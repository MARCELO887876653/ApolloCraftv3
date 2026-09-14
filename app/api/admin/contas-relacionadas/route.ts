import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'VIEW_SECURITY_DATA')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  try {
    const [linksRes, evasionsRes] = await Promise.all([
      supabase
        .from('player_links')
        .select('*, player_a_data:players!player_links_player_a_fkey(id, gamertag, status, risk_score), player_b_data:players!player_links_player_b_fkey(id, gamertag, status, risk_score)')
        .order('confidence_score', { ascending: false })
        .limit(50),
      supabase
        .from('ban_evasion_events')
        .select('*, current_player:players!ban_evasion_events_current_player_id_fkey(id, gamertag, status, risk_score), banned_player:players!ban_evasion_events_banned_player_id_fkey(id, gamertag, status)')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({
      links: linksRes.data || [],
      evasions: evasionsRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar contas relacionadas' }, { status: 500 });
  }
}
