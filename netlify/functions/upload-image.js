import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

const BUCKET_NAME = 'package-images';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB max

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Ensure the bucket exists and is public
async function ensureBucketExists(supabase) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('[Upload Image] Aviso ao listar buckets:', listError.message);
      return;
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      if (createError) {
        console.warn('[Upload Image] Aviso ao criar bucket:', createError.message);
      }
    }
  } catch (err) {
    console.warn('[Upload Image] Erro ao verificar bucket:', err);
  }
}

export const handler = async (event) => {
  const method = event.httpMethod;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: `Método ${method} não permitido. Use POST.` }),
    };
  }

  // 1. Verificar autenticação de administrador
  try {
    verifyAdminToken(event);
  } catch (authErr) {
    return {
      statusCode: authErr.statusCode || 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: authErr.message || 'Acesso não autorizado.' }),
    };
  }

  // 2. Processar payload
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

  const rawBase64 = payload.fileBase64 || payload.data || payload.image || payload.file;
  const originalFilename = payload.filename || 'image.jpg';
  let mimeType = payload.contentType || payload.mimeType || 'image/jpeg';

  if (!rawBase64 || typeof rawBase64 !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Arquivo não informado. Envie o campo "fileBase64" contendo a imagem em base64.',
      }),
    };
  }

  // Tratar se veio como data URI (ex: data:image/png;base64,iVBORw...)
  let base64Clean = rawBase64;
  if (rawBase64.includes(';base64,')) {
    const parts = rawBase64.split(';base64,');
    const header = parts[0];
    base64Clean = parts[1];
    const detectedMime = header.replace('data:', '').trim();
    if (detectedMime) {
      mimeType = detectedMime;
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Formato de arquivo não suportado (${mimeType}). Formatos aceitos: JPG, PNG, WEBP, GIF, SVG.`,
      }),
    };
  }

  // Converter Base64 em Buffer
  let buffer;
  try {
    buffer = Buffer.from(base64Clean, 'base64');
  } catch (bufErr) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao decodificar arquivo base64.' }),
    };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Tamanho máximo de imagem excedido (${(buffer.length / (1024 * 1024)).toFixed(2)}MB). Limite: 10MB.`,
      }),
    };
  }

  const supabase = getSupabase();

  // Caso Supabase não esteja conectado com chave de storage, retornar Data URI otimizada
  if (!supabase) {
    console.warn('[Upload Image] Supabase não configurado. Retornando Data URI.');
    const fallbackDataUri = `data:${mimeType};base64,${base64Clean}`;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        url: fallbackDataUri,
        path: `local/${Date.now()}-${originalFilename}`,
        filename: originalFilename,
        warning: 'Armazenado localmente pois o Supabase Storage não está configurado.',
      }),
    };
  }

  try {
    await ensureBucketExists(supabase);

    // Determinar extensão do arquivo
    let extension = 'jpg';
    if (mimeType.includes('png')) extension = 'png';
    else if (mimeType.includes('webp')) extension = 'webp';
    else if (mimeType.includes('gif')) extension = 'gif';
    else if (mimeType.includes('svg')) extension = 'svg';

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const sanitizedOriginalName = originalFilename
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const filePath = `uploads/${timestamp}-${randomId}-${sanitizedOriginalName}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload Image] Erro no upload do Supabase:', uploadError);
      // Se falhar o upload do storage (ex: permissões RLS), faz fallback para Data URI segura para não quebrar o usuário
      const fallbackDataUri = `data:${mimeType};base64,${base64Clean}`;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          url: fallbackDataUri,
          path: filePath,
          filename: originalFilename,
          warning: `Armazenamento remoto indisponível (${uploadError.message}). Imagem salva diretamente no cadastro.`,
        }),
      };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem salva.');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        url: publicUrl,
        path: filePath,
        filename: originalFilename,
      }),
    };
  } catch (err) {
    console.error('[Upload Image] Erro inesperado:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err?.message || 'Erro ao realizar upload da imagem.',
      }),
    };
  }
};
