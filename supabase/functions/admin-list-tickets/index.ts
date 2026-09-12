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
      .from('tickets')
      .select(`
        *,
        ticket_packages (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (search) {
      const sanitizedSearch = search.replace(/[%,()]/g, '');
      if (sanitizedSearch) {
        query = query.or(
          `customer_name.ilike.%${sanitizedSearch}%,customer_email.ilike.%${sanitizedSearch}%,holder_name.ilike.%${sanitizedSearch}%,holder_email.ilike.%${sanitizedSearch}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Admin List Tickets] Erro ao consultar ingressos no Supabase:', error);
      return errorResponse('Erro ao buscar ingressos no banco de dados.', 500);
    }

    const tickets = (data || []).map((t: any) => ({
      id: t.id,
      holder_name: t.holder_name || t.customer_name || 'Cliente',
      holder_email: t.holder_email || t.customer_email || '',
      holder_phone: t.holder_phone || t.customer_phone || '',
      package_name: t.ticket_packages?.name || 'Ingresso Geral',
      event_date: t.event_date || t.visit_date || null,
      event_time: t.event_time || null,
      price_cents: t.price_cents,
      status: t.status,
      used_at: t.used_at,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    return jsonResponse(tickets);
  } catch (error: any) {
    console.error('[Admin List Tickets] Erro inesperado:', error);
    return errorResponse('Ocorreu um erro interno no servidor.', 500);
  }
});
