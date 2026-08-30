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

interface PartyBookingProps {
  onNavigateToTickets?: () => void;
  onNavigateToMenu?: () => void;
  onNavigateToDocs?: () => void;
}

export default function PartyBooking({ onNavigateToTickets, onNavigateToMenu, onNavigateToDocs }: PartyBookingProps) {
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
    <div className="min-h-screen bg-[#070707] text-neutral-100 font-sans selection:bg-red-600 selection:text-white pb-20">
      {/* Dynamic Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-red-600/15 via-red-900/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-red-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-20 border-b border-neutral-900 bg-black/90 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-900/50 border border-red-500">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight uppercase text-white">
                  Parque Aventura
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                  Festas & Eventos
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-bold">
                Fun Is Our Middle Name
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigateToTickets && (
              <button
                onClick={onNavigateToTickets}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold uppercase tracking-wider transition-colors"
              >
                <Ticket className="w-3.5 h-3.5 text-red-500" />
                <span>Ingressos</span>
              </button>
            )}

            {onNavigateToMenu && (
              <button
                onClick={onNavigateToMenu}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold uppercase tracking-wider transition-colors"
              >
                <Utensils className="w-3.5 h-3.5 text-red-500" />
                <span>Cardápio</span>
              </button>
            )}

            {onNavigateToDocs && (
              <button
                onClick={onNavigateToDocs}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 font-medium transition-colors"
              >
                Docs
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative z-10 pt-10 sm:pt-14 pb-8 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest mb-4">
          <PartyPopper className="w-3.5 h-3.5" />
          Comemorações Inesquecíveis
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-[1.05]">
          FAÇA SUA FESTA NO <span className="text-red-500 underline decoration-red-600/40 decoration-wavy underline-offset-8">PARQUE</span>
        </h1>

        <p className="mt-4 text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Salões temáticos exclusivos, anfitrião dedicado, bolo, buffet completo e passe livre para todos os seus convidados curtirem o dia inteiro.
        </p>
      </section>

      {/* Main Booking Grid */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Party Packages (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Cake className="w-4 h-4 text-red-500" />
                1. Escolha o Pacote de Comemoração
              </h2>
              <span className="text-xs text-neutral-400 font-mono">
                {packages.length} pacotes disponíveis
              </span>
            </div>

            {isLoadingPackages ? (
              <div className="p-12 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider">
                  Carregando pacotes de festa...
                </span>
              </div>
            ) : (
              <div className="space-y-3">
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
                      className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 relative overflow-hidden border ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border-red-500 ring-1 ring-red-500/50 shadow-xl shadow-red-950/30'
                          : 'bg-neutral-900/80 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" /> Selecionado
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 pr-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-white uppercase tracking-tight">
                              {pkg.name}
                            </h3>
                          </div>
                          {pkg.description && (
                            <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                              {pkg.description}
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-neutral-800/80 pt-3 sm:pt-0">
                          <div className="text-2xl font-black text-white tracking-tight">
                            {formatUsdPrice(pkg.priceCents)}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
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
              <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.package}
              </p>
            )}

            {/* Party Highlights */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Cake className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Bolo & Lanches Inclusos</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span>Espaço Temático VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Passes Livres no Parque</span>
              </div>
            </div>
          </div>

          {/* Right Column: Reservation Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                {/* Header */}
                <div className="border-b border-neutral-800 pb-4 mb-5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-red-500" />
                    2. Detalhes da Comemoração
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Preencha os dados do anfitrião para confirmar a reserva.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-red-300">Falha ao agendar</strong>
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-4">
                  {/* Selected Package Mini Summary */}
                  {selectedPackage && (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                          Pacote de Festa
                        </span>
                        <span className="font-bold text-white uppercase">
                          {selectedPackage.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-red-400">
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
                        className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-neutral-950 border text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-neutral-800 focus:border-red-500 focus:ring-red-500'
                        }`}
                      />
                      <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    {validationErrors.name && (
                      <p className="text-[11px] text-red-400 mt-1">{validationErrors.name}</p>
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
                        className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-neutral-950 border text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-neutral-800 focus:border-red-500 focus:ring-red-500'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-[11px] text-red-400 mt-1">{validationErrors.email}</p>
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
                        className={`w-full px-3.5 py-2.5 pl-9 rounded-xl bg-neutral-950 border text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-neutral-800 focus:border-red-500 focus:ring-red-500'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-[11px] text-red-400 mt-1">{validationErrors.phone}</p>
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
                          className={`w-full px-3 py-2.5 pl-8 rounded-xl bg-neutral-950 border text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.date
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-neutral-800 focus:border-red-500 focus:ring-red-500'
                          }`}
                        />
                        <Calendar className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-3 pointer-events-none" />
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
                          className={`w-full px-3 py-2.5 pl-8 rounded-xl bg-neutral-950 border text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                            validationErrors.guests
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-neutral-800 focus:border-red-500 focus:ring-red-500'
                          }`}
                        />
                        <Users className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-3 pointer-events-none" />
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
                        className="w-full px-3.5 py-2 pl-9 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
                      />
                      <MessageSquare className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Order Total Box */}
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 uppercase font-bold block">
                        Valor da Reserva
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Cobrança segura via Stripe
                      </span>
                    </div>
                    <div className="text-xl font-black text-white">
                      {selectedPackage ? formatUsdPrice(selectedPackage.priceCents) : '$0.00'}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="book-party-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Criando Reserva na Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>Reservar Festa Agora</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[10px] text-center text-neutral-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmação imediata com conciliação automática</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
