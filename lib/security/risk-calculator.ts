import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { RiskLevel } from '../types/database';

export interface RiskEvaluationFactors {
  isVpn?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  isDatacenter?: boolean;
  hasBadIpHistory?: boolean;
  relatedAltCount?: number;
  hasBanEvasionSuspicion?: boolean;
  failedAttempts?: number;
}

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  breakdown: Record<string, number>;
}

export const DEFAULT_RISK_WEIGHTS = {
  vpn: 25,
  proxy: 30,
  tor: 50,
  datacenter: 20,
  bad_ip_history: 25,
  related_alt: 20,
  ban_evasion: 45,
  invalid_attempts: 15,
};

export function determineRiskLevel(score: number): RiskLevel {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 41) return 'SUSPICIOUS';
  if (score >= 21) return 'OBSERVATION';
  return 'NORMAL';
}

/**
 * Calculates dynamic risk score bounded strictly between 0 and 100
 */
export function calculateRiskScore(
  factors: RiskEvaluationFactors,
  weights = DEFAULT_RISK_WEIGHTS
): RiskEvaluationResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  if (factors.isTor) {
    breakdown['tor'] = weights.tor;
    total += weights.tor;
  } else if (factors.isProxy) {
    breakdown['proxy'] = weights.proxy;
    total += weights.proxy;
  } else if (factors.isVpn) {
    breakdown['vpn'] = weights.vpn;
    total += weights.vpn;
  }

  if (factors.isDatacenter) {
    breakdown['datacenter'] = weights.datacenter;
    total += weights.datacenter;
  }

  if (factors.hasBadIpHistory) {
    breakdown['bad_ip_history'] = weights.bad_ip_history;
    total += weights.bad_ip_history;
  }

  if (factors.hasBanEvasionSuspicion) {
    breakdown['ban_evasion'] = weights.ban_evasion;
    total += weights.ban_evasion;
  }

  if (factors.relatedAltCount && factors.relatedAltCount > 0) {
    const altWeight = Math.min(weights.related_alt * factors.relatedAltCount, 40);
    breakdown['related_alts'] = altWeight;
    total += altWeight;
  }

  if (factors.failedAttempts && factors.failedAttempts > 0) {
    const attemptScore = Math.min(factors.failedAttempts * 5, weights.invalid_attempts);
    breakdown['invalid_attempts'] = attemptScore;
    total += attemptScore;
  }

  const boundedScore = Math.min(100, Math.max(0, Math.round(total)));
  const level = determineRiskLevel(boundedScore);

  return {
    score: boundedScore,
    level,
    breakdown,
  };
}

/**
 * Updates a player's risk score and records the historical change
 */
export async function updatePlayerRiskScore(
  playerId: string,
  factors: RiskEvaluationFactors,
  reason: string,
  triggeredBy = 'SYSTEM'
): Promise<RiskEvaluationResult | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    // Fetch player old score
    const { data: player } = await supabase
      .from('players')
      .select('risk_score')
      .eq('id', playerId)
      .single();

    const oldScore = player?.risk_score || 0;
    const evaluation = calculateRiskScore(factors);

    // Update player record
    await supabase
      .from('players')
      .update({
        risk_score: evaluation.score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId);

    // Record in player_risk_scores
    await supabase.from('player_risk_scores').insert({
      player_id: playerId,
      score: evaluation.score,
      risk_level: evaluation.level,
      breakdown: evaluation.breakdown,
      calculated_at: new Date().toISOString(),
    });

    // Record historical change
    await supabase.from('player_risk_history').insert({
      player_id: playerId,
      old_score: oldScore,
      new_score: evaluation.score,
      reason,
      triggered_by: triggeredBy,
    });

    return evaluation;
  } catch (error) {
    console.error('[updatePlayerRiskScore] Error updating risk score:', error);
    return null;
  }
}
