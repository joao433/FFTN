import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, MessageSquare } from 'lucide-react';

interface CancelViewProps {
  onNavigateHome: () => void;
}

export default function CancelView({ onNavigateHome }: CancelViewProps) {
  return (
    <div className="min-h-screen bg-[#07080b] text-neutral-100 flex flex-col justify-between selection:bg-[#89CFF0] selection:text-black">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-white/[0.02] blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-md px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#89CFF0]" />
            Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs font-mono text-amber-400 tracking-wider font-bold">CHECKOUT CANCELADO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#0f1015] border border-white/[0.08] rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Top icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-lg">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-neutral-400 text-xs font-bold uppercase tracking-wider mb-3">
              Transação Não Concluída
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Pagamento Cancelado
            </h1>
            <p className="text-neutral-300 mt-2 text-sm leading-relaxed">
              O processo de checkout na Stripe foi cancelado ou expirou. Nenhum valor foi cobrado do seu cartão.
            </p>
          </div>

          {/* Help box */}
          <div className="bg-black/50 border border-white/[0.08] rounded-xl p-5 mb-8 text-xs text-neutral-400 space-y-3">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-[#89CFF0] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-200 block mb-0.5">Precisa de ajuda com o pagamento?</strong>
                Você pode tentar novamente usando outro cartão de crédito ou falar com nosso suporte ao visitante.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateHome}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#89CFF0]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <a
              href="mailto:suporte@familyfuntown.com"
              className="py-3.5 px-5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center border border-white/[0.08]"
            >
              <MessageSquare className="w-4 h-4" />
              Suporte
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-neutral-500">
        <p>© 2026 Family Fun Town. FUN IS OUR MIDDLE NAME.</p>
      </footer>
    </div>
  );
}
