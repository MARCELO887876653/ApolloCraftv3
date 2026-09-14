import { NextResponse } from 'next/server';
import { authenticateMinecraftRequest } from '@/lib/minecraft/hmac-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { normalizeGamertag } from '@/lib/security/crypto';

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

  const { gamertag, sessionSeconds } = body;
  if (!gamertag) {
    return NextResponse.json({ error: 'Gamertag is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const normalized = normalizeGamertag(gamertag);
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('normalized_gamertag', normalized)
      .single();

    if (player) {
      const now = new Date().toISOString();
      // Update most recent open connection for this player
      await supabase
        .from('player_connections')
        .update({
          disconnected_at: now,
          session_duration_seconds: typeof sessionSeconds === 'number' ? sessionSeconds : null,
        })
        .eq('player_id', player.id)
        .is('disconnected_at', null);

      await supabase
        .from('players')
        .update({ last_seen: now })
        .eq('id', player.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
