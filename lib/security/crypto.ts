import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Non-ambiguous character set for Minecraft bedrock players (avoids 0/O, 1/I/L)
const CODE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically secure verification code
 * Format: APOLLO-XXXX-XXXX (e.g. APOLLO-K7P4-91M2)
 */
export function generateVerificationCode(): string {
  const bytes = randomBytes(8);
  let segment1 = '';
  let segment2 = '';

  for (let i = 0; i < 4; i++) {
    segment1 += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }
  for (let i = 4; i < 8; i++) {
    segment2 += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }

  return `APOLLO-${segment1}-${segment2}`;
}

/**
 * Computes a standardized SHA-256 hash of a string
 */
export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Hashes an IP address using SHA-256 with an optional salt for privacy
 */
export function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) || 'apollo_ip_salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/**
 * Masks an IP address for safe display in UI (e.g., 192.168.***.*** or 2001:db8:****)
 */
export function maskIp(ip: string): string {
  if (!ip) return '0.0.0.0';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1] || ''}:****:****`;
  }
  return '***.***.***.***';
}

/**
 * Generates a secure API key pair for Minecraft Bedrock server nodes
 */
export function generateApiKeySecret(): { apiKey: string; apiSecret: string; prefix: string } {
  const prefix = `ap_${randomBytes(4).toString('hex')}`;
  const apiKey = `${prefix}_${randomBytes(24).toString('hex')}`;
  const apiSecret = randomBytes(32).toString('hex');
  return { apiKey, apiSecret, prefix };
}

/**
 * Normalizes gamertag for case-insensitive and whitespace-stripped lookup
 */
export function normalizeGamertag(gamertag: string): string {
  return gamertag.trim().toLowerCase();
}

/**
 * Computes canonical HMAC-SHA256 signature for Minecraft Bedrock API
 * Canonical Format:
 * METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_SHA256
 */
export function computeMinecraftSignature(params: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  body: string;
  secret: string;
}): string {
  const bodyHash = sha256(params.body || '');
  const canonicalString = [
    params.method.toUpperCase(),
    params.path,
    params.timestamp,
    params.nonce,
    bodyHash,
  ].join('\n');

  return createHmac('sha256', params.secret).update(canonicalString).digest('hex');
}

/**
 * Timing-safe signature verification
 */
export function verifyMinecraftSignature(params: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  body: string;
  secret: string;
  signature: string;
}): boolean {
  try {
    const expected = computeMinecraftSignature(params);
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(params.signature, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}
