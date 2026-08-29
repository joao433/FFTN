-- Migration: 0000_initial_schema.sql
-- Descrição: Esquema inicial do banco de dados para o Site do Parque de Diversões
-- Suporta: Ingressos, Festas, Cardápio, Autenticação de Staff/Admin e Idempotência de Webhooks Stripe

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('pending', 'paid', 'used', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE party_booking_status AS ENUM ('pending', 'paid', 'confirmed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA: ticket_packages (Pacotes de Ingresso)
CREATE TABLE IF NOT EXISTS ticket_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_packages_active_idx ON ticket_packages (active);
CREATE INDEX IF NOT EXISTS ticket_packages_display_order_idx ON ticket_packages (display_order);

-- 3. TABELA: tickets (Ingressos Vendidos)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES ticket_packages(id) ON DELETE RESTRICT,
  holder_name TEXT NOT NULL,
  holder_email TEXT NOT NULL,
  holder_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  price_cents INTEGER,
  status ticket_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tickets_holder_email_idx ON tickets (holder_email);
CREATE INDEX IF NOT EXISTS tickets_holder_phone_idx ON tickets (holder_phone);
CREATE INDEX IF NOT EXISTS tickets_event_date_idx ON tickets (event_date);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets (status);
CREATE UNIQUE INDEX IF NOT EXISTS tickets_stripe_session_idx ON tickets (stripe_checkout_session_id);

-- 4. TABELA: party_packages (Combos de Festa)
CREATE TABLE IF NOT EXISTS party_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS party_packages_active_idx ON party_packages (active);
CREATE INDEX IF NOT EXISTS party_packages_display_order_idx ON party_packages (display_order);

-- 5. TABELA: party_bookings (Reservas de Festa)
CREATE TABLE IF NOT EXISTS party_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES party_packages(id) ON DELETE RESTRICT,
  holder_name TEXT NOT NULL,
  holder_email TEXT NOT NULL,
  holder_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  guest_count INTEGER,
  price_cents INTEGER,
  status party_booking_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS party_bookings_holder_email_idx ON party_bookings (holder_email);
CREATE INDEX IF NOT EXISTS party_bookings_holder_phone_idx ON party_bookings (holder_phone);
CREATE INDEX IF NOT EXISTS party_bookings_event_date_idx ON party_bookings (event_date);
CREATE INDEX IF NOT EXISTS party_bookings_status_idx ON party_bookings (status);

-- 6. TABELA: menu_categories (Categorias do Cardápio)
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_categories_active_idx ON menu_categories (active);
CREATE INDEX IF NOT EXISTS menu_categories_display_order_idx ON menu_categories (display_order);

-- 7. TABELA: menu_items (Itens do Cardápio)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  promo_price_cents INTEGER,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS menu_items_available_idx ON menu_items (available);
CREATE INDEX IF NOT EXISTS menu_items_display_order_idx ON menu_items (display_order);

-- 8. TABELA: admin_users (Usuários Administrativos e Staff)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users (email);

-- 9. TABELA: stripe_webhook_events (Log de Idempotência e Auditoria)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS stripe_events_event_id_idx ON stripe_webhook_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS stripe_events_event_type_idx ON stripe_webhook_events (event_type);

-- 10. FUNÇÃO E TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_ticket_packages_updated_at BEFORE UPDATE ON ticket_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_party_packages_updated_at BEFORE UPDATE ON party_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_party_bookings_updated_at BEFORE UPDATE ON party_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stripe_webhook_events_updated_at BEFORE UPDATE ON stripe_webhook_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
