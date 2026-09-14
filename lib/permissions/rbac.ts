import { AdminPermissionName, AdminRoleName } from '../types/database';

export const ROLE_PERMISSIONS: Record<AdminRoleName, AdminPermissionName[]> = {
  OWNER: [
    'VIEW_PLAYERS',
    'VIEW_IP',
    'VIEW_NETWORK_DATA',
    'VIEW_SECURITY_DATA',
    'BAN_PLAYER',
    'UNBAN_PLAYER',
    'VERIFY_PLAYER',
    'RESET_VERIFICATION',
    'VIEW_AUDIT_LOG',
    'EDIT_SECURITY_SETTINGS',
    'MANAGE_ADMINS',
    'MANAGE_ROLES',
    'MANAGE_API_KEYS',
    'MANAGE_SERVERS',
    'MANAGE_DISCORD',
  ],
  ADMIN: [
    'VIEW_PLAYERS',
    'VIEW_IP',
    'VIEW_NETWORK_DATA',
    'VIEW_SECURITY_DATA',
    'BAN_PLAYER',
    'UNBAN_PLAYER',
    'VERIFY_PLAYER',
    'RESET_VERIFICATION',
    'VIEW_AUDIT_LOG',
    'EDIT_SECURITY_SETTINGS',
    'MANAGE_API_KEYS',
    'MANAGE_SERVERS',
    'MANAGE_DISCORD',
  ],
  MODERATOR: [
    'VIEW_PLAYERS',
    'VIEW_IP',
    'VIEW_SECURITY_DATA',
    'BAN_PLAYER',
    'UNBAN_PLAYER',
    'VERIFY_PLAYER',
    'RESET_VERIFICATION',
    'VIEW_AUDIT_LOG',
  ],
  SUPPORT: [
    'VIEW_PLAYERS',
    'VIEW_SECURITY_DATA',
    'VERIFY_PLAYER',
  ],
  ANALYST: [
    'VIEW_PLAYERS',
    'VIEW_NETWORK_DATA',
    'VIEW_SECURITY_DATA',
    'VIEW_AUDIT_LOG',
  ],
};

/**
 * Checks whether a given role is granted a specific permission
 */
export function hasPermission(roleName: AdminRoleName, permission: AdminPermissionName): boolean {
  if (roleName === 'OWNER') return true;
  const permissions = ROLE_PERMISSIONS[roleName] || [];
  return permissions.includes(permission);
}
