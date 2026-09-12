import React, { createContext, useContext, useEffect } from 'react';
import type { SiteTheme } from '../types/database.ts';

export interface ThemePreset {
  id: SiteTheme;
  name: string;
  badge?: string;
  description: string;
  colors: {
    primary: string; // Ações / CTAs
    support: string; // Apoio / Confiança
    accent: string;  // Energia / Destaque pontual (Promoção/Oferta)
    bg: string;      // Fundo principal
    surface: string; // Cards
    text: string;    // Texto principal
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'oficial',
    name: 'Identidade Oficial',
    badge: 'Oficial / 4 Cores',
    description:
      'Paleta simplificada de 4 cores: cabeçalho e rodapé em azul moldura com texto e logo em branco, fundo do conteúdo em branco, botões de ação (CTAs) em vermelho vibrante do logo e texto em preto legível. Sem laranja ou dourado.',
    colors: {
      primary: '#E4141B',
      support: '#134FA0',
      accent: '#1D6FE0',
      bg: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#141414',
    },
  },
];

interface ThemeContextType {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  preset: ThemePreset;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'oficial',
  setTheme: () => {},
  preset: THEME_PRESETS[0],
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // O tema da aplicação é fixo e exclusivo: "Identidade Oficial"
  const theme: SiteTheme = 'oficial';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'oficial');
      document.body.dataset.theme = 'oficial';
      try {
        localStorage.setItem('app_active_theme', 'oficial');
      } catch {
        // Ignora quota de localStorage
      }
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {}, preset: THEME_PRESETS[0] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

