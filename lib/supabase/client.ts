import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseUrl, getPublicSupabaseAnonKey } from './env';

export function createClient() {
  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseAnonKey = getPublicSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    // Graceful fallback for build-time evaluation or unconfigured environment
    return null as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
