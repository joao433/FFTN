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
      .from('party_bookings')
      .select(`
        *,
        party_packages (
          id,
          name,
          duration_minutes
        )
      `);

    const { data: testCols } = await supabase.from('party_bookings').select('id, event_date, party_date').limit(1);
    const hasEventDate = testCols && testCols.length > 0 && 'event_date' in testCols[0];

    if (hasEventDate) {
      query = query.order('event_date', { ascending: true });
    } else {
      query = query.order('party_date', { ascending: true });
    }

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
      console.error('[Admin List Party Bookings] Erro ao consultar reservas no Supabase:', error);
      return errorResponse('Erro ao buscar reservas de festa no banco de dados.', 500);
    }

    const bookings = (data || []).map((b: any) => {
      const pkgDuration = b.party_packages?.duration_minutes || 120;
      const duration = b.duration_minutes || pkgDuration;
      const totalPrice =
        b.total_price_cents !== null && b.total_price_cents !== undefined
          ? Number(b.total_price_cents)
          : Number(b.price_cents || 0);
      const amountPaid =
        b.amount_paid_cents !== null && b.amount_paid_cents !== undefined
          ? Number(b.amount_paid_cents)
          : b.charge_amount_cents !== null && b.charge_amount_cents !== undefined
          ? Number(b.charge_amount_cents)
          : b.status === 'paid' || b.status === 'confirmed'
          ? totalPrice
          : 0;
      const balanceDue =
        b.balance_due_cents !== null && b.balance_due_cents !== undefined
          ? Number(b.balance_due_cents)
          : Math.max(0, totalPrice - amountPaid);
      const balancePaid =
        b.balance_paid !== undefined
          ? Boolean(b.balance_paid)
          : b.status === 'paid' || b.payment_status === 'paid' || balanceDue === 0;

      return {
        id: b.id,
        holder_name: b.holder_name || b.customer_name || 'Cliente',
        holder_email: b.holder_email || b.customer_email || '',
        holder_phone: b.holder_phone || b.customer_phone || '',
        package_id: b.package_id,
        package_name: b.party_packages?.name || 'Pacote de Festa',
        event_date: b.event_date || b.party_date,
        party_date: b.party_date || b.event_date,
        start_time: b.start_time || null,
        end_time: b.end_time || null,
        duration_minutes: duration,
        guest_count: b.guest_count,
        notes: b.notes || b.special_requests || null,
        payment_type: b.payment_type || 'full',
        payment_status: b.payment_status || 'paid',
        price_cents: totalPrice,
        total_price_cents: totalPrice,
        amount_paid_cents: amountPaid,
        balance_due_cents: balanceDue,
        balance_paid: balancePaid,
        status: b.status,
        created_at: b.created_at,
      };
    });

    return jsonResponse(bookings, 200, { 'Cache-Control': 'no-store' });
  } catch (err: any) {
    console.error('[Admin List Party Bookings] Erro:', err);
    return errorResponse(err?.message || 'Erro interno do servidor.', 500);
  }
});
