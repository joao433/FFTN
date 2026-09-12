import React from 'react';
import { Check, Ticket, UserCheck, QrCode } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CheckoutProgressBarProps {
  currentStep: number; // 1, 2, or 3
  step1Label?: string;
  step2Label?: string;
  step3Label?: string;
  className?: string;
}

export default function CheckoutProgressBar({
  currentStep,
  step1Label = 'Escolha do Pacote',
  step2Label = 'Dados & Pagamento',
  step3Label = 'Voucher Liberado',
  className = '',
}: CheckoutProgressBarProps) {
  const steps: Step[] = [
    {
      id: 1,
      label: step1Label,
      sublabel: 'Passo 1',
      icon: Ticket,
    },
    {
      id: 2,
      label: step2Label,
      sublabel: 'Passo 2',
      icon: UserCheck,
    },
    {
      id: 3,
      label: step3Label,
      sublabel: 'Passo 3',
      icon: QrCode,
    },
  ];

  return (
    <div className={`w-full max-w-2xl mx-auto px-4 py-3 mb-6 sm:mb-8 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Connecting track line */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#EADCCF] -z-0">
          <div
            className="h-full bg-[#E4141B] transition-all duration-500 ease-out"
            style={{
              width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 font-black text-xs sm:text-sm border-2 ${
                  isCompleted
                    ? 'bg-[#10B981] border-[#10B981] text-white shadow-md shadow-emerald-500/20'
                    : isActive
                    ? 'bg-[#E4141B] border-[#E4141B] text-white ring-4 ring-[#E4141B]/20 shadow-md shadow-red-500/25 scale-110'
                    : 'bg-white border-[#EADCCF] text-[#7A6C60]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              <div className="mt-2 text-center">
                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider block transition-colors ${
                    isActive
                      ? 'text-[#E4141B]'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-[#7A6C60]'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[9px] text-[#7A6C60]/70 font-mono hidden sm:block">
                  {step.sublabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
