-- Migration: 0001_add_featured_home.sql
-- Descrição: Adiciona coluna featured_home para destacar até 3 itens do cardápio na Home

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS featured_home BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS menu_items_featured_home_idx 
ON menu_items (featured_home);

-- Notificar PostgREST para recarregar o schema caso esteja em uso
SELECT pg_notify('pgrst', 'reload schema');
