/**
 * Supabase Environment Configuration Helper
 * 
 * Supports both modern Vercel/Supabase integration variables and legacy variable names:
 * 
 * Public URL:
 * - Client: NEXT_PUBLIC_SUPABASE_URL
 * - Server: NEXT_PUBLIC_SUPABASE_URL, with fallback to SUPABASE_URL
 * 
 * Public Key:
 * - Client: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, with fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Server: SUPABASE_PUBLISHABLE_KEY, with fallback to SUPABASE_ANON_KEY,
 *           then NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * Administrative Secret Key (SERVER-SIDE ONLY):
 * - Server: SUPABASE_SECRET_KEY, with fallback to SUPABASE_SERVICE_ROLE_KEY
 * - GUARANTEED: NEVER exposed to client-side.
 */

/**
 * Returns the Supabase URL for client-side code (browser).
 */
export function getPublicSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

/**
 * Returns the Supabase URL for server-side code.
 * Checks NEXT_PUBLIC_SUPABASE_URL, then falls back to SUPABASE_URL.
 */
export function getServerSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  );
}

/**
 * Returns the public publishable/anon key for client-side usage.
 * Checks NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getPublicSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}

/**
 * Returns the public publishable/anon key for server-side operations.
 * Checks SUPABASE_PUBLISHABLE_KEY, fallback to SUPABASE_ANON_KEY,
 * then NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getServerSupabaseAnonKey(): string {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}

/**
 * Returns the administrative secret key for server-side operations.
 * Checks SUPABASE_SECRET_KEY, fallback to SUPABASE_SERVICE_ROLE_KEY.
 * 
 * CRITICAL SECURITY GUARD: Throws immediately if accessed in browser context.
 */
export function getServerSupabaseSecretKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY VIOLATION: Supabase Secret Key accessed on client-side!');
  }

  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}
