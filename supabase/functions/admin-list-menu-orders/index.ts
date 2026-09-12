import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Método não permitido. Use GET.', 405);
  }

  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Acesso não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  try {
    const supabase = getSupabaseClient();
    const url = new URL(req.url);
    const search = (url.searchParams.get('search') || '').trim();

    let query = supabase
      .from('menu_orders')
      .select(`
        *,
        menu_order_items (
          *
        )
      `)
      .order('created_at', { ascending: false });

    if (search) {
      const sanitizedSearch = search.replace(/[%,()]/g, '');
      if (sanitizedSearch) {
        query = query.or(
          `customer_name.ilike.%${sanitizedSearch}%,customer_phone.ilike.%${sanitizedSearch}%,holder_name.ilike.%${sanitizedSearch}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Admin List Menu Orders] Erro ao consultar pedidos no Supabase:', error);
      return errorResponse('Erro ao buscar pedidos de cardápio no banco de dados.', 500);
    }

    const orders = (data || []).map((order: any) => ({
      id: order.id,
      holder_name: order.holder_name || order.customer_name || 'Cliente',
      holder_email: order.holder_email || order.customer_email || '',
      holder_phone: order.holder_phone || order.customer_phone || '',
      table_number: order.table_number || null,
      pickup_code: order.pickup_code || null,
      notes: order.notes || null,
      status: order.status,
      total_price_cents: order.total_price_cents ?? order.total_cents ?? 0,
      created_at: order.created_at,
      items: (order.menu_order_items || []).map((item: any) => ({
        item_name: item.item_name || item.name || 'Item',
        unit_price_cents: item.unit_price_cents || item.price_cents || 0,
        quantity: item.quantity,
        variation: item.variation || null,
      })),
    }));

    return jsonResponse(orders, 200, { 'Cache-Control': 'no-store' });
  } catch (err: any) {
    console.error('[Admin List Menu Orders] Erro:', err);
    return errorResponse(err?.message || 'Erro interno do servidor.', 500);
  }
});
