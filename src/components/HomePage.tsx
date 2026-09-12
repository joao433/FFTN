import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import LanguageSelector from './LanguageSelector.tsx';
import ParkLogo from './ParkLogo.tsx';
import { useLanguage } from '../lib/i18n.tsx';
import {
  fetchActiveMenuItems,
  fetchActiveTicketPackages,
  fetchActivePartyPackages,
  fetchSiteSettings,
  DEFAULT_MENU_ITEMS,
  DEFAULT_TICKET_PACKAGES,
  DEFAULT_PARTY_PACKAGES,
} from '../lib/supabase.ts';
import {
  MenuItemModel,
  TicketPackageModel,
  PartyPackageModel,
  SiteContactInfoModel,
} from '../types/database.ts';

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
  const { t } = useLanguage();
  const [featuredItems, setFeaturedItems] = useState<MenuItemModel[]>([]);
  const [featuredTickets, setFeaturedTickets] = useState<TicketPackageModel[]>([]);
  const [featuredParties, setFeaturedParties] = useState<PartyPackageModel[]>([]);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<SiteContactInfoModel | undefined>(undefined);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingParties, setIsLoadingParties] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSiteSettings() {
      try {
        const settings = await fetchSiteSettings();
        if (isMounted && settings) {
          const videoUrl = settings.home?.heroVideoUrl?.trim() || null;
          const imageUrl = settings.home?.heroImageUrl?.trim() || null;
          setHeroVideoUrl(videoUrl);
          setHeroImageUrl(imageUrl);
          if (!videoUrl) {
            setIsVideoLoaded(false);
          }
          if (settings.contact) {
            setContactInfo(settings.contact);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar configurações do site para a Home:', err);
      }
    }

    loadSiteSettings();

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
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] font-sans selection:bg-[#E8734A] selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#E8734A]/[0.05] blur-[150px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-[#F2A94E]/[0.05] blur-[180px] rounded-full" />
      </div>

      {/* Top Navigation Bar (matching screenshot layout) */}
      <header className="relative z-30 border-b border-[#EADCCF] bg-[#FFFDF9]/95 backdrop-blur-xl sticky top-0 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <div className="flex items-center cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ParkLogo size="md" />
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6 text-xs text-[#7A6C60] font-medium">
              <button onClick={onNavigateToTickets} className="hover:text-[#E8734A] transition-colors cursor-pointer">
                {t('header.tickets')}
              </button>
              <button onClick={onNavigateToParties} className="hover:text-[#E8734A] transition-colors cursor-pointer">
                {t('header.parties')}
              </button>
              <button onClick={onNavigateToMenu} className="hover:text-[#E8734A] transition-colors cursor-pointer">
                {t('header.menu')}
              </button>
            </nav>
          </div>

          {/* Right Action buttons: Seletor de Idiomas no cabeçalho */}
          <div className="flex items-center gap-3">
            <LanguageSelector align="right" />
          </div>
        </div>
      </header>

      {/* Main Showcase Content */}
      <main className="relative z-10 flex-1">
        {/* Hero Section with video background or fallback warm gradient */}
        <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#EADCCF] overflow-hidden min-h-[560px] flex flex-col justify-center">
          {heroVideoUrl ? (
            <>
              <video
                key={heroVideoUrl}
                src={heroVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onCanPlay={() => setIsVideoLoaded(true)}
                onLoadedData={() => setIsVideoLoaded(true)}
                onPlay={() => setIsVideoLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${
                  isVideoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Background gradient while video is buffering */}
              <div
                className={`absolute inset-0 z-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF1E4] to-[#FDF6ED] transition-opacity duration-700 ${
                  isVideoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />
              {/* Localized gradient overlay: covers ONLY the text area on the left, leaving the rest of the video crisp, vibrant and 100% unobstructed */}
              <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2 z-0 bg-gradient-to-r from-[#FFFDF9]/80 via-[#FAF1E4]/45 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 z-0 bg-gradient-to-t from-[#FDF6ED]/40 to-transparent pointer-events-none" />
            </>
          ) : heroImageUrl ? (
            <>
              <img
                src={heroImageUrl}
                alt="Family Fun Town Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              {/* Localized gradient overlay for image */}
              <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2 z-0 bg-gradient-to-r from-[#FFFDF9]/80 via-[#FAF1E4]/45 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 z-0 bg-gradient-to-t from-[#FDF6ED]/40 to-transparent pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF1E4] to-[#FDF6ED]" />
              {/* Subtle Light Background Visual Pattern */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-75">
                <div className="w-full h-full bg-[radial-gradient(#D3C2B2_1px,transparent_1px)] [background-size:24px_24px]" />
              </div>

              {/* Decorative Organic Soft Blobs */}
              <div className="absolute -top-16 -left-20 w-[450px] h-[450px] bg-[#E8734A]/10 rounded-full blur-3xl pointer-events-none -z-0" />
              <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] bg-[#F2A94E]/12 rounded-full blur-3xl pointer-events-none -z-0" />
              <div className="absolute -bottom-16 left-1/3 w-[500px] h-[300px] bg-[#E8734A]/08 rounded-full blur-3xl pointer-events-none -z-0" />
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 max-w-5xl mx-auto w-full"
          >
            {/* Main Headline matching print typographic hierarchy */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#3A2E26] leading-[0.98]">
              {t('hero.headline_part1')}<br />
              {t('hero.headline_part2')}<br />
              <span className="text-[#E8734A]">{t('hero.headline_part3')}</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 sm:mt-8 text-[#7A6C60] text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* Dual CTAs matching the screenshot - 'Garantir Ingressos' remains exactly as requested */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onNavigateToTickets}
                className="btn-press py-3 px-6 rounded-full bg-[#E8734A] hover:bg-[#D9653B] active:scale-95 text-white text-xs sm:text-sm font-bold tracking-tight transition-all shadow-md shadow-[#E8734A]/25 hover:shadow-lg hover:shadow-[#E8734A]/30 flex items-center gap-2 group cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>{t('hero.cta_tickets')}</span>
              </button>

              <button
                onClick={onNavigateToParties}
                className="btn-press py-3 px-6 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] active:scale-95 text-[#3A2E26] border border-[#EADCCF] shadow-sm hover:shadow-md text-xs sm:text-sm font-semibold tracking-tight transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{t('hero.cta_parties')}</span>
              </button>

              <button
                onClick={onNavigateToMenu}
                className="btn-press py-3 px-6 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] active:scale-95 text-[#7A6C60] hover:text-[#3A2E26] border border-[#EADCCF] shadow-sm hover:shadow-md text-xs sm:text-sm font-medium tracking-tight transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{t('hero.cta_menu')}</span>
              </button>
            </div>
          </motion.div>
        </section>

        {/* Section: Eventos / Atrações em Destaque (Warm White Section) */}
        <section id="atracoes" className="relative bg-[#FFFDF9] border-b border-[#EADCCF] py-16 sm:py-24">
          <div className="checkered-ribbon-subtle h-2 w-full absolute top-0 inset-x-0" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3A2E26] tracking-tight">
                  Em funcionamento agora, prontas para você.
                </h2>
              </div>

              <button
                onClick={onNavigateToTickets}
                className="btn-press text-xs font-semibold text-[#7A6C60] hover:text-[#E8734A] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Ver todos os ingressos</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E8734A]" />
              </button>
            </div>

            {/* Cards Grid with enhanced warm shadows and hover */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTickets.map((ticket, idx) => {
                const formattedPrice = (ticket.priceCents / 100).toFixed(2);
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    id={`home-featured-ticket-${ticket.id}`}
                    onClick={onNavigateToTickets}
                    className="card-interactive rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] elevation-1 hover:border-[#E8734A]/50 overflow-hidden group transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo / Visual Container */}
                      <div className="relative aspect-[16/10] bg-[#FAF1E4] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 pointer-events-none" />
                        {ticket.imageUrl ? (
                          <img
                            src={ticket.imageUrl}
                            alt={ticket.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#FAF1E4] flex flex-col items-center justify-center text-[#A8988C] gap-2 group-hover:scale-105 transition-transform duration-500">
                            <Ticket className="w-8 h-8 text-[#A8988C]" />
                            <span className="text-xs font-medium text-[#7A6C60]">Ingresso Oficial</span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-5">
                        <h3 className="text-base font-bold text-[#3A2E26] group-hover:text-[#E8734A] transition-colors line-clamp-1">
                          {ticket.name}
                        </h3>
                        <p className="text-xs text-[#7A6C60] mt-2 leading-relaxed line-clamp-2">
                          {ticket.description ||
                            'Acesso completo ao complexo e suas atrações com passaporte oficial.'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Price & Link */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#F0E6DA] flex items-center justify-between text-xs">
                      <div className="text-[#7A6C60]">
                        A partir de <span className="font-bold text-[#3A2E26] font-mono">${formattedPrice}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-[#7A6C60] group-hover:text-[#E8734A] transition-colors">
                        <span>Garantir</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#E8734A]" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* Section: Como Funciona (Tinted Warm Background with Blobs) */}
        <section id="como-funciona" className="relative bg-[#F8EFE4] border-b border-[#EADCCF] py-16 sm:py-24 overflow-hidden">
          {/* Decorative soft organic blobs */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[350px] bg-[#E8734A]/08 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-10 w-[350px] h-[350px] bg-[#F2A94E]/08 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-3xl mb-12">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3A2E26] tracking-tight">
                Três passos entre você e o seu dia de diversão.
              </h2>
            </div>

            {/* 3 Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="card-interactive rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] elevation-1 p-6 relative flex flex-col justify-between hover:border-[#E8734A]/50 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-9 w-9 rounded-xl bg-[#FAF1E4] border border-[#E8734A]/30 flex items-center justify-center text-[#E8734A]">
                      <Search className="w-4 h-4 text-[#E8734A]" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#A8988C]">01</span>
                  </div>

                  <h3 className="text-base font-bold text-[#3A2E26] mb-2">
                    Escolha o seu dia & ingressos
                  </h3>
                  <p className="text-xs text-[#7A6C60] leading-relaxed">
                    Selecione a data ideal da sua visita, a quantidade de passaportes ou os pacotes de festa que melhor atendem sua família.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="card-interactive rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] elevation-1 p-6 relative flex flex-col justify-between hover:border-[#E8734A]/50 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-9 w-9 rounded-xl bg-[#FAF1E4] border border-[#E8734A]/30 flex items-center justify-center text-[#E8734A]">
                      <Lock className="w-4 h-4 text-[#E8734A]" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#A8988C]">02</span>
                  </div>

                  <h3 className="text-base font-bold text-[#3A2E26] mb-2">
                    Pagamento rápido e seguro
                  </h3>
                  <p className="text-xs text-[#7A6C60] leading-relaxed">
                    Pague com segurança via Stripe. Confirmação instantânea com criptografia bancária e sem necessidade de enfrentar filas na bilheteria.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="card-interactive rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] elevation-1 p-6 relative flex flex-col justify-between hover:border-[#E8734A]/50 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-9 w-9 rounded-xl bg-[#FAF1E4] border border-[#E8734A]/30 flex items-center justify-center text-[#E8734A]">
                      <Download className="w-4 h-4 text-[#E8734A]" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#A8988C]">03</span>
                  </div>

                  <h3 className="text-base font-bold text-[#3A2E26] mb-2">
                    Apresente o voucher e aproveite
                  </h3>
                  <p className="text-xs text-[#7A6C60] leading-relaxed">
                    Seu ingresso digital com QR Code fica disponível na hora na tela e no seu e-mail para acesso imediato aos brinquedos.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Footnotes */}
            <div className="mt-8 pt-6 border-t border-[#EADCCF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#7A6C60]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E8734A]" />
                <span>Vouchers oficiais gerados com QR Code único e validação instantânea na catraca</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#E8734A]" />
                <span>100% de segurança no processamento criptografado via Stripe</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section: Cardápio do Parque (Warm White Section) */}
        <section className="relative bg-[#FFFDF9] border-b border-[#EADCCF] py-16 sm:py-24">
          <div className="checkered-ribbon-subtle h-2 w-full absolute top-0 inset-x-0" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3A2E26] tracking-tight">
                  Cardápio Oficial do Complexo.
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6C60] mt-2 max-w-xl leading-relaxed">
                  Hambúrgueres artesanais, porções crocantes, sobremesas exclusivas e bebidas geladas para recarregar a energia entre uma atração e outra.
                </p>
              </div>

              <button
                onClick={onNavigateToMenu}
                className="btn-press text-xs font-semibold text-[#7A6C60] hover:text-[#E8734A] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Ver cardápio completo</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E8734A]" />
              </button>
            </div>

            {/* 3 Menu Cards Grid with enhanced shadows */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((item, idx) => {
                const formattedPrice = (item.priceCents / 100).toFixed(2);
                const formattedPromoPrice = item.promoPriceCents
                  ? (item.promoPriceCents / 100).toFixed(2)
                  : null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    id={`home-featured-menu-item-${item.id}`}
                    onClick={onNavigateToMenu}
                    className="card-interactive rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] elevation-1 hover:border-[#E8734A]/50 overflow-hidden group transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo / Visual Container */}
                      <div className="relative aspect-[16/10] bg-[#FAF1E4] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 pointer-events-none" />
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#FAF1E4] flex flex-col items-center justify-center text-[#A8988C] gap-2 group-hover:scale-105 transition-transform duration-500">
                            <Utensils className="w-8 h-8 text-[#A8988C]" />
                            <span className="text-xs font-medium text-[#7A6C60]">Gastronomia Oficial</span>
                          </div>
                        )}
                        {formattedPromoPrice && (
                          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-[#F2A94E] text-[#3A2E26] text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#3A2E26]" />
                            <span>Oferta</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <h3 className="text-base font-bold text-[#3A2E26] group-hover:text-[#E8734A] transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[#7A6C60] mt-2 leading-relaxed line-clamp-2">
                          {item.description ||
                            'Delicioso item artesanal preparado com ingredientes selecionados do complexo.'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Price / Action */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#F0E6DA] flex items-center justify-between text-xs">
                      <div>
                        {formattedPromoPrice ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-[#E8734A] font-mono">
                              ${formattedPromoPrice}
                            </span>
                            <span className="text-[11px] text-[#A8988C] line-through font-mono">
                              ${formattedPrice}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[#7A6C60]">
                            Por <span className="font-bold text-[#3A2E26] font-mono">${formattedPrice}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-[#7A6C60] group-hover:text-[#E8734A] transition-colors">
                        <span>Pedir</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#E8734A]" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* Section: Festas & Agendamentos do Site (Tinted Warm Background with Blobs) */}
        <section className="relative bg-[#F8EFE4] border-b border-[#EADCCF] py-16 sm:py-24 overflow-hidden">
          {/* Decorative organic blobs */}
          <div className="absolute top-10 right-10 w-[420px] h-[420px] bg-[#F2A94E]/08 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-[380px] h-[380px] bg-[#E8734A]/08 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#3A2E26] tracking-tight">
                  Comemore seu Aniversário e Eventos no Parque.
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6C60] mt-2 max-w-xl leading-relaxed">
                  Camarotes exclusivos, buffet completo, passaporte para todos os convidados e agendamento 100% online com confirmação instantânea.
                </p>
              </div>

              <button
                onClick={onNavigateToParties}
                className="btn-press text-xs font-semibold text-[#3A2E26] hover:text-[#3A2E26] bg-[#FFFDF9] hover:bg-[#FAF1E4] border border-[#EADCCF] shadow-sm hover:shadow-md px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Agendar festa online</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#E8734A]" />
              </button>
            </div>

            {/* 4 Party Feature / Booking Cards Grid with enhanced shadows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredParties.map((pkg, idx) => {
                const formattedPrice = (pkg.priceCents / 100).toFixed(2);
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    id={`home-featured-party-${pkg.id}`}
                    onClick={onNavigateToParties}
                    className="card-interactive rounded-2xl bg-[#FFFDF9] border border-[#EADCCF] elevation-1 hover:border-[#E8734A]/50 overflow-hidden flex flex-col justify-between group transition-all duration-300 cursor-pointer"
                  >
                    <div>
                      <div className="relative aspect-[4/3] bg-[#FAF1E4] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 pointer-events-none" />
                        {pkg.imageUrl ? (
                          <img
                            src={pkg.imageUrl}
                            alt={pkg.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#FAF1E4] flex flex-col items-center justify-center text-[#A8988C] gap-2 group-hover:scale-105 transition-transform duration-500">
                            <PartyPopper className="w-8 h-8 text-[#A8988C]" />
                            <span className="text-xs font-medium text-[#7A6C60]">Pacote de Festa</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-sm font-bold text-[#3A2E26] group-hover:text-[#E8734A] transition-colors line-clamp-1">
                          {pkg.name}
                        </h3>
                        <p className="text-xs text-[#7A6C60] mt-1.5 leading-relaxed line-clamp-2">
                          {pkg.description ||
                            'Salão exclusivo, buffet completo e passaporte ilimitado para todos os convidados.'}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-[#F0E6DA] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#7A6C60] font-mono">A partir de ${formattedPrice}</span>
                      <span className="text-[11px] font-bold text-[#E8734A] flex items-center gap-1">
                        Reservar <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer
        onNavigateToHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateToTickets={onNavigateToTickets}
        onNavigateToParties={onNavigateToParties}
        onNavigateToMenu={onNavigateToMenu}
        initialContactInfo={contactInfo}
      />
    </div>
  );
}

