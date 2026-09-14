-- ==========================================================
-- APOLLOCRAFT SECURITY - DATABASE MIGRATION: 003 FUNCTIONS & RPC
-- Atomic Verification & Security Operations
-- ==========================================================

-- 1. Atomic Verification Code Validation & Player Verification
CREATE OR REPLACE FUNCTION public.verify_player_code_atomic(
    p_normalized_gamertag VARCHAR(32),
    p_code_hash VARCHAR(64),
    p_ip_address VARCHAR(45),
    p_ip_hash VARCHAR(64),
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player RECORD;
    v_code RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_result JSONB;
BEGIN
    -- 1. Find player by normalized gamertag with row-level lock
    SELECT * INTO v_player
    FROM public.players
    WHERE normalized_gamertag = p_normalized_gamertag
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'PLAYER_NOT_FOUND',
            'message', 'Jogador não encontrado no sistema.'
        );
    END IF;

    -- Check if player is currently banned
    IF v_player.status = 'BANNED' OR v_player.status = 'TEMP_BANNED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'PLAYER_BANNED',
            'message', 'Esta conta encontra-se banida do servidor.'
        );
    END IF;

    -- 2. Find active code for this player
    SELECT * INTO v_code
    FROM public.verification_codes
    WHERE player_id = v_player.id
      AND status = 'ACTIVE'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NO_ACTIVE_CODE',
            'message', 'Nenhum código de verificação ativo para este jogador. Gere um novo no Minecraft.'
        );
    END IF;

    -- Check expiration
    IF v_code.expires_at < v_now THEN
        UPDATE public.verification_codes
        SET status = 'EXPIRED'
        WHERE id = v_code.id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'CODE_EXPIRED',
            'message', 'Este código expirou. Gere um novo código no servidor.'
        );
    END IF;

    -- Check attempts limit
    IF v_code.attempts >= v_code.max_attempts THEN
        UPDATE public.verification_codes
        SET status = 'BLOCKED'
        WHERE id = v_code.id;

        -- Record security event
        INSERT INTO public.security_events (player_id, event_type, severity, metadata, ip_address)
        VALUES (
            v_player.id,
            'BRUTE_FORCE_DETECTED',
            'HIGH',
            jsonb_build_object('reason', 'Max code attempts exceeded', 'code_id', v_code.id),
            p_ip_address
        );

        RETURN jsonb_build_object(
            'success', false,
            'code', 'MAX_ATTEMPTS_EXCEEDED',
            'message', 'Muitas tentativas incorretas. Código bloqueado por segurança.'
        );
    END IF;

    -- Verify hash match
    IF v_code.code_hash != p_code_hash THEN
        UPDATE public.verification_codes
        SET attempts = attempts + 1
        WHERE id = v_code.id;

        INSERT INTO public.security_events (player_id, event_type, severity, metadata, ip_address)
        VALUES (
            v_player.id,
            'INVALID_CODE',
            'LOW',
            jsonb_build_object('attempt_number', v_code.attempts + 1),
            p_ip_address
        );

        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_CODE',
            'message', 'Código de verificação incorreto.',
            'remaining_attempts', v_code.max_attempts - (v_code.attempts + 1)
        );
    END IF;

    -- 3. Atomic success application
    -- Mark code as USED
    UPDATE public.verification_codes
    SET status = 'USED',
        used_at = v_now
    WHERE id = v_code.id;

    -- Mark player as VERIFIED
    UPDATE public.players
    SET status = 'VERIFIED',
        verified_at = v_now,
        updated_at = v_now
    WHERE id = v_player.id;

    -- Register network IP if provided
    IF p_ip_address IS NOT NULL AND p_ip_address != '' THEN
        INSERT INTO public.player_networks (player_id, ip_address, ip_hash)
        VALUES (v_player.id, p_ip_address, p_ip_hash);
    END IF;

    -- Record security event
    INSERT INTO public.security_events (player_id, event_type, severity, metadata, ip_address)
    VALUES (
        v_player.id,
        'VERIFICATION_SUCCESS',
        'LOW',
        jsonb_build_object(
            'gamertag', v_player.gamertag,
            'code_preview', v_code.code_display_preview,
            'user_agent', p_user_agent
        ),
        p_ip_address
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'VERIFIED_SUCCESS',
        'message', 'Conta verificada com sucesso!',
        'player_id', v_player.id,
        'gamertag', v_player.gamertag
    );
END;
$$;

-- 2. Cleanup Function for Expired Codes & Old Nonces (used by cron)
CREATE OR REPLACE FUNCTION public.perform_security_maintenance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expired_codes INTEGER;
    v_cleaned_nonces INTEGER;
    v_cleaned_rate_limits INTEGER;
BEGIN
    -- Expire active codes that passed expiration date
    WITH expired AS (
        UPDATE public.verification_codes
        SET status = 'EXPIRED'
        WHERE status = 'ACTIVE' AND expires_at < NOW()
        RETURNING id
    )
    SELECT count(*) INTO v_expired_codes FROM expired;

    -- Clean up consumed nonces that are older than expiration
    WITH deleted_nonces AS (
        DELETE FROM public.used_nonces
        WHERE expires_at < NOW()
        RETURNING nonce
    )
    SELECT count(*) INTO v_cleaned_nonces FROM deleted_nonces;

    -- Clean up rate limit records that are older than 24 hours
    WITH deleted_rates AS (
        DELETE FROM public.rate_limits
        WHERE window_start < NOW() - INTERVAL '24 hours'
          AND (blocked_until IS NULL OR blocked_until < NOW())
        RETURNING key_hash
    )
    SELECT count(*) INTO v_cleaned_rate_limits FROM deleted_rates;

    RETURN jsonb_build_object(
        'expired_codes_count', v_expired_codes,
        'cleaned_nonces_count', v_cleaned_nonces,
        'cleaned_rate_limits_count', v_cleaned_rate_limits,
        'timestamp', NOW()
    );
END;
$$;
