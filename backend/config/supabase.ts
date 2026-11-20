import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SupabaseHealthStatus } from '../types/index.ts';

// Ensure .env is loaded from project root
dotenv.config();

const supabaseUrl = 
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// Determine whether real credentials have been provided
export const isConfigured = Boolean(
  supabaseUrl &&
  (serviceRoleKey || anonKey) &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('MY_SUPABASE_URL') &&
  supabaseUrl.startsWith('https://')
);

const activeKey = serviceRoleKey || anonKey;

let supabaseInstance: SupabaseClient | null = null;

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`[Supabase Config] Initialized connection to: ${supabaseUrl}`);
    if (serviceRoleKey && !serviceRoleKey.includes('your-service-role')) {
      console.log(`[Supabase Config] Authenticated with Service Role Admin Key (Full Access).`);
    } else {
      console.log(`[Supabase Config] Authenticated with Public Anon Key.`);
    }
  } catch (err) {
    console.error(`[Supabase Config] Initialization failed:`, err);
    supabaseInstance = null;
  }
} else {
  console.log(`[Supabase Config] Live keys not detected. Operating in High-Fidelity Mock Mode.`);
}

export const supabase = supabaseInstance;

/**
 * Perform a live check against the database to confirm connectivity
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthStatus> {
  if (!isConfigured || !supabaseInstance) {
    return {
      isConfigured: false,
      isConnected: false,
      mode: 'fallback_mock',
      message: 'Supabase credentials not configured in .env. Running in offline mock mode with sample inventory.',
      url: supabaseUrl || undefined,
    };
  }

  try {
    const { count, error } = await supabaseInstance
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        isConfigured: true,
        isConnected: false,
        mode: 'fallback_mock',
        message: `Supabase reached, but query returned: ${error.message}. Ensure supabase/schema.sql has been executed.`,
        url: supabaseUrl,
      };
    }

    const { count: supplierCount } = await supabaseInstance
      .from('suppliers')
      .select('*', { count: 'exact', head: true });

    const { count: alertsCount } = await supabaseInstance
      .from('reorder_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return {
      isConfigured: true,
      isConnected: true,
      mode: 'live_supabase',
      message: 'Successfully connected to live Supabase PostgreSQL database.',
      url: supabaseUrl,
      databaseStats: {
        productsCount: count || 0,
        suppliersCount: supplierCount || 0,
        alertsCount: alertsCount || 0,
      },
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      mode: 'fallback_mock',
      message: `Failed to connect to Supabase: ${err.message}`,
      url: supabaseUrl,
    };
  }
}
