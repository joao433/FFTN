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

  // 1. Rejeitar DELETE explicitamente para proteger integridade histórica de pedidos
  if (method === 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'GET, POST, PUT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error:
          'Exclusão direta de itens ou categorias não é permitida. Para desativar uma categoria use active: false, para desativar um item use available: false.',
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

    // =========================================================================
    // GET: Listar TODAS as categorias e TODOS os itens (com join de categoria)
    // =========================================================================
    if (method === 'GET') {
      // Busca categorias
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (catError) {
        console.error('[Admin Manage Menu - GET Categories] Erro no Supabase:', catError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao listar categorias do cardápio.' }),
        };
      }

      // Busca itens com join da categoria
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            id,
            name
          )
        `)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('[Admin Manage Menu - GET Items] Erro no Supabase:', itemsError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao listar itens do cardápio.' }),
        };
      }

      const formattedItems = (items || []).map((item) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.menu_categories?.name || 'Sem categoria',
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        promo_price_cents: item.promo_price_cents,
        image_url: item.image_url,
        display_order: item.display_order,
        available: item.available,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: categories || [],
          items: formattedItems,
        }),
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

    const { entity } = payload;
    if (!entity || !['category', 'item'].includes(entity)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'O campo "entity" é obrigatório e deve ser "category" ou "item".',
        }),
      };
    }

    // =========================================================================
    // POST: Criar nova Categoria ou novo Item
    // =========================================================================
    if (method === 'POST') {
      // ----------------- CRIAR CATEGORIA -----------------
      if (entity === 'category') {
        const { name, display_order } = payload;

        if (!name || typeof name !== 'string' || !name.trim()) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O nome da categoria (name) é obrigatório.' }),
          };
        }

        let parsedDisplayOrder = 0;
        if (display_order !== undefined && display_order !== null) {
          const num = Number(display_order);
          if (Number.isInteger(num)) {
            parsedDisplayOrder = num;
          }
        }

        const insertData = {
          name: name.trim(),
          display_order: parsedDisplayOrder,
          active: true, // active sempre começa true
        };

        const { data: newCategory, error: insertError } = await supabase
          .from('menu_categories')
          .insert(insertData)
          .select('*')
          .single();

        if (insertError) {
          console.error('[Admin Manage Menu - POST Category] Erro ao inserir:', insertError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Erro ao cadastrar categoria no banco de dados.' }),
          };
        }

        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCategory),
        };
      }

      // ----------------- CRIAR ITEM DO CARDÁPIO -----------------
      if (entity === 'item') {
        const {
          category_id,
          name,
          description,
          price_cents,
          promo_price_cents,
          image_url,
          display_order,
        } = payload;

        if (!category_id || typeof category_id !== 'string') {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O campo category_id é obrigatório para cadastrar um item.' }),
          };
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'O nome do item (name) é obrigatório.' }),
          };
        }

        if (!isValidPositiveInteger(price_cents)) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error:
                'O campo price_cents é obrigatório e deve ser um número inteiro positivo representando o valor em centavos (ex: 2490 para $24.90).',
            }),
          };
        }

        let validatedPromoPriceCents = null;
        if (promo_price_cents !== undefined && promo_price_cents !== null && promo_price_cents !== '') {
          if (!isValidPositiveInteger(promo_price_cents)) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'O preço promocional (promo_price_cents) deve ser um número inteiro positivo em centavos.',
              }),
            };
          }
          if (promo_price_cents >= price_cents) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'O preço promocional (promo_price_cents) deve ser estritamente menor que o preço original (price_cents).',
              }),
            };
          }
          validatedPromoPriceCents = promo_price_cents;
        }

        let parsedDisplayOrder = 0;
        if (display_order !== undefined && display_order !== null) {
          const num = Number(display_order);
          if (Number.isInteger(num)) {
            parsedDisplayOrder = num;
          }
        }

        const insertData = {
          category_id,
          name: name.trim(),
          description: description ? String(description).trim() : null,
          price_cents,
          promo_price_cents: validatedPromoPriceCents,
          image_url: image_url ? String(image_url).trim() : null,
          display_order: parsedDisplayOrder,
          available: true, // available sempre começa true
        };

        const { data: newItem, error: insertError } = await supabase
          .from('menu_items')
          .insert(insertData)
          .select(`
            *,
            menu_categories (
              id,
              name
            )
          `)
          .single();

        if (insertError) {
          console.error('[Admin Manage Menu - POST Item] Erro ao inserir:', insertError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Erro ao cadastrar item no cardápio.' }),
          };
        }

        const formattedNewItem = {
          id: newItem.id,
          category_id: newItem.category_id,
          category_name: newItem.menu_categories?.name || 'Sem categoria',
          name: newItem.name,
          description: newItem.description,
          price_cents: newItem.price_cents,
          promo_price_cents: newItem.promo_price_cents,
          image_url: newItem.image_url,
          display_order: newItem.display_order,
          available: newItem.available,
          created_at: newItem.created_at,
          updated_at: newItem.updated_at,
        };

        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedNewItem),
        };
      }
    }

    // =========================================================================
    // PUT: Atualizar Categoria existente ou Item existente
    // =========================================================================
    if (method === 'PUT') {
      const { id } = payload;

      if (!id || typeof id !== 'string') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'O id é obrigatório para atualização.' }),
        };
      }

      // ----------------- ATUALIZAR CATEGORIA -----------------
      if (entity === 'category') {
        const { name, display_order, active } = payload;

        const updateData = {
          updated_at: new Date().toISOString(),
        };

        if (name !== undefined) {
          if (typeof name !== 'string' || !name.trim()) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'O nome da categoria não pode ser vazio.' }),
            };
          }
          updateData.name = name.trim();
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
              body: JSON.stringify({ error: 'O campo active deve ser booleano (true ou false).' }),
            };
          }
          updateData.active = active;
        }

        const { data: updatedCategory, error: updateError } = await supabase
          .from('menu_categories')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .maybeSingle();

        if (updateError) {
          console.error('[Admin Manage Menu - PUT Category] Erro ao atualizar:', updateError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Erro ao atualizar categoria do cardápio.' }),
          };
        }

        if (!updatedCategory) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Categoria não encontrada.' }),
          };
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCategory),
        };
      }

      // ----------------- ATUALIZAR ITEM DO CARDÁPIO -----------------
      if (entity === 'item') {
        const {
          category_id,
          name,
          description,
          price_cents,
          promo_price_cents,
          image_url,
          display_order,
          available,
        } = payload;

        // Se price_cents ou promo_price_cents forem alterados, precisamos garantir a consistência
        let currentItem = null;
        if (price_cents !== undefined || promo_price_cents !== undefined) {
          const { data: itemData, error: fetchErr } = await supabase
            .from('menu_items')
            .select('id, price_cents, promo_price_cents')
            .eq('id', id)
            .maybeSingle();

          if (fetchErr || !itemData) {
            return {
              statusCode: 404,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Item do cardápio não encontrado para validação de preço.' }),
            };
          }
          currentItem = itemData;
        }

        const updateData = {
          updated_at: new Date().toISOString(),
        };

        if (category_id !== undefined) {
          if (typeof category_id !== 'string' || !category_id.trim()) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'O category_id informado é inválido.' }),
            };
          }
          updateData.category_id = category_id;
        }

        if (name !== undefined) {
          if (typeof name !== 'string' || !name.trim()) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'O nome do item não pode ser vazio.' }),
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

        // Validação de Preço e Preço Promocional
        const effectivePrice = price_cents !== undefined ? price_cents : currentItem?.price_cents;

        if (price_cents !== undefined) {
          if (!isValidPositiveInteger(price_cents)) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'O campo price_cents deve ser um número inteiro positivo em centavos.',
              }),
            };
          }
          updateData.price_cents = price_cents;
        }

        if (promo_price_cents !== undefined) {
          if (promo_price_cents === null || promo_price_cents === '') {
            updateData.promo_price_cents = null;
          } else {
            if (!isValidPositiveInteger(promo_price_cents)) {
              return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: 'O campo promo_price_cents deve ser um número inteiro positivo em centavos ou nulo.',
                }),
              };
            }
            if (effectivePrice && promo_price_cents >= effectivePrice) {
              return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: 'O preço promocional (promo_price_cents) deve ser estritamente menor que o preço original (price_cents).',
                }),
              };
            }
            updateData.promo_price_cents = promo_price_cents;
          }
        } else if (price_cents !== undefined && currentItem?.promo_price_cents) {
          // Se mudou o preço normal mas não passou promo_price_cents, validar se o promo existente ainda é menor
          if (currentItem.promo_price_cents >= price_cents) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error:
                  'O novo preço original é menor ou igual ao preço promocional existente. Atualize ou remova o preço promocional.',
              }),
            };
          }
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

        if (available !== undefined) {
          if (typeof available !== 'boolean') {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'O campo available deve ser um booleano (true ou false).' }),
            };
          }
          updateData.available = available;
        }

        const { data: updatedItem, error: updateError } = await supabase
          .from('menu_items')
          .update(updateData)
          .eq('id', id)
          .select(`
            *,
            menu_categories (
              id,
              name
            )
          `)
          .maybeSingle();

        if (updateError) {
          console.error('[Admin Manage Menu - PUT Item] Erro ao atualizar:', updateError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Erro ao atualizar item do cardápio.' }),
          };
        }

        if (!updatedItem) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Item do cardápio não encontrado.' }),
          };
        }

        const formattedUpdatedItem = {
          id: updatedItem.id,
          category_id: updatedItem.category_id,
          category_name: updatedItem.menu_categories?.name || 'Sem categoria',
          name: updatedItem.name,
          description: updatedItem.description,
          price_cents: updatedItem.price_cents,
          promo_price_cents: updatedItem.promo_price_cents,
          image_url: updatedItem.image_url,
          display_order: updatedItem.display_order,
          available: updatedItem.available,
          created_at: updatedItem.created_at,
          updated_at: updatedItem.updated_at,
        };

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedUpdatedItem),
        };
      }
    }
  } catch (error) {
    console.error('[Admin Manage Menu] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
