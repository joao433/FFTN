import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en' | 'es';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'pt', label: 'Português', nativeLabel: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en', label: 'Inglês', nativeLabel: 'English (US)', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', nativeLabel: 'Español (ES)', flag: '🇪🇸' },
];

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  pt: {
    // Header & Navegação
    'header.home': 'Início',
    'header.tickets': 'Ingressos',
    'header.parties': 'Festas & Aniversários',
    'header.menu': 'Cardápio',
    'header.select_language': 'Selecionar idioma',
    'header.get_tickets': 'Garantir Ingressos',

    // Hero Section
    'hero.headline_part1': 'Seu Jogo.',
    'hero.headline_part2': 'Seu Momento.',
    'hero.headline_part3': 'Sua Diversão.',
    'hero.subtitle':
      'O maior complexo de entretenimento e atrações radicais da região. Viva momentos extraordinários, garanta seus passaportes online e comemore momentos inesquecíveis.',
    'hero.cta_tickets': 'Garantir Ingressos',
    'hero.cta_parties': 'Ver Pacotes de Festas',
    'hero.cta_menu': 'Cardápio',

    // Home Atrações / Ingressos
    'home.attractions_title': 'Em funcionamento agora, prontas para você.',
    'home.see_all_tickets': 'Ver todos os ingressos',
    'home.from_price': 'A partir de',
    'home.buy_now': 'Comprar Agora',
    'home.instant_voucher': 'Voucher digital no e-mail',

    // Home Festas
    'home.parties_badge': 'CELEBRE COM A GENTE',
    'home.parties_title': 'Comemore aniversários épicos e datas especiais.',
    'home.parties_subtitle':
      'Salões temáticos privativos, monitores dedicados, buffet completo e passaporte livre para todas as atrações.',
    'home.see_all_parties': 'Conhecer todos os pacotes de festas',
    'home.party_details': 'Ver Detalhes & Reservar',
    'home.up_to_guests': 'Até {count} convidados',

    // Home Cardápio
    'home.menu_badge': 'PRAÇA DE ALIMENTAÇÃO',
    'home.menu_title': 'Gastronomia deliciosa para recarregar as energias.',
    'home.menu_subtitle':
      'Burgers artesanais, pizzas crocantes, porções generosas, bebidas geladas e sobremesas irresistíveis.',
    'home.see_full_menu': 'Ver Cardápio Completo',
    'home.order_now': 'Pedir Online',

    // Vantagens / Badges
    'features.instant': 'Ingressos 100% Digitais',
    'features.instant_desc': 'Receba seu QR Code na hora por e-mail e apresente na catraca.',
    'features.secure': 'Pagamento Seguro',
    'features.secure_desc': 'Transações criptografadas com tecnologia Stripe e confirmação imediata.',
    'features.fun': 'Diversão Garantida',
    'features.fun_desc': 'Atrações para todas as idades, segurança rigorosa e monitores treinados.',

    // Rodapé
    'footer.brand_desc':
      'O maior complexo de diversões, atrações radicais, área kids e gastronomia para toda a família. Vouchers digitais instantâneos e checkout 100% seguro.',
    'footer.secure_badge': 'PAGAMENTO SEGURO VIA STRIPE',
    'footer.navigation': 'Navegação',
    'footer.contact_location': 'Atendimento & Localização',
    'footer.all_rights': 'Todos os direitos reservados.',
    'footer.slogan': 'Seu Jogo. Seu Momento. Sua Diversão.',
  },

  en: {
    // Header & Navigation
    'header.home': 'Home',
    'header.tickets': 'Tickets',
    'header.parties': 'Parties & Birthdays',
    'header.menu': 'Menu',
    'header.select_language': 'Select language',
    'header.get_tickets': 'Get Tickets',

    // Hero Section
    'hero.headline_part1': 'Your Game.',
    'hero.headline_part2': 'Your Moment.',
    'hero.headline_part3': 'Your Fun.',
    'hero.subtitle':
      'The largest entertainment and thrill park in the region. Experience extraordinary moments, secure your passes online, and celebrate unforgettable memories.',
    'hero.cta_tickets': 'Get Tickets',
    'hero.cta_parties': 'View Party Packages',
    'hero.cta_menu': 'Menu',

    // Home Attractions / Tickets
    'home.attractions_title': 'Operating right now, ready for you.',
    'home.see_all_tickets': 'View all tickets',
    'home.from_price': 'Starting at',
    'home.buy_now': 'Buy Now',
    'home.instant_voucher': 'Digital voucher by email',

    // Home Parties
    'home.parties_badge': 'CELEBRATE WITH US',
    'home.parties_title': 'Celebrate epic birthdays and special occasions.',
    'home.parties_subtitle':
      'Private themed party rooms, dedicated staff, full buffet, and unlimited access to all park rides.',
    'home.see_all_parties': 'Explore all party packages',
    'home.party_details': 'View Details & Book',
    'home.up_to_guests': 'Up to {count} guests',

    // Home Menu
    'home.menu_badge': 'FOOD COURT & SNACKS',
    'home.menu_title': 'Delicious dining to recharge your energy.',
    'home.menu_subtitle':
      'Artisan burgers, crispy pizzas, generous platters, cold refreshments, and irresistible desserts.',
    'home.see_full_menu': 'View Full Menu',
    'home.order_now': 'Order Online',

    // Highlights
    'features.instant': '100% Digital Tickets',
    'features.instant_desc': 'Receive your QR Code instantly via email and scan at the gate.',
    'features.secure': 'Secure Payment',
    'features.secure_desc': 'Encrypted transactions powered by Stripe with instant confirmation.',
    'features.fun': 'Guaranteed Fun',
    'features.fun_desc': 'Attractions for all ages, rigorous safety standards, and trained team.',

    // Footer
    'footer.brand_desc':
      'The largest complex of amusements, thrill rides, kids area, and dining for the entire family. Instant digital vouchers and 100% secure checkout.',
    'footer.secure_badge': 'SECURE PAYMENT VIA STRIPE',
    'footer.navigation': 'Navigation',
    'footer.contact_location': 'Customer Care & Location',
    'footer.all_rights': 'All rights reserved.',
    'footer.slogan': 'Your Game. Your Moment. Your Fun.',
  },

  es: {
    // Header & Navegación
    'header.home': 'Inicio',
    'header.tickets': 'Entradas',
    'header.parties': 'Fiestas y Cumpleaños',
    'header.menu': 'Menú',
    'header.select_language': 'Seleccionar idioma',
    'header.get_tickets': 'Comprar Entradas',

    // Hero Section
    'hero.headline_part1': 'Tu Juego.',
    'hero.headline_part2': 'Tu Momento.',
    'hero.headline_part3': 'Tu Diversión.',
    'hero.subtitle':
      'El mayor complejo de entretenimiento y atracciones radicales de la región. Vive momentos extraordinarios, asegura tus pases online y celebra recuerdos inolvidables.',
    'hero.cta_tickets': 'Comprar Entradas',
    'hero.cta_parties': 'Ver Paquetes de Fiestas',
    'hero.cta_menu': 'Menú',

    // Home Atracciones / Entradas
    'home.attractions_title': 'En funcionamiento ahora, listas para ti.',
    'home.see_all_tickets': 'Ver todas las entradas',
    'home.from_price': 'A partir de',
    'home.buy_now': 'Comprar Ahora',
    'home.instant_voucher': 'Voucher digital por correo',

    // Home Fiestas
    'home.parties_badge': 'CELEBRA CON NOSOTROS',
    'home.parties_title': 'Celebra cumpleaños épicos y fechas especiales.',
    'home.parties_subtitle':
      'Salones temáticos privados, monitores dedicados, buffet completo y pase libre para todas las atracciones.',
    'home.see_all_parties': 'Conocer todos los paquetes de fiestas',
    'home.party_details': 'Ver Detalles y Reservar',
    'home.up_to_guests': 'Hasta {count} invitados',

    // Home Menú
    'home.menu_badge': 'PATIO DE COMIDAS',
    'home.menu_title': 'Deliciosa gastronomía para recargar energías.',
    'home.menu_subtitle':
      'Hamburguesas artesanales, pizzas crujientes, raciones generosas, bebidas frías y postres irresistibles.',
    'home.see_full_menu': 'Ver Menú Completo',
    'home.order_now': 'Pedir Online',

    // Ventajas
    'features.instant': 'Entradas 100% Digitales',
    'features.instant_desc': 'Recibe tu código QR al instante por correo y preséntalo en el torniquete.',
    'features.secure': 'Pago Seguro',
    'features.secure_desc': 'Transacciones encriptadas con tecnología Stripe y confirmación inmediata.',
    'features.fun': 'Diversión Garantizada',
    'features.fun_desc': 'Atracciones para todas las edades, seguridad rigurosa y monitores capacitados.',

    // Rodapé
    'footer.brand_desc':
      'El mayor complejo de diversiones, atracciones radicales, zona infantil y gastronomía para toda la familia. Vouchers digitales instantáneos y pago 100% seguro.',
    'footer.secure_badge': 'PAGO SEGURO VÍA STRIPE',
    'footer.navigation': 'Navegación',
    'footer.contact_location': 'Atención y Ubicación',
    'footer.all_rights': 'Todos los derechos reservados.',
    'footer.slogan': 'Tu Juego. Tu Momento. Tu Diversión.',
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt',
  setLanguage: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = 'family_fun_town_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && (saved === 'pt' || saved === 'en' || saved === 'es')) {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  };

  const t = (
    key: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.pt;
    let template = dict[key] || TRANSLATIONS.pt[key];

    let actualFallback = '';
    let params: Record<string, string | number> | undefined;

    if (typeof paramsOrFallback === 'string') {
      actualFallback = paramsOrFallback;
    } else if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
      params = paramsOrFallback;
      if (fallback) actualFallback = fallback;
    }

    if (!template) {
      template = actualFallback || key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return template;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
