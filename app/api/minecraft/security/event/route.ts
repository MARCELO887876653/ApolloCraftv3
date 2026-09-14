import { NextResponse } from 'next/server';
import { authenticateMinecraftRequest } from '@/lib/minecraft/hmac-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { minecraftSecurityEventSchema } from '@/lib/security/validation';
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

  const parseResult = minecraftSecurityEventSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors[0]?.message || 'Invalid event payload' },
      { status: 400 }
    );
  }

  const { gamertag, eventType, severity, metadata } = parseResult.data;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    let playerId: string | null = null;
    if (gamertag) {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('normalized_gamertag', normalizeGamertag(gamertag))
        .single();

      if (player) {
        playerId = player.id;
      }
    }

    await supabase.from('security_events').insert({
      player_id: playerId,
      event_type: eventType,
      severity: severity,
      metadata: {
        ...metadata,
        server_id: auth.serverId,
        gamertag: gamertag || null,
      },
    });

    return NextResponse.json({ success: true, recordedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
