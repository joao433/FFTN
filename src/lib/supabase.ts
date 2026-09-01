import { createClient } from '@supabase/supabase-js';
import type { TicketPackageModel, PartyPackageModel, MenuCategoryModel, MenuItemModel } from '../types/database.ts';

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

export const DEFAULT_MENU_CATEGORIES: MenuCategoryModel[] = [
  {
    id: 'cat-1',
    name: 'Hambúrgueres & Lanches',
    displayOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Porções & Snacks',
    displayOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Bebidas & Refrescos',
    displayOrder: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Sobremesas & Doces',
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
