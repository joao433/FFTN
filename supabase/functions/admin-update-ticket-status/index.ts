import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

const VALID_STATUSES = ['pending', 'paid', 'used', 'canceled'];

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

    const { ticket_id, new_status } = payload;

    if (!ticket_id || typeof ticket_id !== 'string') {
      return errorResponse('O campo ticket_id é obrigatório.', 400);
    }

    if (!new_status || !VALID_STATUSES.includes(new_status)) {
      return errorResponse(
        `Status inválido. Os valores permitidos são: ${VALID_STATUSES.join(', ')}.`,
        400
      );
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: new_status,
      updated_at: now,
    };

    if (new_status === 'used') {
      updatePayload.used_at = now;
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticket_id)
      .select(`
        *,
        ticket_packages (
          id,
          name
        )
      `)
      .maybeSingle();

    if (updateError) {
      console.error('[Admin Update Ticket Status] Erro ao atualizar ticket:', updateError);
      return errorResponse('Erro ao atualizar status do ingresso.', 500);
    }

    if (!updatedTicket) {
      return errorResponse('Ingresso não encontrado.', 404);
    }

    const formattedTicket = {
      id: updatedTicket.id,
      holder_name: updatedTicket.holder_name || updatedTicket.customer_name || 'Cliente',
      holder_email: updatedTicket.holder_email || updatedTicket.customer_email || '',
      holder_phone: updatedTicket.holder_phone || updatedTicket.customer_phone || '',
      package_name: updatedTicket.ticket_packages?.name || 'Ingresso Geral',
      event_date: updatedTicket.event_date || updatedTicket.visit_date || null,
      event_time: updatedTicket.event_time || null,
      price_cents: updatedTicket.price_cents,
      status: updatedTicket.status,
      used_at: updatedTicket.used_at,
      created_at: updatedTicket.created_at,
      updated_at: updatedTicket.updated_at,
    };

    return jsonResponse(formattedTicket);
  } catch (error: any) {
    console.error('[Admin Update Ticket Status] Erro inesperado:', error);
    return errorResponse('Ocorreu um erro interno no servidor.', 500);
  }
});
