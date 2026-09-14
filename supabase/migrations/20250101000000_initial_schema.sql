-- ==========================================================
-- APOLLOCRAFT SECURITY - DATABASE MIGRATION: 001 INITIAL SCHEMA
-- Target: Supabase PostgreSQL (Serverless / Production)
-- ==========================================================

-- Enable pgcrypto and uuid-ossp for secure UUID and hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gamertag VARCHAR(32) NOT NULL,
    normalized_gamertag VARCHAR(32) NOT NULL UNIQUE,
    xuid VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    join_count INTEGER NOT NULL DEFAULT 1,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    is_alt BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_normalized_gamertag ON public.players(normalized_gamertag);
CREATE INDEX IF NOT EXISTS idx_players_xuid ON public.players(xuid);
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_risk_score ON public.players(risk_score);
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON public.players(last_seen);

-- 2. PLAYER IDENTITIES
CREATE TABLE IF NOT EXISTS public.player_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    platform VARCHAR(32) NOT NULL,
    client_id VARCHAR(128),
    device_model VARCHAR(64),
    device_os VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_identities_player_id ON public.player_identities(player_id);
CREATE INDEX IF NOT EXISTS idx_player_identities_client_id ON public.player_identities(client_id);

-- 3. PLAYER NETWORKS
CREATE TABLE IF NOT EXISTS public.player_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    asn VARCHAR(32),
    country VARCHAR(8),
    organization VARCHAR(128),
    is_vpn BOOLEAN NOT NULL DEFAULT FALSE,
    is_proxy BOOLEAN NOT NULL DEFAULT FALSE,
    is_tor BOOLEAN NOT NULL DEFAULT FALSE,
    is_hosting BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_networks_player_id ON public.player_networks(player_id);
CREATE INDEX IF NOT EXISTS idx_player_networks_ip_hash ON public.player_networks(ip_hash);
CREATE INDEX IF NOT EXISTS idx_player_networks_asn ON public.player_networks(asn);

-- 4. PLAYER CONNECTIONS
CREATE TABLE IF NOT EXISTS public.player_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    server_id VARCHAR(64) NOT NULL,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    session_duration_seconds INTEGER,
    ip_hash VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_player_connections_player_id ON public.player_connections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_connections_connected_at ON public.player_connections(connected_at);

-- 5. VERIFICATION SESSIONS
CREATE TABLE IF NOT EXISTS public.verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    server_id VARCHAR(64) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_player_id ON public.verification_sessions(player_id);

-- 6. VERIFICATION CODES
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL,
    code_display_preview VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_player_id ON public.verification_codes(player_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code_hash ON public.verification_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_verification_codes_status ON public.verification_codes(status);

-- 7. SECURITY EVENTS
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_player_id ON public.security_events(player_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);

-- 8. PLAYER RISK SCORES
CREATE TABLE IF NOT EXISTS public.player_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_risk_scores_player_id ON public.player_risk_scores(player_id);

-- 9. PLAYER RISK HISTORY
CREATE TABLE IF NOT EXISTS public.player_risk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    reason TEXT NOT NULL,
    triggered_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_risk_history_player_id ON public.player_risk_history(player_id);

-- 10. PLAYER LINKS (Anti-Alt Correlation)
CREATE TABLE IF NOT EXISTS public.player_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_a UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    player_b UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    relation_type VARCHAR(32) NOT NULL DEFAULT 'POSSIBLE',
    signals TEXT[] NOT NULL DEFAULT '{}',
    review_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_distinct_players CHECK (player_a != player_b),
    CONSTRAINT uq_player_pair UNIQUE (player_a, player_b)
);

CREATE INDEX IF NOT EXISTS idx_player_links_player_a ON public.player_links(player_a);
CREATE INDEX IF NOT EXISTS idx_player_links_player_b ON public.player_links(player_b);
CREATE INDEX IF NOT EXISTS idx_player_links_confidence ON public.player_links(confidence_score DESC);

-- 11. BAN EVASION EVENTS
CREATE TABLE IF NOT EXISTS public.ban_evasion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    banned_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    signals TEXT[] NOT NULL DEFAULT '{}',
    decision_status VARCHAR(20) NOT NULL DEFAULT 'SUSPECTED',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ban_evasion_current_player ON public.ban_evasion_events(current_player_id);
CREATE INDEX IF NOT EXISTS idx_ban_evasion_banned_player ON public.ban_evasion_events(banned_player_id);

-- 12. VPN CHECKS (Cache)
CREATE TABLE IF NOT EXISTS public.vpn_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash VARCHAR(64) NOT NULL,
    ip_masked VARCHAR(45) NOT NULL,
    is_vpn BOOLEAN NOT NULL DEFAULT FALSE,
    is_proxy BOOLEAN NOT NULL DEFAULT FALSE,
    is_tor BOOLEAN NOT NULL DEFAULT FALSE,
    is_hosting BOOLEAN NOT NULL DEFAULT FALSE,
    is_datacenter BOOLEAN NOT NULL DEFAULT FALSE,
    is_residential_proxy BOOLEAN NOT NULL DEFAULT FALSE,
    risk_score INTEGER NOT NULL DEFAULT 0,
    asn VARCHAR(32),
    organization VARCHAR(128),
    country VARCHAR(8),
    raw_response JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vpn_checks_ip_hash ON public.vpn_checks(ip_hash);
CREATE INDEX IF NOT EXISTS idx_vpn_checks_expires_at ON public.vpn_checks(expires_at);

-- 13. PUNISHMENTS (Generic punishment system)
CREATE TABLE IF NOT EXISTS public.punishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    reason_public TEXT NOT NULL,
    reason_internal TEXT NOT NULL,
    issuer_admin_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_punishments_player_id ON public.punishments(player_id);
CREATE INDEX IF NOT EXISTS idx_punishments_active ON public.punishments(active);

-- 14. BANS
CREATE TABLE IF NOT EXISTS public.bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'PERMANENT',
    reason_public TEXT NOT NULL,
    reason_internal TEXT NOT NULL,
    issuer_admin_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unbanned_at TIMESTAMPTZ,
    unbanned_by UUID,
    unban_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_bans_player_id ON public.bans(player_id);
CREATE INDEX IF NOT EXISTS idx_bans_active ON public.bans(active);

-- 15. ADMIN ROLES
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(32) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. ADMIN PERMISSIONS
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. ADMIN ROLE PERMISSIONS
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 18. ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    role_id UUID NOT NULL REFERENCES public.admin_roles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user ON public.admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- 19. ADMIN LOGS (Append-only Audit)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128),
    before_data JSONB,
    after_data JSONB,
    request_id VARCHAR(64) NOT NULL,
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- 20. SERVER NODES
CREATE TABLE IF NOT EXISTS public.server_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_heartbeat_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. SERVER API KEYS
CREATE TABLE IF NOT EXISTS public.server_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_node_id UUID NOT NULL REFERENCES public.server_nodes(id) ON DELETE CASCADE,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    secret_hash VARCHAR(128) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_server_api_keys_server ON public.server_api_keys(server_node_id);
CREATE INDEX IF NOT EXISTS idx_server_api_keys_key_hash ON public.server_api_keys(key_hash);

-- 22. SECURITY SETTINGS
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anti_vpn_mode VARCHAR(16) NOT NULL DEFAULT 'MONITOR',
    cache_ttl_hours INTEGER NOT NULL DEFAULT 24,
    max_verification_attempts INTEGER NOT NULL DEFAULT 5,
    code_expiration_minutes INTEGER NOT NULL DEFAULT 15,
    rate_limit_window_seconds INTEGER NOT NULL DEFAULT 300,
    max_failed_logins INTEGER NOT NULL DEFAULT 5,
    risk_weights JSONB NOT NULL DEFAULT '{"vpn":25,"proxy":30,"tor":50,"datacenter":20,"bad_ip_history":25,"related_alt":20,"ban_evasion":45,"invalid_attempts":15}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. SERVER SETTINGS
CREATE TABLE IF NOT EXISTS public.server_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_name VARCHAR(64) NOT NULL DEFAULT 'ApolloCraft Bedrock',
    server_ip VARCHAR(128) NOT NULL DEFAULT 'play.apollocraft.online',
    bedrock_port INTEGER NOT NULL DEFAULT 19132,
    discord_invite_url VARCHAR(255) NOT NULL DEFAULT 'https://discord.gg/apollocraft',
    website_url VARCHAR(255) NOT NULL DEFAULT 'https://apollocraft.online',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. DISCORD SETTINGS
CREATE TABLE IF NOT EXISTS public.discord_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_url TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    notify_on_verify BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_vpn BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_alt BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_ban_evasion BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_ban BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_critical_risk BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_api_error BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(16) NOT NULL DEFAULT 'INFO',
    category VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- 26. USED NONCES (Anti-Replay Protection)
CREATE TABLE IF NOT EXISTS public.used_nonces (
    nonce VARCHAR(128) PRIMARY KEY,
    server_id VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_used_nonces_expires_at ON public.used_nonces(expires_at);

-- 27. RATE LIMITS (Persistent Serverless Rate Limiting)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key_hash VARCHAR(64) PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON public.rate_limits(blocked_until);
