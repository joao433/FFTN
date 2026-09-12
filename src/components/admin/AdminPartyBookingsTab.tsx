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
  DollarSign,
  Settings2,
  Percent,
  Check,
} from 'lucide-react';
import { useAdminLanguage } from '../../lib/adminI18n.tsx';

interface PartyBookingRecord {
  id: string;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  package_name: string;
  event_date: string;
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

interface PaymentSettings {
  allow_no_deposit: boolean;
  allow_deposit: boolean;
  deposit_percentage: number;
  allow_full: boolean;
}

interface AdminPartyBookingsTabProps {
  onSessionExpired: () => void;
}

export default function AdminPartyBookingsTab({ onSessionExpired }: AdminPartyBookingsTabProps) {
  const { t } = useAdminLanguage();
  const [bookings, setBookings] = useState<PartyBookingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedNotesBooking, setSelectedNotesBooking] = useState<PartyBookingRecord | null>(null);

  // Configurações de Pagamento de Festas
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    allow_no_deposit: true,
    allow_deposit: true,
    deposit_percentage: 30,
    allow_full: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Busca as configurações de pagamento
  const fetchPaymentSettings = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const response = await fetch('/.netlify/functions/admin-manage-party-payment-settings', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentSettings({
          allow_no_deposit: Boolean(data.allow_no_deposit),
          allow_deposit: Boolean(data.allow_deposit),
          deposit_percentage: Number(data.deposit_percentage) || 30,
          allow_full: Boolean(data.allow_full),
        });
      }
    } catch (err) {
      console.warn('[Admin Party Payment Settings] Não foi possível carregar configurações:', err);
    }
  }, []);

  // Salva configurações de pagamento
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    if (!paymentSettings.allow_no_deposit && !paymentSettings.allow_deposit && !paymentSettings.allow_full) {
      setErrorMessage('Pelo menos uma opção de pagamento deve ficar ativa.');
      return;
    }

    setIsSavingSettings(true);
    setSettingsNotice(null);

    try {
      const response = await fetch('/.netlify/functions/admin-manage-party-payment-settings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentSettings),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao salvar configurações.');
      }

      setSettingsNotice('Configurações de pagamento das festas salvas com sucesso!');
      setTimeout(() => setSettingsNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar configurações.';
      setErrorMessage(msg);
    } finally {
      setIsSavingSettings(false);
    }
  };

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
    fetchPaymentSettings();
  }, [fetchBookings, fetchPaymentSettings]);

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

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao confirmar a reserva.');
      }

      setBookings((prev) =>
        prev.map((item) => (item.id === bookingId ? { ...item, status: 'confirmed' } : item))
      );

      setSuccessNotice('Reserva confirmada com sucesso!');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: unknown) {
      console.error('[Admin Confirm Booking Error]:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar reserva.';
      setErrorMessage(msg);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Marca saldo como pago presencialmente no parque
  const handleMarkBalancePaid = async (bookingId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      onSessionExpired();
      return;
    }

    setUpdatingBookingId(bookingId);
    setErrorMessage(null);

    try {
      const response = await fetch('/.netlify/functions/admin-update-party-booking-status', {
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
        throw new Error(err.error || 'Erro ao liquidar saldo no parque.');
      }

      const updated = await response.json();

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b))
      );

      setSuccessNotice('Saldo liquidado presencialmente no parque! Reserva totalmente quitada.');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar saldo.';
      setErrorMessage(msg);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const formatCurrency = (cents: number) => `$${((cents || 0) / 100).toFixed(2)}`;

  const renderStatusBadge = (status: PartyBookingRecord['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{t('admin.status.confirmed', 'Confirmada')}</span>
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px] uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>{t('admin.status.paid', 'Paga')}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px] uppercase tracking-wider">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{t('admin.status.pending', 'Pendente')}</span>
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
            <X className="w-3 h-3 text-slate-400" />
            <span>{t('admin.status.canceled', 'Cancelada')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
              {t('admin.tabs.party_bookings', 'Reservas de Festa')}
            </h2>
            <p className="text-xs text-slate-500">
              {bookings.length} {bookings.length === 1 ? t('admin.party_bookings.single_count', 'reserva registrada') : t('admin.party_bookings.multiple_count', 'reservas registradas')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Configurar Opções de Pagamento */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-colors cursor-pointer font-bold ${
              isSettingsOpen
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{t('admin.party_bookings.payment_options', 'Opções de Pagamento')}</span>
          </button>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <input
              type="text"
              placeholder={t('admin.party_bookings.search_placeholder', 'Buscar por cliente, e-mail...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => fetchBookings(searchQuery, false)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title={t('admin.common.refresh', 'Atualizar')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh', 'Atualizar')}</span>
          </button>
        </div>
      </div>

      {/* Painel de Configurações de Pagamento Expansível */}
      {isSettingsOpen && (
        <form
          onSubmit={handleSavePaymentSettings}
          className="bg-white border border-amber-200/80 p-5 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <DollarSign className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Formas de Pagamento Disponíveis na Reserva de Festas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Marque quais modalidades o cliente poderá escolher na página de reserva do site.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {settingsNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{settingsNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Opção 1: Sem Entrada */}
            <label className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors ${
              paymentSettings.allow_no_deposit ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/40' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900">1. Sem Entrada</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.allow_no_deposit}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, allow_no_deposit: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 accent-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600">
                  Reserva o horário sem cobrar nada pelo site. O cliente paga 100% no dia da festa, na recepção do parque.
                </p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 mt-2 block">
                {paymentSettings.allow_no_deposit ? '✓ Ativa no site' : '✕ Desativada'}
              </span>
            </label>

            {/* Opção 2: Porcentagem de Entrada */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
              paymentSettings.allow_deposit ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/40' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900">2. Porcentagem de Entrada</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.allow_deposit}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, allow_deposit: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 accent-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 mb-2">
                  Cobra uma porcentagem antecipada via Stripe no cartão. O saldo restante é quitado no parque.
                </p>

                {paymentSettings.allow_deposit && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Porcentagem:</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="5"
                        max="90"
                        step="5"
                        value={paymentSettings.deposit_percentage}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, deposit_percentage: Math.min(90, Math.max(5, parseInt(e.target.value, 10) || 30)) })}
                        className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 font-mono pr-6"
                      />
                      <span className="absolute right-2 top-1 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-amber-700 mt-2 block">
                {paymentSettings.allow_deposit ? `✓ ${paymentSettings.deposit_percentage}% de entrada` : '✕ Desativada'}
              </span>
            </div>

            {/* Opção 3: Pagamento Integral */}
            <label className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors ${
              paymentSettings.allow_full ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/40' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900">3. Pagamento Integral</span>
                  <input
                    type="checkbox"
                    checked={paymentSettings.allow_full}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, allow_full: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 accent-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600">
                  Cobra 100% do valor do pacote antecipadamente via cartão de crédito / Stripe.
                </p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 mt-2 block">
                {paymentSettings.allow_full ? '✓ Ativa no site' : '✕ Desativada'}
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 rounded-xl bg-[#E8734A] hover:bg-[#D26038] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSavingSettings ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Salvar Formas de Pagamento</span>
            </button>
          </div>
        </form>
      )}

      {/* Success / Error Alerts */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bookings Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#E8734A] animate-spin" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {t('admin.party_bookings.loading', 'Carregando reservas de festa...')}
            </span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <PartyPopper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              {t('admin.party_bookings.empty_title', 'Nenhuma reserva encontrada')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? t('admin.party_bookings.empty_search', { term: searchQuery }, `Nenhum resultado corresponde ao termo "${searchQuery}". Tente buscar por outro termo.`)
                : t('admin.party_bookings.empty_desc', 'Nenhuma reserva de festa cadastrada no momento.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">{t('admin.party_bookings.col_responsible', 'Responsável')}</th>
                  <th className="py-3.5 px-4">{t('admin.common.phone', 'Contato')}</th>
                  <th className="py-3.5 px-4">{t('admin.party_bookings.col_package', 'Pacote')}</th>
                  <th className="py-3.5 px-4">{t('admin.party_bookings.col_date', 'Data & Horário')}</th>
                  <th className="py-3.5 px-4">{t('admin.party_bookings.col_total', 'Situação Financeira')}</th>
                  <th className="py-3.5 px-4 text-center">{t('admin.common.status', 'Status')}</th>
                  <th className="py-3.5 px-4 text-right">{t('admin.common.actions', 'Ação')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((b) => {
                  const isUpdating = updatingBookingId === b.id;
                  const hasNotes = Boolean(b.notes && b.notes.trim().length > 0);
                  const isPaidFull = b.balance_paid || (b.status === 'paid' && b.balance_due_cents === 0);

                  return (
                    <tr
                      key={b.id}
                      id={`party-booking-row-${b.id}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Responsável */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[170px]">{b.holder_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-normal">
                            <Users className="w-3 h-3 text-slate-400" />
                            {b.guest_count} {t('admin.party_bookings.col_guests', 'convidados')}
                          </span>
                          {hasNotes && (
                            <button
                              onClick={() => setSelectedNotesBooking(b)}
                              className="inline-flex items-center gap-1 text-[10px] text-[#E8734A] hover:text-[#D26038] font-medium cursor-pointer w-fit mt-0.5"
                              title={t('admin.party_bookings.btn_view_notes', 'Ver observações')}
                            >
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="underline decoration-dotted underline-offset-2">
                                {t('admin.party_bookings.btn_view_notes', 'Ver observações')}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{b.holder_email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{b.holder_phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Pacote */}
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="font-bold">{b.package_name}</span>
                        </div>
                      </td>

                      {/* Data & Horário */}
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{formatDate(b.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-amber-800 font-mono font-semibold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>
                              {b.start_time || '14:00'} - {b.end_time || '16:00'}
                            </span>
                            {b.duration_minutes && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({Math.floor(b.duration_minutes / 60)}h)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Situação Financeira */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-[11px] text-slate-500">
                            {t('admin.common.total', 'Total')}: <strong className="font-mono text-slate-900">{formatCurrency(b.total_price_cents || b.price_cents)}</strong>
                          </div>
                          <div>
                            {b.payment_type === 'none' && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                {t('admin.party_bookings.pay_none', 'Sem entrada (100% no parque)')}
                              </span>
                            )}
                            {b.payment_type === 'deposit' && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                                {t('admin.party_bookings.pay_deposit', 'Entrada:')} {formatCurrency(b.amount_paid_cents)}
                              </span>
                            )}
                            {(!b.payment_type || b.payment_type === 'full') && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                {t('admin.party_bookings.pay_full', 'Integral:')} {formatCurrency(b.amount_paid_cents || b.price_cents)}
                              </span>
                            )}
                          </div>

                          {/* Saldo Restante */}
                          {isPaidFull ? (
                            <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {t('admin.party_bookings.settled_badge', 'Saldo Quitado')}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-800 font-bold">
                              {t('admin.party_bookings.col_balance', 'Saldo a pagar:')} <span className="font-mono">{formatCurrency(b.balance_due_cents)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(b.status)}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Liquidar Saldo no Parque */}
                          {!b.balance_paid && b.balance_due_cents > 0 && b.status !== 'canceled' && (
                            <button
                              id={`pay-balance-btn-${b.id}`}
                              onClick={() => handleMarkBalancePaid(b.id)}
                              disabled={isUpdating}
                              title={t('admin.party_bookings.btn_settle_balance', 'Liquidar Saldo')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <DollarSign className="w-3 h-3" />
                              )}
                              <span>{t('admin.party_bookings.btn_settle_balance', 'Liquidar Saldo')}</span>
                            </button>
                          )}

                          {/* Botão Confirmar Reserva */}
                          {b.status === 'paid' || b.status === 'pending' ? (
                            <button
                              id={`confirm-booking-btn-${b.id}`}
                              onClick={() => handleConfirmBooking(b.id)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 rounded-lg bg-[#E8734A] hover:bg-[#D26038] disabled:opacity-50 text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>{t('admin.common.confirm', 'Confirmar')}</span>
                            </button>
                          ) : b.status === 'confirmed' ? (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin.status.confirmed', 'Confirmada')}
                            </span>
                          ) : null}
                        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-[#FAF0E1]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-[#E8734A]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('admin.party_bookings.notes_modal_title', 'Observações da Reserva')}</h3>
                  <p className="text-xs text-slate-500">
                    {t('admin.party_bookings.col_responsible', 'Responsável')}: <span className="text-slate-900 font-semibold">{selectedNotesBooking.holder_name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotesBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">{t('admin.party_bookings.col_package', 'Pacote')}:</span>
                  <span className="text-slate-900 font-bold">{selectedNotesBooking.package_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{t('admin.party_bookings.col_date', 'Data & Horário')}:</span>
                  <span className="text-slate-900 font-bold">
                    {formatDate(selectedNotesBooking.event_date)} ({selectedNotesBooking.start_time || '14:00'} - {selectedNotesBooking.end_time || '16:00'})
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  {t('admin.party_bookings.notes_field_label', 'Mensagem / Observações do Cliente:')}
                </label>
                <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs text-slate-800 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
                  {selectedNotesBooking.notes}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedNotesBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('admin.common.close', 'Fechar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
