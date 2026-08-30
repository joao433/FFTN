import { createClient } from '@supabase/supabase-js';
import type { TicketPackageModel, PartyPackageModel } from '../types/database.ts';

// Default catalog fallback for initial load / preview
export const DEFAULT_TICKET_PACKAGES: TicketPackageModel[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Day Pass (Passe Diário)',
    description: 'Acesso ilimitado a todas as montanhas-russas, atrações familiares e shows durante o dia inteiro.',
    priceCents: 4900, // $49.00
    stripePriceId: null,
    active: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'VIP Fast Track Pass',
    description: 'Acesso VIP sem filas em todas as atrações principais, estacionamento gratuito e 1 refeição inclusa.',
    priceCents: 8900, // $89.00
    stripePriceId: null,
    active: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Family Fun Pack (4 Pessoas)',
    description: 'Combo promocional para 4 pessoas com passe livre o dia todo, refrigerante refil e foto souvenir.',
    priceCents: 15900, // $159.00
    stripePriceId: null,
    active: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    name: 'Twilight Adventure (Acesso Noturno)',
    description: 'Entrada especial a partir das 17h para curtir o parque iluminado, montanhas-russas noturnas e queima de fogos.',
    priceCents: 3500, // $35.00
    stripePriceId: null,
    active: true,
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
    displayOrder: 3,
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
          stripePriceId: item.stripe_price_id ?? item.stripePriceId ?? null,
          active: Boolean(item.active),
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
