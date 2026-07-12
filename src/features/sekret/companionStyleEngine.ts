/**
 * companionStyleEngine.ts — RUNTIME MODULE
 *
 * Builds reply request parameters shaped by the active companion's
 * style profile. Control Room can read drift metrics from this module
 * but does not run it.
 *
 * Style profiles: src/features/sekret/styleProfiles.ts
 * Agent skill:    .agents/skills/bip-companion-style-engine/SKILL.md
 */

import type { CompanionId } from './styleProfiles';
import { getStyleProfile } from './styleProfiles';

export type StyledReplyRequest = {
  companionId: CompanionId;
  systemPromptAddendum: string;
  maxQuestions: number;
  slangLevel: number;
  warmthBias: number;
  brevityBias: number;
};

/**
 * Returns a style-shaped request addendum for the given companion.
 * The output is merged into the full reply request in buildReplyRequest.ts.
 */
export function buildStyledRequest(companionId: CompanionId): StyledReplyRequest {
  const profile = getStyleProfile(companionId);
  return {
    companionId,
    systemPromptAddendum: profile.systemPromptSnippet,
    maxQuestions: profile.questionBudget,
    slangLevel: profile.slangLevel,
    warmthBias: profile.warmthScore,
    brevityBias: profile.brevityScore,
  };
}
