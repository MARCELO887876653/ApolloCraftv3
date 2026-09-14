import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'VIEW_PLAYERS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '15', 10)));
  const activeOnly = url.searchParams.get('active') === 'true';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('bans')
      .select('*, player:players(id, gamertag, risk_score, status), issuer:admin_users(id, name, email)', {
        count: 'exact',
      });

    if (activeOnly) {
      query = query.eq('active', true);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: bans, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      bans: bans || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar bans' }, { status: 500 });
  }
}
