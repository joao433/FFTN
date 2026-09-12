import bcrypt from 'npm:bcryptjs@^2.4.3';
import jwt from 'npm:jsonwebtoken@^9.0.2';
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

    const { email, password } = payload;

    if (!email || !password) {
      return errorResponse('Credenciais inválidas.', 401);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const supabase = getSupabaseClient();

    const { data: adminUser, error: queryError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (queryError || !adminUser || !adminUser.password_hash) {
      if (queryError) {
        console.error('[Admin Login] Erro na consulta do Supabase:', queryError);
      }
      return errorResponse('Credenciais inválidas.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);

    if (!isPasswordValid) {
      return errorResponse('Credenciais inválidas.', 401);
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!jwtSecret) {
      console.error('[Admin Login] ADMIN_JWT_SECRET não está definido nas variáveis de ambiente.');
      return errorResponse('ADMIN_JWT_SECRET não está configurado no servidor.', 500);
    }

    const token = jwt.sign(
      {
        admin_id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role || 'admin',
      },
      jwtSecret,
      { expiresIn: '8h' }
    );

    return jsonResponse({
      token,
    });
  } catch (error: any) {
    console.error('[Admin Login] Erro inesperado:', error);
    return errorResponse('Ocorreu um erro interno no servidor.', 500);
  }
});
