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
} from 'lucide-react';

interface TicketPackage {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminTicketPackagesTabProps {
  onSessionExpired: () => void;
}

export default function AdminTicketPackagesTab({ onSessionExpired }: AdminTicketPackagesTabProps) {
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TicketPackage | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceDollars, setFormPriceDollars] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState('0');
  const [formActive, setFormActive] = useState(true);
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
      const response = await fetch('/.netlify/functions/admin-manage-ticket-packages', {
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
    setFormDisplayOrder(String(packages.length * 10));
    setFormActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: TicketPackage) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormPriceDollars((pkg.price_cents / 100).toFixed(2));
    setFormDisplayOrder(String(pkg.display_order ?? 0));
    setFormActive(pkg.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setFormError(null);
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
        display_order: displayOrderNum,
      };

      if (isEdit) {
        payload.id = editingPackage.id;
        payload.active = formActive;
      }

      const response = await fetch('/.netlify/functions/admin-manage-ticket-packages', {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Ticket className="w-5 h-5 text-red-500" />
            Pacotes de Ingressos
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gerencie opções de passaportes, valores e disponibilidade para venda pública.
          </p>
        </div>

        <button
          id="btn-new-ticket-package"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pacote</span>
        </button>
      </div>

      {/* Alerts */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Packages Table / Grid */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Carregando pacotes de ingressos...
            </span>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Ticket className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              Nenhum pacote cadastrado
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Clique em &quot;Novo Pacote&quot; acima para adicionar sua primeira opção de ingresso.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">Nome do Pacote</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Preço</th>
                  <th className="py-3.5 px-4 text-center">Ordem</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    id={`package-row-${pkg.id}`}
                    className="hover:bg-neutral-800/30 transition-colors"
                  >
                    {/* Nome */}
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{pkg.name}</span>
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-4 text-neutral-400 max-w-[260px] truncate">
                      {pkg.description || <span className="italic text-neutral-600">Sem descrição</span>}
                    </td>

                    {/* Preço */}
                    <td className="py-3.5 px-4 text-emerald-400 font-bold font-mono">
                      ${(pkg.price_cents / 100).toFixed(2)}
                    </td>

                    {/* Ordem */}
                    <td className="py-3.5 px-4 text-center text-neutral-400 font-mono">
                      {pkg.display_order}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {pkg.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-bold uppercase tracking-wider">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        id={`btn-edit-package-${pkg.id}`}
                        onClick={() => openEditModal(pkg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-neutral-400" />
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

      {/* Modal Criar / Editar Pacote */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-red-500" />
                {editingPackage ? 'Editar Pacote de Ingresso' : 'Novo Pacote de Ingresso'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Nome do Pacote *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passaporte Aventura VIP"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-neutral-600 outline-none"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Acesso ilimitado a todas as atrações por 1 dia"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-neutral-600 outline-none resize-none"
                />
              </div>

              {/* Preço e Ordem */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Preço ($ USD) *
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
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-neutral-600 outline-none font-mono"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Ordem de Exibição
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(e.target.value)}
                      className="w-full px-3 py-2 pl-7 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white outline-none font-mono"
                    />
                    <Layers className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Ativo Toggle (apenas na edição ou opcional) */}
              {editingPackage && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <span className="block text-xs font-bold text-white">Status do Pacote</span>
                    <span className="text-[11px] text-neutral-400">
                      {formActive ? 'Disponível para compra' : 'Oculto na página pública'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/40"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingPackage ? 'Salvar Alterações' : 'Criar Pacote'}</span>
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
