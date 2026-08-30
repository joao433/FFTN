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

    // 3. Montar query base com join em party_packages e ordenação por event_date crescente
    let query = supabase
      .from('party_bookings')
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
      .order('event_date', { ascending: true });

    // 4. Se o parâmetro 'search' foi fornecido, aplicar filtro ILIKE em holder_name, holder_email ou holder_phone
    const search = (event.queryStringParameters?.search || '').trim();
    if (search) {
      const sanitizedSearch = search.replace(/[%,()]/g, '');
      if (sanitizedSearch) {
        query = query.or(
          `holder_name.ilike.%${sanitizedSearch}%,holder_email.ilike.%${sanitizedSearch}%,holder_phone.ilike.%${sanitizedSearch}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Admin List Party Bookings] Erro ao consultar reservas no Supabase:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao buscar reservas de festa no banco de dados.' }),
      };
    }

    // 5. Mapear os dados retornando o nome do pacote junto
    const bookings = (data || []).map((b) => ({
      id: b.id,
      holder_name: b.holder_name,
      holder_email: b.holder_email,
      holder_phone: b.holder_phone,
      package_name: b.party_packages?.name || 'Pacote de Festa',
      event_date: b.event_date,
      guest_count: b.guest_count,
      notes: b.notes,
      status: b.status,
      created_at: b.created_at,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(bookings),
    };
  } catch (err) {
    console.error('[Admin List Party Bookings Handler Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro interno do servidor.',
      }),
    };
  }
};
