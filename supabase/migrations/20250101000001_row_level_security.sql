-- ==========================================================
-- APOLLOCRAFT SECURITY - DATABASE MIGRATION: 002 ROW LEVEL SECURITY
-- Enforces strict isolation: Privileged actions only via Backend Service Role
-- ==========================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ban_evasion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vpn_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 1. Helper function: check if authenticated auth.uid() is an active admin user
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE auth_user_id = auth.uid()
        AND is_active = TRUE
    );
$$;

-- 2. Server Settings & Public Info Policies
-- Public can read server settings (IP, port, server name, invite)
CREATE POLICY "Public can read general server settings"
    ON public.server_settings
    FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- 3. Verification Codes: Strictly managed by backend service role.
-- No anon read to prevent code scraping.
CREATE POLICY "Service role manages verification codes"
    ON public.verification_codes
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- 4. Admin Users table:
-- Admins can read their own profile
CREATE POLICY "Admins can view their own profile"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() AND is_active = TRUE);

-- Active admins can read other admin records (for user management)
CREATE POLICY "Active admins can view admin user list"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

-- 5. Players & Logs: Active admins can read
CREATE POLICY "Active admins can view players"
    ON public.players
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view security events"
    ON public.security_events
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view player links"
    ON public.player_links
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view bans"
    ON public.bans
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view punishments"
    ON public.punishments
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view admin logs"
    ON public.admin_logs
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view server nodes"
    ON public.server_nodes
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

CREATE POLICY "Active admins can view settings"
    ON public.security_settings
    FOR SELECT
    TO authenticated
    USING (public.is_active_admin());

-- 6. IMMUTABLE AUDIT LOGS:
-- Absolutely NO UPDATE OR DELETE on admin_logs by any role except database owner!
CREATE POLICY "Admin logs can only be inserted, never updated or deleted"
    ON public.admin_logs
    FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- 7. Service Role has master bypass for backend API Route Handlers
-- All updates to bans, risk scores, configurations, etc. must flow through authenticated server APIs
CREATE POLICY "Service role full access to all tables"
    ON public.players FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to player_identities"
    ON public.player_identities FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to player_networks"
    ON public.player_networks FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to player_connections"
    ON public.player_connections FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to security_events"
    ON public.security_events FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to player_risk_scores"
    ON public.player_risk_scores FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to player_risk_history"
    ON public.player_risk_history FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to player_links"
    ON public.player_links FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to ban_evasion_events"
    ON public.ban_evasion_events FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to vpn_checks"
    ON public.vpn_checks FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to punishments"
    ON public.punishments FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to bans"
    ON public.bans FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to admin_roles"
    ON public.admin_roles FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to admin_permissions"
    ON public.admin_permissions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to admin_role_permissions"
    ON public.admin_role_permissions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to admin_users"
    ON public.admin_users FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to server_nodes"
    ON public.server_nodes FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to server_api_keys"
    ON public.server_api_keys FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to security_settings"
    ON public.security_settings FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to discord_settings"
    ON public.discord_settings FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to system_logs"
    ON public.system_logs FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to used_nonces"
    ON public.used_nonces FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access to rate_limits"
    ON public.rate_limits FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
