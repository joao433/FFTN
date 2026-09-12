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

const DEFAULT_SETTINGS = {
  allow_no_deposit: true,
  allow_partial_deposit: true,
  deposit_percentage: 30,
  allow_full_payment: true,
};

export const handler = async (event) => {
  const method = event.httpMethod;

  if (!['GET', 'POST', 'PUT'].includes(method)) {
    return {
      statusCode: 405,
      headers: {
        Allow: 'GET, POST, PUT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: `Método ${method} não permitido. Use GET ou POST.` }),
    };
  }

  const supabase = getSupabase();

  // =========================================================================
  // GET: Obter configurações atuais (aberto para o público e para o admin)
  // =========================================================================
  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('party_payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        // Se a tabela ainda não foi criada, retorna defaults defensivamente
        console.warn('[Party Payment Settings - GET] Tabela pode não existir ainda, usando padrão:', error.message);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
          },
          body: JSON.stringify(DEFAULT_SETTINGS),
        };
      }

      if (!data) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
          },
          body: JSON.stringify(DEFAULT_SETTINGS),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          id: data.id,
          allow_no_deposit: Boolean(data.allow_no_deposit),
          allow_partial_deposit: Boolean(data.allow_partial_deposit),
          deposit_percentage: Number(data.deposit_percentage) || 30,
          allow_full_payment: Boolean(data.allow_full_payment),
          updated_at: data.updated_at,
        }),
      };
    } catch (err) {
      console.error('[Party Payment Settings - GET Error]:', err);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_SETTINGS),
      };
    }
  }

  // =========================================================================
  // POST / PUT: Salvar configurações (Apenas ADMIN autenticado)
  // =========================================================================
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

    const allow_no_deposit = payload.allow_no_deposit !== undefined ? Boolean(payload.allow_no_deposit) : true;
    const allow_partial_deposit =
      payload.allow_partial_deposit !== undefined
        ? Boolean(payload.allow_partial_deposit)
        : payload.allow_deposit !== undefined
        ? Boolean(payload.allow_deposit)
        : true;
    const allow_full_payment =
      payload.allow_full_payment !== undefined
        ? Boolean(payload.allow_full_payment)
        : payload.allow_full !== undefined
        ? Boolean(payload.allow_full)
        : true;
    
    let deposit_percentage = Number(payload.deposit_percentage);
    if (isNaN(deposit_percentage) || deposit_percentage < 5 || deposit_percentage > 90) {
      deposit_percentage = 30;
    }

    // Validação: Pelo menos uma forma de pagamento deve estar ativa
    if (!allow_no_deposit && !allow_partial_deposit && !allow_full_payment) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Pelo menos uma opção de pagamento deve permanecer ativada para as reservas de festa.',
        }),
      };
    }

    const now = new Date().toISOString();

    // Verifica se já existe um registro
    const { data: existing } = await supabase
      .from('party_payment_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let saveResult;
    if (existing && existing.id) {
      saveResult = await supabase
        .from('party_payment_settings')
        .update({
          allow_no_deposit,
          allow_partial_deposit,
          deposit_percentage,
          allow_full_payment,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('*')
        .single();
    } else {
      saveResult = await supabase
        .from('party_payment_settings')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          allow_no_deposit,
          allow_partial_deposit,
          deposit_percentage,
          allow_full_payment,
          updated_at: now,
        })
        .select('*')
        .single();
    }

    if (saveResult.error) {
      console.error('[Party Payment Settings - Save Error]:', saveResult.error);
      const isMissingTable =
        saveResult.error.code === '42P01' ||
        String(saveResult.error.message || '').includes('party_payment_settings') ||
        saveResult.error.code === 'PGRST204';

      if (isMissingTable) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error:
              'A tabela party_payment_settings ainda não foi criada. Por favor, execute a migração SQL (drizzle/0006_party_payment_and_schedule.sql) no SQL Editor do Supabase.',
          }),
        };
      }

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Erro ao salvar configurações: ${saveResult.error.message}` }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        settings: {
          id: saveResult.data.id,
          allow_no_deposit: Boolean(saveResult.data.allow_no_deposit),
          allow_partial_deposit: Boolean(saveResult.data.allow_partial_deposit),
          deposit_percentage: Number(saveResult.data.deposit_percentage),
          allow_full_payment: Boolean(saveResult.data.allow_full_payment),
          updated_at: saveResult.data.updated_at,
        },
      }),
    };
  } catch (err) {
    console.error('[Party Payment Settings - Handler Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro interno do servidor ao salvar configurações.',
      }),
    };
  }
};
