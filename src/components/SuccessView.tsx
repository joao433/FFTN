import React, { useEffect, useState } from 'react';
import { CheckCircle2, Ticket, Calendar, ShieldCheck, ArrowLeft, Sparkles, Download, Mail } from 'lucide-react';

interface SuccessViewProps {
  onNavigateHome: () => void;
}

export default function SuccessView({ onNavigateHome }: SuccessViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if session_id is in query params
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) {
      setSessionId(sid);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* Decorative carnival light glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            Voltar ao Parque
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 tracking-wider">PAGAMENTO CONFIRMADO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Top accent badge */}
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Diversão Garantida
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Pagamento Confirmado!
            </h1>
            <p className="text-neutral-300 mt-2 text-sm sm:text-base leading-relaxed">
              Seu ingresso foi registrado com sucesso em nosso sistema.
            </p>
          </div>

          {/* Ticket voucher card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-8 relative">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
                Ingresso Válido
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-red-500">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Check-in na Catraca do Parque
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Ao chegar no parque, basta informar o seu <strong className="text-neutral-200">E-mail</strong> ou <strong className="text-neutral-200">Telefone cadastrado</strong> na entrada principal para liberação imediata.
                </p>
              </div>
            </div>

            {sessionId && (
              <div className="mt-4 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>ID da Sessão:</span>
                <span className="text-neutral-300 truncate max-w-[200px]" title={sessionId}>
                  {sessionId}
                </span>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="space-y-3 mb-8 text-xs text-neutral-400">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <span>Um e-mail de confirmação com os detalhes da compra foi enviado.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <span>Seu ingresso é válido para a data selecionada durante o horário normal de funcionamento.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <span>Processamento 100% seguro via Stripe com conciliação automática.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateHome}
              className="flex-1 py-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-950/40 text-center"
            >
              Comprar Outro Ingresso
            </button>
            <button
              onClick={() => window.print()}
              className="py-3 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Salvar Comprovante
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800/60 py-6 text-center text-xs text-neutral-500">
        <p>© 2026 Parque de Diversões. FUN IS OUR MIDDLE NAME.</p>
      </footer>
    </div>
  );
}
