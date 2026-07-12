/**
 * relationshipPhase.ts — RUNTIME MODULE
 *
 * Derives the L4 relationship phase from memory state.
 * Control Room’s L4RelationshipDashboard reads this label;
 * it does not compute it.
 *
 * Phase rules:
 *   new         — 0 durable memories
 *   building    — 1–9 durable memories
 *   established — 10–29 durable memories
 *   deep        — 30+ durable memories
 *   reflective  — ≥10 durable memories + ≥1 completed reflection + 0 unresolved contradictions
 *
 * ‘reflective’ requires an established minimum relationship state.
 * A single reflection run on zero memories cannot produce this phase.
 *
 * Agent skill: .agents/skills/bip-l4-memory/SKILL.md
 */

export type RelationshipPhase =
  | 'new'          // 0 durable memories, first sessions
  | 'building'     // 1–9 durable memories, pattern recognition starting
  | 'established'  // 10–29, consistent goals and tone
  | 'deep'         // 30+, contradictions resolved, long context
  | 'reflective';  // 10+ memories + reflection run + zero contradictions

export type PhaseInput = {
  durableMemoryCount: number;
  reflectionRunCount: number;
  contradictions: number;
};

const REFLECTIVE_MIN_MEMORIES = 10;

/**
 * Derives the current relationship phase.
 *
 * ‘reflective’ is evaluated AFTER confirming a minimum memory baseline,
 * so it can never be reached on a sparse or empty memory state.
 */
export function deriveRelationshipPhase(input: PhaseInput): RelationshipPhase {
  const { durableMemoryCount, reflectionRunCount, contradictions } = input;

  // ‘deep’ is evaluated first so a 30+ memory, contradiction-free state
  // with a reflection run correctly returns ‘reflective’ on the next check.
  if (durableMemoryCount >= 30) return 'deep';
  if (durableMemoryCount >= 10) {
    // ‘reflective’ requires established baseline, a completed reflection,
    // and no unresolved contradictions.
    if (reflectionRunCount > 0 && contradictions === 0) return 'reflective';
    return 'established';
  }
  if (durableMemoryCount >= 1) return 'building';
  return 'new';
}
