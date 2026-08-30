import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

const VALID_STATUSES = ['pending', 'paid', 'preparing', 'ready', 'delivered', 'canceled'];

// Lazy initialization of Supabase client
function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'SUPABASE_URL ou SUPABASE_SECRET_KEY não estão configurados nas variáveis de ambiente.'
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
      body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
    };
  }

  // 2. Verificar autenticação do token JWT de admin
  try {
    verifyAdminToken(event);
  } catch (authErr) {
    return {
      statusCode: authErr.statusCode || 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: authErr.message || 'Acesso não autorizado.' }),
    };
  }

  try {
    // 3. Parse e validação do payload JSON
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

    const { order_id, new_status } = payload;

    if (!order_id || typeof order_id !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'O campo order_id é obrigatório.' }),
      };
    }

    if (!new_status || !VALID_STATUSES.includes(new_status)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Status inválido. Os valores permitidos são: ${VALID_STATUSES.join(', ')}.`,
        }),
      };
    }

    const supabase = getSupabase();

    // 4. Montar o payload de atualização
    const now = new Date().toISOString();
    const updatePayload = {
      status: new_status,
      updated_at: now,
    };

    // 5. Executar update no banco
    const { data: updatedOrder, error: updateError } = await supabase
      .from('menu_orders')
      .update(updatePayload)
      .eq('id', order_id)
      .select(`
        id,
        holder_name,
        holder_email,
        holder_phone,
        status,
        total_price_cents,
        created_at,
        menu_order_items (
          item_name,
          unit_price_cents,
          quantity
        )
      `)
      .single();

    if (updateError) {
      console.error('[Admin Update Menu Order] Erro ao atualizar no Supabase:', updateError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao atualizar o pedido de cardápio no banco de dados.' }),
      };
    }

    if (!updatedOrder) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Pedido de cardápio não encontrado.' }),
      };
    }

    const result = {
      id: updatedOrder.id,
      holder_name: updatedOrder.holder_name,
      holder_email: updatedOrder.holder_email,
      holder_phone: updatedOrder.holder_phone,
      status: updatedOrder.status,
      total_price_cents: updatedOrder.total_price_cents,
      created_at: updatedOrder.created_at,
      items: (updatedOrder.menu_order_items || []).map((item) => ({
        item_name: item.item_name,
        unit_price_cents: item.unit_price_cents,
        quantity: item.quantity,
      })),
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('[Admin Update Menu Order Handler Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro interno do servidor ao atualizar pedido.',
      }),
    };
  }
};
