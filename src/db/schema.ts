import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Enums
 */
export const ticketStatusEnum = pgEnum('ticket_status', [
  'pending',
  'paid',
  'used',
  'canceled',
]);

export const partyBookingStatusEnum = pgEnum('party_booking_status', [
  'pending',
  'paid',
  'confirmed',
  'canceled',
]);

export const adminRoleEnum = pgEnum('admin_role', ['admin', 'staff']);

/**
 * 1. ticket_packages (pacotes de ingresso)
 */
export const ticketPackages = pgTable(
  'ticket_packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    imageUrl: text('image_url'),
    stripePriceId: text('stripe_price_id'),
    active: boolean('active').default(true).notNull(),
    featuredHome: boolean('featured_home').default(false).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('ticket_packages_active_idx').on(table.active),
    index('ticket_packages_display_order_idx').on(table.displayOrder),
    index('idx_ticket_packages_featured_home').on(table.featuredHome),
  ]
);

/**
 * 2. tickets (ingressos vendidos)
 */
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => ticketPackages.id, { onDelete: 'restrict' }),
    holderName: text('holder_name').notNull(),
    holderEmail: text('holder_email').notNull(),
    holderPhone: text('holder_phone').notNull(),
    eventDate: text('event_date').notNull(), // YYYY-MM-DD
    eventTime: text('event_time'), // HH:MM
    priceCents: integer('price_cents'), // Congela o preço na venda
    status: ticketStatusEnum('status').default('pending').notNull(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id')
      .notNull()
      .unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('tickets_holder_email_idx').on(table.holderEmail),
    index('tickets_holder_phone_idx').on(table.holderPhone),
    index('tickets_event_date_idx').on(table.eventDate),
    index('tickets_status_idx').on(table.status),
    uniqueIndex('tickets_stripe_session_idx').on(table.stripeCheckoutSessionId),
  ]
);

/**
 * 3. party_packages (combos de festa)
 */
export const partyPackages = pgTable(
  'party_packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    durationMinutes: integer('duration_minutes').default(120).notNull(),
    imageUrl: text('image_url'),
    active: boolean('active').default(true).notNull(),
    featuredHome: boolean('featured_home').default(false).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('party_packages_active_idx').on(table.active),
    index('party_packages_display_order_idx').on(table.displayOrder),
    index('idx_party_packages_featured_home').on(table.featuredHome),
  ]
);

/**
 * 4. party_bookings (reservas de festa)
 */
export const partyBookings = pgTable(
  'party_bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => partyPackages.id, { onDelete: 'restrict' }),
    holderName: text('holder_name').notNull(),
    holderEmail: text('holder_email').notNull(),
    holderPhone: text('holder_phone').notNull(),
    eventDate: text('event_date').notNull(), // YYYY-MM-DD
    startTime: text('start_time'), // HH:MM
    endTime: text('end_time'), // HH:MM
    durationMinutes: integer('duration_minutes').default(120),
    guestCount: integer('guest_count'),
    priceCents: integer('price_cents'), // Congela o preço na reserva (legado)
    totalPriceCents: integer('total_price_cents'), // Valor total do pacote
    paymentType: text('payment_type').default('full'), // 'none' | 'deposit' | 'full'
    amountPaidCents: integer('amount_paid_cents').default(0).notNull(),
    balanceDueCents: integer('balance_due_cents').default(0).notNull(),
    balancePaid: boolean('balance_paid').default(false).notNull(),
    status: partyBookingStatusEnum('status').default('pending').notNull(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('party_bookings_holder_email_idx').on(table.holderEmail),
    index('party_bookings_holder_phone_idx').on(table.holderPhone),
    index('party_bookings_event_date_idx').on(table.eventDate),
    index('party_bookings_status_idx').on(table.status),
    index('idx_party_bookings_date_time').on(table.eventDate, table.startTime),
  ]
);

/**
 * 4b. party_payment_settings (configurações de pagamento de festas)
 */
export const partyPaymentSettings = pgTable(
  'party_payment_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    allowNoDeposit: boolean('allow_no_deposit').default(true).notNull(),
    allowPartialDeposit: boolean('allow_partial_deposit').default(true).notNull(),
    depositPercentage: integer('deposit_percentage').default(30).notNull(),
    allowFullPayment: boolean('allow_full_payment').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

/**
 * 5. menu_categories (categorias do cardápio)
 */
export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    imageUrl: text('image_url'),
    displayOrder: integer('display_order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('menu_categories_active_idx').on(table.active),
    index('menu_categories_display_order_idx').on(table.displayOrder),
  ]
);

/**
 * 6. menu_items (itens do cardápio)
 */
export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    promoPriceCents: integer('promo_price_cents'),
    imageUrl: text('image_url'),
    ingredients: text('ingredients'),
    variations: jsonb('variations'),
    displayOrder: integer('display_order').default(0).notNull(),
    available: boolean('available').default(true).notNull(),
    featuredHome: boolean('featured_home').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('menu_items_category_id_idx').on(table.categoryId),
    index('menu_items_available_idx').on(table.available),
    index('menu_items_display_order_idx').on(table.displayOrder),
    index('menu_items_featured_home_idx').on(table.featuredHome),
  ]
);

/**
 * 6.1 menu_banner (banner de destaque do cardápio)
 */
export const menuBanner = pgTable(
  'menu_banner',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    badgeText: text('badge_text'),
    imageUrl: text('image_url'),
    featuredItemId: uuid('featured_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
    featuredBadgeText: text('featured_badge_text'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('menu_banner_active_idx').on(table.active),
    index('menu_banner_featured_item_id_idx').on(table.featuredItemId),
  ]
);

/**
 * 7. admin_users (acesso ao painel)
 */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: adminRoleEnum('role').default('staff').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('admin_users_email_idx').on(table.email)]
);

/**
 * 8. stripe_webhook_events (log de idempotência)
 */
export const stripeWebhookEvents = pgTable(
  'stripe_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    stripeEventId: text('stripe_event_id').notNull().unique(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('stripe_events_event_id_idx').on(table.stripeEventId),
    index('stripe_events_event_type_idx').on(table.eventType),
  ]
);

/**
 * 9. home_settings (configurações do hero da Home, vídeo e fallback)
 */
export const homeSettings = pgTable(
  'home_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    heroVideoUrl: text('hero_video_url'),
    heroImageUrl: text('hero_image_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

/**
 * 10. site_contact_info (informações de contato e endereço do rodapé)
 */
export const siteContactInfo = pgTable(
  'site_contact_info',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    address: text('address').notNull().default('Av. das Atrações, 1500 — Complexo de Lazer'),
    phonePrimary: text('phone_primary').notNull().default('(11) 98765-4321'),
    phoneSecondary: text('phone_secondary').default('(11) 4004-1234'),
    email: text('email').notNull().default('contato@familyfuntown.com'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

/**
 * Drizzle Relationships
 */
export const ticketPackagesRelations = relations(ticketPackages, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  package: one(ticketPackages, {
    fields: [tickets.packageId],
    references: [ticketPackages.id],
  }),
}));

export const partyPackagesRelations = relations(partyPackages, ({ many }) => ({
  bookings: many(partyBookings),
}));

export const partyBookingsRelations = relations(partyBookings, ({ one }) => ({
  package: one(partyPackages, {
    fields: [partyBookings.packageId],
    references: [partyPackages.id],
  }),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

/**
 * Inferred Types
 */
export type TicketPackage = typeof ticketPackages.$inferSelect;
export type NewTicketPackage = typeof ticketPackages.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type PartyPackage = typeof partyPackages.$inferSelect;
export type NewPartyPackage = typeof partyPackages.$inferInsert;

export type PartyBooking = typeof partyBookings.$inferSelect;
export type NewPartyBooking = typeof partyBookings.$inferInsert;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type MenuBanner = typeof menuBanner.$inferSelect;
export type NewMenuBanner = typeof menuBanner.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;

export type HomeSetting = typeof homeSettings.$inferSelect;
export type NewHomeSetting = typeof homeSettings.$inferInsert;

export type SiteContactInfo = typeof siteContactInfo.$inferSelect;
export type NewSiteContactInfo = typeof siteContactInfo.$inferInsert;

