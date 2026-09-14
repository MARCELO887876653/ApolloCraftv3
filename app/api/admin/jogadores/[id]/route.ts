import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';
import { maskIp } from '@/lib/security/crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await getCurrentAdmin(request);

  if (!admin || !hasPermission(admin.roleName, 'VIEW_PLAYERS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  try {
    const canViewIp = hasPermission(admin.roleName, 'VIEW_IP');

    // 1. Fetch player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    // 2. Fetch related details in parallel
    const [
      identitiesRes,
      networksRes,
      connectionsRes,
      sessionsRes,
      codesRes,
      eventsRes,
      linksRes,
      evasionsRes,
      riskHistoryRes,
      punishmentsRes,
      bansRes,
      logsRes,
    ] = await Promise.all([
      supabase.from('player_identities').select('*').eq('player_id', id).order('created_at', { ascending: false }),
      supabase.from('player_networks').select('*').eq('player_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('player_connections').select('*').eq('player_id', id).order('connected_at', { ascending: false }).limit(20),
      supabase.from('verification_sessions').select('*').eq('player_id', id).order('started_at', { ascending: false }).limit(10),
      supabase.from('verification_codes').select('id, code_display_preview, created_at, expires_at, used_at, attempts, max_attempts, status').eq('player_id', id).order('created_at', { ascending: false }).limit(10),
      supabase.from('security_events').select('*').eq('player_id', id).order('created_at', { ascending: false }).limit(30),
      supabase.from('player_links').select('*, other_player:players!player_links_player_b_fkey(id, gamertag, status, risk_score)').or(`player_a.eq.${id},player_b.eq.${id}`).limit(20),
      supabase.from('ban_evasion_events').select('*, banned_player:players!ban_evasion_events_banned_player_id_fkey(id, gamertag, status)').or(`current_player_id.eq.${id},banned_player_id.eq.${id}`).limit(10),
      supabase.from('player_risk_history').select('*').eq('player_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('punishments').select('*').eq('player_id', id).order('created_at', { ascending: false }),
      supabase.from('bans').select('*').eq('player_id', id).order('created_at', { ascending: false }),
      supabase.from('admin_logs').select('*, admin_user:admin_users(name, email)').eq('target_id', id).order('created_at', { ascending: false }).limit(20),
    ]);

    // Mask IPs if admin lacks VIEW_IP permission
    const sanitizedNetworks = (networksRes.data || []).map((net) => ({
      ...net,
      ip_address: canViewIp ? net.ip_address : maskIp(net.ip_address),
    }));

    return NextResponse.json({
      player,
      identities: identitiesRes.data || [],
      networks: sanitizedNetworks,
      connections: connectionsRes.data || [],
      verificationSessions: sessionsRes.data || [],
      verificationCodes: codesRes.data || [],
      securityEvents: eventsRes.data || [],
      playerLinks: linksRes.data || [],
      banEvasions: evasionsRes.data || [],
      riskHistory: riskHistoryRes.data || [],
      punishments: punishmentsRes.data || [],
      bans: bansRes.data || [],
      adminLogs: logsRes.data || [],
      permissions: { canViewIp },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/jogadores/[id]] Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar detalhes do jogador' }, { status: 500 });
  }
}
