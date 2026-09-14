export type PlayerStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'RESTRICTED'
  | 'SUSPICIOUS'
  | 'MANUAL_REVIEW'
  | 'TEMP_BANNED'
  | 'BANNED';

export type CodeStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED' | 'BLOCKED';

export type RiskLevel = 'NORMAL' | 'OBSERVATION' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';

export type AntiVpnMode = 'OFF' | 'MONITOR' | 'RESTRICT' | 'BLOCK';

export type SecurityEventType =
  | 'VPN_DETECTED'
  | 'PROXY_DETECTED'
  | 'TOR_DETECTED'
  | 'HOSTING_DETECTED'
  | 'ALT_SUSPECTED'
  | 'POSSIBLE_BAN_EVASION'
  | 'BRUTE_FORCE_DETECTED'
  | 'INVALID_CODE'
  | 'CODE_REUSE_ATTEMPT'
  | 'INVALID_SERVER_SIGNATURE'
  | 'REPLAY_ATTACK'
  | 'HIGH_RISK_PLAYER'
  | 'API_ABUSE'
  | 'VERIFICATION_SUCCESS'
  | 'MANUAL_OVERRIDE';

export type PunishmentType =
  | 'WARNING'
  | 'MUTE'
  | 'KICK'
  | 'TEMP_BAN'
  | 'PERM_BAN'
  | 'RESTRICTION';

export type AdminRoleName = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'SUPPORT' | 'ANALYST';

export type AdminPermissionName =
  | 'VIEW_PLAYERS'
  | 'VIEW_IP'
  | 'VIEW_NETWORK_DATA'
  | 'VIEW_SECURITY_DATA'
  | 'BAN_PLAYER'
  | 'UNBAN_PLAYER'
  | 'VERIFY_PLAYER'
  | 'RESET_VERIFICATION'
  | 'VIEW_AUDIT_LOG'
  | 'EDIT_SECURITY_SETTINGS'
  | 'MANAGE_ADMINS'
  | 'MANAGE_ROLES'
  | 'MANAGE_API_KEYS'
  | 'MANAGE_SERVERS'
  | 'MANAGE_DISCORD';

export interface Player {
  id: string;
  gamertag: string;
  normalized_gamertag: string;
  xuid: string | null;
  status: PlayerStatus;
  risk_score: number;
  first_seen: string;
  last_seen: string;
  join_count: number;
  verified_at: string | null;
  notes: string | null;
  is_alt: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerIdentity {
  id: string;
  player_id: string;
  platform: string;
  client_id: string | null;
  device_model: string | null;
  device_os: string | null;
  created_at: string;
}

export interface PlayerNetwork {
  id: string;
  player_id: string;
  ip_address: string;
  ip_hash: string;
  asn: string | null;
  country: string | null;
  organization: string | null;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_hosting: boolean;
  created_at: string;
}

export interface PlayerConnection {
  id: string;
  player_id: string;
  server_id: string;
  connected_at: string;
  disconnected_at: string | null;
  session_duration_seconds: number | null;
  ip_hash: string | null;
}

export interface VerificationSession {
  id: string;
  player_id: string;
  server_id: string;
  started_at: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  ip_address: string | null;
  user_agent: string | null;
}

export interface VerificationCode {
  id: string;
  player_id: string;
  code_hash: string;
  code_display_preview: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  attempts: number;
  max_attempts: number;
  status: CodeStatus;
}

export interface SecurityEvent {
  id: string;
  player_id: string | null;
  event_type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface PlayerRiskScore {
  id: string;
  player_id: string;
  score: number;
  risk_level: RiskLevel;
  breakdown: Record<string, number>;
  calculated_at: string;
}

export interface PlayerRiskHistory {
  id: string;
  player_id: string;
  old_score: number;
  new_score: number;
  reason: string;
  triggered_by: string;
  created_at: string;
}

export interface PlayerLink {
  id: string;
  player_a: string;
  player_b: string;
  confidence_score: number;
  relation_type: string;
  signals: string[];
  review_status: 'PENDING' | 'CONFIRMED' | 'DISMISSED';
  created_at: string;
  updated_at: string;
}

export interface BanEvasionEvent {
  id: string;
  current_player_id: string;
  banned_player_id: string;
  confidence_score: number;
  signals: string[];
  decision_status: 'SUSPECTED' | 'CONFIRMED' | 'CLEARED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface VpnCheck {
  id: string;
  ip_hash: string;
  ip_masked: string;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_hosting: boolean;
  is_datacenter: boolean;
  is_residential_proxy: boolean;
  risk_score: number;
  asn: string | null;
  organization: string | null;
  country: string | null;
  raw_response: Record<string, any> | null;
  expires_at: string;
  created_at: string;
}

export interface Punishment {
  id: string;
  player_id: string;
  type: PunishmentType;
  reason_public: string;
  reason_internal: string;
  issuer_admin_id: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
}

export interface Ban {
  id: string;
  player_id: string;
  type: 'TEMPORARY' | 'PERMANENT';
  reason_public: string;
  reason_internal: string;
  issuer_admin_id: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  unbanned_at: string | null;
  unbanned_by: string | null;
  unban_reason: string | null;
}

export interface AdminUser {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  role?: AdminRole;
}

export interface AdminRole {
  id: string;
  name: AdminRoleName;
  description: string;
  is_system: boolean;
  created_at: string;
  permissions?: AdminPermissionName[];
}

export interface AdminPermission {
  id: string;
  name: AdminPermissionName;
  category: string;
  description: string;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  request_id: string;
  ip_hash: string | null;
  created_at: string;
  admin_user?: { name: string; email: string };
}

export interface ServerNode {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  last_heartbeat_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServerApiKey {
  id: string;
  server_node_id: string;
  key_prefix: string;
  key_hash: string;
  secret_hash: string;
  is_revoked: boolean;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
  server_node?: ServerNode;
}

export interface SecuritySettings {
  id: string;
  anti_vpn_mode: AntiVpnMode;
  cache_ttl_hours: number;
  max_verification_attempts: number;
  code_expiration_minutes: number;
  rate_limit_window_seconds: number;
  max_failed_logins: number;
  risk_weights: {
    vpn: number;
    proxy: number;
    tor: number;
    datacenter: number;
    bad_ip_history: number;
    related_alt: number;
    ban_evasion: number;
    invalid_attempts: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ServerSettings {
  id: string;
  server_name: string;
  server_ip: string;
  bedrock_port: number;
  discord_invite_url: string;
  website_url: string;
  created_at: string;
  updated_at: string;
}

export interface DiscordSettings {
  id: string;
  webhook_url: string;
  is_enabled: boolean;
  notify_on_verify: boolean;
  notify_on_vpn: boolean;
  notify_on_alt: boolean;
  notify_on_ban_evasion: boolean;
  notify_on_ban: boolean;
  notify_on_critical_risk: boolean;
  notify_on_api_error: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category: string;
  message: string;
  context: Record<string, any> | null;
  created_at: string;
}

export interface UsedNonce {
  nonce: string;
  server_id: string;
  expires_at: string;
  created_at: string;
}

export interface RateLimitEntry {
  key_hash: string;
  attempts: number;
  window_start: string;
  blocked_until: string | null;
}
