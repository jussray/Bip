/**
 * relationshipPhase.ts — RUNTIME MODULE
 *
 * Derives the current L4 relationship phase from memory state.
 * Control Room's L4RelationshipDashboard reads the phase label;
 * it does not compute it.
 *
 * Agent skill: .agents/skills/bip-l4-memory/SKILL.md
 */

export type RelationshipPhase =
  | 'new'          // 0 durable memories, first sessions
  | 'building'     // 1–9 durable memories, pattern recognition starting
  | 'established'  // 10–29, consistent goals and tone
  | 'deep'         // 30+, contradictions resolved, long context
  | 'reflective';  // post-reflection run, synthesised self-model

export type PhaseInput = {
  durableMemoryCount: number;
  reflectionRunCount: number;
  contradictions: number;
};

export function deriveRelationshipPhase(input: PhaseInput): RelationshipPhase {
  const { durableMemoryCount, reflectionRunCount, contradictions } = input;

  if (reflectionRunCount > 0 && contradictions === 0) return 'reflective';
  if (durableMemoryCount >= 30) return 'deep';
  if (durableMemoryCount >= 10) return 'established';
  if (durableMemoryCount >= 1) return 'building';
  return 'new';
}
