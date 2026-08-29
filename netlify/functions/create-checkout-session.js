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
  // 1. Aceita apenas requisições POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  try {
    // 2. Parse e validação do payload JSON recebido no body
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payload JSON inválido.' }),
      };
    }

    const { package_id, holder_name, holder_email, holder_phone, event_date } = payload;

    if (!package_id || !holder_name || !holder_email || !holder_phone || !event_date) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error:
            'Campos obrigatórios faltando. Envie: package_id, holder_name, holder_email, holder_phone e event_date.',
        }),
      };
    }

    const supabase = getSupabase();

    // 3. Buscar o pacote na tabela ticket_packages do Supabase
    const { data: pkg, error: pkgError } = await supabase
      .from('ticket_packages')
      .select('*')
      .eq('id', package_id)
      .maybeSingle();

    if (pkgError) {
      console.error('[Create Checkout Session] Erro ao buscar ticket_package:', pkgError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro interno ao consultar o pacote de ingresso.' }),
      };
    }

    if (!pkg || !pkg.active) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Pacote de ingresso não encontrado ou inativo.',
        }),
      };
    }

    // 4. Inserir previamente o registro em tickets com status "pending"
    const { data: newTicket, error: insertTicketError } = await supabase
      .from('tickets')
      .insert({
        package_id: pkg.id,
        holder_name: holder_name.trim(),
        holder_email: holder_email.trim().toLowerCase(),
        holder_phone: holder_phone.trim(),
        event_date,
        price_cents: pkg.price_cents,
        status: 'pending',
      })
      .select()
      .single();

    if (insertTicketError) {
      console.error('[Create Checkout Session] Erro ao inserir ticket pendente:', insertTicketError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao registrar pré-reserva do ingresso.' }),
      };
    }

    // 5. Criar a Checkout Session na Stripe usando o preço e nome salvos no banco
    const stripe = getStripe();
    const appUrl = process.env.APP_URL || 'https://fftn.netlify.app';
    const successUrl = `${appUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/cancelado`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: holder_email.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: pkg.description || undefined,
            },
            unit_amount: pkg.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        package_id: pkg.id,
        type: 'ticket',
        ticket_id: newTicket.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // 6. Atualizar o registro em tickets com o stripe_checkout_session_id gerado
    const { error: updateTicketError } = await supabase
      .from('tickets')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newTicket.id);

    if (updateTicketError) {
      console.error(
        '[Create Checkout Session] Erro ao atualizar ticket com stripe_checkout_session_id:',
        updateTicketError
      );
    }

    // 7. Retornar a URL de redirecionamento para o frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('[Create Checkout Session] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
