-- 0005_add_home_and_contact_settings.sql
-- Migração para suporte a vídeo e imagem de fundo da Home e informações de contato do rodapé

CREATE TABLE IF NOT EXISTS home_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_video_url TEXT,
  hero_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL DEFAULT 'Av. das Atrações, 1500 — Complexo de Lazer',
  phone_primary TEXT NOT NULL DEFAULT '(11) 98765-4321',
  phone_secondary TEXT DEFAULT '(11) 4004-1234',
  email TEXT NOT NULL DEFAULT 'contato@familyfuntown.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir dados padrão caso as tabelas estejam vazias
INSERT INTO home_settings (id, hero_video_url, hero_image_url)
SELECT '00000000-0000-0000-0000-000000000001', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM home_settings);

INSERT INTO site_contact_info (id, address, phone_primary, phone_secondary, email)
SELECT '00000000-0000-0000-0000-000000000001', 'Av. das Atrações, 1500 — Complexo de Lazer', '(11) 98765-4321', '(11) 4004-1234', 'contato@familyfuntown.com'
WHERE NOT EXISTS (SELECT 1 FROM site_contact_info);

-- Recarregar cache de schema do PostgREST no Supabase
SELECT pg_notify('pgrst', 'reload schema');
