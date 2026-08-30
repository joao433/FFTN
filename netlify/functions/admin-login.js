import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    // 2. Parse do payload JSON
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

    const { email, password } = payload;

    if (!email || !password) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Credenciais inválidas.' }),
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    // 3. Buscar usuário administrador pelo e-mail
    const { data: adminUser, error: queryError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // Em caso de erro de consulta ou usuário não encontrado, retorna 401 genérico
    if (queryError || !adminUser || !adminUser.password_hash) {
      if (queryError) {
        console.error('[Admin Login] Erro na consulta do Supabase:', queryError);
      }
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Credenciais inválidas.' }),
      };
    }

    // 4. Comparar a senha informada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Credenciais inválidas.' }),
      };
    }

    // 5. Verificar e obter ADMIN_JWT_SECRET
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Admin Login] ADMIN_JWT_SECRET não está definido nas variáveis de ambiente.');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'ADMIN_JWT_SECRET não está configurado no servidor.',
        }),
      };
    }

    // 6. Gerar o JWT assinado com expiração de 8 horas
    const token = jwt.sign(
      {
        admin_id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role || 'admin',
      },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // 7. Retornar o token de autenticação
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
      }),
    };
  } catch (error) {
    console.error('[Admin Login] Erro inesperado no login:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }),
    };
  }
};
