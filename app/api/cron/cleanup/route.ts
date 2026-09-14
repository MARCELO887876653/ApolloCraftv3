import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const now = new Date();
    // Retention defaults:
    // IPs / player_networks: 90 days
    // Connections: 180 days
    // Security events: 365 days
    const ipRetentionDate = new Date(now.getTime() - 90 * 24 * 3600 * 1000).toISOString();
    const connRetentionDate = new Date(now.getTime() - 180 * 24 * 3600 * 1000).toISOString();
    const secRetentionDate = new Date(now.getTime() - 365 * 24 * 3600 * 1000).toISOString();

    const [networksRes, connsRes, eventsRes] = await Promise.all([
      supabase.from('player_networks').delete().lt('created_at', ipRetentionDate),
      supabase.from('player_connections').delete().lt('connected_at', connRetentionDate),
      supabase.from('security_events').delete().lt('created_at', secRetentionDate),
    ]);

    return NextResponse.json({
      success: true,
      cleanedAt: now.toISOString(),
      retentionPolicyApplied: {
        playerNetworksOlderThan: '90 days',
        playerConnectionsOlderThan: '180 days',
        securityEventsOlderThan: '365 days',
      },
      errors: {
        networks: networksRes.error?.message || null,
        connections: connsRes.error?.message || null,
        securityEvents: eventsRes.error?.message || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
