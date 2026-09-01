import React, { useEffect, useState } from 'react';
import { CheckCircle2, Ticket, Calendar, ShieldCheck, ArrowLeft, Sparkles, Download, Mail } from 'lucide-react';

interface SuccessViewProps {
  onNavigateHome: () => void;
}

export default function SuccessView({ onNavigateHome }: SuccessViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<string>('ticket');

  useEffect(() => {
    // Check if session_id and type are in query params
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    const type = params.get('type') || 'ticket';
    if (sid) {
      setSessionId(sid);
    }
    if (type) {
      setOrderType(type);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#07080b] text-neutral-100 flex flex-col justify-between selection:bg-[#89CFF0] selection:text-black">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#89CFF0]/[0.03] blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-md px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#89CFF0]" />
            Voltar ao Parque
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#89CFF0] animate-pulse" />
            <span className="text-xs font-mono text-[#89CFF0] tracking-wider font-bold">PAGAMENTO CONFIRMADO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-[#0f1015] border border-white/[0.08] rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Top accent badge */}
          <div className="w-16 h-16 mx-auto rounded-full bg-[#89CFF0]/10 border-2 border-[#89CFF0]/30 flex items-center justify-center text-[#89CFF0] mb-6 shadow-lg shadow-black/50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#89CFF0]/10 border border-[#89CFF0]/20 text-[#89CFF0] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Diversão Garantida
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              {orderType === 'party'
                ? 'Festa Agendada com Sucesso!'
                : orderType === 'menu'
                ? 'Pedido do Cardápio Confirmado!'
                : 'Pagamento Confirmado!'}
            </h1>
            <p className="text-neutral-300 mt-2 text-sm sm:text-base leading-relaxed">
              {orderType === 'party'
                ? 'Sua reserva de festa foi registrada e confirmada com sucesso.'
                : orderType === 'menu'
                ? 'Seu pedido de lanches/bebidas foi recebido e já está em preparação.'
                : 'Seu ingresso foi registrado com sucesso em nosso sistema.'}
            </p>
          </div>

          {/* Ticket/Order voucher card */}
          <div className="bg-black/50 border border-white/[0.08] rounded-xl p-5 mb-8 relative">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="px-2.5 py-1 bg-[#89CFF0] text-black text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
                {orderType === 'party' ? 'Reserva Ativa' : orderType === 'menu' ? 'Pedido Pago' : 'Ingresso Válido'}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[#89CFF0]">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {orderType === 'party'
                    ? 'Check-in com a Equipe de Eventos'
                    : orderType === 'menu'
                    ? 'Retirada no Balcão de Alimentação'
                    : 'Check-in na Catraca do Parque'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {orderType === 'menu'
                    ? 'Apresente seu nome e e-mail no balcão central de alimentação do parque para retirar seus itens quentes e bebidas.'
                    : 'Ao chegar no parque, basta informar o seu E-mail ou Telefone cadastrado na entrada principal para liberação imediata.'}
                </p>
              </div>
            </div>

            {sessionId && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>ID da Sessão:</span>
                <span className="text-[#89CFF0] truncate max-w-[200px]" title={sessionId}>
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
              <ShieldCheck className="w-4 h-4 text-[#89CFF0] flex-shrink-0" />
              <span>Processamento 100% seguro via Stripe com conciliação automática.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateHome}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#89CFF0] hover:bg-[#70BAE0] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#89CFF0]/20 text-center cursor-pointer"
            >
              Comprar Outro Ingresso
            </button>
            <button
              onClick={() => window.print()}
              className="py-3.5 px-5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-white/[0.08] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Salvar Comprovante
            </button>
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
