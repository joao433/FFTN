import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

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
  // 1. Aceita apenas requisições GET
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
    const supabase = getSupabase();

    // 3. Montar query base com join em ticket_packages e ordenação por created_at desc
    let query = supabase
      .from('tickets')
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
      .order('created_at', { ascending: false });

    // 4. Se o parâmetro 'search' foi fornecido, aplicar filtro ILIKE em holder_name, holder_email ou holder_phone
    const search = (event.queryStringParameters?.search || '').trim();
    if (search) {
      // Escapa caracteres especiais para evitar quebras no filtro PostgREST
      const sanitizedSearch = search.replace(/[%,()]/g, '');
      if (sanitizedSearch) {
        query = query.or(
          `holder_name.ilike.%${sanitizedSearch}%,holder_email.ilike.%${sanitizedSearch}%,holder_phone.ilike.%${sanitizedSearch}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Admin List Tickets] Erro ao consultar ingressos no Supabase:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao buscar ingressos no banco de dados.' }),
      };
    }

    // 5. Mapear os dados retornando o nome do pacote junto
    const tickets = (data || []).map((t) => ({
      id: t.id,
      holder_name: t.holder_name,
      holder_email: t.holder_email,
      holder_phone: t.holder_phone,
      package_name: t.ticket_packages?.name || 'Ingresso Geral',
      event_date: t.event_date,
      event_time: t.event_time,
      price_cents: t.price_cents,
      status: t.status,
      used_at: t.used_at,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tickets),
    };
  } catch (error) {
    console.error('[Admin List Tickets] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
