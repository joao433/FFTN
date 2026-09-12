-- Migration: 0003_add_menu_banner_and_item_details.sql
-- Descrição: Adiciona tabela menu_banner, imagem para categorias, e ingredientes/variações para itens do cardápio

-- 1. Categorias do cardápio: adicionar image_url
ALTER TABLE menu_categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Itens do cardápio: adicionar ingredients e variations
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS ingredients TEXT;

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS variations JSONB;

-- 3. Tabela menu_banner
CREATE TABLE IF NOT EXISTS menu_banner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Cardápio do Parque',
  subtitle TEXT DEFAULT 'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas. Lanches preparados na hora, porções crocantes, bebidas e sobremesas!',
  badge_text TEXT DEFAULT 'SNACK BAR & GASTRONOMIA',
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_banner_active 
ON menu_banner (active);

-- 4. Inserir registro inicial do banner caso a tabela esteja vazia
INSERT INTO menu_banner (title, subtitle, badge_text, image_url, active)
SELECT 
  'Cardápio do Parque', 
  'Peça online pelo celular e retire rapidamente no balcão central de alimentação sem pegar filas. Lanches preparados na hora, porções crocantes, bebidas e sobremesas!', 
  'SNACK BAR & GASTRONOMIA', 
  NULL, 
  true
WHERE NOT EXISTS (SELECT 1 FROM menu_banner);

-- 5. Recarregar o cache do PostgREST (Supabase)
SELECT pg_notify('pgrst', 'reload schema');
