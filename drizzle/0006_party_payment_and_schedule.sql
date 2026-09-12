-- 0006_party_payment_and_schedule.sql
-- Migração para suporte a 3 opções de pagamento em festas, duração por pacote, horário de início e calendário

-- 1. Criar tabela party_payment_settings para configurações globais de pagamento de festas
CREATE TABLE IF NOT EXISTS party_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_no_deposit BOOLEAN NOT NULL DEFAULT true,
  allow_partial_deposit BOOLEAN NOT NULL DEFAULT true,
  deposit_percentage INTEGER NOT NULL DEFAULT 30,
  allow_full_payment BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir configuração padrão inicial se a tabela estiver vazia
INSERT INTO party_payment_settings (id, allow_no_deposit, allow_partial_deposit, deposit_percentage, allow_full_payment)
SELECT '00000000-0000-0000-0000-000000000001', true, true, 30, true
WHERE NOT EXISTS (SELECT 1 FROM party_payment_settings);

-- 2. Adicionar duração (em minutos) nos pacotes de festa (party_packages)
ALTER TABLE party_packages
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 120;

-- 3. Adicionar colunas de controle de horário e pagamento nas reservas de festa (party_bookings)
ALTER TABLE party_bookings
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS total_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_paid BOOLEAN NOT NULL DEFAULT false;

-- Atualizar registros legados existentes de party_bookings com total_price_cents = price_cents
UPDATE party_bookings
SET 
  total_price_cents = COALESCE(total_price_cents, price_cents, 0),
  amount_paid_cents = CASE 
    WHEN status = 'paid' OR status = 'confirmed' THEN COALESCE(price_cents, 0)
    ELSE 0
  END,
  balance_due_cents = CASE
    WHEN status = 'paid' OR status = 'confirmed' THEN 0
    ELSE COALESCE(price_cents, 0)
  END,
  balance_paid = CASE
    WHEN status = 'paid' OR status = 'confirmed' THEN true
    ELSE false
  END,
  payment_type = COALESCE(payment_type, 'full')
WHERE total_price_cents IS NULL;

-- 4. Criar índices para consulta rápida de agenda e prevenção de conflitos
CREATE INDEX IF NOT EXISTS idx_party_bookings_date_time 
  ON party_bookings (event_date, start_time);

-- 5. Recarregar o cache de schema do PostgREST no Supabase
SELECT pg_notify('pgrst', 'reload schema');
