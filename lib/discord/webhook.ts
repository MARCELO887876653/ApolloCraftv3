import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordNotificationPayload {
  title: string;
  description?: string;
  color?: number; // Hex integer, e.g., 0x8b5cf6 for Apollo purple, 0xef4444 for red
  fields?: DiscordEmbedField[];
  footerText?: string;
  eventType:
    | 'VERIFICATION_SUCCESS'
    | 'VPN_DETECTED'
    | 'PROXY_DETECTED'
    | 'TOR_DETECTED'
    | 'ALT_SUSPECTED'
    | 'BAN_EVASION'
    | 'BAN'
    | 'UNBAN'
    | 'CRITICAL_RISK'
    | 'TEST_NOTIFICATION'
    | 'API_ERROR';
}

const COLORS = {
  purple: 0x8b5cf6, // Apollo Craft Purple
  blue: 0x3b82f6,   // Bedrock Blue
  gold: 0xf59e0b,   // Gold Accent
  red: 0xef4444,    // Ban / Attack / Critical
  green: 0x10b981,  // Verified
};

/**
 * Sends a server-side Discord Webhook notification.
 * Webhook URL is kept strictly on the backend.
 */
export async function sendDiscordNotification(payload: DiscordNotificationPayload): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false; // Silently skip if unconfigured
  }

  // Check discord_settings in Supabase if available
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: settings } = await supabase
        .from('discord_settings')
        .select('*')
        .single();

      if (settings && !settings.is_enabled) {
        return false;
      }
    } catch {
      // Continue with default
    }
  }

  let color = payload.color;
  if (!color) {
    switch (payload.eventType) {
      case 'VERIFICATION_SUCCESS':
        color = COLORS.green;
        break;
      case 'BAN_EVASION':
      case 'CRITICAL_RISK':
      case 'BAN':
        color = COLORS.red;
        break;
      case 'VPN_DETECTED':
      case 'PROXY_DETECTED':
      case 'TOR_DETECTED':
      case 'ALT_SUSPECTED':
        color = COLORS.gold;
        break;
      default:
        color = COLORS.purple;
        break;
    }
  }

  const body = {
    username: 'ApolloCraft Security',
    avatar_url: 'https://apollocraft.online/icon.png',
    embeds: [
      {
        title: `🛡️ APOLLO SECURITY - ${payload.title}`,
        description: payload.description || undefined,
        color: color,
        fields: payload.fields || [],
        footer: {
          text: payload.footerText || 'ApolloCraft Bedrock Security Network',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (error) {
    console.error('[sendDiscordNotification] Error posting to Discord:', error);
    return false;
  }
}
