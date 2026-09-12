import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { verifyAdminToken, AuthError } from '../_shared/verifyAdmin.ts';

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

async function readStorageFallback(supabase: any) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_CONFIG_FILE);

    if (!error && data) {
      const text = await data.text();
      return JSON.parse(text);
    }
  } catch {
    // tenta legado
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

async function writeStorageFallback(supabase: any, settings: any) {
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(JSON.stringify(settings, null, 2));
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_CONFIG_FILE, bytes, {
        contentType: 'application/json',
        upsert: true,
      });
  } catch (err) {
    console.warn('[Site Settings] Erro ao salvar fallback em storage:', err);
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const method = req.method;

  if (!['GET', 'POST', 'PUT'].includes(method)) {
    return errorResponse(`Método ${method} não suportado.`, 405);
  }

  const supabase = getSupabaseClient();

  // GET: Obter configurações (Público ou Admin)
  if (method === 'GET') {
    try {
      let homeData: any = null;
      let contactData: any = null;
      let activeTheme = DEFAULT_SETTINGS.activeTheme;

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

      const fallback = await readStorageFallback(supabase);
      if (fallback) {
        if (
          fallback.activeTheme &&
          ['oficial', 'dark', 'turquesa', 'acolhedor'].includes(fallback.activeTheme)
        ) {
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
        activeTheme: ['oficial', 'dark', 'turquesa', 'acolhedor'].includes(activeTheme)
          ? activeTheme
          : 'oficial',
        home: homeData || DEFAULT_SETTINGS.home,
        contact: contactData || DEFAULT_SETTINGS.contact,
      };

      return jsonResponse(responsePayload, 200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      });
    } catch (err: any) {
      console.error('[Site Settings] Erro ao carregar configurações:', err);
      return jsonResponse({
        success: true,
        ...DEFAULT_SETTINGS,
      });
    }
  }

  // POST / PUT: Requer Admin
  try {
    verifyAdminToken(req);
  } catch (authErr: any) {
    return errorResponse(
      authErr.message || 'Não autorizado.',
      authErr instanceof AuthError ? authErr.statusCode : 401
    );
  }

  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return errorResponse('Payload JSON inválido.', 400);
    }

    const { home, contact, activeTheme, active_theme } = payload;
    const rawTheme = activeTheme || active_theme;
    const toSaveTheme = ['oficial', 'dark', 'turquesa', 'acolhedor'].includes(rawTheme)
      ? rawTheme
      : undefined;

    const rawVideoUrl = home?.heroVideoUrl ?? home?.hero_video_url;
    const rawImageUrl = home?.heroImageUrl ?? home?.hero_image_url;

    const toSaveHome = {
      heroVideoUrl:
        typeof rawVideoUrl === 'string' && rawVideoUrl.trim().length > 0
          ? rawVideoUrl.trim()
          : null,
      heroImageUrl:
        typeof rawImageUrl === 'string' && rawImageUrl.trim().length > 0
          ? rawImageUrl.trim()
          : null,
    };

    const toSaveContact = {
      address: contact?.address?.trim() || DEFAULT_SETTINGS.contact.address,
      phonePrimary:
        contact?.phonePrimary?.trim() ||
        contact?.phone_primary?.trim() ||
        DEFAULT_SETTINGS.contact.phonePrimary,
      phoneSecondary: contact?.phoneSecondary?.trim() || contact?.phone_secondary?.trim() || null,
      email: contact?.email?.trim() || DEFAULT_SETTINGS.contact.email,
    };

    let savedDbHome = false;
    let savedDbContact = false;

    try {
      const { data: existingHome } = await supabase.from('home_settings').select('id').limit(1);
      const baseUpdateData = {
        hero_video_url: toSaveHome.heroVideoUrl,
        hero_image_url: toSaveHome.heroImageUrl,
        updated_at: new Date().toISOString(),
      };

      if (existingHome && existingHome.length > 0) {
        let updated = false;
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
        if (!updated) {
          const updateRes = await supabase
            .from('home_settings')
            .update(baseUpdateData)
            .eq('id', existingHome[0].id);
          if (!updateRes.error) {
            savedDbHome = true;
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
          }
        }
      }
    } catch (err) {
      console.warn('[Site Settings] Aviso ao gravar home_settings:', err);
    }

    try {
      const { data: existingContact } = await supabase
        .from('site_contact_info')
        .select('id')
        .limit(1);
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
      console.warn('[Site Settings] Aviso ao gravar site_contact_info:', err);
    }

    const previousFallback = (await readStorageFallback(supabase)) || {};
    const finalTheme = toSaveTheme || previousFallback.activeTheme || DEFAULT_SETTINGS.activeTheme;

    const unified = {
      activeTheme: finalTheme,
      home: toSaveHome,
      contact: toSaveContact,
      savedDb: { home: savedDbHome, contact: savedDbContact },
      updatedAt: new Date().toISOString(),
    };
    await writeStorageFallback(supabase, unified);

    return jsonResponse({
      success: true,
      message: 'Configurações salvas com sucesso!',
      activeTheme: finalTheme,
      home: toSaveHome,
      contact: toSaveContact,
    });
  } catch (error: any) {
    console.error('[Site Settings] Erro ao salvar configurações:', error);
    return errorResponse(error?.message || 'Erro interno ao salvar configurações.', 500);
  }
});
