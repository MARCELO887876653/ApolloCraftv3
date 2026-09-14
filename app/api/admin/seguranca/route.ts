import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';
import { maskIp } from '@/lib/security/crypto';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'VIEW_SECURITY_DATA')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '20', 10)));
  const severity = url.searchParams.get('severity') || '';
  const eventType = url.searchParams.get('type') || '';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const canViewIp = hasPermission(admin.roleName, 'VIEW_IP');

    let query = supabase
      .from('security_events')
      .select('*, player:players(id, gamertag, risk_score, status)', { count: 'exact' });

    if (severity && severity !== 'ALL') {
      query = query.eq('severity', severity);
    }
    if (eventType && eventType !== 'ALL') {
      query = query.eq('event_type', eventType);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: events, count, error } = await query;
    if (error) throw error;

    const sanitizedEvents = (events || []).map((ev) => ({
      ...ev,
      ip_address: canViewIp ? ev.ip_address : maskIp(ev.ip_address || ''),
    }));

    return NextResponse.json({
      events: sanitizedEvents,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar eventos' }, { status: 500 });
  }
}
