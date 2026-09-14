import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { setupOwnerSchema } from '@/lib/security/validation';
import { logAdminAction } from '@/lib/security/audit';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      supabaseConnected: false,
      message: 'Supabase não conectado ou variáveis de ambiente ausentes.',
    });
  }

  try {
    // Check if any admin user with role OWNER exists
    const { data: ownerRole } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('name', 'OWNER')
      .single();

    if (!ownerRole) {
      return NextResponse.json({
        configured: false,
        ownerExists: false,
        supabaseConnected: true,
      });
    }

    const { count, error } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', ownerRole.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ownerExists = (count || 0) > 0;
    return NextResponse.json({
      configured: true,
      supabaseConnected: true,
      ownerExists,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. Enforce rate limiting on setup endpoint
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const rateLimit = await checkRateLimit(`setup:${clientIp}`, {
    maxAttempts: 5,
    windowSeconds: 600,
    blockDurationSeconds: 1800,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas de configuração. Bloqueado temporariamente por segurança.' },
      { status: 429 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase não está configurado. Configure as variáveis de ambiente no Vercel/.env.local.' },
      { status: 503 }
    );
  }

  // 2. Validate request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const parseResult = setupOwnerSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  const { name, email, password } = parseResult.data;

  try {
    // 3. Backend verification: Ensure OWNER role exists and NO OWNER has been created yet
    const { data: ownerRole } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('name', 'OWNER')
      .single();

    if (!ownerRole) {
      return NextResponse.json(
        { error: 'Função de sistema OWNER não encontrada no banco. Execute as migrations primeiro.' },
        { status: 500 }
      );
    }

    const { count: existingOwners } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', ownerRole.id);

    if ((existingOwners || 0) > 0) {
      return NextResponse.json(
        { error: 'Configuração inicial já concluída. Já existe um OWNER registrado.' },
        { status: 403 }
      );
    }

    // 4. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'OWNER' },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Falha ao criar usuário administrativo no Supabase Auth.' },
        { status: 400 }
      );
    }

    // 5. Create entry in admin_users
    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        auth_user_id: authData.user.id,
        email,
        name,
        role_id: ownerRole.id,
        is_active: true,
      })
      .select()
      .single();

    if (adminError || !adminRecord) {
      // Cleanup auth user if DB insert failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: adminError?.message || 'Falha ao registrar perfil de administrador.' },
        { status: 500 }
      );
    }

    // 6. Record immutable audit log
    await logAdminAction({
      adminUserId: adminRecord.id,
      action: 'INITIAL_OWNER_SETUP',
      targetType: 'SYSTEM',
      targetId: adminRecord.id,
      afterData: { email, name, role: 'OWNER' },
    });

    return NextResponse.json({
      success: true,
      message: 'Proprietário inicial criado com sucesso!',
      adminUser: { id: adminRecord.id, email: adminRecord.email, name: adminRecord.name },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro inesperado durante a configuração inicial.' },
      { status: 500 }
    );
  }
}
