import { createClient } from '@supabase/supabase-js';
import { getApiUrl } from './api.ts';
import type {
  TicketPackageModel,
  PartyPackageModel,
  MenuCategoryModel,
  MenuItemModel,
  MenuBannerModel,
  HomeSettingsModel,
  SiteContactInfoModel,
  SiteSettingsModel,
  SiteTheme,
} from '../types/database.ts';

// Default catalog fallback for initial load / preview
export const DEFAULT_TICKET_PACKAGES: TicketPackageModel[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Day Pass (Passe Diário)',
    description: 'Acesso ilimitado a todas as montanhas-russas, atrações familiares e shows durante o dia inteiro.',
    priceCents: 4900, // $49.00
    imageUrl: null,
    stripePriceId: null,
    active: true,
    featuredHome: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'VIP Fast Track Pass',
    description: 'Acesso VIP sem filas em todas as atrações principais, estacionamento gratuito e 1 refeição inclusa.',
    priceCents: 8900, // $89.00
    imageUrl: null,
    stripePriceId: null,
    active: true,
    featuredHome: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Family Fun Pack (4 Pessoas)',
    description: 'Combo promocional para 4 pessoas com passe livre o dia todo, refrigerante refil e foto souvenir.',
    priceCents: 15900, // $159.00
    imageUrl: null,
    stripePriceId: null,
    active: true,
    featuredHome: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    name: 'Twilight Adventure (Acesso Noturno)',
    description: 'Entrada especial a partir das 17h para curtir o parque iluminado, montanhas-russas noturnas e queima de fogos.',
    priceCents: 3500, // $35.00
    imageUrl: null,
    stripePriceId: null,
    active: true,
    featuredHome: false,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_PARTY_PACKAGES: PartyPackageModel[] = [
  {
    id: 'party-1111-1111-4111-a111-111111111111',
    name: 'Festa Radical (10 Convidados)',
    description: 'Salão temático exclusivo por 2h30, bolo, salgadinhos, refrigerante refil e passaporte ilimitado para 10 convidados.',
    priceCents: 39900, // $399.00
    imageUrl: null,
    active: true,
    featuredHome: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'party-2222-2222-4222-a222-222222222222',
    name: 'Super Aniversário VIP (20 Convidados)',
    description: 'Espaço VIP privativo, anfitrião dedicado, bolo personalizado, combo gourmet, foto oficial e Fast Pass sem filas para todos.',
    priceCents: 69900, // $699.00
    imageUrl: null,
    active: true,
    featuredHome: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'party-3333-3333-4333-a333-333333333333',
    name: 'Mega Celebration & Fireworks (30 Convidados)',
    description: 'Área com vista privilegiada para o show de fogos, buffet completo, mesa de doces, DJ do parque e acesso dia & noite.',
    priceCents: 119900, // $1,199.00
    imageUrl: null,
    active: true,
    featuredHome: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'party-4444-4444-4444-a444-444444444444',
    name: 'Lounge Neon & Balada Teen (25 Convidados)',
    description: 'Espaço exclusivo com iluminação neon, DJ, pista de dança, coquetéis sem álcool, snacks gourmet e pulseiras de acesso total.',
    priceCents: 89900, // $899.00
    imageUrl: null,
    active: true,
    featuredHome: true,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_MENU_BANNER: MenuBannerModel = {
  id: 'banner-default',
  title: 'Cardápio do Parque',
  subtitle: 'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas. Lanches preparados na hora, porções crocantes, bebidas e sobremesas!',
  badgeText: 'SNACK BAR & GASTRONOMIA',
  badge_text: 'SNACK BAR & GASTRONOMIA',
  imageUrl: null,
  image_url: null,
  featuredItemId: null,
  featured_item_id: null,
  featuredBadgeText: 'OFERTA ESPECIAL',
  featured_badge_text: 'OFERTA ESPECIAL',
  active: true,
};

export const DEFAULT_MENU_CATEGORIES: MenuCategoryModel[] = [
  {
    id: 'cat-1',
    name: 'Hambúrgueres & Lanches',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&auto=format&fit=crop&q=80',
    displayOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Porções & Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=160&auto=format&fit=crop&q=80',
    displayOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Bebidas & Refrescos',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=160&auto=format&fit=crop&q=80',
    displayOrder: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Sobremesas & Doces',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=160&auto=format&fit=crop&q=80',
    displayOrder: 4,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_MENU_ITEMS: MenuItemModel[] = [
  {
    id: 'item-1',
    categoryId: 'cat-1',
    name: 'Monster Burger Duplo Angus',
    description: 'Pão brioche tostado, 2 hambúrgueres angus 160g, cheddar cremoso derretido, bacon crocante e molho barbecue artesanal.',
    priceCents: 1699, // $16.99
    promoPriceCents: 1449, // $14.49 promo
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Pão brioche com gergelim, 2 hambúrgueres angus 160g, Queijo cheddar cremoso derretido, Fatias de bacon crocante, Alface americana fresca, Molho barbecue artesanal defumado',
    variations: [
      { name: 'Individual (1 Burger 160g)', price_cents: 1399 },
      { name: 'Duplo Clássico (2 Burgers)', price_cents: 1699 },
      { name: 'Combo Mega (Burger + Fritas + Refil)', price_cents: 2299 },
    ],
    displayOrder: 1,
    available: true,
    featuredHome: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    categoryId: 'cat-1',
    name: 'Crispy Roller Chicken Burger',
    description: 'Peito de frango super empanado crocante, salada coleslaw da casa, picles e maionese especial de páprica defumada.',
    priceCents: 1399, // $13.99
    promoPriceCents: null,
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Peito de frango crocante temperado, Salada coleslaw da casa, Picles artesanal, Maionese especial com páprica defumada, Pão de batata macio',
    variations: [
      { name: 'Individual', price_cents: 1399 },
      { name: 'Combo com Batata Frita', price_cents: 1899 },
    ],
    displayOrder: 2,
    available: true,
    featuredHome: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    categoryId: 'cat-2',
    name: 'Mega Batata Rústica com Cheddar & Bacon',
    description: 'Porção generosa de batatas rústicas com corte especial, molho cheddar quente e farofa de bacon.',
    priceCents: 999, // $9.99
    promoPriceCents: 799, // $7.99 promo
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Batatas rústicas com casca temperadas com alecrim, Molho cheddar derretido especial, Farofa de bacon defumado crocante',
    variations: [
      { name: 'Porção Média (serve 2)', price_cents: 999 },
      { name: 'Porção Mega Família (serve 4)', price_cents: 1599 },
    ],
    displayOrder: 1,
    available: true,
    featuredHome: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    categoryId: 'cat-2',
    name: 'Nuggets de Frango Crocantes (12 un)',
    description: 'Acompanha molho barbecue artesanal e molho honey mustard.',
    priceCents: 849, // $8.49
    promoPriceCents: null,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Peito de frango selecionado, Empanamento crocante especial, Molho barbecue artesanal, Molho honey mustard suave',
    variations: [
      { name: 'Caixa com 6 unidades', price_cents: 549 },
      { name: 'Caixa com 12 unidades', price_cents: 849 },
      { name: 'Balde Família com 24 unidades', price_cents: 1499 },
    ],
    displayOrder: 2,
    available: true,
    featuredHome: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-5',
    categoryId: 'cat-3',
    name: 'Copo Colecionável Refil Infinito (Parque Todo)',
    description: 'Copo oficial temático com refil ilimitado de refrigerantes e sucos o dia todo em todas as estações do parque.',
    priceCents: 1299, // $12.99
    promoPriceCents: 999, // $9.99 promo
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Copo térmico colecionável oficial com chip de refil livre em todas as máquinas de bebidas',
    variations: null,
    displayOrder: 1,
    available: true,
    featuredHome: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-6',
    categoryId: 'cat-3',
    name: 'Milkshake Vulcão de Nutella & Ninho (500ml)',
    description: 'Sorvete de baunilha cremoso batido com calda farta de Nutella e leite em pó.',
    priceCents: 799, // $7.99
    promoPriceCents: null,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Sorvete artesanal de creme de baunilha, Nutella pura, Leite Ninho em pó, Chantilly cremoso, Cobertura de chocolate',
    variations: [
      { name: 'Médio 350ml', price_cents: 649 },
      { name: 'Grande 500ml', price_cents: 799 },
    ],
    displayOrder: 2,
    available: true,
    featuredHome: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-7',
    categoryId: 'cat-4',
    name: 'Churros Espanhóis Gigantes (6 un)',
    description: 'Polvilhados com açúcar e canela, servidos com potinhos generosos de doce de leite artesanal e chocolate quente.',
    priceCents: 899, // $8.99
    promoPriceCents: 699, // $6.99 promo
    imageUrl: 'https://images.unsplash.com/photo-1624371414361-e670edf4898d?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Massa tradicional espanhola crocante frita na hora, Açúcar com canela aromática, Pote de doce de leite argentino, Pote de chocolate cremoso',
    variations: [
      { name: 'Porção com 3 unidades', price_cents: 549 },
      { name: 'Porção com 6 unidades', price_cents: 899 },
    ],
    displayOrder: 1,
    available: true,
    featuredHome: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-8',
    categoryId: 'cat-4',
    name: 'Grand Sundae Montanha-Russa',
    description: '3 bolas de sorvete, chantilly, calda quente de chocolate, castanhas e cereja.',
    priceCents: 749, // $7.49
    promoPriceCents: null,
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Sorvete de chocolate, morango e creme, Calda quente de chocolate, Chantilly, Castanhas de caju picadas, Cereja ao marasquino',
    variations: null,
    displayOrder: 2,
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getClientSupabase() {
  if (supabaseClient) return supabaseClient;

  // Supabase public anon key or standard URL from env
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const url = metaEnv.VITE_SUPABASE_URL || '';
  const anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_KEY || '';

  if (url && anonKey) {
    try {
      supabaseClient = createClient(url, anonKey);
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }

  return null;
}

export async function fetchActiveTicketPackages(): Promise<TicketPackageModel[]> {
  const client = getClientSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('ticket_packages')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as Array<Record<string, any>>).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          priceCents: Number(item.price_cents ?? item.priceCents ?? 0),
          imageUrl: item.image_url ?? item.imageUrl ?? null,
          stripePriceId: item.stripe_price_id ?? item.stripePriceId ?? null,
          active: Boolean(item.active),
          featuredHome: Boolean(item.featured_home ?? item.featuredHome),
          displayOrder: Number(item.display_order ?? item.displayOrder ?? 0),
          createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
          updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, falling back to default catalog:', err);
    }
  }

  return DEFAULT_TICKET_PACKAGES;
}

export async function fetchActivePartyPackages(): Promise<PartyPackageModel[]> {
  const client = getClientSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('party_packages')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as Array<Record<string, any>>).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          priceCents: Number(item.price_cents ?? item.priceCents ?? 0),
          durationMinutes: Number(item.duration_minutes ?? item.durationMinutes ?? 120),
          imageUrl: item.image_url ?? item.imageUrl ?? null,
          active: Boolean(item.active),
          featuredHome: Boolean(item.featured_home ?? item.featuredHome),
          displayOrder: Number(item.display_order ?? item.displayOrder ?? 0),
          createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
          updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, falling back to default party catalog:', err);
    }
  }

  return DEFAULT_PARTY_PACKAGES;
}

export async function fetchActiveMenuBanner(): Promise<MenuBannerModel> {
  const client = getClientSupabase();
  if (client) {
    try {
      const { data, error } = await (client as any)
        .from('menu_banner')
        .select('*')
        .eq('active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const row = data as Record<string, any>;
        let cleanSubtitle = row.subtitle ?? DEFAULT_MENU_BANNER.subtitle;
        let featuredItemId = row.featured_item_id ?? row.featuredItemId ?? null;
        let featuredBadgeText = row.featured_badge_text ?? row.featuredBadgeText ?? null;

        if (cleanSubtitle && typeof cleanSubtitle === 'string' && cleanSubtitle.includes('<!--featured_config:')) {
          const match = cleanSubtitle.match(/<!--featured_config:(.*?)-->/);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              if (!featuredItemId && parsed.item_id !== undefined) {
                featuredItemId = parsed.item_id;
              }
              if (!featuredBadgeText && parsed.badge_text !== undefined) {
                featuredBadgeText = parsed.badge_text;
              }
            } catch {
              // ignore
            }
          }
          cleanSubtitle = cleanSubtitle.replace(/\s*<!--featured_config:(.*?)-->/, '').trim();
        }

        return {
          id: row.id,
          title: row.title || DEFAULT_MENU_BANNER.title,
          subtitle: cleanSubtitle,
          badgeText: row.badge_text ?? row.badgeText ?? DEFAULT_MENU_BANNER.badgeText,
          badge_text: row.badge_text ?? row.badgeText ?? DEFAULT_MENU_BANNER.badgeText,
          imageUrl: row.image_url ?? row.imageUrl ?? null,
          image_url: row.image_url ?? row.imageUrl ?? null,
          featuredItemId: featuredItemId,
          featured_item_id: featuredItemId,
          featuredBadgeText: featuredBadgeText || DEFAULT_MENU_BANNER.featuredBadgeText,
          featured_badge_text: featuredBadgeText || DEFAULT_MENU_BANNER.featuredBadgeText,
          active: Boolean(row.active),
          createdAt: row.created_at ?? row.createdAt,
          updatedAt: row.updated_at ?? row.updatedAt,
        };
      }
    } catch (err) {
      console.warn('Supabase fetch error for menu banner, falling back to default:', err);
    }
  }

  return DEFAULT_MENU_BANNER;
}

export async function fetchActiveMenuCategories(): Promise<MenuCategoryModel[]> {
  const client = getClientSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('menu_categories')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as Array<Record<string, any>>).map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url ?? item.imageUrl ?? null,
          image_url: item.image_url ?? item.imageUrl ?? null,
          displayOrder: Number(item.display_order ?? item.displayOrder ?? 0),
          active: Boolean(item.active),
          createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
          updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, falling back to default menu categories:', err);
    }
  }

  return DEFAULT_MENU_CATEGORIES;
}

export async function fetchActiveMenuItems(): Promise<MenuItemModel[]> {
  const client = getClientSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as Array<Record<string, any>>).map((item) => ({
          id: item.id,
          categoryId: item.category_id ?? item.categoryId,
          name: item.name,
          description: item.description ?? null,
          priceCents: Number(item.price_cents ?? item.priceCents ?? 0),
          promoPriceCents:
            item.promo_price_cents !== null && item.promo_price_cents !== undefined
              ? Number(item.promo_price_cents)
              : item.promoPriceCents !== null && item.promoPriceCents !== undefined
              ? Number(item.promoPriceCents)
              : null,
          imageUrl: item.image_url ?? item.imageUrl ?? null,
          ingredients: item.ingredients ?? null,
          variations: Array.isArray(item.variations) ? item.variations : null,
          displayOrder: Number(item.display_order ?? item.displayOrder ?? 0),
          available: Boolean(item.available),
          featuredHome: Boolean(item.featured_home ?? item.featuredHome),
          createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
          updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, falling back to default menu items:', err);
    }
  }

  return DEFAULT_MENU_ITEMS;
}

export const DEFAULT_HOME_SETTINGS: HomeSettingsModel = {
  heroVideoUrl: null,
  heroImageUrl: null,
};

export const DEFAULT_SITE_THEME: SiteTheme = 'oficial';

export const DEFAULT_SITE_CONTACT_INFO: SiteContactInfoModel = {
  address: 'Av. das Atrações, 1500 — Complexo de Lazer',
  phonePrimary: '(11) 98765-4321',
  phoneSecondary: '(11) 4004-1234',
  email: 'contato@familyfuntown.com',
};

export async function fetchSiteSettings(): Promise<SiteSettingsModel> {
  try {
    const response = await fetch(getApiUrl('admin-manage-site-settings', { _t: Date.now() }), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        return {
          activeTheme: DEFAULT_SITE_THEME,
          home: {
            heroVideoUrl: data.home?.heroVideoUrl ?? data.home?.hero_video_url ?? null,
            heroImageUrl: data.home?.heroImageUrl ?? data.home?.hero_image_url ?? null,
          },
          contact: {
            address: data.contact?.address || DEFAULT_SITE_CONTACT_INFO.address,
            phonePrimary:
              data.contact?.phonePrimary ||
              data.contact?.phone_primary ||
              DEFAULT_SITE_CONTACT_INFO.phonePrimary,
            phoneSecondary:
              data.contact?.phoneSecondary ??
              data.contact?.phone_secondary ??
              DEFAULT_SITE_CONTACT_INFO.phoneSecondary,
            email: data.contact?.email || DEFAULT_SITE_CONTACT_INFO.email,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[Site Settings] Falha ao carregar via function, tentando cliente supabase direto:', err);
  }

  // Fallback: tentar carregar via cliente direto do Supabase se a function não responder
  const client = getClientSupabase();
  if (client) {
    try {
      const [homeRes, contactRes] = await Promise.allSettled([
        client.from('home_settings').select('*').limit(1),
        client.from('site_contact_info').select('*').limit(1),
      ]);

      let home = { ...DEFAULT_HOME_SETTINGS };
      let contact = { ...DEFAULT_SITE_CONTACT_INFO };
      const activeTheme: SiteTheme = DEFAULT_SITE_THEME;

      if (homeRes.status === 'fulfilled' && homeRes.value.data && homeRes.value.data.length > 0) {
        const row = homeRes.value.data[0] as Record<string, any>;
        home = {
          heroVideoUrl: row.hero_video_url ?? null,
          heroImageUrl: row.hero_image_url ?? null,
        };
      }

      if (contactRes.status === 'fulfilled' && contactRes.value.data && contactRes.value.data.length > 0) {
        const row = contactRes.value.data[0] as Record<string, any>;
        contact = {
          address: row.address || DEFAULT_SITE_CONTACT_INFO.address,
          phonePrimary: row.phone_primary || DEFAULT_SITE_CONTACT_INFO.phonePrimary,
          phoneSecondary: row.phone_secondary ?? DEFAULT_SITE_CONTACT_INFO.phoneSecondary,
          email: row.email || DEFAULT_SITE_CONTACT_INFO.email,
        };
      }

      return { activeTheme, home, contact };
    } catch {
      // ignore
    }
  }

  return {
    activeTheme: DEFAULT_SITE_THEME,
    home: DEFAULT_HOME_SETTINGS,
    contact: DEFAULT_SITE_CONTACT_INFO,
  };
}

export async function saveSiteSettings(
  settings: { activeTheme?: SiteTheme; home: Partial<HomeSettingsModel>; contact: Partial<SiteContactInfoModel> },
  adminToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(getApiUrl('admin-manage-site-settings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao salvar configurações do site.' };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha na comunicação com o servidor.',
    };
  }
}

