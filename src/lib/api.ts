/**
 * Utilitário centralizado para resolução de URLs do backend.
 * Suporta Supabase Edge Functions (produção e Hostinger) e fallback local/Netlify.
 * 
 * Ordem de prioridade para a URL base:
 * 1. import.meta.env.VITE_API_BASE_URL (ex: https://<project-ref>.supabase.co/functions/v1)
 * 2. Derivação automática de import.meta.env.VITE_SUPABASE_URL (adiciona /functions/v1)
 * 3. Fallback relativo para ambientes legados ou proxies locais (/.netlify/functions)
 */

export function getApiBaseUrl(): string {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

  // 1. Variável explícita configurada (Hostinger / Produção)
  if (metaEnv.VITE_API_BASE_URL && typeof metaEnv.VITE_API_BASE_URL === 'string') {
    return metaEnv.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 2. Derivação automática da URL do Supabase
  if (metaEnv.VITE_SUPABASE_URL && typeof metaEnv.VITE_SUPABASE_URL === 'string') {
    const cleanUrl = metaEnv.VITE_SUPABASE_URL.replace(/\/+$/, '');
    return `${cleanUrl}/functions/v1`;
  }

  // 3. Fallback relativo para Netlify Functions ou proxy
  return '/.netlify/functions';
}

/**
 * Monta a URL completa para uma função específica, suportando query parameters opcionais.
 * 
 * @param functionName Nome da função (ex: 'create-checkout-session', 'admin-login')
 * @param params Query parameters opcionais
 * @returns URL completa pronta para uso no fetch
 */
export function getApiUrl(
  functionName: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  const baseUrl = getApiBaseUrl();
  const cleanName = functionName.replace(/^\/+/, '');
  const urlString = `${baseUrl}/${cleanName}`;

  if (!params || Object.keys(params).length === 0) {
    return urlString;
  }

  // Construir query string de forma segura
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) return urlString;

  return urlString.includes('?') ? `${urlString}&${queryString}` : `${urlString}?${queryString}`;
}

/**
 * Retorna os headers padrões opcionais para chamadas a Supabase Edge Functions.
 * Se houver chave anon pública configurada, inclui apikey para passar por gateways do Supabase.
 */
export function getApiHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_KEY || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (anonKey) {
    headers['apikey'] = anonKey;
  }

  if (additionalHeaders) {
    if (additionalHeaders instanceof Headers) {
      additionalHeaders.forEach((val, key) => {
        headers[key] = val;
      });
    } else if (Array.isArray(additionalHeaders)) {
      additionalHeaders.forEach(([key, val]) => {
        headers[key] = val;
      });
    } else {
      Object.assign(headers, additionalHeaders);
    }
  }

  return headers;
}
