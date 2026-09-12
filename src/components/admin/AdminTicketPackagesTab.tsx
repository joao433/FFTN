import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Layers,
  X,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField.tsx';
import { useAdminLanguage } from '../../lib/adminI18n.tsx';
import { getApiUrl } from '../../lib/api.ts';

interface TicketPackage {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  image_url?: string | null;
  display_order: number;
  active: boolean;
  featured_home?: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminTicketPackagesTabProps {
  onSessionExpired: () => void;
}

export default function AdminTicketPackagesTab({ onSessionExpired }: AdminTicketPackagesTabProps) {
  const { t } = useAdminLanguage();
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFeaturedId, setIsTogglingFeaturedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TicketPackage | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceDollars, setFormPriceDollars] = useState('');
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formDisplayOrder, setFormDisplayOrder] = useState('0');
  const [formActive, setFormActive] = useState(true);
  const [formFeaturedHome, setFormFeaturedHome] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-manage-ticket-packages'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao carregar pacotes de ingressos.');
      }

      const data: TicketPackage[] = await response.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('[Admin Ticket Packages Fetch Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao buscar pacotes do servidor.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormName('');
    setFormDescription('');
    setFormPriceDollars('');
    setFormImageUrl(null);
    setFormDisplayOrder(String(packages.length * 10));
    setFormActive(true);
    setFormFeaturedHome(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: TicketPackage) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormPriceDollars((pkg.price_cents / 100).toFixed(2));
    setFormImageUrl(pkg.image_url || null);
    setFormDisplayOrder(String(pkg.display_order ?? 0));
    setFormActive(pkg.active);
    setFormFeaturedHome(Boolean(pkg.featured_home));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setFormError(null);
  };

  const handleToggleFeaturedHome = async (pkg: TicketPackage) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    const nextValue = !pkg.featured_home;

    if (nextValue) {
      const currentFeatured = packages.filter((p) => p.featured_home).length;
      if (currentFeatured >= 3) {
        setErrorMessage('Você já tem 3 pacotes de ingressos destacados. Desmarque um antes de adicionar outro.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    setIsTogglingFeaturedId(pkg.id);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-manage-ticket-packages'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: pkg.id,
          featured_home: nextValue,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar destaque na Home.');
      }

      setPackages((prev) =>
        prev.map((item) =>
          item.id === pkg.id ? { ...item, featured_home: nextValue } : item
        )
      );

      setSuccessNotice(
        nextValue
          ? `"${pkg.name}" agora está em destaque na Home!`
          : `"${pkg.name}" removido dos destaques da Home.`
      );
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: unknown) {
      console.error('[Admin Toggle Ticket Featured Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar destaque.';
      setErrorMessage(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsTogglingFeaturedId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    if (!formName.trim()) {
      setFormError('Informe o nome do pacote.');
      return;
    }

    const priceNum = parseFloat(formPriceDollars.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Informe um preço válido maior que zero (ex: 29.90).');
      return;
    }

    const priceCents = Math.round(priceNum * 100);
    const displayOrderNum = parseInt(formDisplayOrder, 10) || 0;

    setIsSaving(true);

    try {
      const isEdit = !!editingPackage;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, any> = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        price_cents: priceCents,
        image_url: formImageUrl || null,
        display_order: displayOrderNum,
        featured_home: formFeaturedHome,
      };

      if (isEdit) {
        payload.id = editingPackage.id;
        payload.active = formActive;
      }

      const response = await fetch(getApiUrl('admin-manage-ticket-packages'), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar pacote.');
      }

      setSuccessNotice(
        isEdit
          ? `Pacote "${result.name}" atualizado com sucesso!`
          : `Pacote "${result.name}" criado com sucesso!`
      );
      setTimeout(() => setSuccessNotice(null), 4000);

      closeModal();
      fetchPackages();
    } catch (err: unknown) {
      console.error('[Admin Save Ticket Package Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar pacote.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-fredoka">
            <Ticket className="w-5 h-5 text-[#E8734A]" />
            {t('admin.ticket_packages.title', 'Pacotes de Ingressos')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('admin.ticket_packages.subtitle', 'Gerencie opções de passaportes, fotos, valores e destaques na Home.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Featured Home Counter Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] text-xs font-semibold text-[#7A6C60]">
            <Star
              className={`w-3.5 h-3.5 ${
                packages.filter((p) => p.featured_home).length > 0
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-slate-400'
              }`}
            />
            <span>{t('admin.ticket_packages.featured_home', 'Destaques Home')}:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                packages.filter((p) => p.featured_home).length === 3
                  ? 'text-amber-800 bg-amber-100 border border-amber-300'
                  : 'text-[#5A493D] bg-[#EADCC9]'
              }`}
            >
              {packages.filter((p) => p.featured_home).length}/3
            </span>
          </div>

          <button
            id="btn-new-ticket-package"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8734A] hover:bg-[#D26038] active:bg-[#BF5028] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm shadow-[#E8734A]/20 cursor-pointer font-fredoka"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.ticket_packages.btn_new', 'Novo Pacote')}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Packages Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#E8734A] animate-spin" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {t('admin.ticket_packages.loading', 'Carregando pacotes de ingressos...')}
            </span>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              {t('admin.ticket_packages.empty_title', 'Nenhum pacote cadastrado')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t('admin.ticket_packages.empty_desc', 'Clique em "Novo Pacote" acima para adicionar sua primeira opção de ingresso.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">{t('admin.ticket_packages.col_photo', 'Foto')}</th>
                  <th className="py-3.5 px-4">{t('admin.ticket_packages.col_name', 'Nome do Pacote')}</th>
                  <th className="py-3.5 px-4">{t('admin.ticket_packages.col_description', 'Descrição')}</th>
                  <th className="py-3.5 px-4">{t('admin.ticket_packages.col_price', 'Preço')}</th>
                  <th className="py-3.5 px-4 text-center">{t('admin.ticket_packages.col_order', 'Ordem')}</th>
                  <th className="py-3.5 px-4 text-center">{t('admin.ticket_packages.col_status', 'Status')}</th>
                  <th className="py-3.5 px-4 text-center">{t('admin.ticket_packages.col_featured', 'Destaque Home')}</th>
                  <th className="py-3.5 px-4 text-right">{t('admin.common.actions', 'Ação')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    id={`package-row-${pkg.id}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Foto */}
                    <td className="py-3 px-4">
                      {pkg.image_url ? (
                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                          <img
                            src={pkg.image_url}
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* Nome */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{pkg.name}</span>
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-4 text-slate-500 max-w-[240px] truncate">
                      {pkg.description || <span className="italic text-slate-400">—</span>}
                    </td>

                    {/* Preço */}
                    <td className="py-3.5 px-4 text-[#E8734A] font-bold font-mono">
                      ${(pkg.price_cents / 100).toFixed(2)}
                    </td>

                    {/* Ordem */}
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                      {pkg.display_order}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {pkg.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> {t('admin.common.active', 'Ativo')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                          <XCircle className="w-3 h-3" /> {t('admin.common.inactive', 'Inativo')}
                        </span>
                      )}
                    </td>

                    {/* Destaque Home Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        id={`btn-toggle-ticket-featured-${pkg.id}`}
                        onClick={() => handleToggleFeaturedHome(pkg)}
                        disabled={isTogglingFeaturedId === pkg.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          pkg.featured_home
                            ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                        title={
                          pkg.featured_home
                            ? 'Remover do destaque na Home'
                            : 'Destacar na seção Ingressos da Home (máx. 3)'
                        }
                      >
                        {isTogglingFeaturedId === pkg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        ) : (
                          <Star
                            className={`w-3.5 h-3.5 ${
                              pkg.featured_home
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-400'
                            }`}
                          />
                        )}
                        <span>
                          {pkg.featured_home
                            ? t('admin.ticket_packages.featured_badge', 'Destacado')
                            : t('admin.ticket_packages.feature_btn', 'Destacar')}
                        </span>
                      </button>
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        id={`btn-edit-package-${pkg.id}`}
                        onClick={() => openEditModal(pkg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>{t('admin.common.edit', 'Editar')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Pacote */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 font-fredoka">
                <Ticket className="w-4 h-4 text-[#E8734A]" />
                {editingPackage
                  ? t('admin.ticket_packages.modal_edit', 'Editar Pacote de Ingresso')
                  : t('admin.ticket_packages.modal_new', 'Novo Pacote de Ingresso')}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t('admin.ticket_packages.field_name', 'Nome do Pacote')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passaporte Aventura VIP"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t('admin.ticket_packages.field_description', 'Descrição')}
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Acesso ilimitado a todas as atrações por 1 dia"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 outline-none resize-none"
                />
              </div>

              {/* Image Upload Component */}
              <ImageUploadField
                id="ticket-package-image"
                label={t('admin.ticket_packages.field_photo', 'Foto Ilustrativa do Pacote')}
                value={formImageUrl}
                onChange={(url) => setFormImageUrl(url)}
                accentColor="red"
                helperText="Envie uma foto em alta resolução do passaporte ou atração correspondente."
              />

              {/* Preço e Ordem */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('admin.ticket_packages.field_price', 'Preço ($ USD)')} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="29.99"
                      value={formPriceDollars}
                      onChange={(e) => setFormPriceDollars(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 outline-none font-mono"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('admin.ticket_packages.field_order', 'Ordem de Exibição')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 outline-none font-mono"
                    />
                    <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Ativo Toggle */}
              {editingPackage && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {t('admin.ticket_packages.field_status', 'Status do Pacote')}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formActive
                        ? t('admin.ticket_packages.field_status_active', 'Disponível para compra')
                        : t('admin.ticket_packages.field_status_inactive', 'Oculto na página pública')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}

              {/* Destacar na Home Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 ${
                        formFeaturedHome ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                      }`}
                    />
                    <span className="block text-xs font-bold text-slate-900">
                      {t('admin.ticket_packages.field_featured', 'Destacar na Home')}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        packages.filter((p) => p.featured_home && p.id !== editingPackage?.id).length +
                          (formFeaturedHome ? 1 : 0) ===
                        3
                          ? 'text-amber-800 bg-amber-100 border border-amber-300'
                          : 'text-slate-700 bg-slate-200'
                      }`}
                    >
                      {packages.filter((p) => p.featured_home && p.id !== editingPackage?.id).length +
                        (formFeaturedHome ? 1 : 0)}
                      /3
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {t('admin.ticket_packages.field_featured_desc', 'Exibir este passaporte na vitrine principal da página inicial (máximo de 3).')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={formFeaturedHome}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        const currentCount = packages.filter(
                          (p) => p.featured_home && p.id !== editingPackage?.id
                        ).length;
                        if (currentCount >= 3) {
                          setFormError('Você já tem 3 pacotes de ingressos destacados. Desmarque um antes.');
                          return;
                        }
                      }
                      setFormError(null);
                      setFormFeaturedHome(checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t('admin.common.cancel', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#E8734A] hover:bg-[#D26038] active:bg-[#BF5028] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#E8734A]/20 font-fredoka"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('admin.common.saving', 'Salvando...')}</span>
                    </>
                  ) : (
                    <span>
                      {editingPackage
                        ? t('admin.ticket_packages.save_btn', 'Salvar Alterações')
                        : t('admin.ticket_packages.create_btn', 'Criar Pacote')}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
