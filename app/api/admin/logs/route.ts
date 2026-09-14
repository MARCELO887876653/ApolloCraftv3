import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'VIEW_AUDIT_LOG')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '20', 10)));
  const action = url.searchParams.get('action') || '';
  const targetType = url.searchParams.get('targetType') || '';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('admin_logs')
      .select('*, admin_user:admin_users(id, name, email, role:admin_roles(name))', { count: 'exact' });

    if (action && action !== 'ALL') {
      query = query.eq('action', action);
    }
    if (targetType && targetType !== 'ALL') {
      query = query.eq('target_type', targetType);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: logs, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar logs' }, { status: 500 });
  }
}
