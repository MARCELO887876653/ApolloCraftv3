import { NextResponse } from 'next/server';
import { authenticateMinecraftRequest } from '@/lib/minecraft/hmac-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { minecraftJoinSchema } from '@/lib/security/validation';
import { normalizeGamertag, hashIp } from '@/lib/security/crypto';

export async function POST(request: Request) {
  const bodyText = await request.text();
  const auth = await authenticateMinecraftRequest(request, bodyText);

  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  let body: any;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parseResult = minecraftJoinSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || 'Invalid join payload' },
      { status: 400 }
    );
  }

  const { gamertag, xuid, platform, clientId, deviceModel, deviceOs, ipAddress } = parseResult.data;
  const normalized = normalizeGamertag(gamertag);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const now = new Date().toISOString();

    // 1. Find or create player record
    let { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('normalized_gamertag', normalized)
      .single();

    if (!player) {
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert({
          gamertag,
          normalized_gamertag: normalized,
          xuid: xuid || null,
          status: 'PENDING',
          first_seen: now,
          last_seen: now,
          join_count: 1,
        })
        .select()
        .single();

      if (createError || !newPlayer) {
        throw new Error(createError?.message || 'Failed to create player record');
      }
      player = newPlayer;
    } else {
      // Update existing player
      await supabase
        .from('players')
        .update({
          gamertag, // update in case case changes
          xuid: xuid || player.xuid,
          last_seen: now,
          join_count: (player.join_count || 1) + 1,
          updated_at: now,
        })
        .eq('id', player.id);
    }

    // 2. Record Player Identity if device info provided
    if (clientId || deviceModel || deviceOs) {
      await supabase.from('player_identities').insert({
        player_id: player.id,
        platform: platform || 'Bedrock',
        client_id: clientId || null,
        device_model: deviceModel || null,
        device_os: deviceOs || null,
      });
    }

    // 3. Record Connection Event
    const ipHash = ipAddress ? hashIp(ipAddress) : null;
    await supabase.from('player_connections').insert({
      player_id: player.id,
      server_id: auth.serverId || 'bedrock-main',
      connected_at: now,
      ip_hash: ipHash,
    });

    // 4. Check active bans
    const { data: activeBan } = await supabase
      .from('bans')
      .select('*')
      .eq('player_id', player.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (activeBan) {
      // If temporary ban, verify whether it has expired
      if (activeBan.type === 'TEMPORARY' && activeBan.expires_at) {
        if (new Date(activeBan.expires_at) < new Date()) {
          // Ban expired! Lift it automatically
          await supabase
            .from('bans')
            .update({
              active: false,
              unbanned_at: now,
              unban_reason: 'Ban temporário expirou automaticamente',
            })
            .eq('id', activeBan.id);

          await supabase
            .from('players')
            .update({ status: player.verified_at ? 'VERIFIED' : 'PENDING' })
            .eq('id', player.id);
        } else {
          // Ban still active
          return NextResponse.json({
            allowed: false,
            action: 'KICK',
            status: 'TEMP_BANNED',
            reason: `Você está temporariamente banido: ${activeBan.reason_public}`,
            expiresAt: activeBan.expires_at,
          });
        }
      } else {
        // Permanent ban
        return NextResponse.json({
          allowed: false,
          action: 'KICK',
          status: 'BANNED',
          reason: `Você está permanentemente banido: ${activeBan.reason_public}`,
        });
      }
    }

    // 5. Check Verification Status
    const isVerified = player.status === 'VERIFIED';

    return NextResponse.json({
      allowed: isVerified,
      playerId: player.id,
      gamertag: player.gamertag,
      status: player.status,
      isVerified,
      riskScore: player.risk_score,
      action: isVerified ? 'ALLOW' : 'VERIFICATION_REQUIRED',
    });
  } catch (error: any) {
    console.error('[POST /api/minecraft/player/join] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
