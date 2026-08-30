import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

const VALID_STATUSES = ['pending', 'paid', 'used', 'canceled'];

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

    const { ticket_id, new_status } = payload;

    if (!ticket_id || typeof ticket_id !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'O campo ticket_id é obrigatório.' }),
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

    // Se new_status for 'used', também preenche used_at com o timestamp atual
    if (new_status === 'used') {
      updatePayload.used_at = now;
    }

    // 5. Executar update no banco
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticket_id)
      .select(`
        id,
        holder_name,
        holder_email,
        holder_phone,
        event_date,
        event_time,
        price_cents,
        status,
        used_at,
        created_at,
        updated_at,
        ticket_packages (
          id,
          name
        )
      `)
      .maybeSingle();

    if (updateError) {
      console.error('[Admin Update Ticket Status] Erro ao atualizar ticket:', updateError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao atualizar status do ingresso.' }),
      };
    }

    if (!updatedTicket) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Ingresso não encontrado.' }),
      };
    }

    // 6. Formatar resposta com package_name do join
    const formattedTicket = {
      id: updatedTicket.id,
      holder_name: updatedTicket.holder_name,
      holder_email: updatedTicket.holder_email,
      holder_phone: updatedTicket.holder_phone,
      package_name: updatedTicket.ticket_packages?.name || 'Ingresso Geral',
      event_date: updatedTicket.event_date,
      event_time: updatedTicket.event_time,
      price_cents: updatedTicket.price_cents,
      status: updatedTicket.status,
      used_at: updatedTicket.used_at,
      created_at: updatedTicket.created_at,
      updated_at: updatedTicket.updated_at,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedTicket),
    };
  } catch (error) {
    console.error('[Admin Update Ticket Status] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
