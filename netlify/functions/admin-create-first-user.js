import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

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
  // 1. Aceita apenas requisições POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
    };
  }

  try {
    // 2. Parse e validação do payload JSON
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

    const { setup_secret, email, password } = payload;

    // 3. Validação do segredo de configuração (ADMIN_SETUP_SECRET)
    const configuredSetupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!configuredSetupSecret) {
      console.error('[Admin Create First User] ADMIN_SETUP_SECRET não está definido no ambiente.');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'ADMIN_SETUP_SECRET não está configurado no servidor.',
        }),
      };
    }

    if (!setup_secret || setup_secret !== configuredSetupSecret) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Acesso não autorizado. Segredo de configuração inválido.',
        }),
      };
    }

    // 4. Validação de e-mail e senha
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Informe um endereço de e-mail válido.' }),
      };
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'A senha deve ter pelo menos 6 caracteres.',
        }),
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    // 5. Verificar se já existe um usuário com esse e-mail na tabela admin_users
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('[Admin Create First User] Erro ao consultar admin_users no Supabase:', checkError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao verificar existência do usuário administrador.' }),
      };
    }

    if (existingUser) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Já existe um usuário administrador cadastrado com este e-mail.',
        }),
      };
    }

    // 6. Gerar hash da senha com bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. Inserir registro na tabela admin_users
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'admin',
      });

    if (insertError) {
      console.error('[Admin Create First User] Erro ao inserir na tabela admin_users:', insertError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Erro ao cadastrar usuário administrador.' }),
      };
    }

    // 8. Retornar sucesso sem expor senhas ou hashes
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('[Admin Create First User] Erro inesperado:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
