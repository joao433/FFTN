import React, { useState, useRef } from 'react';
import {
  Upload,
  Video,
  X,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
  Play,
  Trash2,
} from 'lucide-react';

interface VideoUploadFieldProps {
  id?: string;
  label?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  helperText?: string;
  maxSizeBytes?: number;
}

export default function VideoUploadField({
  id = 'video-upload',
  label = 'Vídeo de Destaque da Home',
  value,
  onChange,
  helperText = 'Formatos aceitos: MP4, WebM ou MOV (máx. 35MB). O vídeo será exibido em loop contínuo e sem som.',
  maxSizeBytes = 35 * 1024 * 1024, // 35MB
}: VideoUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    // Validate size
    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      setUploadError(`O arquivo selecionado tem ${(file.size / (1024 * 1024)).toFixed(1)}MB. O limite máximo permitido é ${maxMb}MB.`);
      return;
    }

    // Validate type
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg)$/i);
    if (!isVideo) {
      setUploadError('Por favor selecione um arquivo de vídeo válido (.mp4, .webm ou .mov).');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente no painel para enviar vídeos.');
      }

      // Step 1: Obter Signed Upload URL do backend
      const queryParams = new URLSearchParams({
        action: 'get-upload-url',
        filename: file.name,
        contentType: file.type || 'video/mp4',
      });

      const urlRes = await fetch(`/.netlify/functions/upload-media?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const urlData = await urlRes.json().catch(() => ({}));

      if (!urlRes.ok || !urlData.signedUrl || !urlData.publicUrl) {
        throw new Error(urlData.error || 'Não foi possível autorizar o envio do vídeo.');
      }

      // Step 2: Enviar arquivo via PUT direto para o Storage com progresso real
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', urlData.signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Falha no envio para o servidor (status ${xhr.status}).`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Erro de conexão ao enviar o vídeo. Verifique sua internet.'));
        };

        xhr.send(file);
      });

      onChange(urlData.publicUrl);
      setUploadSuccess('Vídeo carregado com sucesso!');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: unknown) {
      console.error('[VideoUploadField] Erro:', err);
      setUploadError(
        err instanceof Error ? err.message : 'Erro ao processar o vídeo. Tente novamente.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrlInput.trim()) return;

    try {
      new URL(manualUrlInput.trim());
      onChange(manualUrlInput.trim());
      setManualUrlInput('');
      setShowManualUrl(false);
      setUploadSuccess('URL do vídeo aplicada!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch {
      setUploadError('Insira uma URL válida (ex: https://.../video.mp4)');
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
    setUploadSuccess('Vídeo desmarcado. Clique em "Salvar" para confirmar a remoção e voltar ao fundo padrão.');
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  return (
    <div className="space-y-3" id={id}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#090909] uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] font-medium text-[#FD4912] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          {showManualUrl ? 'Ocultar URL manual' : 'Inserir URL direta'}
        </button>
      </div>

      {/* Manual URL Input Form */}
      {showManualUrl && (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2">
          <input
            type="url"
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="https://exemplo.com/videos/parque-hero.mp4"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#090909]/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FD4912] text-[#090909]"
          />
          <button
            type="submit"
            disabled={!manualUrlInput.trim()}
            className="px-3 py-1.5 bg-[#FD4912] text-white text-xs font-bold rounded-lg hover:bg-[#E03E0B] disabled:opacity-50 transition cursor-pointer"
          >
            Aplicar
          </button>
        </form>
      )}

      {/* Preview if Video Exists */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-[#090909]/15 bg-black group shadow-sm">
          <video
            src={value}
            controls
            preload="metadata"
            playsInline
            className="w-full max-h-72 object-contain bg-black/90 mx-auto"
          />

          <div className="p-3 bg-white border-t border-[#090909]/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-[#FD4912]/10 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-[#FD4912]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#090909] truncate">Vídeo da Home configurado</p>
                <p className="text-[10px] text-[#090909]/60 truncate font-mono">{value}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 text-xs font-bold text-[#090909] bg-white border border-[#090909]/15 rounded-lg hover:bg-[#F3EFEA] transition cursor-pointer"
              >
                Trocar Vídeo
              </button>
              <button
                type="button"
                onClick={handleRemove}
                title="Remover vídeo e voltar para o fundo padrão"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Area (Dropzone) */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
              handleFileProcess(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center cursor-pointer ${
            isDragging
              ? 'border-[#FD4912] bg-[#FD4912]/05 scale-[0.99]'
              : 'border-[#090909]/20 hover:border-[#FD4912] bg-[#FDF6ED]/50 hover:bg-[#FDF6ED]'
          } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="py-4 space-y-3">
              <Loader2 className="w-8 h-8 text-[#FD4912] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#090909]">
                  Enviando vídeo para o servidor... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                </p>
                <div className="w-48 max-w-full bg-[#090909]/10 rounded-full h-1.5 mx-auto overflow-hidden">
                  <div
                    className="bg-[#FD4912] h-full transition-all duration-200"
                    style={{ width: `${Math.max(uploadProgress, 8)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#090909]/60">
                  Por favor, não feche esta página enquanto o vídeo é transferido.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FD4912]/10 text-[#FD4912] flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#090909]">
                  Arraste o vídeo aqui ou clique para selecionar
                </p>
                <p className="text-[11px] text-[#090909]/60 mt-0.5">{helperText}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#090909]/10 rounded-full text-[10px] font-bold text-[#FD4912]">
                <Upload className="w-3 h-3" />
                <span>Escolher do Computador</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{uploadError}</div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}
    </div>
  );
}
