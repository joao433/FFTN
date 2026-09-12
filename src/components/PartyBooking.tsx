import React, { useState, useEffect, useCallback } from 'react';
import {
  PartyPopper,
  Sparkles,
  Calendar,
  User,
  Mail,
  Phone,
  Users,
  MessageSquare,
  ShieldCheck,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Flame,
  ArrowRight,
  Ticket,
  Utensils,
  DollarSign,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import type { PartyPackageModel } from '../types/database.ts';
import { fetchActivePartyPackages } from '../lib/supabase.ts';
import { getApiUrl } from '../lib/api.ts';
import Footer from './Footer.tsx';
import ParkLogo from './ParkLogo.tsx';
import SkeletonCard from './SkeletonCard.tsx';
import ThematicPlaceholder from './ThematicPlaceholder.tsx';

interface PartyBookingProps {
  onNavigateToHome?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToMenu?: () => void;
  onNavigateToDocs?: () => void;
}

interface PaymentSettings {
  allow_no_deposit: boolean;
  allow_deposit: boolean;
  deposit_percentage: number;
  allow_full: boolean;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  label: string;
  available: boolean;
  conflict_with?: string;
}

interface AvailabilityResponse {
  date: string;
  status: 'fully_available' | 'partially_booked' | 'fully_booked';
  available_slots: TimeSlot[];
  existing_bookings: Array<{
    id: string;
    start_time: string;
    end_time: string;
    package_name?: string;
  }>;
}

interface ConfirmedBookingInfo {
  booking_id: string;
  holder_name: string;
  holder_email: string;
  package_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  total_price_cents: number;
  balance_due_cents: number;
  payment_type: 'none' | 'deposit' | 'full';
}

export default function PartyBooking({
  onNavigateToHome,
  onNavigateToTickets,
  onNavigateToMenu,
  onNavigateToDocs,
}: PartyBookingProps) {
  const [packages, setPackages] = useState<PartyPackageModel[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PartyPackageModel | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Payment settings from admin
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    allow_no_deposit: true,
    allow_deposit: true,
    deposit_percentage: 30,
    allow_full: true,
  });

  // Selected payment method: 'none' | 'deposit' | 'full'
  const [selectedPaymentType, setSelectedPaymentType] = useState<'none' | 'deposit' | 'full'>('none');

  // Form State
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guestCount, setGuestCount] = useState<number>(15);
  const [notes, setNotes] = useState('');

  // Availability state
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Immediate confirmation state for "Sem Entrada"
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBookingInfo | null>(null);

  // Minimum date is tomorrow (or today)
  const todayDateString = new Date().toISOString().split('T')[0];

  // Load packages & payment settings on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingPackages(true);
      try {
        const [pkgs] = await Promise.all([
          fetchActivePartyPackages(),
          fetch(getApiUrl('admin-manage-party-payment-settings'))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data) {
                const allowNoDep = Boolean(data.allow_no_deposit);
                const allowDep = Boolean(data.allow_partial_deposit ?? data.allow_deposit ?? true);
                const allowFull = Boolean(data.allow_full_payment ?? data.allow_full ?? true);
                const pct = Number(data.deposit_percentage) || 30;

                setPaymentSettings({
                  allow_no_deposit: allowNoDep,
                  allow_deposit: allowDep,
                  deposit_percentage: pct,
                  allow_full: allowFull,
                });

                // Define initial payment type based on what is allowed
                if (allowNoDep) setSelectedPaymentType('none');
                else if (allowDep) setSelectedPaymentType('deposit');
                else setSelectedPaymentType('full');
              }
            })
            .catch((err) => console.warn('Could not load payment settings, using defaults:', err)),
        ]);

        setPackages(pkgs);
        if (pkgs.length > 0) {
          setSelectedPackage(pkgs[0]);
        }
      } catch (err) {
        console.error('Error loading party packages:', err);
      } finally {
        setIsLoadingPackages(false);
      }
    }
    loadData();
  }, []);

  // Fetch slot availability whenever date or package duration changes
  const fetchAvailability = useCallback(async (date: string, duration: number) => {
    if (!date) return;
    setIsLoadingAvailability(true);
    try {
      const res = await fetch(
        getApiUrl('get-party-availability', { date, duration })
      );
      if (res.ok) {
        const data: AvailabilityResponse = await res.json();
        setAvailability(data);

        // If currently selected slot is now unavailable or not in new slots, find first available
        if (data.available_slots && data.available_slots.length > 0) {
          const firstOpen = data.available_slots.find((s) => s.available);
          setSelectedSlot((prev) => {
            if (prev) {
              const matched = data.available_slots.find(
                (s) => s.start_time === prev.start_time && s.available
              );
              return matched || firstOpen || null;
            }
            return firstOpen || null;
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching slot availability:', err);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (eventDate && selectedPackage) {
      const dur = selectedPackage.durationMinutes || selectedPackage.duration_minutes || 120;
      fetchAvailability(eventDate, dur);
    }
  }, [eventDate, selectedPackage, fetchAvailability]);

  const formatUsdPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format((priceCents || 0) / 100);
  };

  const getPackageDuration = (pkg: PartyPackageModel | null) => {
    const min = pkg?.durationMinutes || pkg?.duration_minutes || 120;
    const hours = Math.floor(min / 60);
    const remainingMin = min % 60;
    if (remainingMin === 0) return `${hours} horas`;
    return `${hours}h${remainingMin}min`;
  };

  // Calculations for deposit and remaining
  const currentPriceCents = selectedPackage ? selectedPackage.priceCents : 0;
  const depositPercentage = paymentSettings.deposit_percentage || 30;
  const depositAmountCents = Math.round((currentPriceCents * depositPercentage) / 100);
  const balanceDueDepositCents = currentPriceCents - depositAmountCents;

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!selectedPackage) {
      errors.package = 'Selecione um pacote de festa.';
    }
    if (!holderName.trim()) {
      errors.name = 'Informe o nome do responsável pela reserva.';
    }
    if (!holderEmail.trim() || !holderEmail.includes('@')) {
      errors.email = 'Informe um e-mail válido para envio da confirmação.';
    }
    if (!holderPhone.trim() || holderPhone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Informe um telefone para contato.';
    }
    if (!eventDate) {
      errors.date = 'Selecione a data da comemoração.';
    } else if (eventDate < todayDateString) {
      errors.date = 'A data da festa não pode ser no passado.';
    }
    if (!selectedSlot) {
      errors.slot = 'Selecione um horário disponível para a festa.';
    }
    if (!guestCount || guestCount < 1) {
      errors.guests = 'Informe a quantidade de convidados estimada.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm() || !selectedPackage || !selectedSlot) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(getApiUrl('create-party-checkout-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          holder_name: holderName.trim(),
          holder_email: holderEmail.trim().toLowerCase(),
          holder_phone: holderPhone.trim(),
          event_date: eventDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          payment_type: selectedPaymentType,
          guest_count: Number(guestCount),
          notes: notes.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível agendar a festa no momento. Por favor, tente outro horário ou data.'
        );
      }

      // Caso 1: Sem entrada (100% no parque) -> Sucesso instantâneo sem Stripe!
      if (data.confirmation || selectedPaymentType === 'none') {
        setConfirmedBooking({
          booking_id: data.booking_id,
          holder_name: holderName.trim(),
          holder_email: holderEmail.trim(),
          package_name: selectedPackage.name,
          event_date: eventDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          total_price_cents: currentPriceCents,
          balance_due_cents: currentPriceCents,
          payment_type: 'none',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmitting(false);
        return;
      }

      // Caso 2: Entrada parcial ou pagamento integral -> Redireciona para Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada pelo servidor de pagamento.');
      }
    } catch (err: unknown) {
      console.error('[Party Booking Error]:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao conectar com o serviço de reserva. Tente novamente.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // TELA DE SUCESSO / CONFIRMAÇÃO (Quando escolhe Sem Entrada)
  // =========================================================================
  if (confirmedBooking) {
    const formattedDate = confirmedBooking.event_date.split('-').reverse().join('/');

    return (
      <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] font-sans pb-24">
        {/* Top Header */}
        <header className="border-b border-[#EADCCF] bg-[#FFFDF9]/95 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div onClick={onNavigateToHome} className="cursor-pointer">
              <ParkLogo size="md" />
            </div>
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="text-xs px-3.5 py-2 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#7A6C60] border border-[#EADCCF] font-semibold transition-all cursor-pointer"
              >
                Voltar ao Início
              </button>
            )}
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
          <div className="bg-[#FFFDF9] rounded-3xl border border-[#EADCCF] p-6 sm:p-10 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <PartyPopper className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 uppercase tracking-wider inline-block mb-3">
                Reserva Realizada com Sucesso!
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E26] tracking-tight">
                Horário Garantido no Parque!
              </h1>
              <p className="text-sm text-[#7A6C60] mt-2 max-w-lg mx-auto">
                Olá, <strong>{confirmedBooking.holder_name}</strong>! O salão exclusivo do parque já está reservado para a sua celebração.
              </p>
            </div>

            {/* Cartão de Detalhes da Reserva */}
            <div className="bg-[#FAF1E4] border border-[#EADCCF] rounded-2xl p-5 text-left text-xs sm:text-sm space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-[#EADCCF]/60">
                <span className="text-[#7A6C60] uppercase text-[11px] font-bold">Código da Reserva</span>
                <span className="font-mono font-black text-[#3A2E26] text-xs">
                  {confirmedBooking.booking_id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#7A6C60]">Pacote de Festa:</span>
                <strong className="text-[#3A2E26]">{confirmedBooking.package_name}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#7A6C60]">Data do Evento:</span>
                <strong className="text-[#3A2E26]">{formattedDate}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#7A6C60]">Horário Reservado:</span>
                <strong className="text-[#E8734A] font-mono">
                  {confirmedBooking.start_time} às {confirmedBooking.end_time}
                </strong>
              </div>

              <div className="pt-3 border-t border-[#EADCCF]/60 flex justify-between items-center text-sm font-black">
                <span className="text-[#3A2E26]">Valor Total a Pagar no Dia:</span>
                <span className="text-[#E8734A] text-lg font-mono">
                  {formatUsdPrice(confirmedBooking.total_price_cents)}
                </span>
              </div>
            </div>

            {/* Instruções de Pagamento Presencial */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>Modalidade Sem Entrada Selecionada:</span>
              </div>
              <p className="leading-relaxed">
                Nenhum valor foi cobrado pelo site agora. O pagamento integral de{' '}
                <strong>{formatUsdPrice(confirmedBooking.total_price_cents)}</strong> será realizado diretamente na recepção do parque no dia do evento (aceitamos cartão de crédito, débito e dinheiro).
              </p>
              <p className="text-[11px] text-amber-800/80">
                Uma cópia dos detalhes desta reserva foi enviada para o e-mail: <strong>{confirmedBooking.holder_email}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onNavigateToHome && (
                <button
                  onClick={onNavigateToHome}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#E8734A] hover:bg-[#D9653B] text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                >
                  Voltar para a Página Inicial
                </button>
              )}
              {onNavigateToTickets && (
                <button
                  onClick={onNavigateToTickets}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#7A6C60] border border-[#EADCCF] font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Comprar Ingressos Avulsos
                </button>
              )}
            </div>
          </div>
        </main>

        <div className="mt-16">
          <Footer
            onNavigateToHome={onNavigateToHome}
            onNavigateToTickets={onNavigateToTickets}
            onNavigateToMenu={onNavigateToMenu}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // TELA PRINCIPAL DE FORMULÁRIO DE RESERVA
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] font-sans selection:bg-[#E8734A] selection:text-white pb-24 relative">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#E8734A]/[0.05] blur-[150px] rounded-full" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-20 border-b border-[#EADCCF] bg-[#FFFDF9]/95 backdrop-blur-xl sticky top-0 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div
            onClick={onNavigateToHome}
            className={`flex items-center gap-3 ${onNavigateToHome ? 'cursor-pointer group' : ''}`}
          >
            <ParkLogo size="md" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#7A6C60] hover:text-[#3A2E26] border border-[#EADCCF] font-semibold transition-all cursor-pointer"
              >
                <span>Início</span>
              </button>
            )}

            {onNavigateToTickets && (
              <button
                onClick={onNavigateToTickets}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#7A6C60] hover:text-[#3A2E26] border border-[#EADCCF] font-medium transition-all cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-[#A8988C]" />
                <span>Ingressos</span>
              </button>
            )}

            <button className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#E8734A] text-white font-bold tracking-tight shadow-sm shadow-[#E8734A]/20">
              <Sparkles className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Festas</span>
            </button>

            {onNavigateToMenu && (
              <button
                onClick={onNavigateToMenu}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#7A6C60] hover:text-[#3A2E26] border border-[#EADCCF] font-medium transition-all cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-[#A8988C]" />
                <span>Cardápio</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Title & Intro */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3A2E26] tracking-tight leading-[1.15]">
            Comemore Momentos <span className="text-[#E8734A]">Inesquecíveis</span>
          </h1>
          <p className="text-sm sm:text-base text-[#7A6C60] mt-3 max-w-xl mx-auto leading-relaxed">
            Reserve o salão temático com exclusividade. Escolha o melhor pacote, selecione seu horário e decida como prefere pagar.
          </p>
        </div>

        {/* Form Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Package Selector (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] p-6 sm:p-7 shadow-[0_8px_30px_-4px_rgba(74,52,40,0.08)]">
              <div className="flex items-center justify-between border-b border-[#EADCCF] pb-4 mb-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3A2E26] flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-[#FAF1E4] text-[#E8734A] border border-[#E8734A]/30 flex items-center justify-center font-black text-[11px]">
                      01
                    </span>
                    Escolha o Pacote de Festa
                  </h2>
                  <p className="text-xs text-[#7A6C60] mt-1">
                    Cada pacote inclui sala temática decorada, convidados e monitores.
                  </p>
                </div>
              </div>

              {isLoadingPackages ? (
                <SkeletonCard type="party" count={2} />
              ) : packages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7A6C60]">
                  Nenhum pacote de festa disponível no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    const durationText = getPackageDuration(pkg);

                    return (
                      <div
                        key={pkg.id}
                        id={`package-card-${pkg.id}`}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setValidationErrors((prev) => ({ ...prev, package: '' }));
                        }}
                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between card-interactive ${
                          isSelected
                            ? 'bg-[#FAF1E4]/90 border-[#E8734A] elevation-2 ring-2 ring-[#E8734A]/20'
                            : 'bg-white border-[#EADCCF] hover:border-[#D3C2B2] hover:bg-[#FAF1E4]/30 elevation-1'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E8734A] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-amber-700" />
                              {durationText}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-[#3A2E26] leading-snug">
                            {pkg.name}
                          </h3>

                          {pkg.description && (
                            <p className="text-xs text-[#7A6C60] mt-2 line-clamp-3 leading-relaxed">
                              {pkg.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EADCCF]/70 flex items-center justify-between">
                          <span className="text-[11px] text-[#7A6C60] font-medium">Valor Total:</span>
                          <span className="text-base font-black text-[#E8734A]">
                            {formatUsdPrice(pkg.priceCents)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Reservation Form & Payment Selector (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] p-6 sm:p-7 shadow-[0_8px_30px_-4px_rgba(74,52,40,0.08)] relative overflow-hidden">
                {/* Header */}
                <div className="border-b border-[#EADCCF] pb-4 mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3A2E26] flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-[#FAF1E4] text-[#E8734A] border border-[#E8734A]/30 flex items-center justify-center font-black text-[11px]">
                      02
                    </span>
                    Data, Horário & Pagamento
                  </h2>
                  <p className="text-xs text-[#7A6C60] mt-1.5 leading-relaxed">
                    Escolha quando vai comemorar e a forma de fechar sua reserva.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-red-800">Atenção</strong>
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-4">
                  {/* Field: Full Name */}
                  <div>
                    <label
                      htmlFor="party_holder_name"
                      className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                    >
                      Nome do Responsável *
                    </label>
                    <div className="relative">
                      <input
                        id="party_holder_name"
                        type="text"
                        placeholder="Ex: Mariana Albuquerque"
                        value={holderName}
                        onChange={(e) => {
                          setHolderName(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        className={`w-full px-4 py-2.5 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                        }`}
                      />
                      <User className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3 pointer-events-none" />
                    </div>
                    {validationErrors.name && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Field: Email & Phone (Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="party_holder_email"
                        className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                      >
                        E-mail *
                      </label>
                      <div className="relative">
                        <input
                          id="party_holder_email"
                          type="email"
                          placeholder="mariana@exemplo.com"
                          value={holderEmail}
                          onChange={(e) => {
                            setHolderEmail(e.target.value);
                            setValidationErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.email
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                          }`}
                        />
                        <Mail className="w-3.5 h-3.5 text-[#A8988C] absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {validationErrors.email && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">{validationErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="party_holder_phone"
                        className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                      >
                        Telefone / WhatsApp *
                      </label>
                      <div className="relative">
                        <input
                          id="party_holder_phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={holderPhone}
                          onChange={(e) => {
                            setHolderPhone(e.target.value);
                            setValidationErrors((prev) => ({ ...prev, phone: '' }));
                          }}
                          className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.phone
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                          }`}
                        />
                        <Phone className="w-3.5 h-3.5 text-[#A8988C] absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {validationErrors.phone && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Field: Event Date & Guest Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="party_event_date"
                        className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                      >
                        Data da Festa *
                      </label>
                      <div className="relative">
                        <input
                          id="party_event_date"
                          type="date"
                          min={todayDateString}
                          value={eventDate}
                          onChange={(e) => {
                            setEventDate(e.target.value);
                            setValidationErrors((prev) => ({ ...prev, date: '', slot: '' }));
                          }}
                          className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.date
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                          }`}
                        />
                        <Calendar className="w-3.5 h-3.5 text-[#A8988C] absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {validationErrors.date && (
                        <p className="text-[10px] text-red-500 mt-1">{validationErrors.date}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="party_guest_count"
                        className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                      >
                        Qtd. Convidados *
                      </label>
                      <div className="relative">
                        <input
                          id="party_guest_count"
                          type="number"
                          min="1"
                          max="200"
                          value={guestCount}
                          onChange={(e) => {
                            setGuestCount(parseInt(e.target.value, 10) || 1);
                            setValidationErrors((prev) => ({ ...prev, guests: '' }));
                          }}
                          className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.guests
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                          }`}
                        />
                        <Users className="w-3.5 h-3.5 text-[#A8988C] absolute left-3 top-3 pointer-events-none" />
                      </div>
                      {validationErrors.guests && (
                        <p className="text-[10px] text-red-500 mt-1">{validationErrors.guests}</p>
                      )}
                    </div>
                  </div>

                  {/* Horários Disponíveis no Dia Selecionado */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5">
                      Horário da Comemoração *
                    </label>

                    {!eventDate ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Selecione a data da festa acima para verificar os horários livres no salão.</span>
                      </div>
                    ) : isLoadingAvailability ? (
                      <div className="p-4 rounded-xl bg-[#FAF1E4]/50 border border-[#EADCCF] text-center flex items-center justify-center gap-2 text-xs text-[#7A6C60]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#E8734A]" />
                        <span>Verificando horários disponíveis...</span>
                      </div>
                    ) : availability?.available_slots && availability.available_slots.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {availability.available_slots.map((slot) => {
                            const isSelected =
                              selectedSlot?.start_time === slot.start_time &&
                              selectedSlot?.end_time === slot.end_time;

                            return (
                              <button
                                key={`${slot.start_time}-${slot.end_time}`}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => {
                                  if (slot.available) {
                                    setSelectedSlot(slot);
                                    setValidationErrors((prev) => ({ ...prev, slot: '' }));
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                  !slot.available
                                    ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'bg-[#E8734A] text-white border-[#E8734A] shadow-xs'
                                    : 'bg-white border-[#D3C2B2] text-[#3A2E26] hover:border-[#E8734A] hover:bg-[#FAF1E4]/40 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold font-mono">
                                    {slot.start_time} - {slot.end_time}
                                  </span>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span
                                  className={`text-[10px] block mt-0.5 ${
                                    isSelected
                                      ? 'text-white/80'
                                      : !slot.available
                                      ? 'text-red-500 font-bold no-underline'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {!slot.available ? 'Ocupado' : 'Disponível'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Duração: {getPackageDuration(selectedPackage)} de festa exclusiva</span>
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>Todos os horários desta data estão ocupados. Escolha outro dia.</span>
                      </div>
                    )}

                    {validationErrors.slot && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{validationErrors.slot}</p>
                    )}
                  </div>

                  {/* FORMAS DE FECHAR A RESERVA (As 3 Opções Solicitadas) */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-2">
                      Como você prefere fechar a reserva? *
                    </label>

                    <div className="space-y-2">
                      {/* Opção 1: Sem Entrada */}
                      {paymentSettings.allow_no_deposit && (
                        <label
                          className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                            selectedPaymentType === 'none'
                              ? 'bg-[#FAF1E4] border-[#E8734A] shadow-xs'
                              : 'bg-white border-[#EADCCF] hover:border-[#D3C2B2]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_type"
                            value="none"
                            checked={selectedPaymentType === 'none'}
                            onChange={() => setSelectedPaymentType('none')}
                            className="mt-0.5 w-4 h-4 text-[#E8734A] accent-[#E8734A] cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#3A2E26]">Sem entrada agora</span>
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                $0 agora
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7A6C60] mt-0.5 leading-relaxed">
                              Garante a data e o horário imediatamente. O valor de{' '}
                              <strong>{formatUsdPrice(currentPriceCents)}</strong> é pago 100% no dia do evento, na recepção do parque.
                            </p>
                          </div>
                        </label>
                      )}

                      {/* Opção 2: Porcentagem de Entrada */}
                      {paymentSettings.allow_deposit && (
                        <label
                          className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                            selectedPaymentType === 'deposit'
                              ? 'bg-[#FAF1E4] border-[#E8734A] shadow-xs'
                              : 'bg-white border-[#EADCCF] hover:border-[#D3C2B2]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_type"
                            value="deposit"
                            checked={selectedPaymentType === 'deposit'}
                            onChange={() => setSelectedPaymentType('deposit')}
                            className="mt-0.5 w-4 h-4 text-[#E8734A] accent-[#E8734A] cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#3A2E26]">
                                Entrada de {depositPercentage}% no cartão
                              </span>
                              <span className="text-[11px] font-black text-[#E8734A] font-mono">
                                {formatUsdPrice(depositAmountCents)} agora
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7A6C60] mt-0.5 leading-relaxed">
                              Pague {depositPercentage}% antecipado via Stripe. O restante de{' '}
                              <strong>{formatUsdPrice(balanceDueDepositCents)}</strong> é acertado no dia no parque.
                            </p>
                          </div>
                        </label>
                      )}

                      {/* Opção 3: Pagamento Integral */}
                      {paymentSettings.allow_full && (
                        <label
                          className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                            selectedPaymentType === 'full'
                              ? 'bg-[#FAF1E4] border-[#E8734A] shadow-xs'
                              : 'bg-white border-[#EADCCF] hover:border-[#D3C2B2]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_type"
                            value="full"
                            checked={selectedPaymentType === 'full'}
                            onChange={() => setSelectedPaymentType('full')}
                            className="mt-0.5 w-4 h-4 text-[#E8734A] accent-[#E8734A] cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#3A2E26]">Pagamento Integral (100%)</span>
                              <span className="text-[11px] font-black text-[#3A2E26] font-mono">
                                {formatUsdPrice(currentPriceCents)}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7A6C60] mt-0.5 leading-relaxed">
                              Quita 100% da festa agora via cartão de crédito / Stripe. Nada a pagar no dia pelo salão.
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Field: Notes / Observations */}
                  <div>
                    <label
                      htmlFor="party_notes"
                      className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                    >
                      Observações / Nome do Aniversariante
                    </label>
                    <div className="relative">
                      <textarea
                        id="party_notes"
                        rows={2}
                        placeholder="Ex: Aniversário de 10 anos do Lucas. Tema astronauta."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2 pl-9 rounded-xl bg-white border border-[#D3C2B2] text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:border-[#E8734A] focus:ring-1 focus:ring-[#E8734A] transition-all resize-none"
                      />
                      <MessageSquare className="w-3.5 h-3.5 text-[#A8988C] absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Resumo do que será cobrado agora */}
                  <div className="pt-3 border-t border-[#EADCCF] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#7A6C60] uppercase font-bold block tracking-wider">
                        Cobrança Agora:
                      </span>
                      <span className="text-[11px] text-[#7A6C60]">
                        {selectedPaymentType === 'none' && 'Pagamento 100% no dia do evento'}
                        {selectedPaymentType === 'deposit' && `Entrada segura de ${depositPercentage}% via Stripe`}
                        {selectedPaymentType === 'full' && 'Cobrança segura 100% via Stripe'}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#E8734A] tracking-tight font-mono">
                      {selectedPaymentType === 'none' && '$0.00'}
                      {selectedPaymentType === 'deposit' && formatUsdPrice(depositAmountCents)}
                      {selectedPaymentType === 'full' && formatUsdPrice(currentPriceCents)}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="book-party-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full bg-[#E8734A] hover:bg-[#D9653B] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#E8734A]/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando sua reserva...</span>
                      </>
                    ) : selectedPaymentType === 'none' ? (
                      <>
                        <CalendarCheck className="w-4 h-4" />
                        <span>Confirmar Reserva do Horário (Sem Cobrança)</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Prosseguir para Pagamento Seguro</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6C60] pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reserva oficial garantida e auditada pelo parque</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Summary Bar (When party package is chosen on mobile) */}
      {selectedPackage && !confirmedBooking && (
        <div className="lg:hidden fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md py-3 px-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8734A]/30 elevation-3 flex items-center justify-between shadow-2xl">
            <div className="flex-1 min-w-0 pr-3">
              <span className="text-[10px] uppercase font-bold text-[#7A6C60] tracking-wider block">
                Festa Selecionada
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-xs text-[#3A2E26] truncate block">
                  {selectedPackage.name}
                </span>
                <span className="font-black text-xs text-[#E8734A] font-mono">
                  {formatUsdPrice(selectedPackage.priceCents)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const formElem = document.getElementById('book-party-submit-btn');
                if (formElem) {
                  formElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-4 py-2.5 rounded-full bg-[#E8734A] hover:bg-[#D9653B] active:scale-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20">
        <Footer
          onNavigateToHome={onNavigateToHome}
          onNavigateToTickets={onNavigateToTickets}
          onNavigateToMenu={onNavigateToMenu}
        />
      </div>
    </div>
  );
}
