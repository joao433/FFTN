import { createClient } from 'npm:@supabase/supabase-js@^2.49.1';

export function getSupabaseClient() {
  const supabaseUrl =
    Deno.env.get('SUPABASE_URL') ||
    Deno.env.get('VITE_SUPABASE_URL');

  const supabaseServiceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_SECRET_KEY') ||
    Deno.env.get('SUPABASE_ANON_KEY') ||
    Deno.env.get('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estão configurados nas variáveis de ambiente do Supabase.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
