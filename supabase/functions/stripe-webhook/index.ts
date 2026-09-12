import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { getStripe } from '../_shared/stripe.ts';

function generateRandomToken(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(`Método ${req.method} não permitido. Use POST.`, 405);
  }

  const stripe = getStripe();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado.');
    return errorResponse('Webhook secret não configurado no servidor.', 500);
  }

  const signature =
    req.headers.get('stripe-signature') || req.headers.get('Stripe-Signature');

  if (!signature) {
    return errorResponse('Cabeçalho stripe-signature ausente.', 400);
  }

  // 1. Ler o corpo raw como texto puro
  const rawBody = await req.text();

  let event: any;
  try {
    if (typeof (stripe.webhooks as any).constructEventAsync === 'function') {
      event = await (stripe.webhooks as any).constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );
    } else {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Falha na validação da assinatura:', err.message);
    return errorResponse(`Webhook Error: ${err.message}`, 400);
  }

  const supabase = getSupabaseClient();

  // 2. Proteção de idempotência: verificar se evento já foi processado
  try {
    const { data: alreadyProcessed } = await supabase
      .from('processed_stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (alreadyProcessed) {
      console.log(`[Stripe Webhook] Evento ${event.id} já processado anteriormente. Ignorando.`);
      return jsonResponse({ received: true, duplicate: true });
    }
  } catch (checkErr) {
    console.warn('[Stripe Webhook] Aviso ao checar tabela de idempotência:', checkErr);
  }

  // 3. Processar evento de checkout completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const orderType = metadata.order_type;

    try {
      if (orderType === 'tickets') {
        const itemsWithDetails = JSON.parse(metadata.items_json || '[]');
        const customerName = metadata.customer_name || session.customer_details?.name || 'Cliente';
        const customerEmail =
          metadata.customer_email || session.customer_details?.email || session.customer_email;
        const customerPhone = metadata.customer_phone || session.customer_details?.phone || null;
        const visitDate = metadata.visit_date || null;
        const totalAmountCents = session.amount_total || 0;

        for (const item of itemsWithDetails) {
          for (let q = 0; q < item.quantity; q++) {
            const qrCodeToken = generateRandomToken('TKT');
            await supabase.from('tickets').insert({
              package_id: item.package_id,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              visit_date: visitDate,
              qr_code_token: qrCodeToken,
              price_cents: item.unit_price_cents,
              status: 'paid',
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent || null,
            });
          }
        }
      } else if (orderType === 'party_booking') {
        const packageId = metadata.package_id;
        const customerName = metadata.customer_name || session.customer_details?.name || 'Cliente';
        const customerEmail =
          metadata.customer_email || session.customer_details?.email || session.customer_email;
        const customerPhone = metadata.customer_phone || session.customer_details?.phone || null;
        const partyDate = metadata.party_date;
        const startTime = metadata.start_time;
        const endTime = metadata.end_time;
        const guestCount = Number(metadata.guest_count) || 10;
        const specialRequests = metadata.special_requests || null;
        const paymentMode = metadata.payment_mode || 'full';
        const totalPriceCents = Number(metadata.total_price_cents) || session.amount_total || 0;
        const chargeAmountCents = Number(metadata.charge_amount_cents) || session.amount_total || 0;

        const paymentStatus = paymentMode === 'deposit' ? 'deposit_paid' : 'paid';

        await supabase.from('party_bookings').insert({
          package_id: packageId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          party_date: partyDate,
          start_time: startTime,
          end_time: endTime,
          guest_count: guestCount,
          total_price_cents: totalPriceCents,
          charge_amount_cents: chargeAmountCents,
          special_requests: specialRequests,
          status: 'confirmed',
          payment_status: paymentStatus,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent || null,
        });
      } else if (orderType === 'menu_order') {
        const itemsWithDetails = JSON.parse(metadata.items_json || '[]');
        const customerName = metadata.customer_name || session.customer_details?.name || 'Cliente';
        const customerPhone = metadata.customer_phone || session.customer_details?.phone || null;
        const tableNumber = metadata.table_number || null;
        const notes = metadata.notes || null;
        const totalAmountCents = session.amount_total || 0;
        const pickupCode = generateRandomToken('PED');

        const { data: newOrder, error: orderError } = await supabase
          .from('menu_orders')
          .insert({
            customer_name: customerName,
            customer_phone: customerPhone,
            table_number: tableNumber,
            notes: notes,
            pickup_code: pickupCode,
            total_cents: totalAmountCents,
            status: 'pending',
            payment_status: 'paid',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
          })
          .select('*')
          .single();

        if (!orderError && newOrder && itemsWithDetails.length > 0) {
          const orderItemsToInsert = itemsWithDetails.map((it: any) => ({
            order_id: newOrder.id,
            menu_item_id: it.menu_item_id,
            item_name: it.name,
            quantity: it.quantity,
            unit_price_cents: it.unit_price_cents,
            total_cents: it.total_cents,
            variation: it.variation || null,
          }));

          await supabase.from('menu_order_items').insert(orderItemsToInsert);
        }
      }
    } catch (procErr: any) {
      console.error('[Stripe Webhook] Erro ao gravar dados no Supabase:', procErr);
      return errorResponse(`Erro ao persistir pedido: ${procErr.message}`, 500);
    }
  }

  // 4. Registrar evento na tabela de idempotência
  try {
    await supabase.from('processed_stripe_events').insert({
      event_id: event.id,
      event_type: event.type,
      created_at: new Date().toISOString(),
    });
  } catch (idempErr) {
    console.warn('[Stripe Webhook] Não foi possível registrar evento na tabela de idempotência:', idempErr);
  }

  return jsonResponse({ received: true });
});
