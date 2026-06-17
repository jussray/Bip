import type { OracleProfile, OracleQuestion, OracleSide } from './oracleDiscovery';
import { normalizeOracleProfile, selectOracleOpening } from './oracleDiscovery';

export type SekretDiscoveryMode = 'sekret-discovery';

export interface SekretDiscoveryContext {
  mode: SekretDiscoveryMode;
  visibleSpeaker: 'sekret';
  internalReasoner: 'oracle';
  side: OracleSide;
  profile: OracleProfile;
  opening: OracleQuestion;
  voiceProfile: 'sekret';
  guardrails: readonly string[];
}

/**
 * Public Se’kret / private Oracle boundary for the dedicated discovery space.
 * This adapter lets the UI evolve without renaming Oracle storage or analysis.
 */
export function createSekretDiscoveryContext(
  profileValue: OracleProfile | undefined,
  side: OracleSide,
): SekretDiscoveryContext {
  const profile = normalizeOracleProfile(profileValue, side);
  return {
    mode: 'sekret-discovery',
    visibleSpeaker: 'sekret',
    internalReasoner: 'oracle',
    side,
    profile,
    opening: selectOracleOpening(profile, side),
    voiceProfile: 'sekret',
    guardrails: [
      'Be curious, warm, personal, and emotionally intelligent.',
      'Ask to understand; do not diagnose, fix, teach, or lecture.',
      'Never expose Oracle, profile internals, or private evidence.',
      'Keep teen and parent discovery contexts separate.',
    ],
  };
}
