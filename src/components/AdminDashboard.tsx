import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Search,
  LogOut,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome?: () => void;
}

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

export default function AdminDashboard({ onLogout, onNavigateHome }: AdminDashboardProps) {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Busca os ingressos da Netlify Function
  const fetchTickets = useCallback(async (query: string = '', isSilent: boolean = false) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onLogout();
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
        onLogout();
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
  }, [onLogout]);

  // Carrega ao montar e monitora token
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onLogout();
      return;
    }
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
      onLogout();
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
        onLogout();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao atualizar status do ingresso.');
      }

      const updatedTicket: TicketRecord = await response.json();

      // Atualiza o estado local imediatamente sem precisar recarregar toda a página
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: 'used', used_at: updatedTicket.used_at || new Date().toISOString() } : t))
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

  const handleLogoutClick = () => {
    localStorage.removeItem('admin_token');
    onLogout();
  };

  // Renderiza o badge de status com a cor correta
  const renderStatusBadge = (status: TicketRecord['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Pago
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Utilizado
          </span>
        );
      case 'canceled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-bold uppercase tracking-wider">
            Cancelado
          </span>
        );
    }
  };

  // Formatação de data da visita
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Data não definida';
    // Se estiver no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans pb-16 selection:bg-red-600 selection:text-white">
      {/* Top Admin Navbar */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-base shadow-md border border-red-500">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm uppercase tracking-tight text-white">
                  Painel Admin
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase tracking-wider border border-neutral-700">
                  Ingressos
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Validação e Gestão de Acessos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ver Site Público</span>
              </button>
            )}

            <button
              id="admin-logout-btn"
              onClick={handleLogoutClick}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <input
              id="admin-ticket-search-input"
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 pl-9 pr-8 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-neutral-500 transition-all outline-none"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-500 hover:text-white text-xs absolute right-3 top-3 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Refresh Button & Stats */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-400 font-mono">
              Total: <strong className="text-white">{tickets.length}</strong>
            </div>

            <button
              onClick={() => fetchTickets(searchQuery, false)}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors disabled:opacity-50 cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
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

        {/* Tickets Table Card */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
              <span className="text-xs text-neutral-400 uppercase tracking-wider">
                Carregando lista de ingressos...
              </span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <Ticket className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Nenhum ingresso encontrado
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `Nenhum resultado corresponde ao termo "${searchQuery}". Tente buscar por outro nome, e-mail ou telefone.`
                  : 'Nenhum ingresso registrado no momento.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="py-3.5 px-4">Nome do Titular</th>
                    <th className="py-3.5 px-4">E-mail</th>
                    <th className="py-3.5 px-4">Telefone</th>
                    <th className="py-3.5 px-4">Pacote</th>
                    <th className="py-3.5 px-4">Data da Visita</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {tickets.map((t) => {
                    const isUpdating = updatingTicketId === t.id;

                    return (
                      <tr
                        key={t.id}
                        id={`ticket-row-${t.id}`}
                        className="hover:bg-neutral-800/30 transition-colors"
                      >
                        {/* Nome do Titular */}
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{t.holder_name}</span>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="py-3.5 px-4 text-neutral-300">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{t.holder_email}</span>
                          </div>
                        </td>

                        {/* Telefone */}
                        <td className="py-3.5 px-4 text-neutral-300 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                            <span>{t.holder_phone}</span>
                          </div>
                        </td>

                        {/* Pacote */}
                        <td className="py-3.5 px-4 text-neutral-200">
                          <span className="font-medium">{t.package_name}</span>
                        </td>

                        {/* Data da Visita */}
                        <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                            <span>{formatDate(t.event_date)}</span>
                            {t.event_time && (
                              <span className="text-[11px] text-neutral-400">({t.event_time})</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(t.status)}
                        </td>

                        {/* Ação */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {t.status === 'paid' ? (
                            <button
                              id={`mark-used-btn-${t.id}`}
                              onClick={() => handleMarkAsUsed(t.id)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto shadow-sm shadow-emerald-950/40 cursor-pointer"
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Salvando...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Marcar como Utilizado</span>
                                </>
                              )}
                            </button>
                          ) : t.status === 'used' ? (
                            <span className="text-[11px] text-neutral-400 italic">
                              Check-in realizado
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400">
                              Nenhuma ação
                            </span>
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
      </main>
    </div>
  );
}
