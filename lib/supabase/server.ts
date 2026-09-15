import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerSupabaseUrl, getServerSupabaseAnonKey } from './env';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = getServerSupabaseUrl();
  const supabaseAnonKey = getServerSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component
        }
      },
    },
  });
}
