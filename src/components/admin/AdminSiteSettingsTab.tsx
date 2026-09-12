import React, { useState, useEffect } from 'react';
import {
  Video,
  MapPin,
  Phone,
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import VideoUploadField from './VideoUploadField.tsx';
import ImageUploadField from './ImageUploadField.tsx';
import {
  fetchSiteSettings,
  saveSiteSettings,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_SITE_CONTACT_INFO,
} from '../../lib/supabase.ts';
import type { HomeSettingsModel, SiteContactInfoModel } from '../../types/database.ts';

interface AdminSiteSettingsTabProps {
  onSessionExpired?: () => void;
}

export default function AdminSiteSettingsTab({ onSessionExpired }: AdminSiteSettingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [homeSettings, setHomeSettings] = useState<HomeSettingsModel>(DEFAULT_HOME_SETTINGS);
  const [contactInfo, setContactInfo] = useState<SiteContactInfoModel>(DEFAULT_SITE_CONTACT_INFO);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSiteSettings();
      if (data) {
        setHomeSettings({
          heroVideoUrl: data.home?.heroVideoUrl ?? data.home?.hero_video_url ?? null,
          heroImageUrl: data.home?.heroImageUrl ?? data.home?.hero_image_url ?? null,
        });
        setContactInfo({
          address: data.contact?.address || DEFAULT_SITE_CONTACT_INFO.address,
          phonePrimary:
            data.contact?.phonePrimary ||
            data.contact?.phone_primary ||
            DEFAULT_SITE_CONTACT_INFO.phonePrimary,
          phoneSecondary:
            data.contact?.phoneSecondary ??
            data.contact?.phone_secondary ??
            DEFAULT_SITE_CONTACT_INFO.phoneSecondary,
          email: data.contact?.email || DEFAULT_SITE_CONTACT_INFO.email,
        });
      }
    } catch (err) {
      console.error('[AdminSiteSettingsTab] Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      if (onSessionExpired) onSessionExpired();
      return;
    }

    setSaving(true);
    try {
      const videoToSave = homeSettings.heroVideoUrl?.trim() || null;
      const imageToSave = homeSettings.heroImageUrl?.trim() || null;

      const result = await saveSiteSettings(
        {
          activeTheme: 'oficial',
          home: {
            heroVideoUrl: videoToSave,
            heroImageUrl: imageToSave,
          },
          contact: {
            address: contactInfo.address,
            phonePrimary: contactInfo.phonePrimary,
            phoneSecondary: contactInfo.phoneSecondary,
            email: contactInfo.email,
          },
        },
        token
      );

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar alterações no servidor.');
      }

      setHomeSettings({
        heroVideoUrl: videoToSave,
        heroImageUrl: imageToSave,
      });

      setSuccessMessage('Configurações do site salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error('[AdminSiteSettingsTab] Erro ao salvar:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha na comunicação ao salvar configurações.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#E4141B] animate-spin mb-3" />
        <p className="text-sm font-bold text-[#090909]">Carregando configurações do site...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16" id="admin-site-settings-view">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#090909]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#090909] font-fredoka tracking-tight">
              Home & Configurações Gerais
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E4141B]/10 text-[#E4141B] uppercase tracking-wider">
              Ao Vivo
            </span>
          </div>
          <p className="text-xs text-[#090909]/60 mt-1 max-w-2xl">
            Gerencie o vídeo e a imagem de destaque do hero na página inicial e atualize as informações de contato, endereço e telefones exibidos no rodapé do site.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          id="btn-save-top"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E4141B] text-white text-xs font-bold rounded-xl hover:bg-[#C70E15] shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: Vídeo de Fundo da Home (Hero) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#090909]/10 shadow-xs space-y-6">
          <div className="border-b border-[#090909]/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4141B]/10 flex items-center justify-center text-[#E4141B]">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#090909] font-fredoka">
                  1. Vídeo de Fundo em Loop (Hero da Home)
                </h3>
                <p className="text-xs text-[#090909]/60">
                  O vídeo será reproduzido como fundo/destaque da primeira seção da Home ("Seu Jogo. Seu Momento. Sua Diversão.").
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF1E4]/50 border border-[#EADCCF] rounded-xl p-4 text-xs text-[#3A2E26] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#FD4912] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#090909]">Comportamento na página inicial:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[#090909]/80">
                <li>O vídeo roda automaticamente sem áudio (muted), em loop contínuo e compatível com celulares (playsInline).</li>
                <li>Possui camada de contraste suave para garantir leitura nítida do título e dos botões.</li>
                <li>Se o vídeo for removido ou demorar para carregar, o fundo padrão (ou a imagem de fallback) é exibido sem travar a navegação.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <VideoUploadField
              id="hero-video-field"
              label="Arquivo de Vídeo da Home"
              value={homeSettings.heroVideoUrl}
              onChange={(url) => setHomeSettings((prev) => ({ ...prev, heroVideoUrl: url }))}
              helperText="Envie um vídeo em MP4 ou WebM (máx. 35MB). Ao salvar, ele será aplicado imediatamente na Home."
            />

            <div className="pt-4 border-t border-[#090909]/10">
              <ImageUploadField
                id="hero-image-field"
                label="Imagem Alternativa / Fallback da Home (Opcional)"
                value={homeSettings.heroImageUrl}
                onChange={(url) => setHomeSettings((prev) => ({ ...prev, heroImageUrl: url }))}
                helperText="Imagem estática exibida como fundo caso nenhum vídeo esteja ativo ou enquanto o vídeo é carregado."
                accentColor="orange"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Informações de Contato e Rodapé */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#090909]/10 shadow-xs space-y-6">
          <div className="border-b border-[#090909]/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#090909] font-fredoka">
                  2. Informações de Contato & Rodapé
                </h3>
                <p className="text-xs text-[#090909]/60">
                  Edite o endereço físico, telefones de suporte e e-mail exibidos no rodapé de todas as páginas do site.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Endereço */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-[#090909] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FD4912]" />
                <span>Endereço do Parque</span>
              </label>
              <input
                type="text"
                value={contactInfo.address}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Av. das Atrações, 1500 — Complexo de Lazer"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#090909]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD4912]/30 focus:border-[#FD4912] text-[#090909] font-medium"
              />
              <p className="text-[11px] text-[#090909]/50">
                Exibido na coluna "Atendimento & Localização" do rodapé com o ícone de mapa.
              </p>
            </div>

            {/* Telefone Principal */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#090909] uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FD4912]" />
                <span>Telefone Principal / WhatsApp</span>
              </label>
              <input
                type="text"
                value={contactInfo.phonePrimary}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, phonePrimary: e.target.value }))}
                placeholder="(11) 98765-4321"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#090909]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD4912]/30 focus:border-[#FD4912] text-[#090909] font-medium"
              />
              <p className="text-[11px] text-[#090909]/50">
                Número principal de atendimento aos visitantes.
              </p>
            </div>

            {/* Telefone Secundário */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#090909] uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#090909]/40" />
                <span>Telefone Secundário (Opcional)</span>
              </label>
              <input
                type="text"
                value={contactInfo.phoneSecondary || ''}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, phoneSecondary: e.target.value }))}
                placeholder="(11) 4004-1234 (opcional)"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#090909]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD4912]/30 focus:border-[#FD4912] text-[#090909] font-medium"
              />
              <p className="text-[11px] text-[#090909]/50">
                Ramal ou telefone fixo adicional. Deixe em branco se não houver.
              </p>
            </div>

            {/* E-mail de Atendimento */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-[#090909] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FD4912]" />
                <span>E-mail de Contato & Suporte</span>
              </label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="contato@familyfuntown.com"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#090909]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FD4912]/30 focus:border-[#FD4912] text-[#090909] font-medium"
              />
              <p className="text-[11px] text-[#090909]/50">
                Endereço de e-mail para dúvidas, reservas e suporte. Clicável com mailto no rodapé.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            id="btn-save-bottom"
            className="flex items-center gap-2 px-6 py-3 bg-[#E4141B] text-white text-xs font-bold rounded-xl hover:bg-[#C70E15] shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Salvando Configurações...' : 'Salvar Todas as Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
