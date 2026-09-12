import React from 'react';
import {
  Trophy,
  PartyPopper,
  Utensils,
  Ticket,
  Flag,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ThematicPlaceholderProps {
  type?: 'kart' | 'party' | 'snack' | 'ticket' | 'general';
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThematicPlaceholder({
  type = 'general',
  label,
  className = '',
  size = 'md',
}: ThematicPlaceholderProps) {
  const getDetails = () => {
    switch (type) {
      case 'kart':
        return {
          icon: Flag,
          defaultLabel: 'Speed Park Kart',
          bgColor: 'from-blue-900/10 via-red-600/10 to-transparent',
          accentColor: '#134FA0',
          badgeText: 'KART RACING',
        };
      case 'party':
        return {
          icon: PartyPopper,
          defaultLabel: 'Salão de Festas',
          bgColor: 'from-amber-500/10 via-orange-500/10 to-transparent',
          accentColor: '#E8734A',
          badgeText: 'ANIVERSÁRIO VIP',
        };
      case 'snack':
        return {
          icon: Utensils,
          defaultLabel: 'Pit Stop Lanches',
          bgColor: 'from-orange-500/10 via-red-500/10 to-transparent',
          accentColor: '#FD4912',
          badgeText: 'PIT STOP FOOD',
        };
      case 'ticket':
        return {
          icon: Ticket,
          defaultLabel: 'Passaporte Speed Park',
          bgColor: 'from-blue-600/10 via-emerald-500/10 to-transparent',
          accentColor: '#134FA0',
          badgeText: 'PASSAPORTE',
        };
      default:
        return {
          icon: Trophy,
          defaultLabel: 'Speed Park',
          bgColor: 'from-blue-900/10 via-slate-500/10 to-transparent',
          accentColor: '#134FA0',
          badgeText: 'SPEED PARK',
        };
    }
  };

  const details = getDetails();
  const Icon = details.icon;

  const sizeClasses = {
    sm: 'p-2.5 text-xs',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-br ${details.bgColor} bg-[#FAF1E4]/60 border border-[#EADCCF]/70 ${sizeClasses[size]} ${className}`}
    >
      {/* Top subtle checkered ribbon */}
      <div className="checkered-ribbon-subtle absolute top-0 inset-x-0" />

      {/* Decorative racing background lines */}
      <div className="absolute inset-0 opacity-15 pointer-events-none [background-image:radial-gradient(#134FA0_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Center Icon Badge */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="p-3 rounded-2xl bg-white/90 shadow-sm border border-black/5 flex items-center justify-center">
          <Icon className={`${iconSizes[size]} text-[${details.accentColor}]`} style={{ color: details.accentColor }} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#141414]/70 px-2 py-0.5 rounded-md bg-white/80 border border-black/5 font-mono">
          {details.badgeText}
        </span>
        {label && (
          <span className="text-xs font-bold text-[#141414]/80 max-w-[90%] truncate">
            {label || details.defaultLabel}
          </span>
        )}
      </div>

      {/* Bottom racing track divider line */}
      <div className="racing-stripes-accent absolute bottom-0 inset-x-0 opacity-75" />
    </div>
  );
}
