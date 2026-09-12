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
          'Exclusão de pacotes não é permitida para preservar o histórico de reservas. Use active: false (PUT) para desativar o pacote.',
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
    // GET: Listar TODOS os pacotes de festas
    // ==========================================
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('party_packages')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Admin Manage Party Packages - GET] Erro no Supabase:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao listar pacotes de festas.' }),
        };
      }

      const formatted = (data || []).map((pkg) => ({
        ...pkg,
        duration_minutes: pkg.duration_minutes || 120,
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
    // POST: Criar novo pacote de festa
    // ==========================================
    if (method === 'POST') {
      const { name, description, price_cents, duration_minutes, image_url, display_order, featured_home } = payload;

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
              'O campo price_cents é obrigatório e deve ser um número inteiro positivo representando o valor em centavos (ex: 120000 para $1,200.00).',
          }),
        };
      }

      let parsedDuration = 120;
      if (duration_minutes !== undefined && duration_minutes !== null) {
        const d = Number(duration_minutes);
        if (Number.isInteger(d) && d >= 30) {
          parsedDuration = d;
        }
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
          .from('party_packages')
          .select('id', { count: 'exact', head: true })
          .eq('featured_home', true);

        if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 4) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Você já tem 4 pacotes de festa destacados. Desmarque um antes de adicionar outro.',
            }),
          };
        }
      }

      const insertData = {
        name: name.trim(),
        description: description ? String(description).trim() : null,
        price_cents,
        duration_minutes: parsedDuration,
        image_url: image_url ? String(image_url).trim() : null,
        display_order: parsedDisplayOrder,
        active: true, // active sempre começa true na criação
        featured_home: isFeaturedHome,
      };

      let { data: newPackage, error: insertError } = await supabase
        .from('party_packages')
        .insert(insertData)
        .select('*')
        .single();

      if (insertError) {
        console.error('[Admin Manage Party Packages - POST] Erro ao inserir:', insertError);

        // Se falhou por duration_minutes não existir ainda, tenta sem duration_minutes
        if (String(insertError.message || '').includes('duration_minutes')) {
          const fallbackData = { ...insertData };
          delete fallbackData.duration_minutes;
          const fallbackRes = await supabase
            .from('party_packages')
            .insert(fallbackData)
            .select('*')
            .single();

          if (!fallbackRes.error) {
            newPackage = fallbackRes.data;
            insertError = null;
          }
        }
      }

      if (insertError) {
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
                "A coluna 'featured_home' ou 'duration_minutes' ainda não foi criada na tabela party_packages. Execute o script de migração SQL (drizzle/0006_party_payment_and_schedule.sql) no SQL Editor do Supabase.",
            }),
          };
        }

        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Erro ao criar pacote de festa: ${insertError.message || 'Erro no banco'}` }),
        };
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPackage,
          duration_minutes: newPackage.duration_minutes || parsedDuration,
          featured_home: Boolean(newPackage.featured_home),
        }),
      };
    }

    // ==========================================
    // PUT: Atualizar pacote de festa existente
    // ==========================================
    if (method === 'PUT') {
      const { id, name, description, price_cents, duration_minutes, image_url, display_order, active, featured_home } = payload;

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
                'O campo price_cents deve ser um número inteiro positivo representando o valor em centavos (ex: 120000 para $1,200.00).',
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
            .from('party_packages')
            .select('id', { count: 'exact', head: true })
            .eq('featured_home', true)
            .neq('id', id);

          if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 4) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'Você já tem 4 pacotes de festa destacados. Desmarque um antes de adicionar outro.',
              }),
            };
          }
        }

        updateData.featured_home = featured_home;
      }

      if (duration_minutes !== undefined) {
        const d = Number(duration_minutes);
        if (Number.isInteger(d) && d >= 30) {
          updateData.duration_minutes = d;
        }
      }

      let { data: updatedPackage, error: updateError } = await supabase
        .from('party_packages')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (updateError && String(updateError.message || '').includes('duration_minutes')) {
        const fallbackUpdate = { ...updateData };
        delete fallbackUpdate.duration_minutes;
        const fallbackRes = await supabase
          .from('party_packages')
          .update(fallbackUpdate)
          .eq('id', id)
          .select('*')
          .maybeSingle();
        if (!fallbackRes.error) {
          updatedPackage = fallbackRes.data;
          updateError = null;
        }
      }

      if (updateError) {
        console.error('[Admin Manage Party Packages - PUT] Erro ao atualizar:', updateError);

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
                "A coluna 'featured_home' ainda não foi criada na tabela party_packages. Execute o script de migração SQL (drizzle/0002_add_ticket_and_party_featured_home.sql) no SQL Editor do Supabase.",
            }),
          };
        }

        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Erro ao atualizar pacote de festa: ${updateError.message || 'Erro no banco'}` }),
        };
      }

      if (!updatedPackage) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Pacote de festa não encontrado.' }),
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
    console.error('[Admin Manage Party Packages] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
