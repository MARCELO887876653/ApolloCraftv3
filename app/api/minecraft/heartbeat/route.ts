import { NextResponse } from 'next/server';
import { authenticateMinecraftRequest } from '@/lib/minecraft/hmac-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const bodyText = await request.text();
  const auth = await authenticateMinecraftRequest(request, bodyText);

  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  let body: any = {};
  try {
    if (bodyText) body = JSON.parse(bodyText);
  } catch {
    // Non-blocking
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const now = new Date().toISOString();
    if (auth.serverId) {
      await supabase
        .from('server_nodes')
        .update({
          last_heartbeat_at: now,
          metadata: body,
          updated_at: now,
        })
        .eq('id', auth.serverId);
    }

    return NextResponse.json({
      status: 'ONLINE',
      serverTime: now,
      acknowledged: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
