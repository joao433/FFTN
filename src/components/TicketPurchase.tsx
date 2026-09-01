import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Sparkles,
  Calendar,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Flame,
  ArrowRight,
  Utensils,
} from 'lucide-react';
import type { TicketPackageModel } from '../types/database.ts';
import { fetchActiveTicketPackages } from '../lib/supabase.ts';
import Footer from './Footer.tsx';

interface TicketPurchaseProps {
  onNavigateToHome?: () => void;
  onNavigateToParties?: () => void;
  onNavigateToMenu?: () => void;
  onNavigateToDocs?: () => void;
}

export default function TicketPurchase({
  onNavigateToHome,
  onNavigateToParties,
  onNavigateToMenu,
  onNavigateToDocs,
}: TicketPurchaseProps) {
  const [packages, setPackages] = useState<TicketPackageModel[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TicketPackageModel | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Form State
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [eventDate, setEventDate] = useState('');

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Minimum allowed date is today
  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadPackages() {
      setIsLoadingPackages(true);
      try {
        const pkgs = await fetchActiveTicketPackages();
        setPackages(pkgs);
        if (pkgs.length > 0) {
          setSelectedPackage(pkgs[0]);
        }
      } catch (err) {
        console.error('Error loading packages:', err);
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
      errors.package = 'Selecione um pacote de ingresso.';
    }
    if (!holderName.trim()) {
      errors.name = 'Informe o nome completo do titular.';
    }
    if (!holderEmail.trim() || !holderEmail.includes('@')) {
      errors.email = 'Informe um e-mail válido para envio do voucher.';
    }
    if (!holderPhone.trim() || holderPhone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Informe um telefone de contato válido.';
    }
    if (!eventDate) {
      errors.date = 'Selecione a data da visita.';
    } else if (eventDate < todayDateString) {
      errors.date = 'A data da visita não pode ser no passado.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm() || !selectedPackage) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
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
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível iniciar o pagamento. Por favor, tente novamente.'
        );
      }

      if (data.url) {
        // Redireciona o usuário para o Stripe Checkout oficial
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada pela Stripe.');
      }
    } catch (err: unknown) {
      console.error('[Checkout Error]:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao conectar com o serviço de pagamento. Tente novamente.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-neutral-100 font-sans selection:bg-red-600 selection:text-white pb-24 relative">
      {/* Dynamic Background Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-red-600/20 via-red-950/10 to-transparent blur-[160px] rounded-full" />
        <div className="absolute top-1/2 -right-48 w-[600px] h-[600px] bg-red-900/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-10 -left-48 w-[500px] h-[500px] bg-red-950/15 blur-[160px] rounded-full" />
        {/* Subtle grid texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} 
        />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-20 border-b border-neutral-900/80 bg-[#050507]/85 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <div 
            onClick={onNavigateToHome}
            className={`flex items-center gap-3.5 ${onNavigateToHome ? 'cursor-pointer group' : ''}`}
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-950/60 border border-red-400/30 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 fill-white drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight uppercase text-white group-hover:text-red-400 transition-colors">
                  Parque Aventura
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-wider">
                  Tickets Online
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-extrabold">
                Fun Is Our Middle Name
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-neutral-400 bg-neutral-900/80 px-3.5 py-2 rounded-xl border border-neutral-800/80 backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>Aberto hoje: <strong className="text-neutral-200">10h às 22h</strong></span>
            </div>

            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Início</span>
              </button>
            )}

            <button
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 font-black uppercase tracking-wider shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 text-red-500" />
              <span>Ingressos</span>
            </button>

            {onNavigateToParties && (
              <button
                onClick={onNavigateToParties}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>Festas</span>
              </button>
            )}

            {onNavigateToMenu && (
              <button
                onClick={onNavigateToMenu}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <Utensils className="w-3.5 h-3.5 text-red-500" />
                <span>Cardápio</span>
              </button>
            )}

            {onNavigateToDocs && (
              <button
                onClick={onNavigateToDocs}
                className="text-xs px-3 py-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800/60 font-medium transition-colors"
              >
                Docs
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section: Cinematic, Bold, High Contrast */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest mb-6 shadow-lg shadow-red-950/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          Ingressos Oficiais & Passes VIP
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.95] drop-shadow-2xl">
          FUN IS OUR{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-orange-500 underline decoration-red-500/40 decoration-wavy underline-offset-8">
            MIDDLE NAME
          </span>
        </h1>

        <p className="mt-5 sm:mt-6 text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Garanta seu passe antecipado com desconto exclusivo, evite filas na bilheteria e aproveite um dia inesquecível de adrenalina e diversão.
        </p>

        {/* Park Highlights Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-neutral-300">
          <div className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-neutral-200">Aberto Todos os Dias</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-neutral-200">Entrada Sem Fila</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold text-neutral-200">Voucher Digital no Celular</span>
          </div>
        </div>
      </section>

      {/* Main Purchasing Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Ticket Packages (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-600/10 text-red-500 border border-red-500/20">
                  <Ticket className="w-4 h-4" />
                </div>
                1. Escolha seu Pacote de Ingresso
              </h2>
              <span className="text-xs text-neutral-400 font-mono px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                {packages.length} {packages.length === 1 ? 'opção' : 'opções'}
              </span>
            </div>

            {isLoadingPackages ? (
              <div className="p-16 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 text-center flex flex-col items-center justify-center gap-3.5 backdrop-blur-sm">
                <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
                <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold">
                  Carregando pacotes do parque...
                </span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      id={`ticket-pkg-${pkg.id}`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setValidationErrors((prev) => ({ ...prev, package: '' }));
                      }}
                      className={`cursor-pointer rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden border ${
                        isSelected
                          ? 'bg-gradient-to-br from-red-950/40 via-neutral-900/90 to-neutral-950 border-red-500/80 ring-1 ring-red-500/40 shadow-2xl shadow-red-950/40 -translate-y-0.5'
                          : 'bg-neutral-900/50 hover:bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Ambient Accent Glow for Selected */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                      )}

                      {isSelected && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-lg shadow-red-950/50">
                            <Check className="w-3 h-3 stroke-[3]" /> Selecionado
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="space-y-2 pr-4 flex-1">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-red-500 bg-red-500' : 'border-neutral-600'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-tight">
                              {pkg.name}
                            </h3>
                          </div>
                          {pkg.description && (
                            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pl-5.5">
                              {pkg.description}
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-neutral-800/80 pt-3.5 sm:pt-0 pl-5.5 sm:pl-0">
                          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            {formatUsdPrice(pkg.priceCents)}
                          </div>
                          <span className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider mt-0.5">
                            USD / Por Pessoa
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

            {/* Quick Highlights / Park Perks */}
            <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-neutral-300 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Zap className="w-4 h-4 flex-shrink-0" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">Instantâneo</span>
                  <span className="text-[11px] text-neutral-400">Voucher enviado na hora</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">100% Seguro</span>
                  <span className="text-[11px] text-neutral-400">Processado via Stripe</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">Atrações VIP</span>
                  <span className="text-[11px] text-neutral-400">Acesso a todos brinquedos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="rounded-3xl bg-neutral-900/70 border border-neutral-800/90 p-6 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
                {/* Header */}
                <div className="border-b border-neutral-800/80 pb-4 mb-5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-red-600/10 text-red-500 border border-red-500/20">
                      <User className="w-4 h-4" />
                    </div>
                    2. Dados do Titular e Visita
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                    Preencha os dados de quem irá apresentar o voucher oficial na entrada do parque.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-4 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-3 shadow-lg shadow-red-950/40">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-red-300">Falha ao processar</strong>
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCheckout} className="space-y-4">
                  {/* Selected Package Mini Summary */}
                  {selectedPackage && (
                    <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-extrabold tracking-wider block">
                          Pacote Selecionado
                        </span>
                        <span className="font-black text-white uppercase text-xs sm:text-sm">
                          {selectedPackage.name}
                        </span>
                      </div>
                      <span className="text-base font-black text-red-400 font-mono">
                        {formatUsdPrice(selectedPackage.priceCents)}
                      </span>
                    </div>
                  )}

                  {/* Field: Full Name */}
                  <div>
                    <label
                      htmlFor="holder_name"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <input
                        id="holder_name"
                        type="text"
                        placeholder="Ex: Carlos Silva"
                        value={holderName}
                        onChange={(e) => {
                          setHolderName(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-neutral-950/90 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.name
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-neutral-800/90 focus:border-red-500/80 focus:ring-red-500/20'
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
                      htmlFor="holder_email"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      E-mail para Recebimento *
                    </label>
                    <div className="relative">
                      <input
                        id="holder_email"
                        type="email"
                        placeholder="carlos@exemplo.com"
                        value={holderEmail}
                        onChange={(e) => {
                          setHolderEmail(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-neutral-950/90 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.email
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-neutral-800/90 focus:border-red-500/80 focus:ring-red-500/20'
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
                      htmlFor="holder_phone"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      Telefone / WhatsApp *
                    </label>
                    <div className="relative">
                      <input
                        id="holder_phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={holderPhone}
                        onChange={(e) => {
                          setHolderPhone(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-neutral-950/90 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.phone
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-neutral-800/90 focus:border-red-500/80 focus:ring-red-500/20'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Field: Event Date */}
                  <div>
                    <label
                      htmlFor="event_date"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5"
                    >
                      Data da Visita *
                    </label>
                    <div className="relative">
                      <input
                        id="event_date"
                        type="date"
                        min={todayDateString}
                        value={eventDate}
                        onChange={(e) => {
                          setEventDate(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, date: '' }));
                        }}
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-neutral-950/90 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.date
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-neutral-800/90 focus:border-red-500/80 focus:ring-red-500/20'
                        }`}
                      />
                      <Calendar className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.date && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">{validationErrors.date}</p>
                    )}
                  </div>

                  {/* Order Total Box */}
                  <div className="pt-4 border-t border-neutral-800/90 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 uppercase font-black block tracking-wider">
                        Total do Pedido
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Cobrança única segura
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white tracking-tight">
                      {selectedPackage ? formatUsdPrice(selectedPackage.priceCents) : '$0.00'}
                    </div>
                  </div>

                  {/* Buy / Checkout Button */}
                  <button
                    id="buy-ticket-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-red-600/30 hover:shadow-red-600/50 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Iniciando Checkout Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>Comprar Ingresso Agora</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3.5 border-t border-neutral-800/80 text-[11px] text-center text-neutral-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
        onNavigateToTickets={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateToParties={onNavigateToParties}
        onNavigateToMenu={onNavigateToMenu}
      />
    </div>
  );
}
