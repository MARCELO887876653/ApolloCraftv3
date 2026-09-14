import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { randomUUID } from 'node:crypto';

export interface AuditLogPayload {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  requestId?: string;
  ipHash?: string | null;
}

/**
 * Records an immutable audit log entry.
 * Strictly append-only.
 */
export async function logAdminAction(payload: AuditLogPayload): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('admin_logs').insert({
      admin_user_id: payload.adminUserId,
      action: payload.action,
      target_type: payload.targetType,
      target_id: payload.targetId || null,
      before_data: payload.beforeData || null,
      after_data: payload.afterData || null,
      request_id: payload.requestId || randomUUID(),
      ip_hash: payload.ipHash || null,
    });
  } catch (error) {
    console.error('[logAdminAction] Error writing audit log:', error);
  }
}
