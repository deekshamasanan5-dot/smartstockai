import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// Validate whether real credentials are provided or if placeholder/default strings are present
export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('MY_SUPABASE_URL') &&
  supabaseUrl.startsWith('https://')
);

let supabaseInstance: SupabaseClient | null = null;

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase Client] Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
} else {
  // Helpful log for developers in console
  console.info(
    '[Supabase Client] Running in offline/mock fallback mode. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to live Supabase.'
  );
}

export const supabase = supabaseInstance;
export const isSupabaseLive = isConfigured && supabaseInstance !== null;
