import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

const DEFAULT_SETTINGS = {
  allow_no_deposit: true,
  allow_partial_deposit: true,
  deposit_percentage: 30,
  allow_full_payment: true,
};

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const method = req.method;

  if (!['GET', 'POST', 'PUT'].includes(method)) {
    return errorResponse(`Método ${method} não permitido. Use GET ou POST.`, 405);
  }

  const supabase = getSupabaseClient();

  if (method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('party_payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return jsonResponse(DEFAULT_SETTINGS, 200, { 'Cache-Control': 'public, max-age=60' });
      }

      return jsonResponse(
        {
          id: data.id,
          allow_no_deposit: Boolean(data.allow_no_deposit),
          allow_partial_deposit: Boolean(data.allow_partial_deposit),
          deposit_percentage: Number(data.deposit_percentage) || 30,
          allow_full_payment: Boolean(data.allow_full_payment),
          updated_at: data.updated_at,
        },
        200,
        { 'Cache-Control': 'no-cache' }
      );
    } catch (_err) {
      return jsonResponse(DEFAULT_SETTINGS);
    }
  }

  // POST / PUT requer autenticação de admin
  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Acesso não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido.', 400);
    }

    const allow_no_deposit =
      payload.allow_no_deposit !== undefined ? Boolean(payload.allow_no_deposit) : true;
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

    if (!allow_no_deposit && !allow_partial_deposit && !allow_full_payment) {
      return errorResponse(
        'Pelo menos uma opção de pagamento deve permanecer ativada para as reservas de festa.',
        400
      );
    }

    const now = new Date().toISOString();

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
      return errorResponse(`Erro ao salvar configurações: ${saveResult.error.message}`, 500);
    }

    return jsonResponse({
      success: true,
      settings: {
        id: saveResult.data.id,
        allow_no_deposit: Boolean(saveResult.data.allow_no_deposit),
        allow_partial_deposit: Boolean(saveResult.data.allow_partial_deposit),
        deposit_percentage: Number(saveResult.data.deposit_percentage),
        allow_full_payment: Boolean(saveResult.data.allow_full_payment),
        updated_at: saveResult.data.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[Party Payment Settings] Erro:', err);
    return errorResponse(err?.message || 'Erro interno ao salvar configurações.', 500);
  }
});
