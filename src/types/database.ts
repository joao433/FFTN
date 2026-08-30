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
  stripePriceId?: string | null;
  active: boolean;
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
  imageUrl?: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PartyBookingModel {
  id: string;
  packageId: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  eventDate: string; // YYYY-MM-DD
  guestCount?: number | null;
  priceCents?: number | null;
  status: PartyBookingStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  package?: PartyPackageModel;
}

export interface MenuCategoryModel {
  id: string;
  name: string;
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
  displayOrder: number;
  available: boolean;
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
