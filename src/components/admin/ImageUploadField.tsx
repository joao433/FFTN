import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api.ts';

interface ImageUploadFieldProps {
  id?: string;
  label?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  accentColor?: 'red' | 'amber' | 'orange' | 'blue';
  helperText?: string;
}

export default function ImageUploadField({
  id = 'image-upload',
  label = 'Imagem Ilustrativa',
  value,
  onChange,
  accentColor = 'amber',
  helperText = 'Formatos aceitos: JPG, PNG, WEBP ou GIF (máx. 10MB).',
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Styling accents based on tab/section
  const accentClasses = {
    red: {
      border: 'hover:border-red-400 focus-within:border-red-500',
      activeBorder: 'border-red-500 bg-red-50',
      button: 'bg-red-600 hover:bg-red-500 text-white',
      badge: 'bg-red-50 text-red-700 border-red-200',
      ring: 'focus:ring-red-500 focus:border-red-500',
    },
    amber: {
      border: 'hover:border-amber-400 focus-within:border-amber-500',
      activeBorder: 'border-amber-500 bg-amber-50',
      button: 'bg-[#F2A94E] hover:bg-[#E0983D] text-[#3A2E26] font-bold font-fredoka',
      badge: 'bg-[#FAF0E1] text-[#7A6C60] border-[#EADCC9]',
      ring: 'focus:ring-[#F2A94E] focus:border-[#F2A94E]',
    },
    orange: {
      border: 'hover:border-orange-400 focus-within:border-orange-500',
      activeBorder: 'border-orange-500 bg-orange-50',
      button: 'bg-[#E8734A] hover:bg-[#D26038] text-white font-bold font-fredoka',
      badge: 'bg-[#FAF0E1] text-[#E8734A] border-[#EADCC9]',
      ring: 'focus:ring-[#E8734A] focus:border-[#E8734A]',
    },
    blue: {
      border: 'hover:border-[#E8734A]/50 focus-within:border-[#E8734A]',
      activeBorder: 'border-[#E8734A] bg-[#FAF0E1]',
      button: 'bg-[#E8734A] hover:bg-[#D26038] text-white font-bold font-fredoka',
      badge: 'bg-[#FAF0E1] text-[#E8734A] border-[#EADCC9]',
      ring: 'focus:ring-[#E8734A] focus:border-[#E8734A]',
    },
  }[accentColor];

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('O arquivo selecionado é muito grande. Escolha uma imagem de até 10MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecione um arquivo de imagem válido (JPG, PNG, WEBP, GIF).');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente para enviar imagens.');
      }

      // Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo do dispositivo.'));
      });
      reader.readAsDataURL(file);

      const base64Data = await base64Promise;

      const response = await fetch(getApiUrl('upload-image'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          filename: file.name,
          contentType: file.type,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload da imagem.');
      }

      if (result.url) {
        onChange(result.url);
        setUploadSuccess('Foto enviada com sucesso!');
        setTimeout(() => setUploadSuccess(null), 3500);
      } else {
        throw new Error('URL da imagem não retornada pelo servidor.');
      }
    } catch (err: unknown) {
      console.error('[Upload Image Error]:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao enviar imagem.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    onChange(null);
    setUploadError(null);
    setUploadSuccess(null);
    setManualUrlInput('');
  };

  const handleApplyManualUrl = () => {
    if (manualUrlInput.trim()) {
      onChange(manualUrlInput.trim());
      setShowManualUrl(false);
      setManualUrlInput('');
      setUploadSuccess('Link de imagem aplicado!');
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-[11px] font-bold uppercase tracking-wider text-slate-700"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showManualUrl ? 'Fazer upload de arquivo' : 'Colar link direto'}</span>
        </button>
      </div>

      {/* Manual URL Input Option */}
      {showManualUrl ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="https://exemplo.com/minha-foto.jpg"
              value={manualUrlInput}
              onChange={(e) => setManualUrlInput(e.target.value)}
              className={`w-full px-3 py-2 pl-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none ${accentClasses.ring}`}
            />
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="button"
            onClick={handleApplyManualUrl}
            disabled={!manualUrlInput.trim()}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${accentClasses.button}`}
          >
            Aplicar
          </button>
        </div>
      ) : null}

      {/* Current Image Preview */}
      {value ? (
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-3.5 overflow-hidden group">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback on broken image
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Imagem carregada</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5" title={value}>
              {value.startsWith('data:') ? 'Arquivo enviado do computador' : value}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[11px] text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
              >
                Trocar foto
              </button>
            </div>
          </div>

          <button
            type="button"
            id={`${id}-btn-remove`}
            onClick={handleRemoveImage}
            title="Remover imagem"
            className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Dropzone / Upload Area */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? accentClasses.activeBorder
              : `border-slate-300 bg-slate-50/70 ${accentClasses.border}`
          }`}
        >
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
              <span className="text-xs font-semibold text-slate-600">
                Enviando imagem para o servidor...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <Upload className="w-5 h-5" />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Clique para escolher uma foto do computador
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  ou arraste e solte o arquivo de imagem aqui
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {uploadError && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Helper text */}
      <p className="text-[10px] text-slate-400">{helperText}</p>
    </div>
  );
}
