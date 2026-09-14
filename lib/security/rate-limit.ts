import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sha256 } from './crypto';

export interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
  blockDurationSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: Date;
  isBlocked: boolean;
}

/**
 * Enforces database-backed persistent rate limiting across serverless invocations
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxAttempts: 5, windowSeconds: 300, blockDurationSeconds: 900 }
): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();

  // If Supabase not yet connected (e.g. local dev prior to env setup), fail open gracefully
  if (!supabase) {
    return { allowed: true, remainingAttempts: config.maxAttempts, isBlocked: false };
  }

  const keyHash = sha256(`ratelimit:${identifier}`);
  const now = new Date();

  try {
    const { data: entry } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (entry) {
      // Check if currently blocked
      if (entry.blocked_until && new Date(entry.blocked_until) > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil: new Date(entry.blocked_until),
          isBlocked: true,
        };
      }

      // Check if window expired
      const windowStart = new Date(entry.window_start);
      const windowEnd = new Date(windowStart.getTime() + config.windowSeconds * 1000);

      if (now > windowEnd) {
        // Reset window
        await supabase
          .from('rate_limits')
          .update({
            attempts: 1,
            window_start: now.toISOString(),
            blocked_until: null,
          })
          .eq('key_hash', keyHash);

        return { allowed: true, remainingAttempts: config.maxAttempts - 1, isBlocked: false };
      } else {
        const nextAttempts = entry.attempts + 1;
        const willBlock = nextAttempts > config.maxAttempts;
        const blockedUntil = willBlock
          ? new Date(now.getTime() + config.blockDurationSeconds * 1000).toISOString()
          : null;

        await supabase
          .from('rate_limits')
          .update({
            attempts: nextAttempts,
            blocked_until: blockedUntil,
          })
          .eq('key_hash', keyHash);

        if (willBlock) {
          // Record BRUTE_FORCE_DETECTED security event
          await supabase.from('security_events').insert({
            event_type: 'BRUTE_FORCE_DETECTED',
            severity: 'HIGH',
            metadata: {
              identifier_preview: identifier.slice(0, 8) + '...',
              attempts: nextAttempts,
              blocked_until: blockedUntil,
            },
          });

          return {
            allowed: false,
            remainingAttempts: 0,
            blockedUntil: new Date(blockedUntil!),
            isBlocked: true,
          };
        }

        return {
          allowed: true,
          remainingAttempts: Math.max(0, config.maxAttempts - nextAttempts),
          isBlocked: false,
        };
      }
    } else {
      // Create fresh entry
      await supabase.from('rate_limits').insert({
        key_hash: keyHash,
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      });

      return { allowed: true, remainingAttempts: config.maxAttempts - 1, isBlocked: false };
    }
  } catch (error) {
    console.error('[checkRateLimit] Error checking persistent rate limit:', error);
    return { allowed: true, remainingAttempts: config.maxAttempts, isBlocked: false };
  }
}

/**
 * Resets rate limit counter on successful action (e.g. valid login)
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const keyHash = sha256(`ratelimit:${identifier}`);
  try {
    await supabase.from('rate_limits').delete().eq('key_hash', keyHash);
  } catch (e) {
    // Non-blocking
  }
}
