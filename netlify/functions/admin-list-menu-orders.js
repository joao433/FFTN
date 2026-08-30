import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

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
  // 1. Aceita apenas requisições GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'GET',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido. Use GET.' }),
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
    const supabase = getSupabase();

    // 3. Montar query base com join em menu_order_items e ordenação por created_at decrescente
    let query = supabase
      .from('menu_orders')
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
      .order('created_at', { ascending: false });

    // 4. Se o parâmetro 'search' foi fornecido, aplicar filtro ILIKE em holder_name, holder_email ou holder_phone
    const search = (event.queryStringParameters?.search || '').trim();
    if (search) {
      const sanitizedSearch = search.replace(/[%,()]/g, '');
      if (sanitizedSearch) {
        query = query.or(
          `holder_name.ilike.%${sanitizedSearch}%,holder_email.ilike.%${sanitizedSearch}%,holder_phone.ilike.%${sanitizedSearch}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Admin List Menu Orders] Erro ao consultar pedidos no Supabase:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao buscar pedidos de cardápio no banco de dados.' }),
      };
    }

    // 5. Mapear os dados retornando os itens formatados
    const orders = (data || []).map((order) => ({
      id: order.id,
      holder_name: order.holder_name,
      holder_email: order.holder_email,
      holder_phone: order.holder_phone,
      status: order.status,
      total_price_cents: order.total_price_cents,
      created_at: order.created_at,
      items: (order.menu_order_items || []).map((item) => ({
        item_name: item.item_name,
        unit_price_cents: item.unit_price_cents,
        quantity: item.quantity,
      })),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(orders),
    };
  } catch (err) {
    console.error('[Admin List Menu Orders Handler Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro interno do servidor.',
      }),
    };
  }
};
