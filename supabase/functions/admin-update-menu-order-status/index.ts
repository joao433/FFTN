import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

const VALID_STATUSES = ['pending', 'paid', 'preparing', 'ready', 'delivered', 'canceled'];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Método não permitido. Use POST.', 405);
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
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido.', 400);
    }

    const { order_id, new_status } = payload;

    if (!order_id || typeof order_id !== 'string') {
      return errorResponse('O campo order_id é obrigatório.', 400);
    }

    if (!new_status || !VALID_STATUSES.includes(new_status)) {
      return errorResponse(
        `Status inválido. Os valores permitidos são: ${VALID_STATUSES.join(', ')}.`,
        400
      );
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabase
      .from('menu_orders')
      .update({
        status: new_status,
        updated_at: now,
      })
      .eq('id', order_id)
      .select(`
        *,
        menu_order_items (
          *
        )
      `)
      .maybeSingle();

    if (updateError) {
      console.error('[Admin Update Menu Order] Erro ao atualizar no Supabase:', updateError);
      return errorResponse('Erro ao atualizar o pedido de cardápio no banco de dados.', 500);
    }

    if (!updatedOrder) {
      return errorResponse('Pedido de cardápio não encontrado.', 404);
    }

    const result = {
      id: updatedOrder.id,
      holder_name: updatedOrder.holder_name || updatedOrder.customer_name || 'Cliente',
      holder_email: updatedOrder.holder_email || updatedOrder.customer_email || '',
      holder_phone: updatedOrder.holder_phone || updatedOrder.customer_phone || '',
      status: updatedOrder.status,
      total_price_cents: updatedOrder.total_price_cents ?? updatedOrder.total_cents ?? 0,
      created_at: updatedOrder.created_at,
      items: (updatedOrder.menu_order_items || []).map((item: any) => ({
        item_name: item.item_name || item.name || 'Item',
        unit_price_cents: item.unit_price_cents || item.price_cents || 0,
        quantity: item.quantity,
      })),
    };

    return jsonResponse(result);
  } catch (err: any) {
    console.error('[Admin Update Menu Order] Erro:', err);
    return errorResponse(err?.message || 'Erro interno do servidor ao atualizar pedido.', 500);
  }
});
