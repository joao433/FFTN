import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  DollarSign,
  PartyPopper,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { useAdminLanguage, ADMIN_MONTH_NAMES, ADMIN_WEEK_DAYS } from '../../lib/adminI18n.tsx';
import { getApiUrl } from '../../lib/api.ts';

interface CalendarPartyBooking {
  id: string;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  package_name: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number;
  guest_count: number;
  notes?: string | null;
  payment_type?: 'none' | 'deposit' | 'full';
  price_cents: number;
  total_price_cents: number;
  amount_paid_cents: number;
  balance_due_cents: number;
  balance_paid: boolean;
  status: 'pending' | 'paid' | 'confirmed' | 'canceled';
  created_at: string;
}

interface AdminPartyCalendarTabProps {
  onSessionExpired: () => void;
}

export default function AdminPartyCalendarTab({ onSessionExpired }: AdminPartyCalendarTabProps) {
  const { t, language } = useAdminLanguage();
  const monthNames = ADMIN_MONTH_NAMES[language] || ADMIN_MONTH_NAMES.pt;
  const weekDays = ADMIN_WEEK_DAYS[language] || ADMIN_WEEK_DAYS.pt;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<CalendarPartyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<CalendarPartyBooking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Mês e ano em visualização
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchMonthBookings = useCallback(async (isSilent = false) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-list-party-bookings'), {
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
        throw new Error(errData.error || 'Erro ao carregar reservas do calendário.');
      }

      const data: CalendarPartyBooking[] = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('[Admin Calendar Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao carregar agenda.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    fetchMonthBookings();
  }, [fetchMonthBookings]);

  // Navegação de mês
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Liquidar saldo presencialmente no parque
  const handleMarkBalancePaid = async (bookingId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setUpdatingId(bookingId);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-update-party-booking-status'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          mark_balance_paid: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao marcar saldo como pago.');
      }

      const updated = await response.json();

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b))
      );

      if (selectedBookingForModal && selectedBookingForModal.id === bookingId) {
        setSelectedBookingForModal((prev) => (prev ? { ...prev, ...updated } : null));
      }

      setSuccessNotice('Saldo liquidado com sucesso! Reserva marcada como quitada.');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar saldo.';
      setErrorMessage(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Confirmar reserva pendente
  const handleConfirmStatus = async (bookingId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setUpdatingId(bookingId);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('admin-update-party-booking-status'), {
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

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao confirmar reserva.');
      }

      const updated = await response.json();

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b))
      );

      if (selectedBookingForModal && selectedBookingForModal.id === bookingId) {
        setSelectedBookingForModal((prev) => (prev ? { ...prev, ...updated } : null));
      }

      setSuccessNotice('Reserva confirmada com sucesso!');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar reserva.';
      setErrorMessage(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Mapa de reservas por data (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarPartyBooking[]>();
    for (const b of bookings) {
      if (!map.has(b.event_date)) {
        map.set(b.event_date, []);
      }
      map.get(b.event_date)!.push(b);
    }
    return map;
  }, [bookings]);

  // Dias do calendário para renderizar
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Dias do próximo mês para completar 35 ou 42 células
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Reservas do dia selecionado
  const selectedDayBookings = useMemo(() => {
    const list = bookingsByDate.get(selectedDateStr) || [];
    // Ordena por horário de início
    return [...list].sort((a, b) => {
      const timeA = a.start_time || '00:00';
      const timeB = b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [bookingsByDate, selectedDateStr]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t('admin.tabs.party_calendar', 'Calendário e Agenda de Festas')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('admin.calendar.exclusivity_rule', 'Controle de horários sem sobreposição. O parque possui 1 espaço exclusivo de festas.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {t('admin.calendar.today', 'Hoje')}
          </button>
          <button
            onClick={() => fetchMonthBookings(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh', 'Atualizar')}</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Calendário Mensal à Esquerda e Linha do Tempo à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna do Calendário Mensal (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          {/* Navegação de Mês */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 capitalize">
                {monthNames[month]} {year}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title={t('admin.common.back', 'Mês anterior')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title={t('admin.common.actions', 'Próximo mês')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-[11px] font-bold text-slate-400 py-1 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Grid dos Dias */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-2" />
              <span className="text-xs">{t('admin.calendar.loading', 'Carregando agenda do mês...')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((cell) => {
                const dayBookings = bookingsByDate.get(cell.dateStr) || [];
                const activeBookings = dayBookings.filter((b) => b.status !== 'canceled');
                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[76px] sm:min-h-[88px] p-2 rounded-xl text-left flex flex-col justify-between transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                        : 'bg-slate-50/40 border-transparent text-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-[#E4141B] text-white'
                            : isSelected
                            ? 'text-amber-700 font-black'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {activeBookings.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                          {activeBookings.length} {activeBookings.length === 1 ? 'festa' : 'festas'}
                        </span>
                      )}
                    </div>

                    {/* Prévia dos horários no card do dia */}
                    <div className="space-y-1 mt-1">
                      {activeBookings.slice(0, 2).map((b) => (
                        <div
                          key={b.id}
                          className={`truncate text-[10px] font-medium px-1 py-0.5 rounded ${
                            b.status === 'confirmed' || b.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : 'bg-amber-100/70 text-amber-900 border border-amber-200/60'
                          }`}
                        >
                          {b.start_time || 'Festa'} • {b.holder_name.split(' ')[0]}
                        </div>
                      ))}
                      {activeBookings.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-bold px-1">
                          +{activeBookings.length - 2} mais...
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legenda de Status */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {t('admin.status.confirmed', 'Confirmada')} / {t('admin.status.paid', 'Paga')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {t('admin.status.pending', 'Pendente')} / {t('admin.party_bookings.pay_none', 'Sem entrada')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> {t('admin.status.canceled', 'Cancelada')}
            </span>
          </div>
        </div>

        {/* Coluna da Linha do Tempo do Dia Selecionado (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('admin.calendar.select_day_title', 'Festas agendadas para')}
              </span>
              <h3 className="text-base font-black text-slate-900">
                {selectedDateStr.split('-').reverse().join('/')}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              {selectedDayBookings.length} {selectedDayBookings.length === 1 ? t('admin.party_bookings.single_count', 'Reserva') : t('admin.party_bookings.multiple_count', 'Reservas')}
            </span>
          </div>

          {/* Lista de Festas no Dia Selecionado */}
          {selectedDayBookings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">{t('admin.calendar.no_parties_day', 'Nenhuma festa agendada para esta data.')}</h4>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-1">
              {selectedDayBookings.map((booking) => {
                const isPaidFull = booking.balance_paid || (booking.status === 'paid' && booking.balance_due_cents === 0);
                const isDepositPaid = booking.payment_type === 'deposit' && (booking.status === 'paid' || booking.amount_paid_cents > 0);
                const isNoDeposit = booking.payment_type === 'none' || (booking.amount_paid_cents === 0 && booking.status === 'pending');

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-xl border transition-all ${
                      booking.status === 'canceled'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isPaidFull
                        ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                        : 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    {/* Linha 1: Horário e Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 font-mono">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>
                          {booking.start_time || 'A definir'}
                          {booking.end_time ? ` - ${booking.end_time}` : ''}
                        </span>
                        {booking.duration_minutes && (
                          <span className="text-[10px] font-normal text-slate-500">
                            ({Math.floor(booking.duration_minutes / 60)}h{booking.duration_minutes % 60 ? `${booking.duration_minutes % 60}m` : ''})
                          </span>
                        )}
                      </div>

                      {/* Badge de Status da Reserva */}
                      {booking.status === 'confirmed' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          {t('admin.status.confirmed', 'Confirmada')}
                        </span>
                      )}
                      {booking.status === 'paid' && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                          {t('admin.status.paid', 'Paga')}
                        </span>
                      )}
                      {booking.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          {t('admin.status.pending', 'Pendente')}
                        </span>
                      )}
                      {booking.status === 'canceled' && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider">
                          {t('admin.status.canceled', 'Cancelada')}
                        </span>
                      )}
                    </div>

                    {/* Linha 2: Nome do Contratante e Pacote */}
                    <div className="mb-2">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <PartyPopper className="w-3.5 h-3.5 text-amber-500" />
                        {booking.package_name}
                      </h4>
                      <p className="text-xs text-slate-700 font-semibold mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {booking.holder_name}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({booking.guest_count} {t('admin.party_bookings.col_guests', 'convidados')})
                        </span>
                      </p>
                    </div>

                    {/* Linha 3: Situação Financeira */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 mb-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{t('admin.common.total', 'Total')}:</span>
                        <strong className="font-mono text-slate-900">
                          {formatCurrency(booking.total_price_cents || booking.price_cents)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>{t('admin.party_bookings.col_payment_type', 'Forma de Pagamento')}:</span>
                        <span className="font-semibold text-slate-800">
                          {booking.payment_type === 'none' && t('admin.party_bookings.pay_none', 'Sem entrada (100% no dia)')}
                          {booking.payment_type === 'deposit' && t('admin.party_bookings.pay_deposit', 'Entrada Parcial')}
                          {(!booking.payment_type || booking.payment_type === 'full') && t('admin.party_bookings.pay_full', 'Pagamento Integral')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>{t('admin.party_bookings.col_balance', 'Saldo Pendente')}:</span>
                        {booking.balance_paid || booking.balance_due_cents === 0 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin.party_bookings.settled_badge', 'Quitado')}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold font-mono">
                            {formatCurrency(booking.balance_due_cents)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas da Reserva */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Botão Liquidar Saldo Presencialmente no Parque */}
                      {!booking.balance_paid && booking.balance_due_cents > 0 && booking.status !== 'canceled' && (
                        <button
                          type="button"
                          onClick={() => handleMarkBalancePaid(booking.id)}
                          disabled={updatingId === booking.id}
                          className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          {updatingId === booking.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <DollarSign className="w-3.5 h-3.5" />
                          )}
                          <span>{t('admin.party_bookings.btn_settle_balance', 'Liquidar Saldo')}</span>
                        </button>
                      )}

                      {/* Botão Confirmar Reserva (caso esteja pendente) */}
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmStatus(booking.id)}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('admin.common.confirm', 'Confirmar')}</span>
                        </button>
                      )}

                      {/* Ver Detalhes Completos */}
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForModal(booking)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {t('admin.common.details', 'Ver Detalhes')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Reserva */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#FAF0E1]">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-[#E8734A]" />
                <h3 className="font-black text-slate-900 text-base">{t('admin.party_bookings.notes_modal_title', 'Detalhes da Reserva de Festa')}</h3>
              </div>
              <button
                onClick={() => setSelectedBookingForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('admin.party_bookings.col_package', 'Pacote')}</span>
                  <strong className="text-slate-900 text-sm font-black">
                    {selectedBookingForModal.package_name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('admin.party_bookings.col_date', 'Data & Horário')}</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedBookingForModal.event_date.split('-').reverse().join('/')} • {selectedBookingForModal.start_time || '14:00'} - {selectedBookingForModal.end_time || '16:00'}
                  </strong>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">{t('admin.party_bookings.col_responsible', 'Cliente')}:</span> {selectedBookingForModal.holder_name}
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">{t('admin.common.email', 'E-mail')}:</span>
                  <a href={`mailto:${selectedBookingForModal.holder_email}`} className="text-[#134FA0] underline">
                    {selectedBookingForModal.holder_email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">{t('admin.common.phone', 'Telefone')}:</span>
                  <a href={`tel:${selectedBookingForModal.holder_phone}`} className="text-[#134FA0] underline font-mono">
                    {selectedBookingForModal.holder_phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">{t('admin.party_bookings.col_guests', 'Convidados')}:</span> {selectedBookingForModal.guest_count}
                </div>
              </div>

              {/* Observações */}
              {selectedBookingForModal.notes && (
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                    {t('admin.party_bookings.notes_field_label', 'Observações do Cliente:')}
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedBookingForModal.notes}</p>
                </div>
              )}

              {/* Quadro Financeiro */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">{t('admin.party_bookings.col_total', 'Resumo Financeiro')}</h4>
                <div className="flex justify-between text-slate-600">
                  <span>{t('admin.common.total', 'Valor Total')}:</span>
                  <strong className="font-mono text-slate-900">
                    {formatCurrency(selectedBookingForModal.total_price_cents || selectedBookingForModal.price_cents)}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('admin.party_bookings.col_paid', 'Valor Pago Antecipadamente')}:</span>
                  <strong className="font-mono text-emerald-600">
                    {formatCurrency(selectedBookingForModal.amount_paid_cents || 0)}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-bold">
                  <span>{t('admin.party_bookings.col_balance', 'Saldo a Acertar no Parque')}:</span>
                  <span className={selectedBookingForModal.balance_paid || selectedBookingForModal.balance_due_cents === 0 ? 'text-emerald-600' : 'text-amber-700'}>
                    {selectedBookingForModal.balance_paid || selectedBookingForModal.balance_due_cents === 0
                      ? t('admin.party_bookings.settled_badge', 'Quitado')
                      : formatCurrency(selectedBookingForModal.balance_due_cents)}
                  </span>
                </div>
              </div>

              {/* Ação de Quitação no Modal */}
              {!selectedBookingForModal.balance_paid && selectedBookingForModal.balance_due_cents > 0 && (
                <button
                  type="button"
                  onClick={() => handleMarkBalancePaid(selectedBookingForModal.id)}
                  disabled={updatingId === selectedBookingForModal.id}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {updatingId === selectedBookingForModal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                  <span>{t('admin.party_bookings.btn_settle_balance', 'Marcar Restante como Pago no Parque (Liquidar)')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
