import jwt from 'npm:jsonwebtoken@^9.0.2';

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export function verifyAdminToken(req: Request): AdminTokenPayload {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader) {
    throw new AuthError('Token de autenticação não fornecido no cabeçalho Authorization.', 401);
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new AuthError('Formato do cabeçalho de autenticação inválido. Use "Bearer <token>".', 401);
  }

  const token = parts[1];
  const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');

  if (!jwtSecret) {
    console.error('[Admin Auth] ADMIN_JWT_SECRET não configurado nas variáveis de ambiente.');
    throw new AuthError('ADMIN_JWT_SECRET não está configurado no servidor.', 500);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AdminTokenPayload;
    return decoded;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro na verificação';
    console.warn('[Admin Auth] Falha na validação do token JWT:', message);
    throw new AuthError('Token de autenticação inválido ou expirado.', 401);
  }
}
