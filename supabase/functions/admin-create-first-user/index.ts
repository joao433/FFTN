import bcrypt from 'npm:bcryptjs@^2.4.3';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Método não permitido. Use POST.', 405);
  }

  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido.', 400);
    }

    const { setup_secret, email, password } = payload;

    const configuredSetupSecret = Deno.env.get('ADMIN_SETUP_SECRET');
    if (!configuredSetupSecret) {
      console.error('[Admin Create First User] ADMIN_SETUP_SECRET não está definido no ambiente.');
      return errorResponse('ADMIN_SETUP_SECRET não está configurado no servidor.', 500);
    }

    if (!setup_secret || setup_secret !== configuredSetupSecret) {
      return errorResponse('Acesso não autorizado. Segredo de configuração inválido.', 403);
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return errorResponse('Informe um endereço de e-mail válido.', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return errorResponse('A senha deve ter pelo menos 6 caracteres.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('[Admin Create First User] Erro ao consultar admin_users no Supabase:', checkError);
      return errorResponse('Erro ao verificar existência do usuário administrador.', 500);
    }

    if (existingUser) {
      return errorResponse('Já existe um usuário administrador cadastrado com este e-mail.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'admin',
      });

    if (insertError) {
      console.error('[Admin Create First User] Erro ao inserir na tabela admin_users:', insertError);
      return errorResponse('Erro ao cadastrar usuário administrador.', 500);
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error('[Admin Create First User] Erro inesperado:', error);
    return errorResponse('Ocorreu um erro interno no servidor.', 500);
  }
});
