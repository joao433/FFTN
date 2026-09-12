import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
  Phone,
  Mail,
  User,
  X,
} from 'lucide-react';
import { useAdminLanguage } from '../../lib/adminI18n.tsx';

interface TicketRecord {
  id: string;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  package_name: string;
  event_date: string;
  event_time?: string;
  price_cents?: number;
  status: 'pending' | 'paid' | 'used' | 'canceled';
  used_at?: string;
  created_at: string;
  updated_at: string;
}

interface AdminTicketsTabProps {
  onSessionExpired: () => void;
}

export default function AdminTicketsTab({ onSessionExpired }: AdminTicketsTabProps) {
  const { t } = useAdminLanguage();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Busca os ingressos da Netlify Function
  const fetchTickets = useCallback(
    async (query: string = '', isSilent: boolean = false) => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        onSessionExpired();
        return;
      }

      if (!isSilent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      try {
        const url = new URL('/.netlify/functions/admin-list-tickets', window.location.origin);
        if (query.trim()) {
          url.searchParams.set('search', query.trim());
        }

        const response = await fetch(url.toString(), {
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
          throw new Error(errData.error || 'Erro ao carregar lista de ingressos.');
        }

        const data: TicketRecord[] = await response.json();
        setTickets(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error('[Admin Fetch Tickets Error]:', err);
        const msg = err instanceof Error ? err.message : 'Erro ao buscar dados do servidor.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [onSessionExpired]
  );

  // Carrega ao montar
  useEffect(() => {
    fetchTickets(searchQuery);
  }, [fetchTickets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Busca com debounce quando o usuário digita
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchTickets(searchQuery, true);
    }, 350);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, fetchTickets]);

  // Atualiza o status do ingresso para 'used'
  const handleMarkAsUsed = async (ticketId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setUpdatingTicketId(ticketId);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const response = await fetch('/.netlify/functions/admin-update-ticket-status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          new_status: 'used',
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao atualizar status do ingresso.');
      }

      const updatedTicket: TicketRecord = await response.json();

      // Atualiza o estado local imediatamente sem precisar recarregar toda a página
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: 'used', used_at: updatedTicket.used_at || new Date().toISOString() }
            : t
        )
      );

      setSuccessNotice(`Ingresso de "${updatedTicket.holder_name}" validado com sucesso!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error('[Admin Update Ticket Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar o ingresso.';
      setErrorMessage(msg);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // Renderiza o badge de status com a cor correta
  const renderStatusBadge = (status: TicketRecord['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3 text-amber-600" /> {t('admin.status.pending', 'Pendente')}
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t('admin.status.paid', 'Pago')}
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> {t('admin.status.used', 'Utilizado')}
          </span>
        );
      case 'canceled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
            {t('admin.status.canceled', 'Cancelado')}
          </span>
        );
    }
  };

  // Formatação de data da visita
  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('admin.common.date', 'Data não definida');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        {/* Search Box */}
        <div className="relative flex-1 max-w-lg">
          <input
            id="admin-ticket-search-input"
            type="text"
            placeholder={t('admin.tickets.search_placeholder', 'Buscar por nome, e-mail ou telefone...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 pl-9 pr-8 rounded-xl bg-[#FAF0E1] border border-[#EADCC9] focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 absolute right-3 top-3 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Refresh Button & Stats */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-mono">
            {t('admin.common.total', 'Total')}: <strong className="text-slate-900">{tickets.length}</strong>
          </div>

          <button
            onClick={() => fetchTickets(searchQuery, false)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title={t('admin.common.refresh', 'Atualizar')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh', 'Atualizar')}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
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

      {/* Tickets Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#E8734A] animate-spin" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {t('admin.tickets.loading', 'Carregando lista de ingressos...')}
            </span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              {t('admin.tickets.empty_title', 'Nenhum ingresso encontrado')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? t('admin.tickets.empty_search', { term: searchQuery }, `Nenhum resultado corresponde ao termo "${searchQuery}". Tente buscar por outro nome, e-mail ou telefone.`)
                : t('admin.tickets.empty_desc', 'Nenhum ingresso registrado no momento.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">{t('admin.tickets.col_holder', 'Nome do Titular')}</th>
                  <th className="py-3.5 px-4">{t('admin.tickets.col_email', 'E-mail')}</th>
                  <th className="py-3.5 px-4">{t('admin.tickets.col_phone', 'Telefone')}</th>
                  <th className="py-3.5 px-4">{t('admin.tickets.col_package', 'Pacote')}</th>
                  <th className="py-3.5 px-4">{t('admin.tickets.col_visit_date', 'Data da Visita')}</th>
                  <th className="py-3.5 px-4 text-center">{t('admin.common.status', 'Status')}</th>
                  <th className="py-3.5 px-4 text-right">{t('admin.common.actions', 'Ação')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tickets.map((tItem) => {
                  const isUpdating = updatingTicketId === tItem.id;

                  return (
                    <tr
                      key={tItem.id}
                      id={`ticket-row-${tItem.id}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Nome do Titular */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{tItem.holder_name}</span>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{tItem.holder_email}</span>
                        </div>
                      </td>

                      {/* Telefone */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{tItem.holder_phone}</span>
                        </div>
                      </td>

                      {/* Pacote */}
                      <td className="py-3.5 px-4 text-slate-800">
                        <span className="font-medium">{tItem.package_name}</span>
                      </td>

                      {/* Data da Visita */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{formatDate(tItem.event_date)}</span>
                          {tItem.event_time && (
                            <span className="text-[11px] text-slate-400">({tItem.event_time})</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(tItem.status)}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {tItem.status === 'paid' ? (
                          <button
                            id={`mark-used-btn-${tItem.id}`}
                            onClick={() => handleMarkAsUsed(tItem.id)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto shadow-sm shadow-emerald-600/20 cursor-pointer"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>{t('admin.common.saving', 'Salvando...')}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t('admin.tickets.btn_validate', 'Marcar como Utilizado')}</span>
                              </>
                            )}
                          </button>
                        ) : tItem.status === 'used' ? (
                          <span className="text-[11px] text-blue-600 font-semibold italic flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t('admin.tickets.checkin_done', 'Check-in realizado')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">{t('admin.common.no_action', 'Nenhuma ação')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
