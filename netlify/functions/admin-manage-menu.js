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

// Helpers to handle featured item & badge metadata seamlessly even before DB columns are migrated
function extractFeaturedMetadata(rawSubtitle, existingItemId, existingBadgeText) {
  let cleanSubtitle = rawSubtitle || '';
  let featuredItemId = existingItemId || null;
  let featuredBadgeText = existingBadgeText || null;

  if (cleanSubtitle && cleanSubtitle.includes('<!--featured_config:')) {
    const match = cleanSubtitle.match(/<!--featured_config:(.*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (!featuredItemId && parsed.item_id !== undefined) {
          featuredItemId = parsed.item_id;
        }
        if (!featuredBadgeText && parsed.badge_text !== undefined) {
          featuredBadgeText = parsed.badge_text;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
    cleanSubtitle = cleanSubtitle.replace(/\s*<!--featured_config:(.*?)-->/, '').trim();
  }

  return {
    subtitle: cleanSubtitle,
    featured_item_id: featuredItemId,
    featured_badge_text: featuredBadgeText || 'OFERTA ESPECIAL',
  };
}

function embedFeaturedMetadata(rawSubtitle, featuredItemId, featuredBadgeText) {
  const cleanSubtitle = (rawSubtitle || '').replace(/\s*<!--featured_config:(.*?)-->/, '').trim();
  if (featuredItemId || (featuredBadgeText && featuredBadgeText !== 'OFERTA ESPECIAL')) {
    const meta = JSON.stringify({
      item_id: featuredItemId || null,
      badge_text: featuredBadgeText || null,
    });
    return `${cleanSubtitle}\n<!--featured_config:${meta}-->`;
  }
  return cleanSubtitle || null;
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

      // Busca banner (se existir tabela)
      let banner = null;
      try {
        const { data: bannerData } = await supabase
          .from('menu_banner')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (bannerData) {
          const parsed = extractFeaturedMetadata(
            bannerData.subtitle,
            bannerData.featured_item_id,
            bannerData.featured_badge_text
          );
          banner = {
            id: bannerData.id,
            title: bannerData.title,
            subtitle: parsed.subtitle,
            badge_text: bannerData.badge_text,
            image_url: bannerData.image_url,
            featured_item_id: parsed.featured_item_id,
            featured_badge_text: parsed.featured_badge_text || 'OFERTA ESPECIAL',
            active: bannerData.active,
            created_at: bannerData.created_at,
            updated_at: bannerData.updated_at,
          };
        }
      } catch (bErr) {
        console.warn('[Admin Manage Menu - GET Banner] Aviso:', bErr);
      }

      const formattedCategories = (categories || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        display_order: cat.display_order,
        active: cat.active,
        image_url: cat.image_url || null,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      }));

      const formattedItems = (items || []).map((item) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.menu_categories?.name || 'Sem categoria',
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        promo_price_cents: item.promo_price_cents,
        image_url: item.image_url,
        ingredients: item.ingredients || null,
        variations: item.variations || null,
        display_order: item.display_order,
        available: item.available,
        featured_home: Boolean(item.featured_home),
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: formattedCategories,
          items: formattedItems,
          banner,
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
    if (!entity || !['category', 'item', 'banner'].includes(entity)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'O campo "entity" é obrigatório e deve ser "category", "item" ou "banner".',
        }),
      };
    }

    // =========================================================================
    // BANNER (POST ou PUT para menu_banner)
    // =========================================================================
    if (entity === 'banner') {
      const { title, subtitle, badge_text, image_url, featured_item_id, featured_badge_text, active } = payload;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'O título do banner é obrigatório.' }),
        };
      }

      const cleanItemId = featured_item_id && String(featured_item_id).trim() ? String(featured_item_id).trim() : null;
      const cleanBadgeText = featured_badge_text && String(featured_badge_text).trim() ? String(featured_badge_text).trim() : null;

      const bannerData = {
        title: title.trim(),
        subtitle: subtitle !== undefined ? (subtitle ? String(subtitle).trim() : null) : null,
        badge_text: badge_text !== undefined ? (badge_text ? String(badge_text).trim() : null) : null,
        image_url: image_url !== undefined ? (image_url ? String(image_url).trim() : null) : null,
        featured_item_id: cleanItemId,
        featured_badge_text: cleanBadgeText,
        active: active !== undefined ? Boolean(active) : true,
        updated_at: new Date().toISOString(),
      };

      try {
        const { data: existing } = await supabase
          .from('menu_banner')
          .select('id')
          .limit(1)
          .maybeSingle();

        let saved = null;
        let saveError = null;

        if (existing?.id) {
          const { data: updated, error: uErr } = await supabase
            .from('menu_banner')
            .update(bannerData)
            .eq('id', existing.id)
            .select('*')
            .maybeSingle();

          if (uErr) {
            // Check if error is due to missing columns in DB schema cache
            const isColumnError =
              String(uErr.message || '').includes('featured_badge_text') ||
              String(uErr.message || '').includes('featured_item_id') ||
              uErr.code === 'PGRST204' ||
              uErr.code === '42703';

            if (isColumnError) {
              console.warn(
                '[Admin Manage Menu - Banner] Colunas featured_item_id / featured_badge_text ainda não migradas na tabela menu_banner. Usando fallback de persistência...'
              );
              const fallbackData = { ...bannerData };
              delete fallbackData.featured_item_id;
              delete fallbackData.featured_badge_text;
              fallbackData.subtitle = embedFeaturedMetadata(
                subtitle,
                cleanItemId,
                cleanBadgeText
              );

              const { data: retryUpdated, error: retryErr } = await supabase
                .from('menu_banner')
                .update(fallbackData)
                .eq('id', existing.id)
                .select('*')
                .maybeSingle();

              if (retryErr) {
                saveError = retryErr;
              } else {
                saved = retryUpdated;
              }
            } else {
              saveError = uErr;
            }
          } else {
            saved = updated;
          }
        } else {
          // Inserção caso ainda não exista registro
          const { data: inserted, error: iErr } = await supabase
            .from('menu_banner')
            .insert(bannerData)
            .select('*')
            .maybeSingle();

          if (iErr) {
            const isColumnError =
              String(iErr.message || '').includes('featured_badge_text') ||
              String(iErr.message || '').includes('featured_item_id') ||
              iErr.code === 'PGRST204' ||
              iErr.code === '42703';

            if (isColumnError) {
              console.warn(
                '[Admin Manage Menu - Banner Insert] Usando fallback de persistência para colunas novas...'
              );
              const fallbackData = { ...bannerData };
              delete fallbackData.featured_item_id;
              delete fallbackData.featured_badge_text;
              fallbackData.subtitle = embedFeaturedMetadata(
                subtitle,
                cleanItemId,
                cleanBadgeText
              );

              const { data: retryInserted, error: retryErr } = await supabase
                .from('menu_banner')
                .insert(fallbackData)
                .select('*')
                .maybeSingle();

              if (retryErr) {
                saveError = retryErr;
              } else {
                saved = retryInserted;
              }
            } else {
              saveError = iErr;
            }
          } else {
            saved = inserted;
          }
        }

        if (saveError || !saved) {
          throw saveError || new Error('Não foi possível salvar o banner no banco de dados.');
        }

        const parsed = extractFeaturedMetadata(
          saved.subtitle,
          saved.featured_item_id || cleanItemId,
          saved.featured_badge_text || cleanBadgeText
        );

        const responsePayload = {
          id: saved.id,
          title: saved.title,
          subtitle: parsed.subtitle,
          badge_text: saved.badge_text,
          image_url: saved.image_url,
          featured_item_id: parsed.featured_item_id,
          featured_badge_text: parsed.featured_badge_text || 'OFERTA ESPECIAL',
          active: saved.active,
          created_at: saved.created_at,
          updated_at: saved.updated_at,
        };

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responsePayload),
        };
      } catch (bErr) {
        console.error('[Admin Manage Menu - Banner] Erro ao salvar banner:', bErr);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Erro ao salvar banner do cardápio: ' + (bErr.message || '') }),
        };
      }
    }

    // =========================================================================
    // POST: Criar nova Categoria ou novo Item
    // =========================================================================
    if (method === 'POST') {
      // ----------------- CRIAR CATEGORIA -----------------
      if (entity === 'category') {
        const { name, display_order, image_url } = payload;

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
          image_url: image_url ? String(image_url).trim() : null,
          display_order: parsedDisplayOrder,
          active: true, // active sempre começa true
        };

        let newCategory = null;
        let insertError = null;

        const { data: insertedCat, error: initialCatError } = await supabase
          .from('menu_categories')
          .insert(insertData)
          .select('*')
          .single();

        if (initialCatError) {
          // Se a coluna image_url ainda não existir, tenta sem ela
          if (String(initialCatError.message || '').includes('image_url') || initialCatError.code === '42703') {
            const fallbackData = { ...insertData };
            delete fallbackData.image_url;
            const { data: retryCat, error: retryError } = await supabase
              .from('menu_categories')
              .insert(fallbackData)
              .select('*')
              .single();
            newCategory = retryCat;
            insertError = retryError;
          } else {
            insertError = initialCatError;
          }
        } else {
          newCategory = insertedCat;
        }

        if (insertError || !newCategory) {
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
          ingredients,
          variations,
          display_order,
          featured_home,
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

        const isFeaturedHome = Boolean(featured_home);
        if (isFeaturedHome) {
          const { count: currentFeaturedCount, error: countErr } = await supabase
            .from('menu_items')
            .select('id', { count: 'exact', head: true })
            .eq('featured_home', true);

          if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 3) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.',
              }),
            };
          }
        }

        const insertData = {
          category_id,
          name: name.trim(),
          description: description ? String(description).trim() : null,
          price_cents,
          promo_price_cents: validatedPromoPriceCents,
          image_url: image_url ? String(image_url).trim() : null,
          ingredients: ingredients ? String(ingredients).trim() : null,
          variations: Array.isArray(variations) ? variations : null,
          display_order: parsedDisplayOrder,
          available: true, // available sempre começa true
          featured_home: isFeaturedHome,
        };

        let newItem = null;
        let insertError = null;

        const { data: insertedItem, error: initialInsertError } = await supabase
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

        if (initialInsertError) {
          const isColumnError =
            String(initialInsertError.message || '').includes('featured_home') ||
            String(initialInsertError.message || '').includes('ingredients') ||
            String(initialInsertError.message || '').includes('variations') ||
            initialInsertError.code === 'PGRST204' ||
            initialInsertError.code === '42703';

          if (isColumnError) {
            console.warn(
              '[Admin Manage Menu - POST Item] Tentando salvar sem colunas extras ainda não migradas...'
            );
            const fallbackData = { ...insertData };
            delete fallbackData.featured_home;
            delete fallbackData.ingredients;
            delete fallbackData.variations;

            const { data: retryItem, error: retryError } = await supabase
              .from('menu_items')
              .insert(fallbackData)
              .select(`
                *,
                menu_categories (
                  id,
                  name
                )
              `)
              .single();

            if (retryError) {
              insertError = retryError;
            } else {
              newItem = retryItem;
            }
          } else {
            insertError = initialInsertError;
          }
        } else {
          newItem = insertedItem;
        }

        if (insertError || !newItem) {
          console.error('[Admin Manage Menu - POST Item] Erro ao inserir:', insertError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: insertError?.message || 'Erro ao cadastrar item no cardápio.',
            }),
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
          ingredients: newItem.ingredients || null,
          variations: newItem.variations || null,
          display_order: newItem.display_order,
          available: newItem.available,
          featured_home: Boolean(newItem.featured_home),
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

        if (payload.image_url !== undefined) {
          updateData.image_url = payload.image_url ? String(payload.image_url).trim() : null;
        }

        let updatedCategory = null;
        let updateError = null;

        const { data: initialUpdatedCat, error: initialCatUpdateError } = await supabase
          .from('menu_categories')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .maybeSingle();

        if (initialCatUpdateError) {
          if (String(initialCatUpdateError.message || '').includes('image_url') || initialCatUpdateError.code === '42703') {
            const fallbackData = { ...updateData };
            delete fallbackData.image_url;
            const { data: retryCat, error: retryError } = await supabase
              .from('menu_categories')
              .update(fallbackData)
              .eq('id', id)
              .select('*')
              .maybeSingle();
            updatedCategory = retryCat;
            updateError = retryError;
          } else {
            updateError = initialCatUpdateError;
          }
        } else {
          updatedCategory = initialUpdatedCat;
        }

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
          ingredients,
          variations,
          display_order,
          available,
          featured_home,
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

        if (featured_home !== undefined) {
          if (typeof featured_home !== 'boolean') {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'O campo featured_home deve ser um booleano (true ou false).' }),
            };
          }

          if (featured_home === true) {
            const { count: otherFeaturedCount, error: countErr } = await supabase
              .from('menu_items')
              .select('id', { count: 'exact', head: true })
              .eq('featured_home', true)
              .neq('id', id);

            if (!countErr && typeof otherFeaturedCount === 'number' && otherFeaturedCount >= 3) {
              return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: 'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.',
                }),
              };
            }
          }

          updateData.featured_home = featured_home;
        }

        if (ingredients !== undefined) {
          updateData.ingredients = ingredients ? String(ingredients).trim() : null;
        }

        if (variations !== undefined) {
          updateData.variations = Array.isArray(variations) ? variations : null;
        }

        let updatedItem = null;
        let updateError = null;

        const { data: initialUpdatedItem, error: initialUpdateError } = await supabase
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

        if (initialUpdateError) {
          const isColumnError =
            String(initialUpdateError.message || '').includes('featured_home') ||
            String(initialUpdateError.message || '').includes('ingredients') ||
            String(initialUpdateError.message || '').includes('variations') ||
            initialUpdateError.code === 'PGRST204' ||
            initialUpdateError.code === '42703';

          if (isColumnError) {
            console.warn(
              '[Admin Manage Menu - PUT Item] Tentando atualizar sem colunas extras ainda não migradas...'
            );
            const fallbackData = { ...updateData };
            delete fallbackData.featured_home;
            delete fallbackData.ingredients;
            delete fallbackData.variations;

            const { data: retryItem, error: retryError } = await supabase
              .from('menu_items')
              .update(fallbackData)
              .eq('id', id)
              .select(`
                *,
                menu_categories (
                  id,
                  name
                )
              `)
              .maybeSingle();

            if (retryError) {
              updateError = retryError;
            } else {
              updatedItem = retryItem;
            }
          } else {
            updateError = initialUpdateError;
          }
        } else {
          updatedItem = initialUpdatedItem;
        }

        if (updateError) {
          console.error('[Admin Manage Menu - PUT Item] Erro ao atualizar:', updateError);
          return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: updateError?.message || 'Erro ao atualizar item do cardápio.',
            }),
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
          ingredients: updatedItem.ingredients || null,
          variations: updatedItem.variations || null,
          display_order: updatedItem.display_order,
          available: updatedItem.available,
          featured_home: Boolean(updatedItem.featured_home),
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
