-- Migration: 0004_add_menu_banner_featured_item.sql
-- Descrição: Adiciona featured_item_id e featured_badge_text à tabela menu_banner

-- 1. Coluna featured_item_id com chave estrangeira para menu_items
ALTER TABLE menu_banner 
ADD COLUMN IF NOT EXISTS featured_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL;

-- 2. Coluna featured_badge_text para badge customizável do card de destaque
ALTER TABLE menu_banner 
ADD COLUMN IF NOT EXISTS featured_badge_text TEXT DEFAULT 'OFERTA ESPECIAL';

-- 3. Índice para otimização de busca por item destacado
CREATE INDEX IF NOT EXISTS idx_menu_banner_featured_item_id 
ON menu_banner (featured_item_id);

-- 4. Notificar PostgREST para recarregar o schema no Supabase
SELECT pg_notify('pgrst', 'reload schema');
