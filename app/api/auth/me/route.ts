import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);

  if (!admin) {
    return NextResponse.json({ authenticated: false, admin: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.roleName,
      permissions: admin.permissions,
    },
  });
}
