// ─────────────────────────────────────────────────────────────────────────────
// Room Emotional Wiring — Phase 2
// Enriches RoomScreen's glow, pose, and greeting based on Oracle understanding.
// All functions are pure — they receive current state and return new values.
// They NEVER mutate state or produce side effects.
// ─────────────────────────────────────────────────────────────────────────────

import type { HumanUnderstandingProfile } from '../types/oracleMemory';
import { buildSekretBrief } from './oracleMemory';

export type RoomCharacter = 'raylene' | 'rylane' | 'cloud' | 'night';
export type RoomMood = string;

// ── Glow enrichment ───────────────────────────────────────────────────────────

export interface EnrichedGlow {
  pulseDuration: number;  // ms — default 1600
  opacityFloor: number;   // 0–1 — default 0.2
  colorHint?: string;     // optional tint for future use
}

const DEFAULT_GLOW: EnrichedGlow = { pulseDuration: 1600, opacityFloor: 0.2 };

export function getEnrichedGlow(
  character: RoomCharacter,
  mood: RoomMood,
  profile: HumanUnderstandingProfile | null,
): EnrichedGlow {
  if (!profile) return DEFAULT_GLOW;

  const brief = buildSekretBrief(profile, character);
  if (!brief.hasHistory) return DEFAULT_GLOW;

  const heavy = /\b(sad|anxious|scared|overwhelmed|alone|numb|lost|hopeless|tired|exhausted)\b/i.test(mood);
  const open  = /\b(okay|good|calm|hopeful|proud|motivated|happy|excited|grateful|relieved)\b/i.test(mood);
  const hasSelfTrust = brief.selfTrustEvidenceCount >= 1;

  switch (character) {
    case 'raylene':
      if (open && hasSelfTrust) return { pulseDuration: 1400, opacityFloor: 0.22 };
      if (heavy)                return { pulseDuration: 1800, opacityFloor: 0.18 };
      return DEFAULT_GLOW;

    case 'rylane':
      if (open && hasSelfTrust) return { pulseDuration: 1200, opacityFloor: 0.25 };
      if (heavy)                return { pulseDuration: 1600, opacityFloor: 0.15 };
      return DEFAULT_GLOW;

    case 'cloud':
      if (heavy)  return { pulseDuration: 2400, opacityFloor: 0.12 };
      if (open)   return { pulseDuration: 1800, opacityFloor: 0.2 };
      return { pulseDuration: 2000, opacityFloor: 0.15 };

    case 'night':
      if (heavy)  return { pulseDuration: 3000, opacityFloor: 0.08 };
      return { pulseDuration: 2400, opacityFloor: 0.14 };

    default:
      return DEFAULT_GLOW;
  }
}

// ── Pose enrichment ───────────────────────────────────────────────────────────

export type SekretPose = string; // mirrors existing pose string keys

export function enrichPose(
  basePose: SekretPose,
  character: RoomCharacter,
  mood: RoomMood,
  profile: HumanUnderstandingProfile | null,
): SekretPose {
  if (!profile) return basePose;

  const brief = buildSekretBrief(profile, character);
  if (!brief.hasHistory) return basePose;

  const heavy = /\b(sad|anxious|scared|overwhelmed|alone|numb|lost|hopeless|tired|exhausted)\b/i.test(mood);
  const open  = /\b(okay|good|calm|hopeful|proud|motivated|happy|excited|grateful|relieved)\b/i.test(mood);
  const hasActiveGoal = brief.dominantDimensions.includes('motivation-source');
  const hasCompletedGoal = brief.recentEvidence.some((e) => e.type === 'completed-goal');
  const hasSelfTrust = brief.selfTrustEvidenceCount >= 2;

  if (character === 'rylane' && open && hasActiveGoal && !heavy) return 'writing';
  if (character === 'raylene' && heavy && brief.dominantDimensions.includes('emotional-pattern')) return 'thinking';
  if (hasCompletedGoal && open) return 'happy';
  if (hasSelfTrust && (character === 'raylene' || character === 'rylane') && !heavy) return 'happy';

  return basePose;
}

// ── Greeting enrichment ───────────────────────────────────────────────────────

export function enrichGreeting(
  baseGreeting: string,
  character: RoomCharacter,
  mood: RoomMood,
  profile: HumanUnderstandingProfile | null,
  timeOfDay: string,
): string {
  if (!profile) return baseGreeting;

  const brief = buildSekretBrief(profile, character);
  // Only enrich when there's meaningful history
  if (!brief.hasHistory) return baseGreeting;
  if (profile.conversationCount < 3 && brief.selfTrustEvidenceCount < 1) return baseGreeting;

  const heavy = /\b(sad|anxious|scared|overwhelmed|alone|numb|lost|hopeless|tired|exhausted)\b/i.test(mood);
  const open  = /\b(okay|good|calm|hopeful|proud|motivated|happy|excited|grateful|relieved)\b/i.test(mood);

  const hasEmotionalPattern = brief.dominantDimensions.includes('emotional-pattern');
  const hasResilienceIndicator = brief.dominantDimensions.includes('resilience-indicator');
  const hasSelfTrust = brief.selfTrustEvidenceCount >= 1;
  const hasActiveGoal = brief.dominantDimensions.includes('motivation-source');

  switch (character) {
    case 'raylene':
      if (open && hasSelfTrust)
        return "you've been getting clearer about yourself. i noticed that.";
      if (heavy && hasEmotionalPattern)
        return "something familiar is back. you don't have to figure it out right now.";
      break;

    case 'rylane':
      if (open && hasActiveGoal)
        return "you got something in motion. let's keep it there.";
      if (heavy)
        return "alright. what are we actually dealing with today.";
      break;

    case 'cloud':
      if (heavy && hasEmotionalPattern)
        return "something familiar is back. you don't have to figure it out yet.";
      if (open)
        return "you seem a little lighter. i'm here either way.";
      break;

    case 'night':
      if (heavy && hasResilienceIndicator)
        return "you've gotten through nights like this before.";
      if (heavy)
        return "it's okay that it's heavy tonight.";
      break;
  }

  return baseGreeting;
}

/**
 * Build an Oracle presence note for the room — used only when Oracle
 * has a cross-session pattern worth surfacing. Returns null when
 * nothing meaningful is ready.
 */
export function getOraclePresenceNote(
  profile: HumanUnderstandingProfile | null,
): string | null {
  if (!profile) return null;
  if (profile.conversationCount < 4) return null;
  if (!profile.selfTrustEvidence.length) return null;

  const count = profile.selfTrustEvidence.length;
  if (count >= 5) {
    return `${count} moments of self-trust on record. Oracle has been paying attention.`;
  }

  return null;
}
