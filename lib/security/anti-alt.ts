import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface AltSignalCheck {
  signalName: string;
  weight: number;
  description: string;
}

/**
 * Analyzes potential alt relationships between players and checks for ban evasion
 */
export async function analyzePlayerCorrelations(playerId: string, ipHash: string, asn?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    // Look for other players who used the same IP hash
    const { data: networkMatches } = await supabase
      .from('player_networks')
      .select('player_id, ip_hash, asn, created_at')
      .eq('ip_hash', ipHash)
      .neq('player_id', playerId)
      .limit(20);

    if (!networkMatches || networkMatches.length === 0) {
      return;
    }

    const uniqueOtherPlayerIds = Array.from(new Set(networkMatches.map((m) => m.player_id)));

    for (const otherPlayerId of uniqueOtherPlayerIds) {
      // Calculate correlation signals
      const signals: string[] = ['SAME_IP_HASH'];
      let confidenceScore = 35; // Base confidence for same IP (remember: same IP alone is NOT 100% alt)

      if (asn) {
        signals.push(`SAME_ASN:${asn}`);
        confidenceScore += 10;
      }

      // Check if the other player is BANNED
      const { data: otherPlayer } = await supabase
        .from('players')
        .select('id, gamertag, status, risk_score')
        .eq('id', otherPlayerId)
        .single();

      if (otherPlayer && (otherPlayer.status === 'BANNED' || otherPlayer.status === 'TEMP_BANNED')) {
        signals.push(`LINKED_TO_BANNED_PLAYER:${otherPlayer.gamertag}`);
        confidenceScore += 30; // Significant jump if matching banned account

        // Record POSSIBLE_BAN_EVASION event
        await supabase.from('ban_evasion_events').insert({
          current_player_id: playerId,
          banned_player_id: otherPlayerId,
          confidence_score: Math.min(100, confidenceScore),
          signals,
          decision_status: 'SUSPECTED',
        });

        // Record security event
        await supabase.from('security_events').insert({
          player_id: playerId,
          event_type: 'POSSIBLE_BAN_EVASION',
          severity: 'HIGH',
          metadata: {
            current_player_id: playerId,
            banned_player_id: otherPlayerId,
            banned_gamertag: otherPlayer.gamertag,
            confidence: confidenceScore,
            signals,
          },
        });
      }

      // Record or update player_links
      const boundedScore = Math.min(100, confidenceScore);
      const relationType = boundedScore >= 76 ? 'VERY_STRONG' : boundedScore >= 51 ? 'STRONG' : 'POSSIBLE';

      const [p1, p2] = [playerId, otherPlayerId].sort();

      const { data: existingLink } = await supabase
        .from('player_links')
        .select('id, confidence_score, signals')
        .eq('player_a', p1)
        .eq('player_b', p2)
        .single();

      if (existingLink) {
        const mergedSignals = Array.from(new Set([...existingLink.signals, ...signals]));
        await supabase
          .from('player_links')
          .update({
            confidence_score: Math.max(existingLink.confidence_score, boundedScore),
            relation_type: relationType,
            signals: mergedSignals,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLink.id);
      } else {
        await supabase.from('player_links').insert({
          player_a: p1,
          player_b: p2,
          confidence_score: boundedScore,
          relation_type: relationType,
          signals,
          review_status: 'PENDING',
        });
      }
    }
  } catch (error) {
    console.error('[analyzePlayerCorrelations] Error evaluating alts:', error);
  }
}
