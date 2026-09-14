import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';
import { createAdminSchema } from '@/lib/security/validation';
import { logAdminAction } from '@/lib/security/audit';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'MANAGE_ADMINS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  try {
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, auth_user_id, email, name, is_active, last_login_at, created_at, role:admin_roles(id, name, description)')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const { data: roles } = await supabase.from('admin_roles').select('*');

    return NextResponse.json({ admins: admins || [], roles: roles || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar administradores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'MANAGE_ADMINS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const parseResult = createAdminSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.errors[0]?.message || 'Dados inválidos' }, { status: 400 });
  }

  const { email, name, roleName, password } = parseResult.data;

  try {
    // 1. Get role ID
    const { data: roleRecord } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (!roleRecord) {
      return NextResponse.json({ error: 'Cargo especificado não existe' }, { status: 400 });
    }

    // 2. Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: roleName },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Falha ao criar usuário no Supabase Auth' }, { status: 400 });
    }

    // 3. Insert into admin_users
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        auth_user_id: authData.user.id,
        email,
        name,
        role_id: roleRecord.id,
        is_active: true,
      })
      .select('*, role:admin_roles(name)')
      .single();

    if (insertError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw insertError;
    }

    // 4. Audit Log
    await logAdminAction({
      adminUserId: admin.id,
      action: 'CREATE_ADMIN_USER',
      targetType: 'ADMIN_USER',
      targetId: newAdmin.id,
      afterData: { email, name, roleName },
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar administrador' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'MANAGE_ADMINS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const { adminId, isActive, roleId } = body;
  if (!adminId) {
    return NextResponse.json({ error: 'adminId é obrigatório' }, { status: 400 });
  }

  try {
    // Prevent modifying self to inactive
    if (adminId === admin.id && isActive === false) {
      return NextResponse.json({ error: 'Você não pode desativar sua própria conta' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (typeof isActive === 'boolean') updates.is_active = isActive;
    if (roleId) updates.role_id = roleId;

    const { data: updated, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', adminId)
      .select('*, role:admin_roles(name)')
      .single();

    if (error) throw error;

    await logAdminAction({
      adminUserId: admin.id,
      action: 'UPDATE_ADMIN_USER',
      targetType: 'ADMIN_USER',
      targetId: adminId,
      afterData: updates,
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar administrador' }, { status: 500 });
  }
}
