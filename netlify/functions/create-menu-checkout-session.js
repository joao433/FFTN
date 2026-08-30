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
    // 2. Parse e validação do payload JSON
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

    const { holder_name, holder_email, holder_phone, items } = payload;

    if (!holder_name || !holder_email || !holder_phone) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error:
            'Campos obrigatórios faltando. Envie: holder_name, holder_email e holder_phone.',
        }),
      };
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'O carrinho está vazio. Envie ao menos um item em items.',
        }),
      };
    }

    // Validar cada item do array
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!item.menu_item_id || !Number.isInteger(qty) || qty <= 0) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error:
              'Cada item deve conter menu_item_id válido e quantity como número inteiro positivo.',
          }),
        };
      }
    }

    const supabase = getSupabase();

    // 3. Buscar os itens reais do cardápio no Supabase pelo menu_item_id
    const requestedIds = [...new Set(items.map((i) => i.menu_item_id))];
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .in('id', requestedIds);

    if (menuError) {
      console.error(
        '[Create Menu Checkout Session] Erro ao consultar menu_items no Supabase:',
        menuError
      );
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Erro interno ao consultar itens do cardápio.',
        }),
      };
    }

    const menuMap = new Map((menuItems || []).map((m) => [m.id, m]));

    // Verificar se todos os itens existem e estão disponíveis (available = true)
    for (const item of items) {
      const found = menuMap.get(item.menu_item_id);
      if (!found) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: `Item do cardápio com ID ${item.menu_item_id} não foi encontrado.`,
          }),
        };
      }
      if (!found.available) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: `O item "${found.name}" não está disponível no momento.`,
          }),
        };
      }
    }

    // 4. Calcular o total_price_cents somando (price_cents * quantity) do banco
    let totalPriceCents = 0;
    const lineItems = [];
    const orderItemsToPrepare = [];

    for (const item of items) {
      const found = menuMap.get(item.menu_item_id);
      const qty = Number(item.quantity);
      const unitPriceCents = found.price_cents;
      const itemTotalCents = unitPriceCents * qty;

      totalPriceCents += itemTotalCents;

      // Dados para gravar na tabela menu_order_items (congelando nome e preço unitário)
      orderItemsToPrepare.push({
        menu_item_id: found.id,
        item_name: found.name,
        unit_price_cents: unitPriceCents,
        quantity: qty,
        total_price_cents: itemTotalCents,
      });

      // Item para a Stripe Checkout Session
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: found.name,
            description: found.description || undefined,
          },
          unit_amount: unitPriceCents,
        },
        quantity: qty,
      });
    }

    // 5. Inserir o pedido em menu_orders com status 'pending'
    const { data: newOrder, error: insertOrderError } = await supabase
      .from('menu_orders')
      .insert({
        holder_name: holder_name.trim(),
        holder_email: holder_email.trim().toLowerCase(),
        holder_phone: holder_phone.trim(),
        total_price_cents: totalPriceCents,
        status: 'pending',
      })
      .select()
      .single();

    if (insertOrderError) {
      console.error(
        '[Create Menu Checkout Session] Erro ao inserir menu_orders:',
        insertOrderError
      );
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao registrar pedido no cardápio.' }),
      };
    }

    // 6. Inserir os itens do pedido em menu_order_items vinculados ao order_id
    const orderItemsRows = orderItemsToPrepare.map((oi) => ({
      order_id: newOrder.id,
      menu_item_id: oi.menu_item_id,
      item_name: oi.item_name,
      unit_price_cents: oi.unit_price_cents,
      quantity: oi.quantity,
      total_price_cents: oi.total_price_cents,
    }));

    const { error: insertItemsError } = await supabase
      .from('menu_order_items')
      .insert(orderItemsRows);

    if (insertItemsError) {
      console.error(
        '[Create Menu Checkout Session] Erro ao inserir menu_order_items:',
        insertItemsError
      );
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Erro ao registrar itens do pedido.',
        }),
      };
    }

    // 7. Criar a Checkout Session na Stripe com moeda USD e metadata { order_id, type: 'menu' }
    const stripe = getStripe();
    const appUrl = process.env.APP_URL || 'https://fftn.netlify.app';
    const successUrl = `${appUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}&type=menu`;
    const cancelUrl = `${appUrl}/cancelado?type=menu`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: holder_email.trim().toLowerCase(),
      line_items: lineItems,
      metadata: {
        order_id: newOrder.id,
        type: 'menu',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // 8. Atualizar menu_orders com o stripe_checkout_session_id
    const { error: updateOrderError } = await supabase
      .from('menu_orders')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newOrder.id);

    if (updateOrderError) {
      console.error(
        '[Create Menu Checkout Session] Erro ao atualizar menu_orders com stripe_checkout_session_id:',
        updateOrderError
      );
    }

    // 9 & 10. Retornar URL da sessão para redirecionamento
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('[Create Menu Checkout Session] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
