import { createClient, SupabaseClient } from '@supabase/supabase-js';

// SERVER-SIDE ONLY. Never import or run this on the client.
let adminClient: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any, "public", any> | null {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY VIOLATION: SUPABASE_SERVICE_ROLE_KEY accessed on client!');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
