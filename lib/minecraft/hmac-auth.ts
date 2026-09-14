import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sha256, verifyMinecraftSignature } from '../security/crypto';

export interface MinecraftAuthResult {
  isValid: boolean;
  serverId?: string;
  error?: string;
  statusCode: number;
}

const MAX_TIMESTAMP_DRIFT_SECONDS = 300; // 5 minutes

/**
 * Authenticates a request coming from Minecraft Bedrock BDS Server or Dedicated Addon
 * Enforces HMAC-SHA256 and Anti-Replay Protection
 */
export async function authenticateMinecraftRequest(
  request: Request,
  bodyText: string
): Promise<MinecraftAuthResult> {
  const serverId = request.headers.get('x-apollo-server-id');
  const apiKey = request.headers.get('x-apollo-api-key');
  const timestampHeader = request.headers.get('x-apollo-timestamp');
  const nonce = request.headers.get('x-apollo-nonce');
  const signature = request.headers.get('x-apollo-signature');

  if (!serverId || !apiKey || !timestampHeader || !nonce || !signature) {
    return {
      isValid: false,
      error: 'Missing required security headers (x-apollo-server-id, x-apollo-api-key, x-apollo-timestamp, x-apollo-nonce, x-apollo-signature)',
      statusCode: 401,
    };
  }

  // 1. Validate Timestamp to prevent delayed replay attacks
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) {
    return { isValid: false, error: 'Invalid timestamp format', statusCode: 400 };
  }

  const currentEpoch = Math.floor(Date.now() / 1000);
  const timeDrift = Math.abs(currentEpoch - timestamp);

  if (timeDrift > MAX_TIMESTAMP_DRIFT_SECONDS) {
    return {
      isValid: false,
      error: `Timestamp out of acceptable window (${timeDrift}s drift > ${MAX_TIMESTAMP_DRIFT_SECONDS}s max)`,
      statusCode: 401,
    };
  }

  // 2. Validate Nonce & Server in Database
  const supabase = getSupabaseAdmin();
  let serverSecret = '';

  // Check Master credentials fallback first (for initial setup or master nodes)
  const masterKey = process.env.MINECRAFT_API_MASTER_KEY;
  const masterSecret = process.env.MINECRAFT_HMAC_MASTER_SECRET;

  if (masterKey && masterSecret && apiKey === masterKey) {
    serverSecret = masterSecret;
  } else if (supabase) {
    try {
      const keyHash = sha256(apiKey);
      const { data: keyRecord } = await supabase
        .from('server_api_keys')
        .select('*, server_node:server_nodes(*)')
        .eq('key_hash', keyHash)
        .eq('is_revoked', false)
        .single();

      if (!keyRecord || !keyRecord.server_node || !keyRecord.server_node.is_active) {
        return { isValid: false, error: 'API key is invalid, inactive, or revoked', statusCode: 403 };
      }

      if (keyRecord.server_node_id !== serverId) {
        return { isValid: false, error: 'Server ID mismatch with credentials', statusCode: 403 };
      }

      serverSecret = keyRecord.secret_hash;
    } catch (e) {
      return { isValid: false, error: 'Database authentication lookup failed', statusCode: 500 };
    }
  } else {
    return { isValid: false, error: 'No authentication provider configured', statusCode: 500 };
  }

  // 3. Prevent Replay Attack via Nonce Tracking
  if (supabase) {
    try {
      const { data: existingNonce } = await supabase
        .from('used_nonces')
        .select('nonce')
        .eq('nonce', nonce)
        .single();

      if (existingNonce) {
        // Record REPLAY_ATTACK security event
        await supabase.from('security_events').insert({
          event_type: 'REPLAY_ATTACK',
          severity: 'CRITICAL',
          metadata: {
            server_id: serverId,
            replayed_nonce: nonce,
            timestamp: timestampHeader,
          },
        });

        return {
          isValid: false,
          error: 'Replay attack detected: Nonce has already been consumed',
          statusCode: 409,
        };
      }

      // Record nonce with expiration (5 minutes after timestamp)
      const expiresAt = new Date((timestamp + MAX_TIMESTAMP_DRIFT_SECONDS) * 1000).toISOString();
      await supabase.from('used_nonces').insert({
        nonce,
        server_id: serverId,
        expires_at: expiresAt,
      });
    } catch (e) {
      console.warn('[authenticateMinecraftRequest] Nonce table tracking warning:', e);
    }
  }

  // 4. Verify Canonical HMAC-SHA256 Signature
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  const isValidSig = verifyMinecraftSignature({
    method,
    path,
    timestamp: timestampHeader,
    nonce,
    body: bodyText,
    secret: serverSecret,
    signature,
  });

  if (!isValidSig) {
    if (supabase) {
      await supabase.from('security_events').insert({
        event_type: 'INVALID_SERVER_SIGNATURE',
        severity: 'HIGH',
        metadata: {
          server_id: serverId,
          method,
          path,
          timestamp: timestampHeader,
        },
      });
    }

    return {
      isValid: false,
      error: 'Invalid HMAC signature. Check canonical string formatting and shared secret.',
      statusCode: 401,
    };
  }

  return {
    isValid: true,
    serverId,
    statusCode: 200,
  };
}
