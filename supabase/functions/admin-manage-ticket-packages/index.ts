import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

function isValidPositiveInteger(val: any): boolean {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const method = req.method;

  if (method === 'DELETE') {
    return errorResponse(
      'Exclusão de pacotes não é permitida para preservar o histórico de vendas. Use active: false (PUT) para desativar o pacote.',
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
      const { data, error } = await supabase
        .from('ticket_packages')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Admin Manage Ticket Packages - GET] Erro no Supabase:', error);
        return errorResponse('Erro ao listar pacotes de ingressos.', 500);
      }

      const formatted = (data || []).map((pkg: any) => ({
        ...pkg,
        featured_home: Boolean(pkg.featured_home),
      }));

      return jsonResponse(formatted);
    }

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido no corpo da requisição.', 400);
    }

    if (method === 'POST') {
      const { name, description, price_cents, image_url, display_order, featured_home } = payload;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return errorResponse('O nome do pacote (name) é obrigatório.', 400);
      }

      if (!isValidPositiveInteger(price_cents)) {
        return errorResponse(
          'O campo price_cents é obrigatório e deve ser um número inteiro positivo representando o valor em centavos (ex: 2990 para $29.90).',
          400
        );
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
          return errorResponse(
            'Você já tem 3 pacotes de ingressos destacados. Desmarque um antes de adicionar outro.',
            400
          );
        }
      }

      const insertData = {
        name: name.trim(),
        description: description ? String(description).trim() : null,
        price_cents,
        image_url: image_url ? String(image_url).trim() : null,
        display_order: parsedDisplayOrder,
        active: true,
        featured_home: isFeaturedHome,
      };

      const { data: newPackage, error: insertError } = await supabase
        .from('ticket_packages')
        .insert(insertData)
        .select('*')
        .single();

      if (insertError) {
        console.error('[Admin Manage Ticket Packages - POST] Erro ao inserir:', insertError);
        return errorResponse(`Erro ao criar pacote de ingresso: ${insertError.message || 'Erro no banco'}`, 500);
      }

      return jsonResponse(
        {
          ...newPackage,
          featured_home: Boolean(newPackage.featured_home),
        },
        201
      );
    }

    if (method === 'PUT') {
      const { id, name, description, price_cents, image_url, display_order, active, featured_home } =
        payload;

      if (!id || typeof id !== 'string') {
        return errorResponse('O id do pacote é obrigatório para atualização.', 400);
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          return errorResponse('O nome do pacote (name) não pode ser vazio.', 400);
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
          return errorResponse(
            'O campo price_cents deve ser um número inteiro positivo representando o valor em centavos (ex: 2990 para $29.90).',
            400
          );
        }
        updateData.price_cents = price_cents;
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
          return errorResponse('O campo active deve ser um booleano (true ou false).', 400);
        }
        updateData.active = active;
      }

      if (featured_home !== undefined) {
        if (typeof featured_home !== 'boolean') {
          return errorResponse('O campo featured_home deve ser um booleano (true ou false).', 400);
        }

        if (featured_home === true) {
          const { count: currentFeaturedCount, error: countErr } = await supabase
            .from('ticket_packages')
            .select('id', { count: 'exact', head: true })
            .eq('featured_home', true)
            .neq('id', id);

          if (!countErr && typeof currentFeaturedCount === 'number' && currentFeaturedCount >= 3) {
            return errorResponse(
              'Você já tem 3 pacotes de ingressos destacados. Desmarque um antes de adicionar outro.',
              400
            );
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
        return errorResponse(`Erro ao atualizar pacote de ingresso: ${updateError.message || 'Erro no banco'}`, 500);
      }

      if (!updatedPackage) {
        return errorResponse('Pacote de ingresso não encontrado.', 404);
      }

      return jsonResponse({
        ...updatedPackage,
        featured_home: Boolean(updatedPackage.featured_home),
      });
    }
  } catch (error: any) {
    console.error('[Admin Manage Ticket Packages] Erro inesperado:', error);
    return errorResponse('Ocorreu um erro interno no servidor.', 500);
  }
});
