/**
 * Database Types & Models - Parque de Diversões
 */

export type TicketStatus = 'pending' | 'paid' | 'used' | 'canceled';
export type PartyBookingStatus = 'pending' | 'paid' | 'confirmed' | 'canceled';
export type MenuOrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'canceled';
export type AdminRole = 'admin' | 'staff';

export interface TicketPackageModel {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  stripePriceId?: string | null;
  active: boolean;
  featuredHome?: boolean;
  featured_home?: boolean;
  displayOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TicketModel {
  id: string;
  packageId: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string | null;
  priceCents?: number | null;
  status: TicketStatus;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  usedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  package?: TicketPackageModel;
}

export interface PartyPackageModel {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  price_cents?: number;
  durationMinutes?: number;
  duration_minutes?: number;
  imageUrl?: string | null;
  image_url?: string | null;
  active: boolean;
  featuredHome?: boolean;
  featured_home?: boolean;
  displayOrder: number;
  display_order?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PartyPaymentType = 'none' | 'deposit' | 'full';

export interface PartyPaymentSettingsModel {
  id?: string;
  allowNoDeposit: boolean;
  allow_no_deposit?: boolean;
  allowPartialDeposit: boolean;
  allow_partial_deposit?: boolean;
  depositPercentage: number;
  deposit_percentage?: number;
  allowFullPayment: boolean;
  allow_full_payment?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PartyBookingModel {
  id: string;
  packageId: string;
  package_id?: string;
  holderName: string;
  holder_name?: string;
  holderEmail: string;
  holder_email?: string;
  holderPhone: string;
  holder_phone?: string;
  eventDate: string; // YYYY-MM-DD
  event_date?: string;
  startTime?: string | null; // HH:MM
  start_time?: string | null;
  endTime?: string | null; // HH:MM
  end_time?: string | null;
  durationMinutes?: number | null;
  duration_minutes?: number | null;
  guestCount?: number | null;
  guest_count?: number | null;
  priceCents?: number | null;
  price_cents?: number | null;
  totalPriceCents?: number | null;
  total_price_cents?: number | null;
  paymentType?: PartyPaymentType;
  payment_type?: PartyPaymentType;
  amountPaidCents?: number;
  amount_paid_cents?: number;
  balanceDueCents?: number;
  balance_due_cents?: number;
  balancePaid?: boolean;
  balance_paid?: boolean;
  status: PartyBookingStatus;
  stripeCheckoutSessionId?: string | null;
  stripe_checkout_session_id?: string | null;
  stripePaymentIntentId?: string | null;
  stripe_payment_intent_id?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  created_at?: Date | string;
  updatedAt: Date | string;
  updated_at?: Date | string;
  package?: PartyPackageModel;
  party_packages?: PartyPackageModel;
}

export interface MenuItemVariation {
  name: string;
  priceCents?: number;
  price_cents?: number;
}

export interface MenuBannerModel {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  badge_text?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  featuredItemId?: string | null;
  featured_item_id?: string | null;
  featuredBadgeText?: string | null;
  featured_badge_text?: string | null;
  active: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface MenuCategoryModel {
  id: string;
  name: string;
  imageUrl?: string | null;
  image_url?: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: MenuItemModel[];
}

export interface MenuItemModel {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  promoPriceCents?: number | null;
  imageUrl?: string | null;
  ingredients?: string | string[] | null;
  variations?: MenuItemVariation[] | null;
  displayOrder: number;
  available: boolean;
  featuredHome?: boolean;
  featured_home?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MenuOrderModel {
  id: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  totalPriceCents: number;
  status: MenuOrderStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: MenuOrderItemModel[];
}

export interface MenuOrderItemModel {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  unitPriceCents: number;
  quantity: number;
  totalPriceCents: number;
  createdAt: Date | string;
}

export interface AdminUserModel {
  id: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StripeWebhookEventModel {
  id: string;
  stripeEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Stripe Checkout Metadata contract for webhook routing
 */
export interface StripeCheckoutMetadata {
  type: 'ticket' | 'party' | 'menu';
  orderType?: 'ticket' | 'party' | 'menu';
  packageId?: string;
  orderId?: string;
  holderName?: string;
  holderEmail?: string;
  holderPhone?: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: string;
}

export interface HomeSettingsModel {
  id?: string;
  heroVideoUrl?: string | null;
  hero_video_url?: string | null;
  heroImageUrl?: string | null;
  hero_image_url?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SiteContactInfoModel {
  id?: string;
  address: string;
  phonePrimary: string;
  phone_primary?: string;
  phoneSecondary?: string | null;
  phone_secondary?: string | null;
  email: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type SiteTheme = 'oficial' | 'dark' | 'turquesa' | 'acolhedor';

export interface SiteSettingsModel {
  activeTheme?: SiteTheme;
  active_theme?: SiteTheme;
  home: HomeSettingsModel;
  contact: SiteContactInfoModel;
}

