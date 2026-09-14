import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

    // Fetch counts in parallel
    const [
      totalPlayersRes,
      verifiedPlayersRes,
      pendingPlayersRes,
      bannedPlayersRes,
      highRiskPlayersRes,
      possibleAltsRes,
      banEvasionsRes,
      verificationsTodayRes,
      eventsLast24hRes,
      vpnCountRes,
      proxyCountRes,
      torCountRes,
      recentEventsRes,
    ] = await Promise.all([
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('players').select('*', { count: 'exact', head: true }).eq('status', 'VERIFIED'),
      supabase.from('players').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('players').select('*', { count: 'exact', head: true }).in('status', ['BANNED', 'TEMP_BANNED']),
      supabase.from('players').select('*', { count: 'exact', head: true }).gte('risk_score', 61),
      supabase.from('player_links').select('*', { count: 'exact', head: true }),
      supabase.from('ban_evasion_events').select('*', { count: 'exact', head: true }).eq('decision_status', 'SUSPECTED'),
      supabase.from('players').select('*', { count: 'exact', head: true }).gte('verified_at', todayStart),
      supabase.from('security_events').select('*', { count: 'exact', head: true }).gte('created_at', yesterday),
      supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('event_type', 'VPN_DETECTED'),
      supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('event_type', 'PROXY_DETECTED'),
      supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('event_type', 'TOR_DETECTED'),
      supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(6),
    ]);

    return NextResponse.json({
      stats: {
        totalPlayers: totalPlayersRes.count || 0,
        verifiedPlayers: verifiedPlayersRes.count || 0,
        pendingPlayers: pendingPlayersRes.count || 0,
        bannedPlayers: bannedPlayersRes.count || 0,
        highRiskPlayers: highRiskPlayersRes.count || 0,
        possibleAlts: possibleAltsRes.count || 0,
        possibleBanEvasions: banEvasionsRes.count || 0,
        verificationsToday: verificationsTodayRes.count || 0,
        eventsLast24h: eventsLast24hRes.count || 0,
        vpnDetected: vpnCountRes.count || 0,
        proxyDetected: proxyCountRes.count || 0,
        torDetected: torCountRes.count || 0,
      },
      recentEvents: recentEventsRes.data || [],
    });
  } catch (error: any) {
    console.error('[GET /api/admin/dashboard] Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
