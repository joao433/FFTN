import { Buffer } from 'node:buffer';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

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

async function ensureBucketExists(supabase: any) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('[Upload Image] Aviso ao listar buckets:', listError.message);
      return;
    }

    const bucketExists = buckets?.some((b: any) => b.name === BUCKET_NAME);
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

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(`Método ${req.method} não permitido. Use POST.`, 405);
  }

  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Acesso não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Payload JSON inválido.', 400);
  }

  const rawBase64 = payload.fileBase64 || payload.data || payload.image || payload.file;
  const originalFilename = payload.filename || 'image.jpg';
  let mimeType = payload.contentType || payload.mimeType || 'image/jpeg';

  if (!rawBase64 || typeof rawBase64 !== 'string') {
    return errorResponse('Arquivo não informado. Envie o campo "fileBase64" contendo a imagem em base64.', 400);
  }

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
    return errorResponse(
      `Formato de arquivo não suportado (${mimeType}). Formatos aceitos: JPG, PNG, WEBP, GIF, SVG.`,
      400
    );
  }

  let buffer: Uint8Array;
  try {
    buffer = Buffer.from(base64Clean, 'base64');
  } catch {
    return errorResponse('Erro ao decodificar arquivo base64.', 400);
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return errorResponse(
      `Tamanho máximo de imagem excedido (${(buffer.length / (1024 * 1024)).toFixed(2)}MB). Limite: 10MB.`,
      400
    );
  }

  const supabase = getSupabaseClient();

  try {
    await ensureBucketExists(supabase);

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

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload Image] Erro no upload:', uploadError);
      const fallbackDataUri = `data:${mimeType};base64,${base64Clean}`;
      return jsonResponse({
        success: true,
        url: fallbackDataUri,
        path: filePath,
        filename: originalFilename,
        warning: `Armazenamento remoto indisponível (${uploadError.message}). Imagem salva diretamente no cadastro.`,
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem salva.');
    }

    return jsonResponse({
      success: true,
      url: publicUrl,
      path: filePath,
      filename: originalFilename,
    });
  } catch (err: any) {
    console.error('[Upload Image] Erro inesperado:', err);
    return errorResponse(err?.message || 'Erro ao realizar upload da imagem.', 500);
  }
});
