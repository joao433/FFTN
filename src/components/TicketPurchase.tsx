import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Sparkles,
  Calendar,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Flame,
  ArrowRight,
  Utensils,
} from 'lucide-react';
import type { TicketPackageModel } from '../types/database.ts';
import { fetchActiveTicketPackages } from '../lib/supabase.ts';
import Footer from './Footer.tsx';
import ParkLogo from './ParkLogo.tsx';
import ThematicPlaceholder from './ThematicPlaceholder.tsx';
import SkeletonCard from './SkeletonCard.tsx';

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
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] font-sans selection:bg-[#E8734A] selection:text-white pb-24 relative">
      {/* Dynamic Background Atmospheric Lighting */}
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

            <button
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#E8734A] text-white font-bold tracking-tight shadow-sm shadow-[#E8734A]/20"
            >
              <Ticket className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Ingressos</span>
            </button>

            {onNavigateToParties && (
              <button
                onClick={onNavigateToParties}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#7A6C60] hover:text-[#3A2E26] border border-[#EADCCF] font-medium transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A8988C]" />
                <span>Festas</span>
              </button>
            )}

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

      {/* Hero Section with soft warm gradient and organic depth */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-12 sm:pb-14 px-4 sm:px-6 lg:px-8 text-center border-b border-[#EADCCF] bg-gradient-to-b from-[#FFFDF9] via-[#FAF1E4] to-[#FDF6ED] overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-70">
          <div className="w-full h-full bg-[radial-gradient(#D3C2B2_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        {/* Soft blobs */}
        <div className="absolute -top-12 -left-12 w-[380px] h-[380px] bg-[#E8734A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 -right-10 w-[360px] h-[360px] bg-[#F2A94E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#3A2E26] leading-[1.05]">
            Garanta Sua Entrada no <span className="text-[#E8734A]">Parque</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-[#7A6C60] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Compre seu ingresso antecipado com desconto exclusivo, receba o voucher digital com QR Code no celular e entre direto nas atrações sem filas.
          </p>
        </div>
      </section>

      {/* Main Purchasing Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Ticket Packages (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADCCF]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3A2E26] flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-md bg-[#FAF1E4] text-[#E8734A] border border-[#E8734A]/30 flex items-center justify-center font-black text-[11px]">
                  01
                </span>
                Escolha seu Pacote de Ingresso
              </h2>
              <span className="text-xs text-[#7A6C60] font-mono px-2.5 py-1 rounded-lg bg-[#FAF1E4] border border-[#EADCCF]">
                {packages.length} {packages.length === 1 ? 'opção' : 'opções'}
              </span>
            </div>

            {isLoadingPackages ? (
              <SkeletonCard type="ticket" count={3} />
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
                      className={`cursor-pointer rounded-2xl p-5 sm:p-6 card-interactive relative overflow-hidden border ${
                        isSelected
                          ? 'bg-[#FFFDF9] border-[#E8734A] ring-2 ring-[#E8734A]/30 elevation-2'
                          : 'bg-[#FFFDF9] hover:bg-[#FAF1E4] border-[#EADCCF] hover:border-[#E8734A]/40 elevation-1'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-[#E8734A] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Selecionado
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5 flex-1 pr-4">
                          {pkg.imageUrl ? (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#EADCCF] bg-[#FAF1E4] flex-shrink-0">
                              <img
                                src={pkg.imageUrl}
                                alt={pkg.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#EADCCF] flex-shrink-0">
                              <ThematicPlaceholder type="ticket" size="sm" />
                            </div>
                          )}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#E8734A] bg-[#E8734A]' : 'border-[#D3C2B2]'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <h3 className="font-bold text-base sm:text-lg text-[#3A2E26] tracking-tight">
                                {pkg.name}
                              </h3>
                            </div>
                            {pkg.description && (
                              <p className="text-xs sm:text-sm text-[#7A6C60] leading-relaxed pl-5.5 sm:pl-0">
                                {pkg.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-[#F0E6DA] pt-3 sm:pt-0 pl-5.5 sm:pl-0">
                          <div className="text-2xl sm:text-3xl font-black text-[#3A2E26] tracking-tight">
                            {formatUsdPrice(pkg.priceCents)}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-[#7A6C60] tracking-wider">
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
              <p className="text-xs text-red-600 flex items-center gap-1.5 font-semibold bg-red-50 p-3 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {validationErrors.package}
              </p>
            )}
          </div>

          {/* Right Column: Checkout Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] p-6 sm:p-7 shadow-[0_8px_30px_-4px_rgba(74,52,40,0.08)] relative overflow-hidden">
                {/* Header */}
                <div className="border-b border-[#EADCCF] pb-4 mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3A2E26] flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-[#FAF1E4] text-[#E8734A] border border-[#E8734A]/30 flex items-center justify-center font-black text-[11px]">
                      02
                    </span>
                    Dados do Titular e Visita
                  </h2>
                  <p className="text-xs text-[#7A6C60] mt-1.5 leading-relaxed">
                    Preencha os dados de quem irá apresentar o voucher oficial na catraca do parque.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-red-800">Falha ao processar</strong>
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCheckout} className="space-y-4">
                  {/* Selected Package Mini Summary */}
                  {selectedPackage && (
                    <div className="p-3.5 rounded-xl bg-[#FAF1E4] border border-[#EADCCF] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#7A6C60] uppercase font-bold tracking-wider block">
                          Pacote Selecionado
                        </span>
                        <span className="font-bold text-[#3A2E26] text-xs sm:text-sm">
                          {selectedPackage.name}
                        </span>
                      </div>
                      <span className="text-base font-black text-[#E8734A]">
                        {formatUsdPrice(selectedPackage.priceCents)}
                      </span>
                    </div>
                  )}

                  {/* Field: Full Name */}
                  <div>
                    <label
                      htmlFor="holder_name"
                      className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                        }`}
                      />
                      <User className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.name && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Field: Email */}
                  <div>
                    <label
                      htmlFor="holder_email"
                      className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
                    >
                      E-mail para Recebimento do Voucher *
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Field: Phone */}
                  <div>
                    <label
                      htmlFor="holder_phone"
                      className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Field: Event Date */}
                  <div>
                    <label
                      htmlFor="event_date"
                      className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26] mb-1.5"
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
                        className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-xs sm:text-sm text-[#3A2E26] placeholder-[#A8988C] focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.date
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-[#D3C2B2] focus:border-[#E8734A] focus:ring-[#E8734A]'
                        }`}
                      />
                      <Calendar className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {validationErrors.date && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{validationErrors.date}</p>
                    )}
                  </div>

                  {/* Order Total Box */}
                  <div className="pt-4 border-t border-[#EADCCF] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#7A6C60] uppercase font-bold block tracking-wider">
                        Total do Pedido
                      </span>
                      <span className="text-[11px] text-[#7A6C60]">
                        Cobrança única segura
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#3A2E26] tracking-tight">
                      {selectedPackage ? formatUsdPrice(selectedPackage.priceCents) : '$0.00'}
                    </div>
                  </div>

                  {/* Buy / Checkout Button */}
                  <button
                    id="buy-ticket-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full bg-[#E8734A] hover:bg-[#D9653B] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#E8734A]/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Iniciando Checkout Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>Garantir Ingresso Agora</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3.5 border-t border-[#EADCCF] text-[11px] text-center text-[#7A6C60] flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E8734A]" />
                  <span>Stripe 256-bit Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Summary Bar (Appears when package is selected on mobile screens) */}
      {selectedPackage && (
        <div className="lg:hidden fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md py-3 px-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8734A]/30 elevation-3 flex items-center justify-between shadow-2xl">
            <div className="flex-1 min-w-0 pr-3">
              <span className="text-[10px] uppercase font-bold text-[#7A6C60] tracking-wider block">
                Pacote Escolhido
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
                const formElem = document.getElementById('buy-ticket-submit-btn');
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
