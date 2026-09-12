import React, { useState, useEffect, useCallback } from 'react';
import {
  PartyPopper,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Star,
  X,
  Clock,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField.tsx';

interface PartyPackage {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  duration_minutes?: number;
  image_url?: string | null;
  display_order: number;
  active: boolean;
  featured_home?: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminPartyPackagesTabProps {
  onSessionExpired: () => void;
}

export default function AdminPartyPackagesTab({ onSessionExpired }: AdminPartyPackagesTabProps) {
  const [packages, setPackages] = useState<PartyPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFeaturedId, setIsTogglingFeaturedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PartyPackage | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceDollars, setFormPriceDollars] = useState('');
  const [formDurationMinutes, setFormDurationMinutes] = useState('120');
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
      const response = await fetch('/.netlify/functions/admin-manage-party-packages', {
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
        throw new Error(errData.error || 'Erro ao carregar pacotes de festas.');
      }

      const data: PartyPackage[] = await response.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('[Admin Party Packages Fetch Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao buscar pacotes de festa.';
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
    setFormDurationMinutes('120');
    setFormImageUrl(null);
    setFormDisplayOrder(String(packages.length * 10));
    setFormActive(true);
    setFormFeaturedHome(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: PartyPackage) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormPriceDollars((pkg.price_cents / 100).toFixed(2));
    setFormDurationMinutes(String(pkg.duration_minutes || 120));
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

  const handleToggleFeaturedHome = async (pkg: PartyPackage) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    const nextValue = !pkg.featured_home;

    if (nextValue) {
      const currentFeatured = packages.filter((p) => p.featured_home).length;
      if (currentFeatured >= 4) {
        setErrorMessage('Você já tem 4 pacotes de festa destacados. Desmarque um antes de adicionar outro.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    setIsTogglingFeaturedId(pkg.id);
    setErrorMessage(null);

    try {
      const response = await fetch('/.netlify/functions/admin-manage-party-packages', {
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
      console.error('[Admin Toggle Party Featured Error]:', err);
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
      setFormError('Informe o nome do pacote de festa.');
      return;
    }

    const priceNum = parseFloat(formPriceDollars.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Informe um preço válido maior que zero (ex: 350.00).');
      return;
    }

    const priceCents = Math.round(priceNum * 100);
    const displayOrderNum = parseInt(formDisplayOrder, 10) || 0;
    const durationMinutesNum = Math.max(30, parseInt(formDurationMinutes, 10) || 120);

    setIsSaving(true);

    try {
      const isEdit = !!editingPackage;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, any> = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        price_cents: priceCents,
        duration_minutes: durationMinutesNum,
        image_url: formImageUrl || null,
        display_order: displayOrderNum,
        featured_home: formFeaturedHome,
      };

      if (isEdit) {
        payload.id = editingPackage.id;
        payload.active = formActive;
      }

      const response = await fetch('/.netlify/functions/admin-manage-party-packages', {
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
        throw new Error(result.error || 'Erro ao salvar pacote de festa.');
      }

      setSuccessNotice(
        isEdit
          ? `Pacote de festa "${result.name}" atualizado com sucesso!`
          : `Pacote de festa "${result.name}" criado com sucesso!`
      );
      setTimeout(() => setSuccessNotice(null), 4000);

      closeModal();
      fetchPackages();
    } catch (err: unknown) {
      console.error('[Admin Save Party Package Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar pacote de festa.';
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
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-amber-500" />
            Pacotes de Festas e Aniversários
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie os planos de comemorações, fotos ilustrativas, valores e destaques na Home.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Featured Home Counter Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Star
              className={`w-3.5 h-3.5 ${
                packages.filter((p) => p.featured_home).length > 0
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-400'
              }`}
            />
            <span>Destaques Home:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                packages.filter((p) => p.featured_home).length === 4
                  ? 'text-amber-800 bg-amber-100 border border-amber-300'
                  : 'text-slate-700 bg-slate-200'
              }`}
            >
              {packages.filter((p) => p.featured_home).length}/4
            </span>
          </div>

          <button
            id="btn-new-party-package"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8734A] hover:bg-[#D26038] active:bg-[#BF5028] text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm shadow-[#E8734A]/20 cursor-pointer font-fredoka"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pacote</span>
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
              Carregando pacotes de festas...
            </span>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <PartyPopper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Nenhum pacote de festa cadastrado
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Clique em &quot;Novo Pacote&quot; acima para cadastrar a primeira opção de festa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">Foto</th>
                  <th className="py-3.5 px-4">Nome do Pacote</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Duração</th>
                  <th className="py-3.5 px-4">Preço</th>
                  <th className="py-3.5 px-4 text-center">Ordem</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Destaque Home</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    id={`party-package-row-${pkg.id}`}
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
                        <PartyPopper className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{pkg.name}</span>
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-4 text-slate-500 max-w-[240px] truncate">
                      {pkg.description || <span className="italic text-slate-400">Sem descrição</span>}
                    </td>

                    {/* Duração */}
                    <td className="py-3.5 px-4 text-slate-700 text-xs whitespace-nowrap font-medium">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {Math.floor((pkg.duration_minutes || 120) / 60)}h{(pkg.duration_minutes || 120) % 60 ? `${(pkg.duration_minutes || 120) % 60}m` : ''}
                      </span>
                    </td>

                    {/* Preço */}
                    <td className="py-3.5 px-4 text-[#E8734A] font-bold font-mono whitespace-nowrap">
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
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>

                    {/* Destaque Home Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        id={`btn-toggle-party-featured-${pkg.id}`}
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
                            : 'Destacar na seção Festas da Home (máx. 4)'
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
                        <span>{pkg.featured_home ? 'Destacado' : 'Destacar'}</span>
                      </button>
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        id={`btn-edit-party-package-${pkg.id}`}
                        onClick={() => openEditModal(pkg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Pacote de Festa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-amber-500" />
                {editingPackage ? 'Editar Pacote de Festa' : 'Novo Pacote de Festa'}
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
                  Nome do Pacote *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aniversário Super Aventura"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descrição dos Itens Inclusos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sala temática exclusiva por 3h, bolo, salgados, monitores dedicados"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 outline-none resize-none"
                />
              </div>

              {/* Image Upload Component */}
              <ImageUploadField
                id="party-package-image"
                label="Foto Ilustrativa do Pacote de Festa"
                value={formImageUrl}
                onChange={(url) => setFormImageUrl(url)}
                accentColor="amber"
                helperText="Envie uma foto da sala de festa, bolo ou decoração correspondente."
              />

              {/* Preço, Duração e Ordem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Preço ($ USD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="350.00"
                      value={formPriceDollars}
                      onChange={(e) => setFormPriceDollars(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 outline-none font-mono"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Duração (min) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="15"
                      min="30"
                      max="480"
                      required
                      placeholder="120"
                      value={formDurationMinutes}
                      onChange={(e) => setFormDurationMinutes(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 outline-none font-mono"
                    />
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {[
                      { label: '1h30', val: '90' },
                      { label: '2h', val: '120' },
                      { label: '2h30', val: '150' },
                      { label: '3h', val: '180' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setFormDurationMinutes(p.val)}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                          formDurationMinutes === p.val
                            ? 'bg-[#E8734A] text-white border-[#E8734A]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ordem de Exibição
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

              {/* Ativo Toggle (apenas na edição) */}
              {editingPackage && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Status do Pacote</span>
                    <span className="text-[11px] text-slate-500">
                      {formActive ? 'Disponível para reservas' : 'Oculto na página pública'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}

              {/* Destacar na Home Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 ${
                        formFeaturedHome ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="block text-xs font-bold text-slate-900">Destacar na Home</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        packages.filter((p) => p.featured_home && p.id !== editingPackage?.id).length +
                          (formFeaturedHome ? 1 : 0) ===
                        4
                          ? 'text-amber-800 bg-amber-100 border border-amber-300'
                          : 'text-slate-700 bg-slate-200'
                      }`}
                    >
                      {packages.filter((p) => p.featured_home && p.id !== editingPackage?.id).length +
                        (formFeaturedHome ? 1 : 0)}
                      /4
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Exibir este pacote na vitrine de festas da página inicial (máximo de 4).
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
                        if (currentCount >= 4) {
                          setFormError('Você já tem 4 pacotes de festa destacados. Desmarque um antes.');
                          return;
                        }
                      }
                      setFormError(null);
                      setFormFeaturedHome(checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#E8734A] hover:bg-[#D26038] active:bg-[#BF5028] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#E8734A]/20 font-fredoka"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingPackage ? 'Salvar Alterações' : 'Criar Pacote de Festa'}</span>
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
