import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseUrl, getServerSupabaseSecretKey } from './env';

// SERVER-SIDE ONLY. Never import or run this on the client.
let adminClient: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any, "public", any> | null {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY VIOLATION: Supabase Admin Secret Key accessed on client!');
  }

  const supabaseUrl = getServerSupabaseUrl();
  const serviceRoleKey = getServerSupabaseSecretKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
