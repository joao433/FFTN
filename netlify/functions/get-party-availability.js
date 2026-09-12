import { createClient } from '@supabase/supabase-js';

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

  try {
    const params = event.queryStringParameters || {};
    const targetDate = params.date ? params.date.trim() : null; // YYYY-MM-DD
    const targetMonth = params.month ? params.month.trim() : null; // YYYY-MM

    if (!targetDate && !targetMonth) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Informe o parâmetro "date" (YYYY-MM-DD) ou "month" (YYYY-MM).' }),
      };
    }

    const supabase = getSupabase();

    let query = supabase
      .from('party_bookings')
      .select(`
        id,
        event_date,
        start_time,
        end_time,
        duration_minutes,
        status,
        package_id,
        party_packages (
          id,
          name,
          duration_minutes
        )
      `)
      .neq('status', 'canceled');

    if (targetDate) {
      query = query.eq('event_date', targetDate);
    } else if (targetMonth) {
      // Começa com YYYY-MM
      query = query.ilike('event_date', `${targetMonth}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Get Party Availability] Erro no Supabase:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao consultar disponibilidade no banco de dados.' }),
      };
    }

    const bookedSlots = (data || []).map((b) => {
      const pkgDuration = b.party_packages?.duration_minutes || 120;
      const duration = b.duration_minutes || pkgDuration;

      // Se não tiver start_time registrado (legado), não conseguimos precisar o intervalo
      const startTime = b.start_time || null;
      let endTime = b.end_time || null;

      if (startTime && !endTime) {
        // Calcular end_time
        const [h, m] = startTime.split(':').map(Number);
        const startTotalMin = h * 60 + (m || 0);
        const endTotalMin = startTotalMin + duration;
        const endH = Math.floor(endTotalMin / 60);
        const endM = endTotalMin % 60;
        endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }

      return {
        bookingId: b.id,
        eventDate: b.event_date,
        startTime,
        endTime,
        durationMinutes: duration,
        status: b.status,
        packageName: b.party_packages?.name || null,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        date: targetDate,
        month: targetMonth,
        bookedSlots,
      }),
    };
  } catch (err) {
    console.error('[Get Party Availability] Handler Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro interno do servidor ao checar disponibilidade.',
      }),
    };
  }
};
