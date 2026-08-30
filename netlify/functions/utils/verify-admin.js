import jwt from 'jsonwebtoken';

/**
 * Helper para verificar o token JWT de administrador em Netlify Functions.
 * Lê o header 'Authorization: Bearer <token>', valida com ADMIN_JWT_SECRET
 * e retorna os dados do payload { admin_id, email, role }.
 *
 * Lança um erro explicativo com .statusCode = 401 ou 500 caso o token seja inválido, ausente ou expirado.
 */
export function verifyAdminToken(event) {
  const authHeader =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    event.headers?.['authorization'] ||
    event.headers?.['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    const error = new Error('Token de autenticação não fornecido no cabeçalho Authorization.');
    error.statusCode = 401;
    throw error;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    const error = new Error('Formato do cabeçalho de autenticação inválido. Use "Bearer <token>".');
    error.statusCode = 401;
    throw error;
  }

  const token = parts[1];
  if (!token) {
    const error = new Error('Token de autenticação ausente.');
    error.statusCode = 401;
    throw error;
  }

  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) {
    const error = new Error('ADMIN_JWT_SECRET não está configurado nas variáveis de ambiente do servidor.');
    error.statusCode = 500;
    throw error;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (err) {
    const error = new Error('Token de autenticação inválido ou expirado.');
    error.statusCode = 401;
    throw error;
  }
}
