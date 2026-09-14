import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ROLE_PERMISSIONS } from '../permissions/rbac';
import { AdminPermissionName, AdminRoleName } from '../types/database';

export interface CurrentAdmin {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  roleName: AdminRoleName;
  permissions: AdminPermissionName[];
}

/**
 * Extracts and validates the authenticated admin user from the Request headers/cookies
 */
export async function getCurrentAdmin(request: Request): Promise<CurrentAdmin | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // Check Bearer token or Cookie
  const authHeader = request.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    // Check cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) return null;

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return null;
    }

    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .select('*, role:admin_roles(*)')
      .eq('auth_user_id', userData.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminRecord || !adminRecord.role) {
      return null;
    }

    const roleName = adminRecord.role.name as AdminRoleName;
    const permissions = ROLE_PERMISSIONS[roleName] || [];

    return {
      id: adminRecord.id,
      authUserId: adminRecord.auth_user_id,
      email: adminRecord.email,
      name: adminRecord.name,
      roleName,
      permissions,
    };
  } catch {
    return null;
  }
}
