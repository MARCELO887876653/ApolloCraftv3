import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';
import { logAdminAction } from '@/lib/security/audit';
import { sendDiscordNotification } from '@/lib/discord/webhook';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'VIEW_SECURITY_DATA')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  try {
    const [secRes, srvRes, dscRes] = await Promise.all([
      supabase.from('security_settings').select('*').limit(1).single(),
      supabase.from('server_settings').select('*').limit(1).single(),
      supabase.from('discord_settings').select('*').limit(1).single(),
    ]);

    // Mask Discord webhook URL for security
    const discordData = dscRes.data ? {
      ...dscRes.data,
      webhook_url: dscRes.data.webhook_url
        ? `${dscRes.data.webhook_url.slice(0, 32)}...${dscRes.data.webhook_url.slice(-8)}`
        : '',
      hasWebhookConfigured: Boolean(dscRes.data.webhook_url),
    } : null;

    return NextResponse.json({
      security: secRes.data,
      server: srvRes.data,
      discord: discordData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar configurações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'EDIT_SECURITY_SETTINGS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
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

  const { type, payload } = body;
  const now = new Date().toISOString();

  try {
    if (type === 'SECURITY') {
      const { anti_vpn_mode, cache_ttl_hours, max_verification_attempts, code_expiration_minutes, risk_weights } = payload;
      
      const updateData: any = { updated_at: now };
      if (anti_vpn_mode) updateData.anti_vpn_mode = anti_vpn_mode;
      if (cache_ttl_hours) updateData.cache_ttl_hours = Number(cache_ttl_hours);
      if (max_verification_attempts) updateData.max_verification_attempts = Number(max_verification_attempts);
      if (code_expiration_minutes) updateData.code_expiration_minutes = Number(code_expiration_minutes);
      if (risk_weights) updateData.risk_weights = risk_weights;

      // Update the singleton security_settings row
      const { data: existing } = await supabase.from('security_settings').select('id').limit(1).single();
      if (existing) {
        await supabase.from('security_settings').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('security_settings').insert(updateData);
      }

      await logAdminAction({
        adminUserId: admin.id,
        action: 'UPDATE_SECURITY_SETTINGS',
        targetType: 'SETTINGS',
        afterData: updateData,
      });

      return NextResponse.json({ success: true, message: 'Configurações de segurança atualizadas' });
    }

    if (type === 'SERVER') {
      const { server_name, server_ip, bedrock_port, discord_invite_url, website_url } = payload;
      const updateData: any = { updated_at: now };
      if (server_name) updateData.server_name = server_name;
      if (server_ip) updateData.server_ip = server_ip;
      if (bedrock_port) updateData.bedrock_port = Number(bedrock_port);
      if (discord_invite_url) updateData.discord_invite_url = discord_invite_url;
      if (website_url) updateData.website_url = website_url;

      const { data: existing } = await supabase.from('server_settings').select('id').limit(1).single();
      if (existing) {
        await supabase.from('server_settings').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('server_settings').insert(updateData);
      }

      await logAdminAction({
        adminUserId: admin.id,
        action: 'UPDATE_SERVER_SETTINGS',
        targetType: 'SETTINGS',
        afterData: updateData,
      });

      return NextResponse.json({ success: true, message: 'Configurações do servidor atualizadas' });
    }

    if (type === 'DISCORD') {
      const { webhook_url, is_enabled, notify_on_verify, notify_on_vpn, notify_on_alt, notify_on_ban_evasion, notify_on_ban, notify_on_critical_risk } = payload;
      const updateData: any = { updated_at: now };
      if (typeof webhook_url === 'string' && webhook_url.length > 0 && !webhook_url.includes('...')) {
        updateData.webhook_url = webhook_url;
      }
      if (typeof is_enabled === 'boolean') updateData.is_enabled = is_enabled;
      if (typeof notify_on_verify === 'boolean') updateData.notify_on_verify = notify_on_verify;
      if (typeof notify_on_vpn === 'boolean') updateData.notify_on_vpn = notify_on_vpn;
      if (typeof notify_on_alt === 'boolean') updateData.notify_on_alt = notify_on_alt;
      if (typeof notify_on_ban_evasion === 'boolean') updateData.notify_on_ban_evasion = notify_on_ban_evasion;
      if (typeof notify_on_ban === 'boolean') updateData.notify_on_ban = notify_on_ban;
      if (typeof notify_on_critical_risk === 'boolean') updateData.notify_on_critical_risk = notify_on_critical_risk;

      const { data: existing } = await supabase.from('discord_settings').select('id').limit(1).single();
      if (existing) {
        await supabase.from('discord_settings').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('discord_settings').insert(updateData);
      }

      await logAdminAction({
        adminUserId: admin.id,
        action: 'UPDATE_DISCORD_SETTINGS',
        targetType: 'SETTINGS',
        afterData: { is_enabled, notify_on_verify, notify_on_vpn },
      });

      return NextResponse.json({ success: true, message: 'Configurações do Discord atualizadas' });
    }

    if (type === 'TEST_DISCORD') {
      const sent = await sendDiscordNotification({
        title: '🧪 Teste de Webhook - ApolloCraft Security',
        description: `Este é um teste disparado manualmente pelo administrador **${admin.name}** (${admin.email}). O sistema de notificações está operacional!`,
        eventType: 'TEST_NOTIFICATION',
        fields: [
          { name: 'Horário', value: new Date().toLocaleString('pt-BR'), inline: true },
          { name: 'Status', value: '🟢 Operacional', inline: true },
        ],
      });

      if (!sent) {
        return NextResponse.json({ error: 'Falha ao enviar webhook. Verifique se o URL está correto e ativo.' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Webhook de teste disparado com sucesso no canal do Discord!' });
    }

    return NextResponse.json({ error: 'Tipo de configuração inválido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar configurações' }, { status: 500 });
  }
}
