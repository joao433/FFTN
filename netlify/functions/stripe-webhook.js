import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Stripe and Supabase clients
function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables.');
  }
  return new Stripe(apiKey);
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'SUPABASE_URL or SUPABASE_SECRET_KEY is not defined in environment variables.'
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const handler = async (event) => {
  try {
    // 1. Obter a assinatura da Stripe nos headers (suporta minúsculas e maiúsculas)
    const signature =
      event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header.');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing stripe-signature header' }),
      };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET env variable.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' }),
      };
    }

    // 2. Preparar o corpo bruto da requisição (decodificar base64 se necessário)
    let rawBody = event.body;
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(event.body, 'base64').toString('utf8');
    }

    const stripe = getStripe();
    let stripeEvent;

    // 3. Validar assinatura do webhook
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
      };
    }

    // 4. Se não for checkout.session.completed, retornar 200 sem processar
    if (stripeEvent.type !== 'checkout.session.completed') {
      console.log(`[Stripe Webhook] Unhandled event type: ${stripeEvent.type}`);
      return {
        statusCode: 200,
        body: 'ok',
      };
    }

    const session = stripeEvent.data.object;
    const metadata = session.metadata || {};
    const packageId = metadata.package_id;
    const orderType = metadata.type; // "ticket" ou "party"
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;

    const supabase = getSupabase();

    // 5. Idempotência: verificar se o evento já foi processado na tabela stripe_webhook_events
    const { data: existingEvent, error: checkError } = await supabase
      .from('stripe_webhook_events')
      .select('id, stripe_event_id')
      .eq('stripe_event_id', stripeEvent.id)
      .maybeSingle();

    if (checkError) {
      console.error('[Stripe Webhook] Error checking idempotency:', checkError);
      throw checkError;
    }

    if (existingEvent) {
      console.log(`[Stripe Webhook] Event ${stripeEvent.id} already processed. Skipping.`);
      return {
        statusCode: 200,
        body: 'ok',
      };
    }

    // 6. Registrar o evento em stripe_webhook_events para garantir idempotência e auditoria
    const { error: insertEventError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: stripeEvent.id,
        event_type: stripeEvent.type,
        payload: stripeEvent,
        processed_at: new Date().toISOString(),
      });

    if (insertEventError) {
      console.error('[Stripe Webhook] Error logging webhook event:', insertEventError);
      throw insertEventError;
    }

    // 7. Atualizar status conforme o tipo no metadata (ticket ou party)
    if (orderType === 'ticket') {
      console.log(`[Stripe Webhook] Updating ticket for session: ${sessionId}, package: ${packageId}`);

      const updatePayload = {
        status: 'paid',
        updated_at: new Date().toISOString(),
      };
      if (paymentIntentId) {
        updatePayload.stripe_payment_intent_id = paymentIntentId;
      }

      const { data: updatedTicket, error: ticketError } = await supabase
        .from('tickets')
        .update(updatePayload)
        .eq('stripe_checkout_session_id', sessionId)
        .select();

      if (ticketError) {
        console.error('[Stripe Webhook] Error updating ticket status:', ticketError);
        throw ticketError;
      }

      console.log('[Stripe Webhook] Ticket updated successfully:', updatedTicket);
    } else if (orderType === 'party') {
      console.log(`[Stripe Webhook] Updating party booking for session: ${sessionId}, package: ${packageId}`);

      const paymentType = metadata.payment_type || 'full';
      const amountPaid = typeof session.amount_total === 'number' ? session.amount_total : 0;
      const balanceDueFromMeta = metadata.balance_due_cents !== undefined ? parseInt(metadata.balance_due_cents, 10) : 0;

      const updatePayload = {
        status: 'paid',
        updated_at: new Date().toISOString(),
      };
      if (paymentIntentId) {
        updatePayload.stripe_payment_intent_id = paymentIntentId;
      }

      // Se as novas colunas existirem, registrar detalhes financeiros
      const richUpdatePayload = {
        ...updatePayload,
        payment_type: paymentType,
        amount_paid_cents: amountPaid,
        balance_due_cents: paymentType === 'deposit' ? balanceDueFromMeta : 0,
        balance_paid: paymentType !== 'deposit',
      };

      let { data: updatedBooking, error: partyError } = await supabase
        .from('party_bookings')
        .update(richUpdatePayload)
        .eq('stripe_checkout_session_id', sessionId)
        .select();

      // Fallback gracioso caso as novas colunas ainda não tenham sido migradas no Supabase
      if (partyError) {
        console.warn('[Stripe Webhook] Falha ao atualizar party_booking com novos campos, tentando payload padrão:', partyError.message);
        const fallbackRes = await supabase
          .from('party_bookings')
          .update(updatePayload)
          .eq('stripe_checkout_session_id', sessionId)
          .select();
        
        if (fallbackRes.error) {
          console.error('[Stripe Webhook] Error updating party booking status:', fallbackRes.error);
          throw fallbackRes.error;
        }
        updatedBooking = fallbackRes.data;
      }

      console.log('[Stripe Webhook] Party booking updated successfully:', updatedBooking);
    } else if (orderType === 'menu') {
      const orderId = metadata.order_id;
      console.log(`[Stripe Webhook] Updating menu order for session: ${sessionId}, order_id: ${orderId}`);

      const updatePayload = {
        status: 'paid',
        updated_at: new Date().toISOString(),
      };
      if (paymentIntentId) {
        updatePayload.stripe_payment_intent_id = paymentIntentId;
      }

      let query = supabase.from('menu_orders').update(updatePayload);
      if (orderId) {
        query = query.eq('id', orderId);
      } else {
        query = query.eq('stripe_checkout_session_id', sessionId);
      }

      const { data: updatedOrder, error: menuOrderError } = await query.select();

      if (menuOrderError) {
        console.error('[Stripe Webhook] Error updating menu order status:', menuOrderError);
        throw menuOrderError;
      }

      console.log('[Stripe Webhook] Menu order updated successfully:', updatedOrder);
    } else {
      console.warn(`[Stripe Webhook] Unrecognized or missing metadata.type: "${orderType}" on session ${sessionId}`);
    }

    return {
      statusCode: 200,
      body: 'ok',
    };
  } catch (error) {
    console.error('[Stripe Webhook] Internal server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
