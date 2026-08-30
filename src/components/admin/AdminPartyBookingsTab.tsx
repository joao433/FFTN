import React, { useState, useEffect, useCallback } from 'react';
import {
  PartyPopper,
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
  Users,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';

interface PartyBookingRecord {
  id: string;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  package_name: string;
  event_date: string;
  guest_count: number;
  notes?: string | null;
  status: 'pending' | 'paid' | 'confirmed' | 'canceled';
  created_at: string;
}

interface AdminPartyBookingsTabProps {
  onSessionExpired: () => void;
}

export default function AdminPartyBookingsTab({ onSessionExpired }: AdminPartyBookingsTabProps) {
  const [bookings, setBookings] = useState<PartyBookingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedNotesBooking, setSelectedNotesBooking] = useState<PartyBookingRecord | null>(null);

  // Busca as reservas da Netlify Function
  const fetchBookings = useCallback(
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
        const url = new URL('/.netlify/functions/admin-list-party-bookings', window.location.origin);
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
          throw new Error(errData.error || 'Erro ao carregar lista de reservas de festa.');
        }

        const data: PartyBookingRecord[] = await response.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error('[Admin Fetch Party Bookings Error]:', err);
        const msg = err instanceof Error ? err.message : 'Erro ao buscar reservas do servidor.';
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
    fetchBookings(searchQuery);
  }, [fetchBookings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Busca com debounce quando o usuário digita
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchBookings(searchQuery, true);
    }, 350);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, fetchBookings]);

  // Atualiza o status da reserva para 'confirmed'
  const handleConfirmBooking = async (bookingId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setUpdatingBookingId(bookingId);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const response = await fetch('/.netlify/functions/admin-update-party-booking-status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          new_status: 'confirmed',
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao confirmar a reserva da festa.');
      }

      const updatedBooking: PartyBookingRecord = await response.json();

      // Atualiza o estado local imediatamente
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'confirmed' }
            : b
        )
      );

      setSuccessNotice(`Festa de "${updatedBooking.holder_name}" confirmada com sucesso!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error('[Admin Update Party Booking Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar a reserva.';
      setErrorMessage(msg);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Renderiza o badge de status com a cor correta
  const renderStatusBadge = (status: PartyBookingRecord['status']) => {
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
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Confirmada
          </span>
        );
      case 'canceled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-bold uppercase tracking-wider">
            Cancelada
          </span>
        );
    }
  };

  // Formatação de data
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Data não definida';
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
    <div className="space-y-6">
      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        {/* Search Box */}
        <div className="relative flex-1 max-w-lg">
          <input
            id="admin-party-booking-search-input"
            type="text"
            placeholder="Buscar por responsável, e-mail ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 pl-9 pr-8 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-neutral-500 transition-all outline-none"
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
            Total de Reservas: <strong className="text-white">{bookings.length}</strong>
          </div>

          <button
            onClick={() => fetchBookings(searchQuery, false)}
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

      {/* Bookings Table Card */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Carregando reservas de festa...
            </span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <PartyPopper className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              Nenhuma reserva encontrada
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Nenhum resultado corresponde ao termo "${searchQuery}". Tente buscar por outro termo.`
                : 'Nenhuma reserva de festa cadastrada no momento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">Nome do Responsável</th>
                  <th className="py-3.5 px-4">E-mail</th>
                  <th className="py-3.5 px-4">Telefone</th>
                  <th className="py-3.5 px-4">Pacote</th>
                  <th className="py-3.5 px-4">Data da Festa</th>
                  <th className="py-3.5 px-4 text-center">Convidados</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {bookings.map((b) => {
                  const isUpdating = updatingBookingId === b.id;
                  const hasNotes = Boolean(b.notes && b.notes.trim().length > 0);

                  return (
                    <tr
                      key={b.id}
                      id={`party-booking-row-${b.id}`}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* Nome do Responsável */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{b.holder_name}</span>
                          </div>
                          {hasNotes && (
                            <button
                              onClick={() => setSelectedNotesBooking(b)}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer w-fit mt-0.5"
                              title="Clique para ver as observações"
                            >
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="underline decoration-dotted underline-offset-2">
                                Ver observações
                              </span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{b.holder_email}</span>
                        </div>
                      </td>

                      {/* Telefone */}
                      <td className="py-3.5 px-4 text-neutral-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span>{b.holder_phone}</span>
                        </div>
                      </td>

                      {/* Pacote */}
                      <td className="py-3.5 px-4 text-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                          <span className="font-medium">{b.package_name}</span>
                        </div>
                      </td>

                      {/* Data da Festa */}
                      <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="font-medium">{formatDate(b.event_date)}</span>
                        </div>
                      </td>

                      {/* Convidados */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-white font-bold text-xs">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{b.guest_count}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(b.status)}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {b.status === 'paid' ? (
                          <button
                            id={`confirm-booking-btn-${b.id}`}
                            onClick={() => handleConfirmBooking(b.id)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto shadow-sm shadow-blue-950/40 cursor-pointer"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Confirmando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Confirmar Festa</span>
                              </>
                            )}
                          </button>
                        ) : b.status === 'confirmed' ? (
                          <span className="text-[11px] text-blue-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Festa Confirmada
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500">Nenhuma ação</span>
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

      {/* Notes Modal */}
      {selectedNotesBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Observações da Reserva</h3>
                  <p className="text-xs text-neutral-400">
                    Responsável: <span className="text-white">{selectedNotesBooking.holder_name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotesBooking(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                <div>
                  <span className="text-neutral-500 block">Pacote:</span>
                  <span className="text-white font-medium">{selectedNotesBooking.package_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Data da Festa:</span>
                  <span className="text-white font-medium">{formatDate(selectedNotesBooking.event_date)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Convidados:</span>
                  <span className="text-white font-medium">{selectedNotesBooking.guest_count} pessoas</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Contato:</span>
                  <span className="text-white font-medium">{selectedNotesBooking.holder_phone}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Texto de Observações & Instruções:
                </label>
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-sans">
                  {selectedNotesBooking.notes || 'Nenhuma observação informada.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/30 flex justify-end">
              <button
                onClick={() => setSelectedNotesBooking(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
