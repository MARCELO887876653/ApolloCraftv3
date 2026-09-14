import { NextResponse } from 'next/server';
import { authenticateMinecraftRequest } from '@/lib/minecraft/hmac-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { normalizeGamertag } from '@/lib/security/crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateMinecraftRequest(request, '');

  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('players').select('*');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('normalized_gamertag', normalizeGamertag(id));
    }

    const { data: player, error } = await query.single();

    if (error || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Check active bans
    const { data: ban } = await supabase
      .from('bans')
      .select('*')
      .eq('player_id', player.id)
      .eq('active', true)
      .limit(1)
      .single();

    return NextResponse.json({
      playerId: player.id,
      gamertag: player.gamertag,
      status: player.status,
      isVerified: player.status === 'VERIFIED',
      verifiedAt: player.verified_at,
      riskScore: player.risk_score,
      isAlt: player.is_alt,
      ban: ban
        ? {
            active: true,
            type: ban.type,
            reason: ban.reason_public,
            expiresAt: ban.expires_at,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
