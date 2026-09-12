import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from './utils/verify-admin.js';

const STORAGE_BUCKET = 'site-config';
const STORAGE_CONFIG_FILE = 'settings.json';
const LEGACY_STORAGE_BUCKET = 'package-images';
const LEGACY_STORAGE_CONFIG_FILE = 'site-config/settings.json';

const DEFAULT_SETTINGS = {
  activeTheme: 'oficial',
  home: {
    heroVideoUrl: null,
    heroImageUrl: null,
  },
  contact: {
    address: 'Av. das Atrações, 1500 — Complexo de Lazer',
    phonePrimary: '(11) 98765-4321',
    phoneSecondary: '(11) 4004-1234',
    email: 'contato@familyfuntown.com',
  },
};

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Fallback persistence using Supabase Storage
async function readStorageFallback(supabase) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_CONFIG_FILE);

    if (!error && data) {
      const text = await data.text();
      return JSON.parse(text);
    }
  } catch {
    // tenta fallback legado abaixo
  }

  try {
    const { data: legData, error: legError } = await supabase.storage
      .from(LEGACY_STORAGE_BUCKET)
      .download(LEGACY_STORAGE_CONFIG_FILE);

    if (!legError && legData) {
      const text = await legData.text();
      return JSON.parse(text);
    }
  } catch {
    // ignora
  }

  return null;
}

async function writeStorageFallback(supabase, settings) {
  try {
    const buffer = Buffer.from(JSON.stringify(settings, null, 2), 'utf-8');
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_CONFIG_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });
  } catch (err) {
    console.warn('[Site Settings] Erro ao salvar fallback em storage:', err);
  }
}

export const handler = async (event) => {
  const method = event.httpMethod;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      },
      body: '',
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Supabase não configurado no servidor.' }),
    };
  }

  // --- GET: Obter configurações (Público ou Admin) ---
  if (method === 'GET') {
    try {
      let homeData = null;
      let contactData = null;
      let activeTheme = DEFAULT_SETTINGS.activeTheme;

      // 1. Tentar ler da tabela home_settings
      const { data: homeRows, error: homeError } = await supabase
        .from('home_settings')
        .select('*')
        .limit(1);

      if (!homeError && homeRows && homeRows.length > 0) {
        homeData = {
          heroVideoUrl: homeRows[0].hero_video_url || null,
          heroImageUrl: homeRows[0].hero_image_url || null,
        };
        if (homeRows[0].active_theme) {
          activeTheme = homeRows[0].active_theme;
        }
      }

      // 2. Tentar ler da tabela site_contact_info
      const { data: contactRows, error: contactError } = await supabase
        .from('site_contact_info')
        .select('*')
        .limit(1);

      if (!contactError && contactRows && contactRows.length > 0) {
        contactData = {
          address: contactRows[0].address || DEFAULT_SETTINGS.contact.address,
          phonePrimary: contactRows[0].phone_primary || DEFAULT_SETTINGS.contact.phonePrimary,
          phoneSecondary: contactRows[0].phone_secondary ?? DEFAULT_SETTINGS.contact.phoneSecondary,
          email: contactRows[0].email || DEFAULT_SETTINGS.contact.email,
        };
      }

      // 3. Se alguma tabela não respondeu ou para carregar tema ativo do storage
      const fallback = await readStorageFallback(supabase);
      if (fallback) {
        if (fallback.activeTheme && ['oficial', 'dark', 'turquesa', 'acolhedor'].includes(fallback.activeTheme)) {
          activeTheme = fallback.activeTheme;
        }
        if (!homeData && fallback.home) {
          homeData = fallback.home;
        }
        if (!contactData && fallback.contact) {
          contactData = fallback.contact;
        }
      }

      const responsePayload = {
        success: true,
        activeTheme: ['oficial', 'dark', 'turquesa', 'acolhedor'].includes(activeTheme) ? activeTheme : 'oficial',
        home: homeData || DEFAULT_SETTINGS.home,
        contact: contactData || DEFAULT_SETTINGS.contact,
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify(responsePayload),
      };
    } catch (err) {
      console.error('[Site Settings] Erro ao carregar configurações:', err);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          ...DEFAULT_SETTINGS,
        }),
      };
    }
  }

  // --- POST / PUT: Salvar configurações (Requer Admin) ---
  if (method === 'POST' || method === 'PUT') {
    try {
      verifyAdminToken(event);
    } catch (authErr) {
      return {
        statusCode: authErr.statusCode || 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: authErr.message || 'Não autorizado.' }),
      };
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Payload JSON inválido.' }),
      };
    }

    const { home, contact, activeTheme, active_theme } = payload;
    const rawTheme = activeTheme || active_theme;
    const toSaveTheme = ['oficial', 'dark', 'turquesa', 'acolhedor'].includes(rawTheme) ? rawTheme : undefined;

    // Normalizar dados a salvar (garantir null explícito para URLs vazias ou desativadas)
    const rawVideoUrl = home?.heroVideoUrl ?? home?.hero_video_url;
    const rawImageUrl = home?.heroImageUrl ?? home?.hero_image_url;

    const toSaveHome = {
      heroVideoUrl: (typeof rawVideoUrl === 'string' && rawVideoUrl.trim().length > 0)
        ? rawVideoUrl.trim()
        : null,
      heroImageUrl: (typeof rawImageUrl === 'string' && rawImageUrl.trim().length > 0)
        ? rawImageUrl.trim()
        : null,
    };

    const toSaveContact = {
      address: contact?.address?.trim() || DEFAULT_SETTINGS.contact.address,
      phonePrimary: contact?.phonePrimary?.trim() || contact?.phone_primary?.trim() || DEFAULT_SETTINGS.contact.phonePrimary,
      phoneSecondary: contact?.phoneSecondary?.trim() || contact?.phone_secondary?.trim() || null,
      email: contact?.email?.trim() || DEFAULT_SETTINGS.contact.email,
    };

    let savedDbHome = false;
    let savedDbContact = false;

    // Tentar salvar na tabela home_settings garantindo que a ausência de coluna active_theme não quebre a gravação do hero_video_url
    try {
      const { data: existingHome } = await supabase.from('home_settings').select('id').limit(1);
      const baseUpdateData = {
        hero_video_url: toSaveHome.heroVideoUrl,
        hero_image_url: toSaveHome.heroImageUrl,
        updated_at: new Date().toISOString(),
      };

      if (existingHome && existingHome.length > 0) {
        let updated = false;
        // Se toSaveTheme foi especificado, tenta atualizar com active_theme primeiro caso a coluna exista
        if (toSaveTheme) {
          const tryWithTheme = await supabase
            .from('home_settings')
            .update({ ...baseUpdateData, active_theme: toSaveTheme })
            .eq('id', existingHome[0].id);
          if (!tryWithTheme.error) {
            updated = true;
            savedDbHome = true;
          }
        }
        // Se deu erro (por ex: coluna active_theme não existe na tabela) ou não havia tema, grava com baseUpdateData
        if (!updated) {
          const updateRes = await supabase
            .from('home_settings')
            .update(baseUpdateData)
            .eq('id', existingHome[0].id);
          if (!updateRes.error) {
            savedDbHome = true;
          } else {
            console.error('[Site Settings] Erro ao gravar home_settings:', updateRes.error);
          }
        }
      } else {
        let inserted = false;
        if (toSaveTheme) {
          const tryInsertWithTheme = await supabase.from('home_settings').insert([
            {
              hero_video_url: toSaveHome.heroVideoUrl,
              hero_image_url: toSaveHome.heroImageUrl,
              active_theme: toSaveTheme,
            },
          ]);
          if (!tryInsertWithTheme.error) {
            inserted = true;
            savedDbHome = true;
          }
        }
        if (!inserted) {
          const insertRes = await supabase.from('home_settings').insert([
            {
              hero_video_url: toSaveHome.heroVideoUrl,
              hero_image_url: toSaveHome.heroImageUrl,
            },
          ]);
          if (!insertRes.error) {
            savedDbHome = true;
          } else {
            console.error('[Site Settings] Erro ao inserir home_settings:', insertRes.error);
          }
        }
      }
    } catch (err) {
      console.warn('[Site Settings] Aviso ao gravar tabela home_settings:', err);
    }

    // Tentar salvar na tabela site_contact_info
    try {
      const { data: existingContact } = await supabase.from('site_contact_info').select('id').limit(1);
      if (existingContact && existingContact.length > 0) {
        const { error } = await supabase
          .from('site_contact_info')
          .update({
            address: toSaveContact.address,
            phone_primary: toSaveContact.phonePrimary,
            phone_secondary: toSaveContact.phoneSecondary,
            email: toSaveContact.email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContact[0].id);
        if (!error) savedDbContact = true;
      } else {
        const { error } = await supabase.from('site_contact_info').insert([
          {
            address: toSaveContact.address,
            phone_primary: toSaveContact.phonePrimary,
            phone_secondary: toSaveContact.phoneSecondary,
            email: toSaveContact.email,
          },
        ]);
        if (!error) savedDbContact = true;
      }
    } catch (err) {
      console.warn('[Site Settings] Aviso ao gravar tabela site_contact_info:', err);
    }

    // Carregar fallback prévio para preservar campos não alterados
    const previousFallback = (await readStorageFallback(supabase)) || {};
    const finalTheme = toSaveTheme || previousFallback.activeTheme || DEFAULT_SETTINGS.activeTheme;

    // Sempre manter sincronizado também com fallback em storage para garantir 100% de persistência
    const unified = {
      activeTheme: finalTheme,
      home: toSaveHome,
      contact: toSaveContact,
      savedDb: { home: savedDbHome, contact: savedDbContact },
      updatedAt: new Date().toISOString(),
    };
    await writeStorageFallback(supabase, unified);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Configurações salvas com sucesso!',
        activeTheme: finalTheme,
        home: toSaveHome,
        contact: toSaveContact,
      }),
    };
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: `Método ${method} não suportado.` }),
  };
};
