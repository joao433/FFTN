import { Buffer } from 'node:buffer';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

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

async function ensureBucketConfigured(supabase: any) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);

    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_MEDIA_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
    } else {
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

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const method = req.method;

  if (!['GET', 'POST'].includes(method)) {
    return errorResponse(`Método ${method} não permitido.`, 405);
  }

  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Acesso não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  const supabase = getSupabaseClient();
  await ensureBucketConfigured(supabase);

  // GET: Obter Signed Upload URL
  if (method === 'GET') {
    const url = new URL(req.url);
    const rawFilename = url.searchParams.get('filename') || 'media.mp4';
    const contentType = (url.searchParams.get('contentType') || 'video/mp4').toLowerCase();

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

      return jsonResponse({
        success: true,
        signedUrl: data.signedUrl,
        path: filePath,
        token: data.token,
        publicUrl: publicData?.publicUrl,
      });
    } catch (err: any) {
      console.error('[Upload Media] Erro ao criar signed upload url:', err);
      return errorResponse(err.message || 'Erro ao gerar URL de upload.', 500);
    }
  }

  // POST: Upload alternativo via base64
  if (method === 'POST') {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido.', 400);
    }

    const rawBase64 = payload.fileBase64 || payload.data || payload.file;
    const filename = payload.filename || 'media.mp4';
    let contentType = payload.contentType || 'video/mp4';

    if (!rawBase64) {
      return errorResponse('Nenhum arquivo enviado.', 400);
    }

    let base64Clean = rawBase64;
    if (rawBase64.includes(';base64,')) {
      const parts = rawBase64.split(';base64,');
      contentType = parts[0].replace('data:', '').trim() || contentType;
      base64Clean = parts[1];
    }

    let buffer: Uint8Array;
    try {
      buffer = Buffer.from(base64Clean, 'base64');
    } catch {
      return errorResponse('Erro ao decodificar base64.', 400);
    }

    const folder = contentType.startsWith('video/') ? 'videos' : 'uploads';
    const filePath = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return errorResponse(uploadError.message, 500);
    }

    const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return jsonResponse({
      success: true,
      url: pubData?.publicUrl,
      path: filePath,
    });
  }

  return errorResponse(`Método ${method} não permitido.`, 405);
});
