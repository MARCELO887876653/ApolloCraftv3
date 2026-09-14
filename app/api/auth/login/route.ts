import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/security/validation';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/audit';

export async function POST(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  // 1. Rate limiting: max 5 failed attempts per 5 minutes
  const rateLimit = await checkRateLimit(`login:${clientIp}`, {
    maxAttempts: 5,
    windowSeconds: 300,
    blockDurationSeconds: 900,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas incorretas de login. Bloqueado temporariamente por segurança.' },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
  }

  const { email, password } = parseResult.data;
  const adminSupabase = getSupabaseAdmin();

  if (!adminSupabase) {
    return NextResponse.json(
      { error: 'Supabase não está configurado. Verifique as variáveis de ambiente.' },
      { status: 503 }
    );
  }

  try {
    // 2. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Credenciais administrativas inválidas' }, { status: 401 });
    }

    // 3. CRITICAL: Check if auth user has active entry in admin_users
    const { data: adminRecord, error: adminQueryError } = await adminSupabase
      .from('admin_users')
      .select('*, role:admin_roles(*)')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (adminQueryError || !adminRecord) {
      // User is in Supabase Auth but NOT in admin_users! Deny administrative access.
      await adminSupabase.auth.admin.signOut(authData.session?.access_token || '');
      return NextResponse.json(
        { error: 'Acesso administrativo negado. Usuário não cadastrado como administrador.' },
        { status: 403 }
      );
    }

    if (!adminRecord.is_active) {
      return NextResponse.json(
        { error: 'Esta conta de administrador foi desativada. Contate o proprietário.' },
        { status: 403 }
      );
    }

    // Update last_login_at
    const now = new Date().toISOString();
    await adminSupabase
      .from('admin_users')
      .update({ last_login_at: now })
      .eq('id', adminRecord.id);

    // Reset rate limiter on successful login
    await resetRateLimit(`login:${clientIp}`);

    // Record login audit log
    await logAdminAction({
      adminUserId: adminRecord.id,
      action: 'ADMIN_LOGIN',
      targetType: 'ADMIN_USER',
      targetId: adminRecord.id,
      afterData: { email, role: adminRecord.role?.name },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminRecord.id,
        email: adminRecord.email,
        name: adminRecord.name,
        role: adminRecord.role?.name,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    });

    // Set auth cookies if server client available
    if (authData.session) {
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (err: any) {
    console.error('[POST /api/auth/login] Error:', err);
    return NextResponse.json({ error: 'Falha durante o login' }, { status: 500 });
  }
}
