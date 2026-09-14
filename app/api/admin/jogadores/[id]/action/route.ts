import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';
import { logAdminAction } from '@/lib/security/audit';
import { updatePlayerRiskScore } from '@/lib/security/risk-calculator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await getCurrentAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
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

  const { action, payload } = body;
  if (!action) {
    return NextResponse.json({ error: 'Ação é obrigatória' }, { status: 400 });
  }

  try {
    // 1. Fetch current player state for before_data
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (playerErr || !player) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    const now = new Date().toISOString();

    switch (action) {
      case 'MANUAL_VERIFY': {
        if (!hasPermission(admin.roleName, 'VERIFY_PLAYER')) {
          return NextResponse.json({ error: 'Sem permissão para verificar jogadores' }, { status: 403 });
        }
        await supabase
          .from('players')
          .update({ status: 'VERIFIED', verified_at: now, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'MANUAL_VERIFY',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: 'VERIFIED', verified_at: now },
        });
        break;
      }

      case 'REVOKE_VERIFICATION': {
        if (!hasPermission(admin.roleName, 'RESET_VERIFICATION')) {
          return NextResponse.json({ error: 'Sem permissão para revogar verificação' }, { status: 403 });
        }
        await supabase
          .from('players')
          .update({ status: 'PENDING', verified_at: null, updated_at: now })
          .eq('id', id);

        // Also revoke any active codes
        await supabase
          .from('verification_codes')
          .update({ status: 'REVOKED' })
          .eq('player_id', id)
          .eq('status', 'ACTIVE');

        await logAdminAction({
          adminUserId: admin.id,
          action: 'REVOKE_VERIFICATION',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status, verified_at: player.verified_at },
          afterData: { status: 'PENDING', verified_at: null },
        });
        break;
      }

      case 'REQUIRE_REVERIFICATION': {
        if (!hasPermission(admin.roleName, 'RESET_VERIFICATION')) {
          return NextResponse.json({ error: 'Sem permissão para exigir nova verificação' }, { status: 403 });
        }
        await supabase
          .from('players')
          .update({ status: 'PENDING', verified_at: null, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'REQUIRE_REVERIFICATION',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: 'PENDING' },
        });
        break;
      }

      case 'RESTRICT': {
        await supabase
          .from('players')
          .update({ status: 'RESTRICTED', updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'RESTRICT_PLAYER',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: 'RESTRICTED' },
        });
        break;
      }

      case 'UNRESTRICT': {
        const nextStatus = player.verified_at ? 'VERIFIED' : 'PENDING';
        await supabase
          .from('players')
          .update({ status: nextStatus, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'UNRESTRICT_PLAYER',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: nextStatus },
        });
        break;
      }

      case 'MANUAL_REVIEW': {
        await supabase
          .from('players')
          .update({ status: 'MANUAL_REVIEW', updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'SET_MANUAL_REVIEW',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: 'MANUAL_REVIEW' },
        });
        break;
      }

      case 'BAN': {
        if (!hasPermission(admin.roleName, 'BAN_PLAYER')) {
          return NextResponse.json({ error: 'Sem permissão para banir jogadores' }, { status: 403 });
        }
        const { type = 'PERMANENT', reasonPublic, reasonInternal, durationDays } = payload || {};
        if (!reasonPublic || !reasonInternal) {
          return NextResponse.json({ error: 'Motivos público e interno são obrigatórios' }, { status: 400 });
        }

        const expiresAt =
          type === 'TEMPORARY' && durationDays
            ? new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString()
            : null;

        const newStatus = type === 'TEMPORARY' ? 'TEMP_BANNED' : 'BANNED';

        // 1. Insert Ban record
        await supabase.from('bans').insert({
          player_id: id,
          type,
          reason_public: reasonPublic,
          reason_internal: reasonInternal,
          issuer_admin_id: admin.id,
          active: true,
          expires_at: expiresAt,
        });

        // 2. Update player status
        await supabase
          .from('players')
          .update({ status: newStatus, updated_at: now })
          .eq('id', id);

        // 3. Revoke any active codes
        await supabase
          .from('verification_codes')
          .update({ status: 'REVOKED' })
          .eq('player_id', id)
          .eq('status', 'ACTIVE');

        await logAdminAction({
          adminUserId: admin.id,
          action: 'BAN_PLAYER',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: newStatus, type, reasonPublic, reasonInternal, expiresAt },
        });
        break;
      }

      case 'UNBAN': {
        if (!hasPermission(admin.roleName, 'UNBAN_PLAYER')) {
          return NextResponse.json({ error: 'Sem permissão para desbanir jogadores' }, { status: 403 });
        }
        const { unbanReason = 'Desbanido administrativamente' } = payload || {};

        // Deactivate all active bans for player
        await supabase
          .from('bans')
          .update({
            active: false,
            unbanned_at: now,
            unbanned_by: admin.id,
            unban_reason: unbanReason,
          })
          .eq('player_id', id)
          .eq('active', true);

        const nextStatus = player.verified_at ? 'VERIFIED' : 'PENDING';
        await supabase
          .from('players')
          .update({ status: nextStatus, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'UNBAN_PLAYER',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { status: player.status },
          afterData: { status: nextStatus, unbanReason },
        });
        break;
      }

      case 'ADD_NOTE': {
        const { notes } = payload || {};
        await supabase
          .from('players')
          .update({ notes, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'UPDATE_PLAYER_NOTES',
          targetType: 'PLAYER',
          targetId: id,
          beforeData: { notes: player.notes },
          afterData: { notes },
        });
        break;
      }

      case 'RECALCULATE_RISK': {
        // Fetch networks to determine risk
        const { data: networks } = await supabase
          .from('player_networks')
          .select('*')
          .eq('player_id', id);

        const hasVpn = networks?.some((n) => n.is_vpn) || false;
        const hasProxy = networks?.some((n) => n.is_proxy) || false;
        const hasTor = networks?.some((n) => n.is_tor) || false;

        const updated = await updatePlayerRiskScore(
          id,
          { isVpn: hasVpn, isProxy: hasProxy, isTor: hasTor },
          'Recálculo manual solicitado pelo painel admin',
          admin.email
        );

        await logAdminAction({
          adminUserId: admin.id,
          action: 'RECALCULATE_RISK',
          targetType: 'PLAYER',
          targetId: id,
          afterData: { recalculatedRisk: updated?.score },
        });
        break;
      }

      case 'MARK_ALT': {
        await supabase
          .from('players')
          .update({ is_alt: true, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'MARK_PLAYER_AS_ALT',
          targetType: 'PLAYER',
          targetId: id,
          afterData: { is_alt: true },
        });
        break;
      }

      case 'UNMARK_ALT': {
        await supabase
          .from('players')
          .update({ is_alt: false, updated_at: now })
          .eq('id', id);

        await logAdminAction({
          adminUserId: admin.id,
          action: 'UNMARK_PLAYER_AS_ALT',
          targetType: 'PLAYER',
          targetId: id,
          afterData: { is_alt: false },
        });
        break;
      }

      case 'REVOKE_ACTIVE_CODES': {
        await supabase
          .from('verification_codes')
          .update({ status: 'REVOKED' })
          .eq('player_id', id)
          .eq('status', 'ACTIVE');

        await logAdminAction({
          adminUserId: admin.id,
          action: 'REVOKE_ACTIVE_CODES',
          targetType: 'PLAYER',
          targetId: id,
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Ação ${action} executada com sucesso.` });
  } catch (error: any) {
    console.error('[POST /api/admin/jogadores/[id]/action] Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao executar ação administrativa' }, { status: 500 });
  }
}
