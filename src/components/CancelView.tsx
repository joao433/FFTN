import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, MessageSquare } from 'lucide-react';
import ParkLogo from './ParkLogo.tsx';

interface CancelViewProps {
  onNavigateHome: () => void;
}

export default function CancelView({ onNavigateHome }: CancelViewProps) {
  return (
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] flex flex-col justify-between selection:bg-[#E8734A] selection:text-white">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#F2A94E]/[0.06] blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#EADCC9] bg-[#FDF6ED]/95 backdrop-blur-md px-4 py-3 sm:py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#7A6C60] hover:text-[#3A2E26] font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E8734A]" />
            <span className="hidden sm:inline">Voltar ao Início</span>
            <span className="sm:hidden">Voltar</span>
          </button>
          <div onClick={onNavigateHome} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <ParkLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs font-mono text-amber-700 tracking-wider font-bold hidden sm:inline">CHECKOUT CANCELADO</span>
            <span className="text-xs font-mono text-amber-700 tracking-wider font-bold sm:hidden">CANCELADO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-[#EADCC9] rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden backdrop-blur-sm">
          {/* Top icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-md">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FAF0E1] border border-[#EADCC9] text-[#7A6C60] text-xs font-bold uppercase tracking-wider mb-3 font-fredoka">
              Transação Não Concluída
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#3A2E26] font-fredoka">
              Pagamento Cancelado
            </h1>
            <p className="text-[#7A6C60] mt-2 text-sm leading-relaxed">
              O processo de checkout na Stripe foi cancelado ou expirou. Nenhum valor foi cobrado do seu cartão.
            </p>
          </div>

          {/* Help box */}
          <div className="bg-[#FAF0E1] border border-[#EADCC9] rounded-xl p-5 mb-8 text-xs text-[#7A6C60] space-y-3">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-[#E8734A] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#3A2E26] block mb-0.5 font-fredoka">Precisa de ajuda com o pagamento?</strong>
                Você pode tentar novamente usando outro cartão de crédito ou falar com nosso suporte ao visitante.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateHome}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#E8734A] hover:bg-[#D26038] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#E8734A]/20 flex items-center justify-center gap-2 cursor-pointer font-fredoka"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <a
              href="mailto:suporte@familyfuntown.com"
              className="py-3.5 px-5 rounded-full bg-[#FAF0E1] hover:bg-[#F3E5D0] text-[#5A493D] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center border border-[#EADCC9] font-fredoka"
            >
              <MessageSquare className="w-4 h-4" />
              Suporte
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#EADCC9] py-6 text-center text-xs text-[#7A6C60]">
        <p>© 2026 Family Fun Town. FUN IS OUR MIDDLE NAME.</p>
      </footer>
    </div>
  );
}
