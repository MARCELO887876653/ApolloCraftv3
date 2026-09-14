import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyRequestSchema } from '@/lib/security/validation';
import { hashIp, normalizeGamertag, sha256 } from '@/lib/security/crypto';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { checkIpWithCache } from '@/lib/security/ip-risk/provider';
import { analyzePlayerCorrelations } from '@/lib/security/anti-alt';
import { updatePlayerRiskScore } from '@/lib/security/risk-calculator';
import { sendDiscordNotification } from '@/lib/discord/webhook';

export async function POST(request: Request) {
  // 1. Resolve client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipHash = hashIp(clientIp);

  // 2. Persistent rate limit check (max 5 failed attempts per 5 minutes)
  const rateLimit = await checkRateLimit(`verify:${clientIp}`, {
    maxAttempts: 5,
    windowSeconds: 300,
    blockDurationSeconds: 900,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        code: 'BRUTE_FORCE_BLOCKED',
        message: 'Muitas tentativas. Seu acesso foi temporariamente suspenso por segurança.',
      },
      { status: 429 }
    );
  }

  // 3. Validate request schema
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: 'INVALID_PAYLOAD', message: 'Payload inválido' },
      { status: 400 }
    );
  }

  const parseResult = verifyRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_FAILED',
        message: parseResult.error.errors[0]?.message || 'Código ou gamertag inválido',
      },
      { status: 400 }
    );
  }

  const { gamertag, code } = parseResult.data;
  const normalized = normalizeGamertag(gamertag);
  const codeHash = sha256(code.trim().toUpperCase());

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Servidor temporariamente indisponível. Tente novamente mais tarde.',
      },
      { status: 503 }
    );
  }

  try {
    // 4. Check Anti-VPN & Security Settings
    const { data: secSettings } = await supabase
      .from('security_settings')
      .select('*')
      .limit(1)
      .single();

    const antiVpnMode = secSettings?.anti_vpn_mode || 'MONITOR';

    let ipRisk: any = {
      vpn: false,
      proxy: false,
      tor: false,
      datacenter: false,
      riskScore: 0,
      asn: undefined,
      organization: undefined,
      country: undefined,
    };

    if (antiVpnMode !== 'OFF') {
      ipRisk = await checkIpWithCache(clientIp);

      if (ipRisk.vpn || ipRisk.proxy || ipRisk.tor) {
        // Record security event
        await supabase.from('security_events').insert({
          event_type: ipRisk.tor
            ? 'TOR_DETECTED'
            : ipRisk.proxy
            ? 'PROXY_DETECTED'
            : 'VPN_DETECTED',
          severity: 'HIGH',
          metadata: {
            gamertag,
            ip_masked: clientIp.replace(/\.\d+$/, '.***'),
            asn: ipRisk.asn,
            organization: ipRisk.organization,
          },
          ip_address: clientIp,
        });

        // If configured to BLOCK, reject verification immediately
        if (antiVpnMode === 'BLOCK') {
          return NextResponse.json(
            {
              success: false,
              code: 'VPN_DETECTED',
              message:
                'VPN ou Proxy detectado. Desative serviços de anonimização para concluir sua verificação.',
            },
            { status: 403 }
          );
        }
      }
    }

    // 5. Execute Atomic Verification via PostgreSQL RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'verify_player_code_atomic',
      {
        p_normalized_gamertag: normalized,
        p_code_hash: codeHash,
        p_ip_address: clientIp,
        p_ip_hash: ipHash,
        p_user_agent: userAgent,
      }
    );

    if (rpcError) {
      console.error('[verify_player_code_atomic] Error:', rpcError);
      return NextResponse.json(
        {
          success: false,
          code: 'VERIFICATION_ERROR',
          message: 'Erro interno ao processar a verificação. Tente novamente.',
        },
        { status: 500 }
      );
    }

    if (!rpcResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: rpcResult.code,
          message: rpcResult.message,
          remainingAttempts: rpcResult.remaining_attempts,
        },
        { status: 400 }
      );
    }

    const playerId = rpcResult.player_id;

    // Reset rate limiter on success
    await resetRateLimit(`verify:${clientIp}`);

    // 6. Asynchronous Background Evaluations: Anti-Alt, Risk Calculation, Discord Alert
    if (playerId) {
      // If anti-vpn mode is RESTRICT and VPN was found, set status to MANUAL_REVIEW
      if (antiVpnMode === 'RESTRICT' && (ipRisk.vpn || ipRisk.proxy || ipRisk.tor)) {
        await supabase
          .from('players')
          .update({ status: 'MANUAL_REVIEW' })
          .eq('id', playerId);
      }

      // Check account correlations & alt relationships
      await analyzePlayerCorrelations(playerId, ipHash, ipRisk.asn);

      // Recalculate risk score
      await updatePlayerRiskScore(
        playerId,
        {
          isVpn: ipRisk.vpn,
          isProxy: ipRisk.proxy,
          isTor: ipRisk.tor,
          isDatacenter: ipRisk.datacenter,
        },
        'Atualização após verificação pública com sucesso'
      );

      // Notify Discord
      await sendDiscordNotification({
        title: 'Jogador Verificado',
        description: `O jogador **${gamertag}** concluiu com sucesso a verificação de segurança.`,
        eventType: 'VERIFICATION_SUCCESS',
        fields: [
          { name: 'Gamertag', value: gamertag, inline: true },
          { name: 'País', value: ipRisk.country || 'Desconhecido', inline: true },
          {
            name: 'Segurança de Rede',
            value: ipRisk.vpn ? '⚠️ VPN Detectada' : '✅ Conexão Limpa',
            inline: true,
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      code: 'VERIFIED_SUCCESS',
      message: 'Conta verificada com sucesso! Você já pode retornar ao Minecraft.',
      gamertag: rpcResult.gamertag,
    });
  } catch (err: any) {
    console.error('[POST /api/verificar] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro ao processar sua solicitação.',
      },
      { status: 500 }
    );
  }
}
