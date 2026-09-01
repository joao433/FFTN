import React, { useState, useEffect } from 'react';
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
  Cake,
  Music,
  ArrowRight,
  Ticket,
  Utensils,
} from 'lucide-react';
import type { PartyPackageModel } from '../types/database.ts';
import { fetchActivePartyPackages } from '../lib/supabase.ts';
import Footer from './Footer.tsx';

interface PartyBookingProps {
  onNavigateToHome?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToMenu?: () => void;
  onNavigateToDocs?: () => void;
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

  // Form State
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState<number>(15);
  const [notes, setNotes] = useState('');

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Minimum date is today
  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadPackages() {
      setIsLoadingPackages(true);
      try {
        const pkgs = await fetchActivePartyPackages();
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
    loadPackages();
  }, []);

  const formatUsdPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceCents / 100);
  };

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
    if (!guestCount || guestCount < 1) {
      errors.guests = 'Informe a quantidade de convidados estimada.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm() || !selectedPackage) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/.netlify/functions/create-party-checkout-session', {
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
          guest_count: Number(guestCount),
          notes: notes.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível agendar a festa no momento. Por favor, tente novamente.'
        );
      }

      if (data.url) {
        // Redireciona o usuário para o Stripe Checkout oficial
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada pelo servidor de pagamento.');
      }
    } catch (err: unknown) {
      console.error('[Party Booking Error]:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao conectar com o serviço de pagamento. Tente novamente.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-neutral-100 font-sans selection:bg-[#89CFF0] selection:text-black pb-24 relative">
      {/* Dynamic Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#89CFF0]/[0.03] blur-[150px] rounded-full" />
        <div className="absolute top-1/2 -right-48 w-[600px] h-[600px] bg-neutral-800/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-10 -left-48 w-[500px] h-[500px] bg-neutral-900/30 blur-[160px] rounded-full" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div 
            onClick={onNavigateToHome}
            className={`flex items-center gap-3 ${onNavigateToHome ? 'cursor-pointer group' : ''}`}
          >
            <div className="h-7 w-7 rounded-lg bg-[#89CFF0] flex items-center justify-center text-black font-black text-xs shadow-sm shadow-[#89CFF0]/20">
              <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#89CFF0] transition-colors">
              Family Fun Town
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-semibold transition-all cursor-pointer"
              >
                <span>Início</span>
              </button>
            )}

            {onNavigateToTickets && (
              <button
                onClick={onNavigateToTickets}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-medium transition-all cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ingressos</span>
              </button>
            )}

            <button
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#89CFF0] text-black font-bold tracking-tight shadow-sm shadow-[#89CFF0]/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>Festas</span>
            </button>

            {onNavigateToMenu && (
              <button
                onClick={onNavigateToMenu}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] font-medium transition-all cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cardápio</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 tracking-wider uppercase mb-4">
          <span className="text-[#89CFF0]">#</span> COMEMORAÇÕES & ANIVERSÁRIOS VIP
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-[1.05]">
          Celebre Sua Festa no <span className="text-[#89CFF0]">Parque</span>
        </h1>

        <p className="mt-4 sm:mt-5 text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Salões temáticos exclusivos, anfitrião dedicado, buffet completo e passe livre para todos os seus convidados curtirem atrações inesquecíveis.
        </p>

        {/* Highlights Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-neutral-300">
          <div className="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
            <Cake className="w-3.5 h-3.5 text-[#89CFF0]" />
            <span className="font-semibold text-neutral-200">Buffet & Salão Temático</span>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#89CFF0]" />
            <span className="font-semibold text-neutral-200">Passes Livres Inclusos</span>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#89CFF0]" />
            <span className="font-semibold text-neutral-200">Reserva Segura Stripe</span>
          </div>
        </div>
      </section>

      {/* Main Booking Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Party Packages (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-md bg-[#89CFF0]/10 text-[#89CFF0] border border-[#89CFF0]/20 flex items-center justify-center font-black text-[11px]">
                  01
                </span>
                Escolha o Pacote de Comemoração
              </h2>
              <span className="text-xs text-neutral-400 font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                {packages.length} {packages.length === 1 ? 'opção' : 'opções'}
              </span>
            </div>

            {isLoadingPackages ? (
              <div className="p-16 rounded-2xl bg-[#0f1015] border border-white/[0.06] text-center flex flex-col items-center justify-center gap-3.5">
                <Loader2 className="w-7 h-7 text-[#89CFF0] animate-spin" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">
                  Carregando pacotes de festa...
                </span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      id={`party-pkg-${pkg.id}`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setValidationErrors((prev) => ({ ...prev, package: '' }));
                      }}
                      className={`cursor-pointer rounded-2xl p-5 sm:p-6 transition-all relative overflow-hidden border ${
                        isSelected
                          ? 'bg-[#0f1015] border-[#89CFF0] ring-1 ring-[#89CFF0]/30 shadow-lg shadow-black/60'
                          : 'bg-[#0f1015] hover:bg-[#14151c] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-[#89CFF0] text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Selecionado
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 pr-4 flex-1">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#89CFF0] bg-[#89CFF0]' : 'border-neutral-600'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">
                              {pkg.name}
                            </h3>
                          </div>
                          {pkg.description && (
                            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pl-5.5">
                              {pkg.description}
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-white/[0.06] pt-3 sm:pt-0 pl-5.5 sm:pl-0">
                          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            {formatUsdPrice(pkg.priceCents)}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                            USD / Pacote Completo
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {validationErrors.package && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 font-semibold bg-red-950/40 p-3 rounded-xl border border-red-900/50">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {validationErrors.package}
              </p>
            )}

            {/* Party Highlights */}
            <div className="p-5 rounded-2xl bg-[#0f1015] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-neutral-300">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-neutral-300">
                  <Cake className="w-4 h-4 flex-shrink-0 text-[#89CFF0]" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">Buffet & Bolo</span>
                  <span className="text-[11px] text-neutral-400">Cardápio completo de festa</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-neutral-300">
                  <Music className="w-4 h-4 flex-shrink-0 text-[#89CFF0]" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">Espaço VIP</span>
                  <span className="text-[11px] text-neutral-400">Salão exclusivo com som</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-neutral-300">
                  <Zap className="w-4 h-4 flex-shrink-0 text-[#89CFF0]" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">Passes Livres</span>
                  <span className="text-[11px] text-neutral-400">Para todos os convidados</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reservation Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-[#0f1015] border border-white/[0.08] p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="border-b border-white/[0.08] pb-4 mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-[#89CFF0]/10 text-[#89CFF0] border border-[#89CFF0]/20 flex items-center justify-center font-black text-[11px]">
                      02
                    </span>
                    Detalhes da Comemoração
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                    Preencha os dados do anfitrião para confirmar a reserva do salão e da data.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-red-300">Falha ao agendar</strong>
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-4">
                  {/* Selected Package Mini Summary */}
                  {selectedPackage && (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                          Pacote de Festa
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {selectedPackage.name}
                        </span>
                      </div>
                      <span className="text-base font-black text-[#89CFF0]">
                        {formatUsdPrice(selectedPackage.priceCents)}
                      </span>
                    </div>
                  )}

                  {/* Field: Full Name */}
                  <div>
                    <label
                      htmlFor="party_holder_name"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                        }`}
                      />
                      <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.name && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Field: Email */}
                  <div>
                    <label
                      htmlFor="party_holder_email"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      E-mail do Responsável *
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Field: Phone */}
                  <div>
                    <label
                      htmlFor="party_holder_phone"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Field: Event Date & Guest Count (Row) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="party_event_date"
                        className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
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
                            setValidationErrors((prev) => ({ ...prev, date: '' }));
                          }}
                          className={`w-full px-3.5 py-3 pl-9 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.date
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                          }`}
                        />
                        <Calendar className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5 pointer-events-none" />
                      </div>
                      {validationErrors.date && (
                        <p className="text-[10px] text-red-400 mt-1">{validationErrors.date}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="party_guest_count"
                        className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
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
                          className={`w-full px-3.5 py-3 pl-9 rounded-xl bg-black/50 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.guests
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-white/[0.1] focus:border-[#89CFF0] focus:ring-[#89CFF0]'
                          }`}
                        />
                        <Users className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5 pointer-events-none" />
                      </div>
                      {validationErrors.guests && (
                        <p className="text-[10px] text-red-400 mt-1">{validationErrors.guests}</p>
                      )}
                    </div>
                  </div>

                  {/* Field: Notes / Observations */}
                  <div>
                    <label
                      htmlFor="party_notes"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      Nome do Aniversariante & Observações
                    </label>
                    <div className="relative">
                      <textarea
                        id="party_notes"
                        rows={2}
                        placeholder="Ex: Aniversário de 10 anos do Lucas. Preferência por bolo de chocolate."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-black/50 border border-white/[0.1] text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#89CFF0] focus:ring-1 focus:ring-[#89CFF0] transition-all resize-none"
                      />
                      <MessageSquare className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Order Total Box */}
                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 uppercase font-bold block tracking-wider">
                        Valor da Reserva
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Cobrança segura via Stripe
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white tracking-tight">
                      {selectedPackage ? formatUsdPrice(selectedPackage.priceCents) : '$0.00'}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="book-party-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#89CFF0]/20 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Criando Reserva na Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>Reservar Festa Agora</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3.5 border-t border-white/[0.06] text-[11px] text-center text-neutral-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#89CFF0]" />
                  <span>Stripe 256-bit Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer
        onNavigateToHome={onNavigateToHome}
        onNavigateToTickets={onNavigateToTickets}
        onNavigateToParties={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateToMenu={onNavigateToMenu}
      />
    </div>
  );
}
