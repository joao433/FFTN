import React, { useEffect, useState } from 'react';
import { CheckCircle2, Ticket, Calendar, ShieldCheck, ArrowLeft, Sparkles, Download, Mail } from 'lucide-react';
import ParkLogo from './ParkLogo.tsx';

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
    <div className="min-h-screen bg-[#FDF6ED] text-[#3A2E26] flex flex-col justify-between selection:bg-[#E8734A] selection:text-white">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#E8734A]/[0.04] blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#EADCC9] bg-[#FDF6ED]/95 backdrop-blur-md px-4 py-3 sm:py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#7A6C60] hover:text-[#3A2E26] font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E8734A]" />
            <span className="hidden sm:inline">Voltar ao Parque</span>
            <span className="sm:hidden">Voltar</span>
          </button>
          <div onClick={onNavigateHome} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <ParkLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E8734A] animate-pulse" />
            <span className="text-xs font-mono text-[#E8734A] tracking-wider font-bold hidden sm:inline">PAGAMENTO CONFIRMADO</span>
            <span className="text-xs font-mono text-[#E8734A] tracking-wider font-bold sm:hidden">CONFIRMADO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-[#EADCC9] rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden backdrop-blur-sm">
          {/* Top accent badge */}
          <div className="w-16 h-16 mx-auto rounded-full bg-[#E8734A]/10 border-2 border-[#E8734A]/30 flex items-center justify-center text-[#E8734A] mb-6 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8734A]/10 border border-[#E8734A]/20 text-[#E8734A] text-xs font-bold uppercase tracking-wider mb-3 font-fredoka">
              <Sparkles className="w-3.5 h-3.5" />
              Diversão Garantida
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#3A2E26] font-fredoka">
              {orderType === 'party'
                ? 'Festa Agendada com Sucesso!'
                : orderType === 'menu'
                ? 'Pedido do Cardápio Confirmado!'
                : 'Pagamento Confirmado!'}
            </h1>
            <p className="text-[#7A6C60] mt-2 text-sm sm:text-base leading-relaxed">
              {orderType === 'party'
                ? 'Sua reserva de festa foi registrada e confirmada com sucesso.'
                : orderType === 'menu'
                ? 'Seu pedido de lanches/bebidas foi recebido e já está em preparação.'
                : 'Seu ingresso foi registrado com sucesso em nosso sistema.'}
            </p>
          </div>

          {/* Ticket/Order voucher card */}
          <div className="bg-[#FAF0E1] border border-[#EADCC9] rounded-xl p-5 mb-8 relative">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="px-2.5 py-1 bg-[#E8734A] text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-md font-fredoka">
                {orderType === 'party' ? 'Reserva Ativa' : orderType === 'menu' ? 'Pedido Pago' : 'Ingresso Válido'}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white border border-[#EADCC9] text-[#E8734A] shadow-sm">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#3A2E26] uppercase tracking-wider font-fredoka">
                  {orderType === 'party'
                    ? 'Check-in com a Equipe de Eventos'
                    : orderType === 'menu'
                    ? 'Retirada no Balcão de Alimentação'
                    : 'Check-in na Catraca do Parque'}
                </h3>
                <p className="text-xs text-[#7A6C60] mt-1 leading-relaxed">
                  {orderType === 'menu'
                    ? 'Apresente seu nome e e-mail no balcão central de alimentação do parque para retirar seus itens quentes e bebidas.'
                    : 'Ao chegar no parque, basta informar o seu E-mail ou Telefone cadastrado na entrada principal para liberação imediata.'}
                </p>
              </div>
            </div>

            {sessionId && (
              <div className="mt-4 pt-4 border-t border-[#EADCC9] flex items-center justify-between text-xs text-[#7A6C60] font-mono">
                <span>ID da Sessão:</span>
                <span className="text-[#E8734A] truncate max-w-[200px]" title={sessionId}>
                  {sessionId}
                </span>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="space-y-3 mb-8 text-xs text-[#7A6C60]">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#A89A8D] flex-shrink-0" />
              <span>Um e-mail de confirmação com os detalhes da compra foi enviado.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#A89A8D] flex-shrink-0" />
              <span>Seu ingresso é válido para a data selecionada durante o horário normal de funcionamento.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#E8734A] flex-shrink-0" />
              <span>Processamento 100% seguro via Stripe com conciliação automática.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateHome}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#E8734A] hover:bg-[#D26038] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#E8734A]/20 text-center cursor-pointer font-fredoka"
            >
              Comprar Outro Ingresso
            </button>
            <button
              onClick={() => window.print()}
              className="py-3.5 px-5 rounded-full bg-[#FAF0E1] hover:bg-[#F3E5D0] text-[#5A493D] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-[#EADCC9] cursor-pointer font-fredoka"
            >
              <Download className="w-4 h-4" />
              Salvar Comprovante
            </button>
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
