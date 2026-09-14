import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasPermission } from '@/lib/permissions/rbac';
import { generateApiKeySecret, sha256 } from '@/lib/security/crypto';
import { logAdminAction } from '@/lib/security/audit';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'MANAGE_SERVERS')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não conectado' }, { status: 503 });
  }

  try {
    const { data: nodes, error } = await supabase
      .from('server_nodes')
      .select('*, api_keys:server_api_keys(id, key_prefix, is_revoked, created_at, last_used_at, expires_at)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ servers: nodes || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar servidores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin || !hasPermission(admin.roleName, 'MANAGE_SERVERS')) {
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

  const { action, name, description, serverId } = body;

  try {
    if (action === 'CREATE_SERVER') {
      if (!name) {
        return NextResponse.json({ error: 'Nome do servidor é obrigatório' }, { status: 400 });
      }

      const { data: newNode, error: nodeError } = await supabase
        .from('server_nodes')
        .insert({
          name,
          description: description || null,
          is_active: true,
        })
        .select()
        .single();

      if (nodeError || !newNode) throw nodeError;

      // Auto-generate initial API Key pair
      const { apiKey, apiSecret, prefix } = generateApiKeySecret();
      const keyHash = sha256(apiKey);
      const secretHash = sha256(apiSecret);

      const { error: keyError } = await supabase.from('server_api_keys').insert({
        server_node_id: newNode.id,
        key_prefix: prefix,
        key_hash: keyHash,
        secret_hash: secretHash,
        is_revoked: false,
      });

      if (keyError) throw keyError;

      await logAdminAction({
        adminUserId: admin.id,
        action: 'CREATE_SERVER_NODE',
        targetType: 'SERVER_NODE',
        targetId: newNode.id,
        afterData: { name, prefix },
      });

      return NextResponse.json({
        success: true,
        server: newNode,
        credentials: {
          serverId: newNode.id,
          apiKey,
          apiSecret,
          warning: 'Guarde a API Secret com segurança. Ela NUNCA será exibida novamente!',
        },
      });
    }

    if (action === 'GENERATE_KEY') {
      if (!serverId) {
        return NextResponse.json({ error: 'serverId é obrigatório' }, { status: 400 });
      }

      const { apiKey, apiSecret, prefix } = generateApiKeySecret();
      const keyHash = sha256(apiKey);
      const secretHash = sha256(apiSecret);

      const { data: newKey, error: keyError } = await supabase
        .from('server_api_keys')
        .insert({
          server_node_id: serverId,
          key_prefix: prefix,
          key_hash: keyHash,
          secret_hash: secretHash,
          is_revoked: false,
        })
        .select()
        .single();

      if (keyError) throw keyError;

      await logAdminAction({
        adminUserId: admin.id,
        action: 'GENERATE_SERVER_API_KEY',
        targetType: 'SERVER_API_KEY',
        targetId: newKey.id,
        afterData: { serverId, prefix },
      });

      return NextResponse.json({
        success: true,
        credentials: {
          keyId: newKey.id,
          apiKey,
          apiSecret,
          warning: 'Guarde a API Secret com segurança. Ela NUNCA será exibida novamente!',
        },
      });
    }

    if (action === 'REVOKE_KEY') {
      const { keyId } = body;
      if (!keyId) return NextResponse.json({ error: 'keyId é obrigatório' }, { status: 400 });

      await supabase
        .from('server_api_keys')
        .update({ is_revoked: true })
        .eq('id', keyId);

      await logAdminAction({
        adminUserId: admin.id,
        action: 'REVOKE_SERVER_API_KEY',
        targetType: 'SERVER_API_KEY',
        targetId: keyId,
      });

      return NextResponse.json({ success: true, message: 'Chave revogada com sucesso' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao processar servidor' }, { status: 500 });
  }
}
