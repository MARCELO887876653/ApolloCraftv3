import { NextResponse } from 'next/server';
import { authenticateMinecraftRequest } from '@/lib/minecraft/hmac-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { minecraftCreateCodeSchema } from '@/lib/security/validation';
import { generateVerificationCode, normalizeGamertag, sha256 } from '@/lib/security/crypto';

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

  const parseResult = minecraftCreateCodeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || 'Invalid parameters' },
      { status: 400 }
    );
  }

  const { gamertag, xuid, ipAddress } = parseResult.data;
  const normalized = normalizeGamertag(gamertag);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const now = new Date();

    // 1. Fetch or create player
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
        })
        .select()
        .single();

      if (createError || !newPlayer) {
        throw new Error(createError?.message || 'Failed to initialize player');
      }
      player = newPlayer;
    }

    // Check if player is already verified
    if (player.status === 'VERIFIED') {
      return NextResponse.json({
        alreadyVerified: true,
        status: 'VERIFIED',
        message: 'Player is already verified.',
      });
    }

    // Check if player is banned
    if (player.status === 'BANNED' || player.status === 'TEMP_BANNED') {
      return NextResponse.json(
        { error: 'Cannot generate verification code for banned player', status: player.status },
        { status: 403 }
      );
    }

    // 2. Revoke any previously ACTIVE codes for this player to prevent multiple open tokens
    await supabase
      .from('verification_codes')
      .update({ status: 'REVOKED' })
      .eq('player_id', player.id)
      .eq('status', 'ACTIVE');

    // 3. Fetch expiration setting (default 15 minutes)
    const { data: settings } = await supabase
      .from('security_settings')
      .select('code_expiration_minutes, max_verification_attempts')
      .single();

    const expirationMinutes = settings?.code_expiration_minutes || 15;
    const maxAttempts = settings?.max_verification_attempts || 5;
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000).toISOString();

    // 4. Generate cryptographically safe code
    const rawCode = generateVerificationCode();
    const codeHash = sha256(rawCode);
    const codePreview = `${rawCode.slice(0, 7)}****${rawCode.slice(-4)}`;

    // 5. Store hash and metadata in database
    const { error: insertError } = await supabase.from('verification_codes').insert({
      player_id: player.id,
      code_hash: codeHash,
      code_display_preview: codePreview,
      expires_at: expiresAt,
      max_attempts: maxAttempts,
      status: 'ACTIVE',
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Create verification session record
    await supabase.from('verification_sessions').insert({
      player_id: player.id,
      server_id: auth.serverId || 'bedrock-main',
      started_at: now.toISOString(),
      status: 'PENDING',
      ip_address: ipAddress || null,
    });

    // Return the plaintext code ONLY to the authenticated Minecraft server to display on title/actionbar
    return NextResponse.json({
      success: true,
      code: rawCode,
      expiresAt,
      expiresInSeconds: expirationMinutes * 60,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://apollocraft.online'}/verificar`,
      instructions: `Acesse apollocraft.online/verificar e insira o código: ${rawCode}`,
    });
  } catch (error: any) {
    console.error('[POST /api/minecraft/verification/create] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
