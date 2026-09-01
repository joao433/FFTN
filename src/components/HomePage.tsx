import React from 'react';
import {
  Flame,
  Ticket,
  Sparkles,
  Utensils,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  PartyPopper,
  Compass,
  Star,
  Users,
  CheckCircle2,
} from 'lucide-react';
import Footer from './Footer.tsx';

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
  return (
    <div className="min-h-screen bg-[#050507] text-neutral-100 font-sans selection:bg-red-600 selection:text-white flex flex-col justify-between relative">
      {/* Background Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-red-600/20 via-red-950/10 to-transparent blur-[160px] rounded-full" />
        <div className="absolute top-1/3 -right-48 w-[600px] h-[600px] bg-red-900/10 blur-[180px] rounded-full" />
        <div className="absolute top-2/3 -left-48 w-[600px] h-[600px] bg-red-950/15 blur-[180px] rounded-full" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-neutral-900/80 bg-[#050507]/85 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-950/60 border border-red-400/30 flex-shrink-0">
              <Flame className="w-5 h-5 fill-white drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight uppercase text-white">
                  Parque Aventura
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-wider">
                  Oficial
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
              <span>
                Aberto hoje: <strong className="text-neutral-200">10h às 22h</strong>
              </span>
            </div>

            <button
              onClick={onNavigateToTickets}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-950/50"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Ingressos</span>
            </button>

            <button
              onClick={onNavigateToParties}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Festas</span>
            </button>

            <button
              onClick={onNavigateToMenu}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              <Utensils className="w-3.5 h-3.5 text-red-500" />
              <span>Cardápio</span>
            </button>

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

      {/* Main Showcase Content */}
      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest mb-6 shadow-lg shadow-red-950/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            O Maior Parque de Lazer e Adrenalina
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.95] drop-shadow-2xl">
            FUN IS OUR{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-orange-500 underline decoration-red-500/40 decoration-wavy underline-offset-8">
              MIDDLE NAME
            </span>
          </h1>

          <p className="mt-6 sm:mt-8 text-neutral-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
            Prepare-se para viver momentos extraordinários. Montanhas-russas de tirar o fôlego, atrações para todas as idades, gastronomia deliciosa e festas inesquecíveis.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onNavigateToTickets}
              className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 active:scale-[0.98] text-white text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-red-600/30 hover:shadow-red-600/50 flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Comprar Ingressos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onNavigateToMenu}
              className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-sm font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-neutral-900 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-red-500" />
              <span>Ver Cardápio</span>
            </button>
          </div>
        </section>

        {/* Highlights Strip */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-md shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-black text-white block uppercase tracking-tight">
                  Aberto Todos os Dias
                </strong>
                <span className="text-xs text-neutral-400">Das 10h às 22h sem intervalo</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-black text-white block uppercase tracking-tight">
                  Entrada Sem Fila
                </strong>
                <span className="text-xs text-neutral-400">Voucher digital direto no celular</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-black text-white block uppercase tracking-tight">
                  100% Seguro
                </strong>
                <span className="text-xs text-neutral-400">Checkout criptografado via Stripe</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-black text-white block uppercase tracking-tight">
                  Para Toda a Família
                </strong>
                <span className="text-xs text-neutral-400">Áreas kids e brinquedos radicais</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Nossas Atrações */}
        {/* <!-- CONTEÚDO PROVISÓRIO DAS ATRAÇÕES - SUBSTITUA PELOS NOMES E DADOS REAIS DAS ATRAÇÕES --> */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              Experiência Completa
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              Nossas Atrações em Destaque
            </h2>
            <p className="mt-3 text-neutral-400 text-sm sm:text-base leading-relaxed">
              Descubra um mundo de emoção projetado para proporcionar frio na barriga, risadas e memórias marcantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card Atração 1 */}
            <div className="rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-6 flex flex-col justify-between hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                    Radical
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">5.0</span>
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors mb-2">
                  Hyper Coaster 360
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Nossa montanha-russa principal com loops verticais, descidas em alta velocidade e aceleração instantânea.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Altura mínima: 1,40m</span>
                <span className="text-red-400 font-bold">Adrenalina Máxima</span>
              </div>
            </div>

            {/* Card Atração 2 */}
            <div className="rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-6 flex flex-col justify-between hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                    Aquático & Aventura
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">4.9</span>
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors mb-2">
                  Splash Rapids
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Embarcações em corredeiras velozes com quedas d'água refrescantes para toda a turma se divertir junta.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Altura mínima: 1,10m</span>
                <span className="text-blue-400 font-bold">Diversão em Grupo</span>
              </div>
            </div>

            {/* Card Atração 3 */}
            <div className="rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-6 flex flex-col justify-between hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                    Família & Kids
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">4.8</span>
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors mb-2">
                  Vila dos Pequenos
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Área temática interativa 100% monitorada, com carrosséis clássicos, mini-rodas e circuito de obstáculos seguros.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Livre para todas idades</span>
                <span className="text-emerald-400 font-bold">100% Monitorado</span>
              </div>
            </div>

            {/* Card Atração 4 */}
            <div className="rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-6 flex flex-col justify-between hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider">
                    Panorama VIP
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">4.9</span>
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors mb-2">
                  Roda Gigante Celestial
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Cabines climatizadas com vista panorâmica de 360° de todo o complexo e show de iluminação noturno exclusivo.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Vista Panorâmica</span>
                <span className="text-purple-400 font-bold">Cabines Climatizadas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Festas & Eventos Banner */}
        {/* <!-- CONTEÚDO DA SEÇÃO DE FESTAS - VINCULADA AO COMPONENTE DE FESTAS --> */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-red-950/40 border border-neutral-800 p-8 sm:p-12 lg:p-14 shadow-2xl">
            {/* Top decorative badge */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <PartyPopper className="w-3.5 h-3.5" />
                  Comemorações Inesquecíveis
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                  Comemore Seu Aniversário no Parque
                </h2>

                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                  Pacotes completos com camarote privativo, buffet temático, ingressos inclusos para todos os seus convidados e equipe exclusiva de entretenimento.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Camarote VIP exclusivo por 4 horas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Buffet livre de lanches & bebidas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Passaportes para todas as atrações</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Monitores e recreação dedicada</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
                <button
                  onClick={onNavigateToParties}
                  className="py-4 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Ver Pacotes de Festa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <span className="text-[11px] text-center text-neutral-400 font-medium">
                  Datas limitadas por fim de semana
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Cardápio & Gastronomia */}
        {/* <!-- CONTEÚDO DA SEÇÃO DO CARDÁPIO - VINCULADA AO COMPONENTE DO CARDÁPIO --> */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-24">
          <div className="rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-8 sm:p-12 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider">
                  <Utensils className="w-3.5 h-3.5" />
                  Praça Gastronômica
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                  Gastronomia para Recarregar as Energias
                </h2>

                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                  Burgers artesanais suculentos, pizzas crocantes, porções de batata com cheddar & bacon, churros quentinhos, sucos naturais e combos infantis.
                </p>

                <p className="text-xs text-neutral-400">
                  Faça seu pedido online com antecedência ou direto pelo celular enquanto aproveita os brinquedos!
                </p>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  onClick={onNavigateToMenu}
                  className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-orange-950/50 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Ver Cardápio Completo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
