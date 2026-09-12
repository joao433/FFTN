import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import {
  useAdminLanguage,
  ADMIN_LANGUAGE_OPTIONS,
  AdminLanguage,
} from '../../lib/adminI18n.tsx';

interface AdminLanguageSelectorProps {
  align?: 'left' | 'right';
  className?: string;
}

export default function AdminLanguageSelector({
  align = 'right',
  className = '',
}: AdminLanguageSelectorProps) {
  const { language, setLanguage, t } = useAdminLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    ADMIN_LANGUAGE_OPTIONS.find((opt) => opt.code === language) ||
    ADMIN_LANGUAGE_OPTIONS[0];

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

  const handleSelect = (code: AdminLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id="admin-language-selector-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t('admin.header.language', 'Idioma do Painel')}
        className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#090909] border border-[#090909]/15 font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
      >
        <Globe className="w-3.5 h-3.5 text-[#134FA0]" />
        <span className="text-sm leading-none" role="img" aria-label={currentOption.label}>
          {currentOption.flag}
        </span>
        <span className="uppercase font-mono font-extrabold text-[11px] text-[#090909]">
          {currentOption.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#FD4912]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="admin-language-dropdown-menu"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-150`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#FD4912]" />
            <span>{t('admin.header.language', 'Idioma do Painel')}</span>
          </div>

          <div className="p-1 space-y-0.5">
            {ADMIN_LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.code === language;
              return (
                <button
                  key={option.code}
                  id={`admin-lang-option-${option.code}`}
                  onClick={() => handleSelect(option.code)}
                  role="menuitem"
                  data-selected={isSelected ? 'true' : 'false'}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 text-[#FD4912] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base" role="img" aria-label={option.label}>
                      {option.flag}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="leading-tight text-xs font-semibold">
                        {option.nativeLabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#FD4912] stroke-[2.5]" />
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
