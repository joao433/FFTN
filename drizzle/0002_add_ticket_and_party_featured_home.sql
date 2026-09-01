-- Migration: 0002_add_ticket_and_party_featured_home.sql
-- Descrição: Adiciona coluna featured_home para ticket_packages e party_packages

-- 1. ticket_packages
ALTER TABLE ticket_packages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE ticket_packages 
ADD COLUMN IF NOT EXISTS featured_home BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ticket_packages_featured_home 
ON ticket_packages (featured_home);

-- 2. party_packages
ALTER TABLE party_packages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE party_packages 
ADD COLUMN IF NOT EXISTS featured_home BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_party_packages_featured_home 
ON party_packages (featured_home);

-- Recarregar o cache do PostgREST
SELECT pg_notify('pgrst', 'reload schema');
