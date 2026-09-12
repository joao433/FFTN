import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Método não permitido. Use GET.', 405);
  }

  try {
    const url = new URL(req.url);
    const targetDate = url.searchParams.get('date')?.trim() || null;
    const targetMonth = url.searchParams.get('month')?.trim() || null;

    if (!targetDate && !targetMonth) {
      return errorResponse('Informe o parâmetro "date" (YYYY-MM-DD) ou "month" (YYYY-MM).', 400);
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('party_bookings')
      .select(`
        id,
        party_date,
        start_time,
        end_time,
        status,
        package_id,
        party_packages (
          id,
          name,
          duration_minutes
        )
      `)
      .not('status', 'eq', 'cancelled');

    if (targetDate) {
      query = query.eq('party_date', targetDate);
    } else if (targetMonth) {
      query = query.ilike('party_date', `${targetMonth}%`);
    }

    let { data, error } = await query;

    // Se falhou por 'party_date', tentar com 'event_date'
    if (error && String(error.message || '').includes('party_date')) {
      let retryQuery = supabase
        .from('party_bookings')
        .select(`
          id,
          event_date,
          start_time,
          end_time,
          status,
          package_id,
          party_packages (
            id,
            name,
            duration_minutes
          )
        `)
        .not('status', 'eq', 'cancelled');

      if (targetDate) {
        retryQuery = retryQuery.eq('event_date', targetDate);
      } else if (targetMonth) {
        retryQuery = retryQuery.ilike('event_date', `${targetMonth}%`);
      }

      const retryRes = await retryQuery;
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('[Get Party Availability] Erro no Supabase:', error);
      return errorResponse('Erro ao consultar disponibilidade no banco de dados.', 500);
    }

    const bookedSlots = (data || []).map((b: any) => {
      const pkgDuration = b.party_packages?.duration_minutes || 120;
      const duration = b.duration_minutes || pkgDuration;
      const startTime = b.start_time || null;
      let endTime = b.end_time || null;

      if (startTime && !endTime) {
        const [h, m] = startTime.split(':').map(Number);
        const startTotalMin = h * 60 + (m || 0);
        const endTotalMin = startTotalMin + duration;
        const endH = Math.floor(endTotalMin / 60);
        const endM = endTotalMin % 60;
        endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }

      return {
        bookingId: b.id,
        eventDate: b.party_date || b.event_date,
        startTime,
        endTime,
        durationMinutes: duration,
        status: b.status,
        packageName: b.party_packages?.name || null,
      };
    });

    return jsonResponse(
      {
        date: targetDate,
        month: targetMonth,
        bookedSlots,
      },
      200,
      { 'Cache-Control': 'no-cache' }
    );
  } catch (err: any) {
    console.error('[Get Party Availability] Erro:', err);
    return errorResponse(err?.message || 'Erro interno ao verificar disponibilidade.', 500);
  }
});
