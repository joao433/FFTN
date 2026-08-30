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

    const { booking_id, new_status } = payload;

    if (!booking_id || typeof booking_id !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'O campo booking_id é obrigatório.' }),
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
    const { data: updatedBooking, error: updateError } = await supabase
      .from('party_bookings')
      .update(updatePayload)
      .eq('id', booking_id)
      .select(`
        id,
        holder_name,
        holder_email,
        holder_phone,
        event_date,
        guest_count,
        notes,
        status,
        created_at,
        party_packages (
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('[Admin Update Party Booking] Erro ao atualizar no Supabase:', updateError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao atualizar a reserva de festa no banco de dados.' }),
      };
    }

    if (!updatedBooking) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Reserva de festa não encontrada.' }),
      };
    }

    const result = {
      id: updatedBooking.id,
      holder_name: updatedBooking.holder_name,
      holder_email: updatedBooking.holder_email,
      holder_phone: updatedBooking.holder_phone,
      package_name: updatedBooking.party_packages?.name || 'Pacote de Festa',
      event_date: updatedBooking.event_date,
      guest_count: updatedBooking.guest_count,
      notes: updatedBooking.notes,
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
