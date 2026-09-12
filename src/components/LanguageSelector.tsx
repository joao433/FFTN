import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS, Language } from '../lib/i18n.tsx';

interface LanguageSelectorProps {
  align?: 'left' | 'right';
  className?: string;
  variant?: 'solid' | 'outline' | 'pill';
}

export default function LanguageSelector({
  align = 'right',
  className = '',
  variant = 'pill',
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Selecionar idioma / Select language"
        className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-full bg-[#FFFDF9] hover:bg-[#FAF1E4] text-[#3A2E26] border border-[#EADCCF] font-bold tracking-tight transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-95"
      >
        <span className="text-sm leading-none" role="img" aria-label={currentOption.label}>
          {currentOption.flag}
        </span>
        <span className="uppercase font-extrabold text-[11px] text-[#3A2E26]">
          {currentOption.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A6C60] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#E8734A]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="language-dropdown-menu"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-150`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="lang-dropdown-header px-3.5 py-2 border-b border-slate-100 flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#E4141B]" />
            <span>Idioma / Language</span>
          </div>

          <div className="p-1 space-y-0.5">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.code === language;
              return (
                <button
                  key={option.code}
                  id={`lang-option-${option.code}`}
                  onClick={() => handleSelect(option.code)}
                  role="menuitem"
                  data-selected={isSelected ? 'true' : 'false'}
                  className={`lang-option-btn w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50 text-[#E4141B] font-bold'
                      : 'text-slate-800 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{option.flag}</span>
                    <div className="text-left">
                      <div className={`lang-native-label font-semibold ${isSelected ? 'text-[#E4141B]' : 'text-slate-900'}`}>
                        {option.nativeLabel}
                      </div>
                      <div className={`lang-label text-[10px] ${isSelected ? 'text-[#E4141B]/80' : 'text-slate-500'}`}>
                        {option.label}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#E4141B] stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
