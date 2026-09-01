import React from 'react';
import { Flame, Ticket, Sparkles, Utensils, ShieldCheck, MapPin, Phone, Mail, Clock, Heart } from 'lucide-react';

interface FooterProps {
  onNavigateToHome?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToParties?: () => void;
  onNavigateToMenu?: () => void;
}

export default function Footer({
  onNavigateToHome,
  onNavigateToTickets,
  onNavigateToParties,
  onNavigateToMenu,
}: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-neutral-900 bg-[#040406] text-neutral-400 text-sm mt-16">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4">
            <div 
              onClick={onNavigateToHome}
              className="flex items-center gap-3 cursor-pointer group inline-flex"
            >
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-red-950/60 border border-red-400/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight uppercase text-white block group-hover:text-red-400 transition-colors">
                  Parque Aventura
                </span>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold">
                  Fun Is Our Middle Name
                </p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              O destino definitivo para quem busca adrenalina, momentos inesquecíveis em família e as atrações mais radicais da região.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Stripe Verified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                10h às 22h
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs">
              {onNavigateToHome && (
                <li>
                  <button
                    onClick={onNavigateToHome}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Início (Home)</span>
                  </button>
                </li>
              )}
              {onNavigateToTickets && (
                <li>
                  <button
                    onClick={onNavigateToTickets}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5 text-red-500" />
                    <span>Ingressos & Passes VIP</span>
                  </button>
                </li>
              )}
              {onNavigateToParties && (
                <li>
                  <button
                    onClick={onNavigateToParties}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Festas & Aniversários</span>
                  </button>
                </li>
              )}
              {onNavigateToMenu && (
                <li>
                  <button
                    onClick={onNavigateToMenu}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Utensils className="w-3.5 h-3.5 text-orange-400" />
                    <span>Cardápio & Lanches</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Horários & Visitação */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Horários do Parque
            </h4>
            {/* <!-- TEXTOS PROVISÓRIOS / PLACEHOLDER - AJUSTE CONFORME OS HORÁRIOS REAIS --> */}
            <div className="space-y-2 text-xs text-neutral-400">
              <div className="flex items-start justify-between border-b border-neutral-900 pb-1.5">
                <span>Segunda a Sexta:</span>
                <span className="font-semibold text-neutral-200">11h às 21h</span>
              </div>
              <div className="flex items-start justify-between border-b border-neutral-900 pb-1.5">
                <span>Sábados e Domingos:</span>
                <span className="font-semibold text-neutral-200">10h às 22h</span>
              </div>
              <div className="flex items-start justify-between">
                <span>Feriados Nacionais:</span>
                <span className="font-semibold text-neutral-200">10h às 23h</span>
              </div>
              <p className="text-[11px] text-neutral-400 pt-1">
                * Bilheteria encerra 1 hora antes do fechamento das atrações.
              </p>
            </div>
          </div>

          {/* Column 4: Contato & Localização */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Atendimento & Localização
            </h4>
            {/* <!-- DADOS DE CONTATO PROVISÓRIOS / PLACEHOLDER - SUBSTITUA PELOS REAIS --> */}
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>
                  Av. das Atrações, 1500 — Complexo de Lazer e Entretenimento
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>(11) 98765-4321 / (11) 4004-1234</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>contato@parqueaventura.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-900/90 bg-black/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span>© 2026 Parque Aventura. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <span>Criado com</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>para proporcionar a melhor experiência de diversão.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
