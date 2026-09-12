import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

const BUCKET_NAME = 'package-images';
const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
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

async function ensureBucketConfigured(supabase) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_MEDIA_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
    } else {
      // Ensure video MIME types and size limit are enabled
      await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_MEDIA_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
    }
  } catch (err) {
    console.warn('[Upload Media] Aviso ao verificar/atualizar bucket:', err);
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // 1. Verificar autenticação de administrador
  try {
    verifyAdminToken(event);
  } catch (authErr) {
    return {
      statusCode: authErr.statusCode || 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: authErr.message || 'Acesso não autorizado.' }),
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Supabase não configurado no servidor.' }),
    };
  }

  await ensureBucketConfigured(supabase);

  // --- GET: Obter Signed Upload URL para envio direto de arquivos grandes (ex: vídeos de 20MB-50MB) ---
  if (method === 'GET') {
    const params = event.queryStringParameters || {};
    const rawFilename = params.filename || 'media.mp4';
    const contentType = (params.contentType || 'video/mp4').toLowerCase();

    // Sanitizar nome do arquivo
    const extMatch = rawFilename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : (contentType.includes('video') ? 'mp4' : 'jpg');
    const baseClean = rawFilename
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 40);

    const folder = contentType.startsWith('video/') ? 'videos' : 'uploads';
    const filePath = `${folder}/${Date.now()}-${baseClean}.${ext}`;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(filePath, { expiresIn: 3600 });

      if (error || !data) {
        throw new Error(error?.message || 'Falha ao gerar URL de upload assinada.');
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          signedUrl: data.signedUrl,
          path: filePath,
          token: data.token,
          publicUrl: publicData?.publicUrl,
        }),
      };
    } catch (err) {
      console.error('[Upload Media] Erro ao criar signed upload url:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message || 'Erro ao gerar URL de upload.' }),
      };
    }
  }

  // --- POST: Upload alternativo via base64 ou multipart ---
  if (method === 'POST') {
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Payload JSON inválido.' }),
      };
    }

    const rawBase64 = payload.fileBase64 || payload.data || payload.file;
    const filename = payload.filename || 'media.mp4';
    let contentType = payload.contentType || 'video/mp4';

    if (!rawBase64) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Nenhum arquivo enviado.' }),
      };
    }

    let base64Clean = rawBase64;
    if (rawBase64.includes(';base64,')) {
      const parts = rawBase64.split(';base64,');
      contentType = parts[0].replace('data:', '').trim() || contentType;
      base64Clean = parts[1];
    }

    const buffer = Buffer.from(base64Clean, 'base64');
    const folder = contentType.startsWith('video/') ? 'videos' : 'uploads';
    const filePath = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: uploadError.message }),
      };
    }

    const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        url: pubData?.publicUrl,
        path: filePath,
      }),
    };
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: `Método ${method} não permitido.` }),
  };
};
