import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

const VALID_STATUSES = ['pending', 'paid', 'confirmed', 'canceled'];

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

    const { booking_id, new_status, mark_balance_paid } = payload;

    if (!booking_id || typeof booking_id !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'O campo booking_id é obrigatório.' }),
      };
    }

    if (!mark_balance_paid && (!new_status || !VALID_STATUSES.includes(new_status))) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Status inválido ou ausente. Valores permitidos: ${VALID_STATUSES.join(', ')}.`,
        }),
      };
    }

    const supabase = getSupabase();

    // 4. Buscar a reserva atual para poder calcular quitação
    const { data: currentBooking, error: fetchErr } = await supabase
      .from('party_bookings')
      .select('*')
      .eq('id', booking_id)
      .maybeSingle();

    if (fetchErr || !currentBooking) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Reserva de festa não encontrada.' }),
      };
    }

    const now = new Date().toISOString();
    const totalPrice = Number(currentBooking.total_price_cents || currentBooking.price_cents || 0);

    // Montar o payload de atualização
    const updatePayload = {
      updated_at: now,
    };

    if (new_status && VALID_STATUSES.includes(new_status)) {
      updatePayload.status = new_status;
    }

    // Se a ação for "Marcar restante como pago" (Liquidar no Parque presencialmente)
    if (mark_balance_paid) {
      updatePayload.balance_paid = true;
      updatePayload.balance_due_cents = 0;
      updatePayload.amount_paid_cents = totalPrice;
      if (!new_status) {
        // Se a reserva era pending, promove para confirmed
        updatePayload.status = currentBooking.status === 'pending' ? 'confirmed' : currentBooking.status;
      }
    }

    // 5. Executar update no banco
    let { data: updatedBooking, error: updateError } = await supabase
      .from('party_bookings')
      .update(updatePayload)
      .eq('id', booking_id)
      .select(`
        *,
        party_packages (
          id,
          name,
          duration_minutes
        )
      `)
      .single();

    // Fallback gracioso caso alguma coluna nova não exista ainda no banco
    if (updateError) {
      console.warn('[Admin Update Party Booking] Falha com payload avançado, tentando payload básico:', updateError.message);
      const basicPayload = {
        updated_at: now,
      };
      if (new_status && VALID_STATUSES.includes(new_status)) {
        basicPayload.status = new_status;
      } else if (mark_balance_paid) {
        basicPayload.status = 'confirmed';
      }

      const fallbackUpdate = await supabase
        .from('party_bookings')
        .update(basicPayload)
        .eq('id', booking_id)
        .select(`
          *,
          party_packages (
            id,
            name
          )
        `)
        .single();

      if (fallbackUpdate.error) {
        console.error('[Admin Update Party Booking] Erro definitivo:', fallbackUpdate.error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao atualizar a reserva de festa no banco.' }),
        };
      }
      updatedBooking = fallbackUpdate.data;
    }

    const pkgDuration = updatedBooking.party_packages?.duration_minutes || 120;
    const duration = updatedBooking.duration_minutes || pkgDuration;
    const bookingTotal = updatedBooking.total_price_cents !== null && updatedBooking.total_price_cents !== undefined
      ? Number(updatedBooking.total_price_cents)
      : Number(updatedBooking.price_cents || 0);

    const result = {
      id: updatedBooking.id,
      holder_name: updatedBooking.holder_name,
      holder_email: updatedBooking.holder_email,
      holder_phone: updatedBooking.holder_phone,
      package_name: updatedBooking.party_packages?.name || 'Pacote de Festa',
      event_date: updatedBooking.event_date,
      start_time: updatedBooking.start_time || null,
      end_time: updatedBooking.end_time || null,
      duration_minutes: duration,
      guest_count: updatedBooking.guest_count,
      notes: updatedBooking.notes,
      payment_type: updatedBooking.payment_type || 'full',
      price_cents: bookingTotal,
      total_price_cents: bookingTotal,
      amount_paid_cents: updatedBooking.amount_paid_cents !== undefined ? Number(updatedBooking.amount_paid_cents) : bookingTotal,
      balance_due_cents: updatedBooking.balance_due_cents !== undefined ? Number(updatedBooking.balance_due_cents) : 0,
      balance_paid: updatedBooking.balance_paid !== undefined ? Boolean(updatedBooking.balance_paid) : true,
      status: updatedBooking.status,
      created_at: updatedBooking.created_at,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('[Admin Update Party Booking Handler Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro interno do servidor ao atualizar reserva.',
      }),
    };
  }
};
