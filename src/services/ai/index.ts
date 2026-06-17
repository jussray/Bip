/**
 * src/services/ai/index.ts
 *
 * Per-personality AI service stubs.
 * Implementations land here in Step 3 when services/ logic is
 * extracted from screens and centralised.
 *
 * Personalities: Raylene, Rylane, Cloud, Night, Oracle
 */

// Placeholder — replace with real implementations in Step 3
export const AI_PERSONALITIES = [
  'raylene',
  'rylane',
  'cloud',
  'night',
  'oracle',
] as const;

export type PersonalityId = typeof AI_PERSONALITIES[number];
