import React from 'react';
import { Ticket, Sparkles, Utensils, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';

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
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#07080b] text-neutral-400 text-xs">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand & Identity */}
          <div className="md:col-span-5 space-y-4">
            <div 
              onClick={onNavigateToHome}
              className="cursor-pointer group inline-flex items-center gap-2.5"
            >
              <div className="h-6 w-6 rounded-md bg-[#89CFF0] flex items-center justify-center text-black font-black text-xs">
                <Ticket className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#89CFF0] transition-colors">
                Family Fun Town
              </span>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              O maior complexo de diversões, atrações radicais, área kids e gastronomia para toda a família. Vouchers digitais instantâneos e checkout 100% seguro.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#89CFF0]" />
              <span>PAGAMENTO SEGURO VIA STRIPE</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-300">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs">
              {onNavigateToHome && (
                <li>
                  <button
                    onClick={onNavigateToHome}
                    className="hover:text-white transition-colors cursor-pointer text-neutral-400"
                  >
                    Início
                  </button>
                </li>
              )}
              {onNavigateToTickets && (
                <li>
                  <button
                    onClick={onNavigateToTickets}
                    className="hover:text-white transition-colors cursor-pointer text-neutral-400"
                  >
                    Ingressos & Passaportes
                  </button>
                </li>
              )}
              {onNavigateToParties && (
                <li>
                  <button
                    onClick={onNavigateToParties}
                    className="hover:text-white transition-colors cursor-pointer text-neutral-400"
                  >
                    Festas & Aniversários
                  </button>
                </li>
              )}
              {onNavigateToMenu && (
                <li>
                  <button
                    onClick={onNavigateToMenu}
                    className="hover:text-white transition-colors cursor-pointer text-neutral-400"
                  >
                    Cardápio & Praça
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Contato & Localização */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-300">
              Atendimento & Localização
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
                <span>
                  Av. das Atrações, 1500 — Complexo de Lazer
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                <span>(11) 98765-4321 / (11) 4004-1234</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                <span>contato@familyfuntown.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06] bg-black/40 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <div>
            © 2026 Family Fun Town. Todos os direitos reservados.
          </div>

          <div className="flex items-center gap-1 text-neutral-400 font-medium">
            <span>Seu Jogo. Seu Momento. Sua Diversão.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
