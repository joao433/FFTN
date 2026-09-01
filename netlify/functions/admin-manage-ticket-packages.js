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

function isValidPositiveInteger(val) {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

export const handler = async (event) => {
  const method = event.httpMethod;

  // 1. Rejeitar DELETE explicitamente para proteger integridade histórica
  if (method === 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'GET, POST, PUT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error:
          'Exclusão de pacotes não é permitida para preservar o histórico de vendas. Use active: false (PUT) para desativar o pacote.',
      }),
    };
  }

  if (!['GET', 'POST', 'PUT'].includes(method)) {
    return {
      statusCode: 405,
      headers: {
        Allow: 'GET, POST, PUT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: `Método ${method} não permitido. Use GET, POST ou PUT.` }),
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

    // ==========================================
    // GET: Listar TODOS os pacotes de ingressos
    // ==========================================
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('ticket_packages')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Admin Manage Ticket Packages - GET] Erro no Supabase:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao listar pacotes de ingressos.' }),
        };
      }

      const formatted = (data || []).map((pkg) => ({
        ...pkg,
        featured_home: Boolean(pkg.featured_home),
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted),
      };
    }

    // Parse do Body para POST e PUT
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payload JSON inválido no corpo da requisição.' }),
      };
    }

    // ==========================================
    // POST: Criar novo pacote de ingresso
    // ==========================================
    if (method === 'POST') {
      const { name, description, price_cents, image_url, display_order, featured_home } = payload;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'O nome do pacote (name) é obrigatório.' }),
        };
      }

      if (!isValidPositiveInteger(price_cents)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error:
              'O campo price_cents é obrigatório e deve ser um número inteiro positivo representando o valor em centavos (ex: 2990 para $29.90).',
          }),
        };
      }

      let parsedDisplayOrder = 0;
      if (display_order !== undefined && display_order !== null) {
        const num = Number(display_order);
        if (Number.isInteger(num)) {
          parsedDisplayOrder = num;
        }
      }

      const isFeaturedHome = Boolean(featured_home);
      if (isFeaturedHome) {
        const { count: currentFeaturedCount, error: countErr } = await supabase
          .from('ticket_packages')
          .select('id', { count: 'exact', head: true })
          .eq('featured_home', true);

        if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 3) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Você já tem 3 pacotes de ingressos destacados. Desmarque um antes de adicionar outro.',
            }),
          };
        }
      }

      const insertData = {
        name: name.trim(),
        description: description ? String(description).trim() : null,
        price_cents,
        image_url: image_url ? String(image_url).trim() : null,
        display_order: parsedDisplayOrder,
        active: true, // active sempre começa true na criação
        featured_home: isFeaturedHome,
      };

      const { data: newPackage, error: insertError } = await supabase
        .from('ticket_packages')
        .insert(insertData)
        .select('*')
        .single();

      if (insertError) {
        console.error('[Admin Manage Ticket Packages - POST] Erro ao inserir:', insertError);

        const isMissingColumn =
          String(insertError.message || '').includes('featured_home') ||
          String(insertError.details || '').includes('featured_home') ||
          insertError.code === 'PGRST204' ||
          insertError.code === '42703';

        if (isMissingColumn) {
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error:
                "A coluna 'featured_home' ainda não foi criada na tabela ticket_packages. Execute o script de migração SQL (drizzle/0002_add_ticket_and_party_featured_home.sql) no SQL Editor do Supabase.",
            }),
          };
        }

        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Erro ao criar pacote de ingresso: ${insertError.message || 'Erro no banco'}` }),
        };
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPackage,
          featured_home: Boolean(newPackage.featured_home),
        }),
      };
    }

    // ==========================================
    // PUT: Atualizar pacote existente
    // ==========================================
    if (method === 'PUT') {
      const { id, name, description, price_cents, image_url, display_order, active, featured_home } = payload;

      if (!id || typeof id !== 'string') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'O id do pacote é obrigatório para atualização.' }),
        };
      }

      const updateData = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O nome do pacote (name) não pode ser vazio.' }),
          };
        }
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        updateData.description = description ? String(description).trim() : null;
      }

      if (image_url !== undefined) {
        updateData.image_url = image_url ? String(image_url).trim() : null;
      }

      if (price_cents !== undefined) {
        if (!isValidPositiveInteger(price_cents)) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error:
                'O campo price_cents deve ser um número inteiro positivo representando o valor em centavos (ex: 2990 para $29.90).',
            }),
          };
        }
        updateData.price_cents = price_cents;
      }

      if (display_order !== undefined) {
        const num = Number(display_order);
        if (!Number.isInteger(num)) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O campo display_order deve ser um número inteiro.' }),
          };
        }
        updateData.display_order = num;
      }

      if (active !== undefined) {
        if (typeof active !== 'boolean') {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O campo active deve ser um booleano (true ou false).' }),
          };
        }
        updateData.active = active;
      }

      if (featured_home !== undefined) {
        if (typeof featured_home !== 'boolean') {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O campo featured_home deve ser um booleano (true ou false).' }),
          };
        }

        if (featured_home === true) {
          const { count: currentFeaturedCount, error: countErr } = await supabase
            .from('ticket_packages')
            .select('id', { count: 'exact', head: true })
            .eq('featured_home', true)
            .neq('id', id);

          if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 3) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'Você já tem 3 pacotes de ingressos destacados. Desmarque um antes de adicionar outro.',
              }),
            };
          }
        }

        updateData.featured_home = featured_home;
      }

      const { data: updatedPackage, error: updateError } = await supabase
        .from('ticket_packages')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (updateError) {
        console.error('[Admin Manage Ticket Packages - PUT] Erro ao atualizar:', updateError);

        const isMissingColumn =
          String(updateError.message || '').includes('featured_home') ||
          String(updateError.details || '').includes('featured_home') ||
          updateError.code === 'PGRST204' ||
          updateError.code === '42703';

        if (isMissingColumn) {
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error:
                "A coluna 'featured_home' ainda não foi criada na tabela ticket_packages. Execute o script de migração SQL (drizzle/0002_add_ticket_and_party_featured_home.sql) no SQL Editor do Supabase.",
            }),
          };
        }

        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Erro ao atualizar pacote de ingresso: ${updateError.message || 'Erro no banco'}` }),
        };
      }

      if (!updatedPackage) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Pacote de ingresso não encontrado.' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedPackage,
          featured_home: Boolean(updatedPackage.featured_home),
        }),
      };
    }
  } catch (error) {
    console.error('[Admin Manage Ticket Packages] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
