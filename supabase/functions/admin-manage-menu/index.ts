import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

function isValidPositiveInteger(val: any): boolean {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

function extractFeaturedMetadata(rawSubtitle: string | null, existingItemId: string | null, existingBadgeText: string | null) {
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
      } catch {
        // ignore parse error
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

function embedFeaturedMetadata(rawSubtitle: string | null | undefined, featuredItemId: string | null, featuredBadgeText: string | null) {
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

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const method = req.method;

  if (method === 'DELETE') {
    return errorResponse(
      'Exclusão direta de itens ou categorias não é permitida. Para desativar uma categoria use active: false, para desativar um item use available: false.',
      405
    );
  }

  if (!['GET', 'POST', 'PUT'].includes(method)) {
    return errorResponse(`Método ${method} não permitido. Use GET, POST ou PUT.`, 405);
  }

  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Acesso não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  try {
    const supabase = getSupabaseClient();

    if (method === 'GET') {
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (catError) {
        console.error('[Admin Manage Menu - GET Categories] Erro:', catError);
        return errorResponse('Erro ao listar categorias do cardápio.', 500);
      }

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
        console.error('[Admin Manage Menu - GET Items] Erro:', itemsError);
        return errorResponse('Erro ao listar itens do cardápio.', 500);
      }

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

      const formattedCategories = (categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        display_order: cat.display_order,
        active: cat.active,
        image_url: cat.image_url || null,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      }));

      const formattedItems = (items || []).map((item: any) => ({
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

      return jsonResponse({
        categories: formattedCategories,
        items: formattedItems,
        banner,
      });
    }

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido no corpo da requisição.', 400);
    }

    const { entity } = payload;
    if (!entity || !['category', 'item', 'banner'].includes(entity)) {
      return errorResponse(
        'O campo "entity" é obrigatório e deve ser "category", "item" ou "banner".',
        400
      );
    }

    // BANNER
    if (entity === 'banner') {
      const { title, subtitle, badge_text, image_url, featured_item_id, featured_badge_text, active } =
        payload;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return errorResponse('O título do banner é obrigatório.', 400);
      }

      const cleanItemId =
        featured_item_id && String(featured_item_id).trim() ? String(featured_item_id).trim() : null;
      const cleanBadgeText =
        featured_badge_text && String(featured_badge_text).trim()
          ? String(featured_badge_text).trim()
          : null;

      const bannerData: Record<string, any> = {
        title: title.trim(),
        subtitle: subtitle !== undefined ? (subtitle ? String(subtitle).trim() : null) : null,
        badge_text: badge_text !== undefined ? (badge_text ? String(badge_text).trim() : null) : null,
        image_url: image_url !== undefined ? (image_url ? String(image_url).trim() : null) : null,
        featured_item_id: cleanItemId,
        featured_badge_text: cleanBadgeText,
        active: active !== undefined ? Boolean(active) : true,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase.from('menu_banner').select('id').limit(1).maybeSingle();

      let saved: any = null;
      let saveError: any = null;

      if (existing?.id) {
        const { data: updated, error: uErr } = await supabase
          .from('menu_banner')
          .update(bannerData)
          .eq('id', existing.id)
          .select('*')
          .maybeSingle();

        if (uErr) {
          const fallbackData = { ...bannerData };
          delete fallbackData.featured_item_id;
          delete fallbackData.featured_badge_text;
          fallbackData.subtitle = embedFeaturedMetadata(subtitle, cleanItemId, cleanBadgeText);

          const { data: retryUpdated, error: retryErr } = await supabase
            .from('menu_banner')
            .update(fallbackData)
            .eq('id', existing.id)
            .select('*')
            .maybeSingle();

          if (retryErr) saveError = retryErr;
          else saved = retryUpdated;
        } else {
          saved = updated;
        }
      } else {
        const { data: inserted, error: iErr } = await supabase
          .from('menu_banner')
          .insert(bannerData)
          .select('*')
          .maybeSingle();

        if (iErr) {
          const fallbackData = { ...bannerData };
          delete fallbackData.featured_item_id;
          delete fallbackData.featured_badge_text;
          fallbackData.subtitle = embedFeaturedMetadata(subtitle, cleanItemId, cleanBadgeText);

          const { data: retryInserted, error: retryErr } = await supabase
            .from('menu_banner')
            .insert(fallbackData)
            .select('*')
            .maybeSingle();

          if (retryErr) saveError = retryErr;
          else saved = retryInserted;
        } else {
          saved = inserted;
        }
      }

      if (saveError || !saved) {
        return errorResponse(`Erro ao salvar banner do cardápio: ${saveError?.message || ''}`, 500);
      }

      const parsed = extractFeaturedMetadata(
        saved.subtitle,
        saved.featured_item_id || cleanItemId,
        saved.featured_badge_text || cleanBadgeText
      );

      return jsonResponse({
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
      });
    }

    // POST
    if (method === 'POST') {
      if (entity === 'category') {
        const { name, display_order, image_url } = payload;
        if (!name || typeof name !== 'string' || !name.trim()) {
          return errorResponse('O nome da categoria (name) é obrigatório.', 400);
        }

        let parsedDisplayOrder = 0;
        if (display_order !== undefined && display_order !== null) {
          const num = Number(display_order);
          if (Number.isInteger(num)) parsedDisplayOrder = num;
        }

        const insertData = {
          name: name.trim(),
          image_url: image_url ? String(image_url).trim() : null,
          display_order: parsedDisplayOrder,
          active: true,
        };

        const { data: insertedCat, error: catErr } = await supabase
          .from('menu_categories')
          .insert(insertData)
          .select('*')
          .single();

        if (catErr) {
          console.error('[Admin Manage Menu - POST Category] Erro:', catErr);
          return errorResponse('Erro ao cadastrar categoria no banco de dados.', 500);
        }

        return jsonResponse(insertedCat, 201);
      }

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
          return errorResponse('O campo category_id é obrigatório para cadastrar um item.', 400);
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
          return errorResponse('O nome do item (name) é obrigatório.', 400);
        }

        if (!isValidPositiveInteger(price_cents)) {
          return errorResponse(
            'O campo price_cents é obrigatório e deve ser um número inteiro positivo em centavos.',
            400
          );
        }

        let validatedPromoPriceCents = null;
        if (promo_price_cents !== undefined && promo_price_cents !== null && promo_price_cents !== '') {
          if (!isValidPositiveInteger(promo_price_cents)) {
            return errorResponse(
              'O preço promocional (promo_price_cents) deve ser um número inteiro positivo em centavos.',
              400
            );
          }
          if (promo_price_cents >= price_cents) {
            return errorResponse(
              'O preço promocional (promo_price_cents) deve ser estritamente menor que o preço original (price_cents).',
              400
            );
          }
          validatedPromoPriceCents = promo_price_cents;
        }

        let parsedDisplayOrder = 0;
        if (display_order !== undefined && display_order !== null) {
          const num = Number(display_order);
          if (Number.isInteger(num)) parsedDisplayOrder = num;
        }

        const isFeaturedHome = Boolean(featured_home);
        if (isFeaturedHome) {
          const { count: currentFeaturedCount, error: countErr } = await supabase
            .from('menu_items')
            .select('id', { count: 'exact', head: true })
            .eq('featured_home', true);

          if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 3) {
            return errorResponse(
              'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.',
              400
            );
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
          available: true,
          featured_home: isFeaturedHome,
        };

        const { data: insertedItem, error: insertError } = await supabase
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
          console.error('[Admin Manage Menu - POST Item] Erro:', insertError);
          return errorResponse(insertError.message || 'Erro ao cadastrar item no cardápio.', 500);
        }

        const formattedNewItem = {
          id: insertedItem.id,
          category_id: insertedItem.category_id,
          category_name: insertedItem.menu_categories?.name || 'Sem categoria',
          name: insertedItem.name,
          description: insertedItem.description,
          price_cents: insertedItem.price_cents,
          promo_price_cents: insertedItem.promo_price_cents,
          image_url: insertedItem.image_url,
          ingredients: insertedItem.ingredients || null,
          variations: insertedItem.variations || null,
          display_order: insertedItem.display_order,
          available: insertedItem.available,
          featured_home: Boolean(insertedItem.featured_home),
          created_at: insertedItem.created_at,
          updated_at: insertedItem.updated_at,
        };

        return jsonResponse(formattedNewItem, 201);
      }
    }

    // PUT
    if (method === 'PUT') {
      const { id } = payload;
      if (!id || typeof id !== 'string') {
        return errorResponse('O id é obrigatório para atualização.', 400);
      }

      if (entity === 'category') {
        const { name, display_order, active, image_url } = payload;
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (name !== undefined) {
          if (typeof name !== 'string' || !name.trim()) {
            return errorResponse('O nome da categoria não pode ser vazio.', 400);
          }
          updateData.name = name.trim();
        }

        if (display_order !== undefined) {
          const num = Number(display_order);
          if (!Number.isInteger(num)) {
            return errorResponse('O campo display_order deve ser um número inteiro.', 400);
          }
          updateData.display_order = num;
        }

        if (active !== undefined) {
          if (typeof active !== 'boolean') {
            return errorResponse('O campo active deve ser booleano (true ou false).', 400);
          }
          updateData.active = active;
        }

        if (image_url !== undefined) {
          updateData.image_url = image_url ? String(image_url).trim() : null;
        }

        const { data: updatedCategory, error: updateError } = await supabase
          .from('menu_categories')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .maybeSingle();

        if (updateError) {
          console.error('[Admin Manage Menu - PUT Category] Erro:', updateError);
          return errorResponse('Erro ao atualizar categoria do cardápio.', 500);
        }

        if (!updatedCategory) {
          return errorResponse('Categoria não encontrada.', 404);
        }

        return jsonResponse(updatedCategory);
      }

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

        let currentItem: any = null;
        if (price_cents !== undefined || promo_price_cents !== undefined) {
          const { data: itemData, error: fetchErr } = await supabase
            .from('menu_items')
            .select('id, price_cents, promo_price_cents')
            .eq('id', id)
            .maybeSingle();

          if (fetchErr || !itemData) {
            return errorResponse('Item do cardápio não encontrado para validação de preço.', 404);
          }
          currentItem = itemData;
        }

        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (category_id !== undefined) {
          if (typeof category_id !== 'string' || !category_id.trim()) {
            return errorResponse('O category_id informado é inválido.', 400);
          }
          updateData.category_id = category_id;
        }

        if (name !== undefined) {
          if (typeof name !== 'string' || !name.trim()) {
            return errorResponse('O nome do item não pode ser vazio.', 400);
          }
          updateData.name = name.trim();
        }

        if (description !== undefined) {
          updateData.description = description ? String(description).trim() : null;
        }

        if (image_url !== undefined) {
          updateData.image_url = image_url ? String(image_url).trim() : null;
        }

        const effectivePrice = price_cents !== undefined ? price_cents : currentItem?.price_cents;

        if (price_cents !== undefined) {
          if (!isValidPositiveInteger(price_cents)) {
            return errorResponse(
              'O campo price_cents deve ser um número inteiro positivo em centavos.',
              400
            );
          }
          updateData.price_cents = price_cents;
        }

        if (promo_price_cents !== undefined) {
          if (promo_price_cents === null || promo_price_cents === '') {
            updateData.promo_price_cents = null;
          } else {
            if (!isValidPositiveInteger(promo_price_cents)) {
              return errorResponse(
                'O campo promo_price_cents deve ser um número inteiro positivo em centavos ou nulo.',
                400
              );
            }
            if (effectivePrice && promo_price_cents >= effectivePrice) {
              return errorResponse(
                'O preço promocional (promo_price_cents) deve ser estritamente menor que o preço original (price_cents).',
                400
              );
            }
            updateData.promo_price_cents = promo_price_cents;
          }
        } else if (price_cents !== undefined && currentItem?.promo_price_cents) {
          if (currentItem.promo_price_cents >= price_cents) {
            return errorResponse(
              'O novo preço original é menor ou igual ao preço promocional existente. Atualize ou remova o preço promocional.',
              400
            );
          }
        }

        if (display_order !== undefined) {
          const num = Number(display_order);
          if (!Number.isInteger(num)) {
            return errorResponse('O campo display_order deve ser um número inteiro.', 400);
          }
          updateData.display_order = num;
        }

        if (available !== undefined) {
          if (typeof available !== 'boolean') {
            return errorResponse('O campo available deve ser um booleano (true ou false).', 400);
          }
          updateData.available = available;
        }

        if (featured_home !== undefined) {
          if (typeof featured_home !== 'boolean') {
            return errorResponse('O campo featured_home deve ser um booleano (true ou false).', 400);
          }

          if (featured_home === true) {
            const { count: otherFeaturedCount, error: countErr } = await supabase
              .from('menu_items')
              .select('id', { count: 'exact', head: true })
              .eq('featured_home', true)
              .neq('id', id);

            if (!countErr && typeof otherFeaturedCount === 'number' && otherFeaturedCount >= 3) {
              return errorResponse(
                'Você já tem 3 itens destacados. Desmarque um antes de adicionar outro.',
                400
              );
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
          console.error('[Admin Manage Menu - PUT Item] Erro:', updateError);
          return errorResponse(`Erro ao atualizar item do cardápio: ${updateError.message}`, 500);
        }

        if (!updatedItem) {
          return errorResponse('Item do cardápio não encontrado.', 404);
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

        return jsonResponse(formattedUpdatedItem);
      }
    }
  } catch (error: any) {
    console.error('[Admin Manage Menu] Erro inesperado:', error);
    return errorResponse('Ocorreu um erro interno no servidor.', 500);
  }
});
