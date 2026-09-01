import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Sparkles,
  Utensils,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  PartyPopper,
  Star,
  Users,
  Search,
  Lock,
  Download,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import Footer from './Footer.tsx';
import {
  fetchActiveMenuItems,
  fetchActiveTicketPackages,
  fetchActivePartyPackages,
  DEFAULT_MENU_ITEMS,
  DEFAULT_TICKET_PACKAGES,
  DEFAULT_PARTY_PACKAGES,
} from '../lib/supabase.ts';
import { MenuItemModel, TicketPackageModel, PartyPackageModel } from '../types/database.ts';

interface HomePageProps {
  onNavigateToTickets: () => void;
  onNavigateToParties: () => void;
  onNavigateToMenu: () => void;
  onNavigateToDocs?: () => void;
}

export default function HomePage({
  onNavigateToTickets,
  onNavigateToParties,
  onNavigateToMenu,
  onNavigateToDocs,
}: HomePageProps) {
  const [featuredItems, setFeaturedItems] = useState<MenuItemModel[]>([]);
  const [featuredTickets, setFeaturedTickets] = useState<TicketPackageModel[]>([]);
  const [featuredParties, setFeaturedParties] = useState<PartyPackageModel[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingParties, setIsLoadingParties] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedData() {
      // Menu Items (max 3)
      try {
        const allItems = await fetchActiveMenuItems();
        if (isMounted) {
          const featured = allItems.filter(
            (it) => it.featuredHome === true || it.featured_home === true
          );
          if (featured.length > 0) {
            setFeaturedItems(featured.slice(0, 3));
          } else {
            setFeaturedItems(allItems.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('Error loading featured menu for Home:', err);
        if (isMounted) {
          setFeaturedItems(DEFAULT_MENU_ITEMS.slice(0, 3));
        }
      } finally {
        if (isMounted) setIsLoadingMenu(false);
      }

      // Ticket Packages (max 3)
      try {
        const allTickets = await fetchActiveTicketPackages();
        if (isMounted) {
          const featured = allTickets.filter(
            (t) => t.featuredHome === true || (t as any).featured_home === true
          );
          if (featured.length > 0) {
            setFeaturedTickets(featured.slice(0, 3));
          } else {
            setFeaturedTickets(allTickets.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('Error loading featured tickets for Home:', err);
        if (isMounted) {
          setFeaturedTickets(DEFAULT_TICKET_PACKAGES.slice(0, 3));
        }
      } finally {
        if (isMounted) setIsLoadingTickets(false);
      }

      // Party Packages (max 4)
      try {
        const allParties = await fetchActivePartyPackages();
        if (isMounted) {
          const featured = allParties.filter(
            (p) => p.featuredHome === true || (p as any).featured_home === true
          );
          if (featured.length > 0) {
            setFeaturedParties(featured.slice(0, 4));
          } else {
            setFeaturedParties(allParties.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn('Error loading featured party packages for Home:', err);
        if (isMounted) {
          setFeaturedParties(DEFAULT_PARTY_PACKAGES.slice(0, 4));
        }
      } finally {
        if (isMounted) setIsLoadingParties(false);
      }
    }

    loadFeaturedData();
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <div className="min-h-screen bg-[#07080b] text-neutral-100 font-sans selection:bg-[#89CFF0] selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#89CFF0]/[0.035] blur-[150px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-neutral-800/10 blur-[180px] rounded-full" />
        <div className="absolute top-2/3 -left-40 w-[600px] h-[600px] bg-neutral-900/30 blur-[180px] rounded-full" />
      </div>

      {/* Top Navigation Bar (matching screenshot layout) */}
      <header className="relative z-30 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Logo with Lime accent badge */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="h-7 w-7 rounded-lg bg-[#89CFF0] flex items-center justify-center text-black font-black text-xs shadow-sm shadow-[#89CFF0]/20">
                <Ticket className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Family Fun Town
              </span>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-400 font-medium">
              <button onClick={onNavigateToTickets} className="hover:text-white transition-colors cursor-pointer">
                Ingressos
              </button>
              <button onClick={onNavigateToParties} className="hover:text-white transition-colors cursor-pointer">
                Festas & Aniversários
              </button>
              <button onClick={onNavigateToMenu} className="hover:text-white transition-colors cursor-pointer">
                Cardápio
              </button>
              <a href="#como-funciona" className="hover:text-white transition-colors cursor-pointer">
                Como Funciona
              </a>
              <a href="#atracoes" className="hover:text-white transition-colors cursor-pointer">
                Atrações
              </a>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToTickets}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] text-black font-bold tracking-tight transition-all cursor-pointer shadow-sm shadow-[#89CFF0]/20 active:scale-95"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Garantir Ingressos</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Showcase Content */}
      <main className="relative z-10 flex-1">
        {/* Hero Section with dark image placeholder backdrop */}
        <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
          {/* Subtle Dark Background Visual Placeholder Container */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-transparent to-[#07080b] z-10" />
            {/* Dark abstract placeholder for video/hero banner */}
            <div className="w-full h-full bg-[radial-gradient(#1c202a_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            {/* Category / Hashtag pill */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 tracking-wider uppercase mb-6">
              <span className="text-[#89CFF0]">#</span> PARQUE DE DIVERSÕES & ADRENALINA · TEMPORADA 2026
            </div>

            {/* Main Headline matching print typographic hierarchy */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.98]">
              Seu Jogo.<br />
              Seu Momento.<br />
              <span className="text-[#89CFF0]">Sua Diversão.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 sm:mt-8 text-neutral-400 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
              O maior complexo de entretenimento e atrações radicais da região. Viva momentos extraordinários, garanta seus passaportes online e comemore momentos inesquecíveis.
            </p>

            {/* Dual CTAs matching the screenshot */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onNavigateToTickets}
                className="py-3 px-6 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] active:scale-95 text-black text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#89CFF0]/20 flex items-center gap-2 group cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Garantir Ingressos</span>
              </button>

              <button
                onClick={onNavigateToParties}
                className="py-3 px-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-white border border-white/[0.1] text-xs sm:text-sm font-semibold tracking-tight transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Ver Pacotes de Festas</span>
              </button>

              <button
                onClick={onNavigateToMenu}
                className="py-3 px-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-neutral-300 hover:text-white border border-white/[0.1] text-xs sm:text-sm font-medium tracking-tight transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Cardápio</span>
              </button>
            </div>

            {/* Stats Row matching screenshot (163 FOTOS NO AR / 6 EVENTOS / 4 FOTÓGRAFOS / 24h ENTREGA) */}
            <div className="mt-14 sm:mt-20 pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">12+</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                  Atrações no Complexo
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">3+</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                  Áreas Temáticas
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">100%</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                  Checkout Seguro Stripe
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">10h às 22h</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                  Aberto Todos os Dias
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Eventos / Atrações em Destaque (matching screenshot cards with photo preview & date badge) */}
        <section id="atracoes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                ATRAÇÕES EM DESTAQUE
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Em funcionamento agora, prontas para você.
              </h2>
            </div>

            <button
              onClick={onNavigateToTickets}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Ver todos os ingressos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTickets.map((ticket) => {
              const formattedPrice = (ticket.priceCents / 100).toFixed(2);
              return (
                <div
                  key={ticket.id}
                  id={`home-featured-ticket-${ticket.id}`}
                  onClick={onNavigateToTickets}
                  className="rounded-2xl bg-[#0f1015] border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Photo / Visual Container */}
                    <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-transparent to-black/40 z-10 pointer-events-none" />
                      {ticket.imageUrl ? (
                        <img
                          src={ticket.imageUrl}
                          alt={ticket.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center text-neutral-500 gap-2 group-hover:scale-105 transition-transform duration-500">
                          <Ticket className="w-8 h-8 text-neutral-600" />
                          <span className="text-xs font-medium text-neutral-500">Ingresso Oficial</span>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-white group-hover:text-[#89CFF0] transition-colors line-clamp-1">
                        {ticket.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-2 leading-relaxed line-clamp-2">
                        {ticket.description ||
                          'Acesso completo ao complexo e suas atrações com passaporte oficial.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Price & Link */}
                  <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="text-neutral-400">
                      A partir de <span className="font-bold text-white font-mono">${formattedPrice}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-white group-hover:text-[#89CFF0] transition-colors">
                      <span>Garantir</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Como Funciona (matching screenshot 3-step cards with 01, 02, 03 and trust footnotes) */}
        <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06]">
          <div className="max-w-3xl mb-12">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
              COMO FUNCIONA
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Três passos entre você e o seu dia de diversão.
            </h2>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl bg-[#0f1015] border border-white/[0.06] p-6 relative flex flex-col justify-between hover:border-white/15 transition-all">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-neutral-300">
                    <Search className="w-4 h-4 text-neutral-300" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-neutral-500">01</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  Escolha o seu dia & ingressos
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Selecione a data ideal da sua visita, a quantidade de passaportes ou os pacotes de festa que melhor atendem sua família.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-[#0f1015] border border-white/[0.06] p-6 relative flex flex-col justify-between hover:border-white/15 transition-all">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-neutral-300">
                    <Lock className="w-4 h-4 text-neutral-300" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-neutral-500">02</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  Pagamento rápido e seguro
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Pague com segurança via Stripe. Confirmação instantânea com criptografia bancária e sem necessidade de enfrentar filas na bilheteria.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-[#0f1015] border border-white/[0.06] p-6 relative flex flex-col justify-between hover:border-white/15 transition-all">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-neutral-300">
                    <Download className="w-4 h-4 text-neutral-300" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-neutral-500">03</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  Apresente o voucher e aproveite
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Seu ingresso digital com QR Code fica disponível na hora na tela e no seu e-mail para acesso imediato aos brinquedos.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Footnotes */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#89CFF0]" />
              <span>Vouchers oficiais gerados com QR Code único e validação instantânea na catraca</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#89CFF0]" />
              <span>100% de segurança no processamento criptografado via Stripe</span>
            </div>
          </div>
        </section>

        {/* Section: Cardápio do Parque com 3 cards para fotos/imagens */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                # GASTRONOMIA & SNACK BAR
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Cardápio Oficial do Complexo.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
                Hambúrgueres artesanais, porções crocantes, sobremesas exclusivas e bebidas geladas para recarregar a energia entre uma atração e outra.
              </p>
            </div>

            <button
              onClick={onNavigateToMenu}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Ver cardápio completo</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#89CFF0]" />
            </button>
          </div>

          {/* 3 Menu Cards Grid for Featured Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => {
              const formattedPrice = (item.priceCents / 100).toFixed(2);
              const formattedPromoPrice = item.promoPriceCents
                ? (item.promoPriceCents / 100).toFixed(2)
                : null;

              return (
                <div
                  key={item.id}
                  id={`home-featured-menu-item-${item.id}`}
                  onClick={onNavigateToMenu}
                  className="rounded-2xl bg-[#0f1015] border border-white/[0.08] overflow-hidden group hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Photo / Visual Container */}
                    <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-transparent to-black/30 z-10 pointer-events-none" />
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center text-neutral-500 gap-2 group-hover:scale-105 transition-transform duration-500">
                          <Utensils className="w-8 h-8 text-neutral-600" />
                          <span className="text-xs font-medium text-neutral-500">Gastronomia Oficial</span>
                        </div>
                      )}
                      {formattedPromoPrice && (
                        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 backdrop-blur-sm">
                          <Sparkles className="w-3 h-3" />
                          <span>Oferta</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-white group-hover:text-[#89CFF0] transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-2 leading-relaxed line-clamp-2">
                        {item.description ||
                          'Delicioso item artesanal preparado com ingredientes selecionados do complexo.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Price / Action */}
                  <div className="px-5 pb-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      {formattedPromoPrice ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-amber-400 font-mono">
                            ${formattedPromoPrice}
                          </span>
                          <span className="text-[11px] text-neutral-500 line-through font-mono">
                            ${formattedPrice}
                          </span>
                        </div>
                      ) : (
                        <div className="text-neutral-400">
                          Por <span className="font-bold text-white font-mono">${formattedPrice}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-white group-hover:text-[#89CFF0] transition-colors">
                      <span>Pedir</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Festas & Agendamentos do Site */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                # FESTAS, EVENTOS & AGENDAMENTOS
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Comemore seu Aniversário e Eventos no Parque.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
                Camarotes exclusivos, buffet completo, passaporte para todos os convidados e agendamento 100% online com confirmação instantânea.
              </p>
            </div>

            <button
              onClick={onNavigateToParties}
              className="text-xs font-semibold text-neutral-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Agendar festa online</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#89CFF0]" />
            </button>
          </div>

          {/* 4 Party Feature / Booking Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredParties.map((pkg) => {
              const formattedPrice = (pkg.priceCents / 100).toFixed(2);
              return (
                <div
                  key={pkg.id}
                  id={`home-featured-party-${pkg.id}`}
                  onClick={onNavigateToParties}
                  className="rounded-2xl bg-[#0f1015] border border-white/[0.08] overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-transparent to-black/30 z-10 pointer-events-none" />
                      {pkg.imageUrl ? (
                        <img
                          src={pkg.imageUrl}
                          alt={pkg.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center text-neutral-500 gap-2 group-hover:scale-105 transition-transform duration-500">
                          <PartyPopper className="w-8 h-8 text-neutral-600" />
                          <span className="text-xs font-medium text-neutral-500">Pacote de Festa</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#89CFF0] transition-colors line-clamp-1">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed line-clamp-2">
                        {pkg.description ||
                          'Salão exclusivo, buffet completo e passaporte ilimitado para todos os convidados.'}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-400 font-mono">A partir de ${formattedPrice}</span>
                    <span className="text-[11px] font-bold text-[#89CFF0] flex items-center gap-1">
                      Reservar <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer
        onNavigateToHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateToTickets={onNavigateToTickets}
        onNavigateToParties={onNavigateToParties}
        onNavigateToMenu={onNavigateToMenu}
      />
    </div>
  );
}

