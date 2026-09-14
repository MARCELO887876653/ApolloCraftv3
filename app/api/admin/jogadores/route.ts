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
  const search = url.searchParams.get('search')?.trim().toLowerCase() || '';
  const status = url.searchParams.get('status') || '';
  const risk = url.searchParams.get('risk') || '';
  const sortBy = url.searchParams.get('sortBy') || 'last_seen';
  const order = url.searchParams.get('order') === 'asc' ? true : false;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase.from('players').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('gamertag', `%${search}%`);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (risk === 'HIGH') {
      query = query.gte('risk_score', 61);
    } else if (risk === 'SUSPICIOUS') {
      query = query.gte('risk_score', 41).lte('risk_score', 60);
    } else if (risk === 'NORMAL') {
      query = query.lte('risk_score', 20);
    }

    const validSortFields = ['last_seen', 'first_seen', 'risk_score', 'gamertag', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'last_seen';

    query = query.order(sortField, { ascending: order }).range(from, to);

    const { data: players, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      players: players || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/jogadores] Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar jogadores' }, { status: 500 });
  }
}
