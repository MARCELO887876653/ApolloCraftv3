-- ==========================================================
-- APOLLOCRAFT SECURITY - DATABASE MIGRATION: 004 SEED DATA
-- Default System Roles, Permissions, and Core Settings
-- ==========================================================

-- 1. Insert System Roles
INSERT INTO public.admin_roles (name, description, is_system)
VALUES
    ('OWNER', 'Proprietário supremo do ApolloCraft Security. Acesso e controle total e irrestrito.', TRUE),
    ('ADMIN', 'Administrador geral de segurança, jogadores, punições e configurações técnicas.', TRUE),
    ('MODERATOR', 'Moderador de jogadores, verificações, histórico e aplicação de punições.', TRUE),
    ('SUPPORT', 'Atendente de suporte focado em auxílio de verificação de jogadores.', TRUE),
    ('ANALYST', 'Analista de dados, logs de auditoria e métricas de segurança.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Permissions
INSERT INTO public.admin_permissions (name, category, description)
VALUES
    ('VIEW_PLAYERS', 'PLAYERS', 'Permite visualizar a lista e perfis de jogadores'),
    ('VIEW_IP', 'PLAYERS', 'Permite visualizar endereços IP completos e dados de rede'),
    ('VIEW_NETWORK_DATA', 'PLAYERS', 'Permite visualizar ASN, organização e país de conexão'),
    ('VIEW_SECURITY_DATA', 'SECURITY', 'Permite visualizar alertas de VPN, proxy, Tor e alts'),
    ('BAN_PLAYER', 'PUNISHMENTS', 'Permite aplicar bans permanentes e temporários a jogadores'),
    ('UNBAN_PLAYER', 'PUNISHMENTS', 'Permite revogar bans e punições ativas'),
    ('VERIFY_PLAYER', 'VERIFICATION', 'Permite verificar jogadores manualmente'),
    ('RESET_VERIFICATION', 'VERIFICATION', 'Permite revogar ou exigir nova verificação de jogador'),
    ('VIEW_AUDIT_LOG', 'AUDIT', 'Permite visualizar registros de auditoria e ações administrativas'),
    ('EDIT_SECURITY_SETTINGS', 'SETTINGS', 'Permite editar configurações de segurança e anti-VPN'),
    ('MANAGE_ADMINS', 'ADMINISTRATION', 'Permite criar, alterar cargos e desativar administradores'),
    ('MANAGE_ROLES', 'ADMINISTRATION', 'Permite configurar funções e permissões'),
    ('MANAGE_API_KEYS', 'SERVERS', 'Permite gerar e revogar credenciais de API de servidores'),
    ('MANAGE_SERVERS', 'SERVERS', 'Permite cadastrar e gerenciar nós de servidores Bedrock'),
    ('MANAGE_DISCORD', 'INTEGRATIONS', 'Permite configurar webhooks e alertas para o Discord')
ON CONFLICT (name) DO NOTHING;

-- 3. Link Role Permissions (OWNER gets everything, ADMIN gets administrative, etc.)
DO $$
DECLARE
    v_owner_id UUID;
    v_admin_id UUID;
    v_mod_id UUID;
    v_support_id UUID;
    v_analyst_id UUID;
    v_perm RECORD;
BEGIN
    SELECT id INTO v_owner_id FROM public.admin_roles WHERE name = 'OWNER';
    SELECT id INTO v_admin_id FROM public.admin_roles WHERE name = 'ADMIN';
    SELECT id INTO v_mod_id FROM public.admin_roles WHERE name = 'MODERATOR';
    SELECT id INTO v_support_id FROM public.admin_roles WHERE name = 'SUPPORT';
    SELECT id INTO v_analyst_id FROM public.admin_roles WHERE name = 'ANALYST';

    -- OWNER gets ALL permissions
    FOR v_perm IN SELECT id FROM public.admin_permissions LOOP
        INSERT INTO public.admin_role_permissions (role_id, permission_id)
        VALUES (v_owner_id, v_perm.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ADMIN gets most permissions (except managing other OWNERs)
    FOR v_perm IN SELECT id FROM public.admin_permissions WHERE name NOT IN ('MANAGE_ADMINS', 'MANAGE_ROLES') LOOP
        INSERT INTO public.admin_role_permissions (role_id, permission_id)
        VALUES (v_admin_id, v_perm.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- MODERATOR permissions
    FOR v_perm IN SELECT id FROM public.admin_permissions WHERE name IN (
        'VIEW_PLAYERS', 'VIEW_IP', 'VIEW_SECURITY_DATA', 'BAN_PLAYER', 'UNBAN_PLAYER',
        'VERIFY_PLAYER', 'RESET_VERIFICATION', 'VIEW_AUDIT_LOG'
    ) LOOP
        INSERT INTO public.admin_role_permissions (role_id, permission_id)
        VALUES (v_mod_id, v_perm.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- SUPPORT permissions
    FOR v_perm IN SELECT id FROM public.admin_permissions WHERE name IN (
        'VIEW_PLAYERS', 'VIEW_SECURITY_DATA', 'VERIFY_PLAYER'
    ) LOOP
        INSERT INTO public.admin_role_permissions (role_id, permission_id)
        VALUES (v_support_id, v_perm.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- ANALYST permissions
    FOR v_perm IN SELECT id FROM public.admin_permissions WHERE name IN (
        'VIEW_PLAYERS', 'VIEW_NETWORK_DATA', 'VIEW_SECURITY_DATA', 'VIEW_AUDIT_LOG'
    ) LOOP
        INSERT INTO public.admin_role_permissions (role_id, permission_id)
        VALUES (v_analyst_id, v_perm.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 4. Default Settings Seed
INSERT INTO public.security_settings (
    anti_vpn_mode,
    cache_ttl_hours,
    max_verification_attempts,
    code_expiration_minutes,
    rate_limit_window_seconds,
    max_failed_logins
)
SELECT 'MONITOR', 24, 5, 15, 300, 5
WHERE NOT EXISTS (SELECT 1 FROM public.security_settings);

INSERT INTO public.server_settings (
    server_name,
    server_ip,
    bedrock_port,
    discord_invite_url,
    website_url
)
SELECT 'ApolloCraft Bedrock', 'play.apollocraft.online', 19132, 'https://discord.gg/apollocraft', 'https://apollocraft.online'
WHERE NOT EXISTS (SELECT 1 FROM public.server_settings);

INSERT INTO public.discord_settings (
    is_enabled,
    notify_on_verify,
    notify_on_vpn,
    notify_on_alt,
    notify_on_ban_evasion,
    notify_on_ban,
    notify_on_critical_risk,
    notify_on_api_error
)
SELECT FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.discord_settings);
