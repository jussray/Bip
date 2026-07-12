/**
 * companionStyleEngine.ts — RUNTIME MODULE
 *
 * Builds style-shaped reply request parameters for any presence.
 * The result is merged into the full prompt in buildReplyRequest.ts (PR C).
 *
 * IMPORTANT: buildStyledRequest() is defined here but not yet wired
 * into worker/sekret-reply.ts. That integration happens in PR C.
 * The four named companions do not automatically use these profiles
 * until PR C is merged.
 *
 * Style profiles: src/features/sekret/styleProfiles.ts
 * Agent skill:    .agents/skills/bip-companion-style-engine/SKILL.md
 */

import type { PresenceStyleId } from './styleProfiles';
import { getStyleProfile } from './styleProfiles';

export type StyledReplyRequest = {
  presenceId: PresenceStyleId;
  systemPromptAddendum: string;
  maxQuestions: number;
  slangLevel: number;
  warmthBias: number;
  brevityBias: number;
};

/**
 * Returns style-shaped parameters for the given presence.
 * Safe to call for any PresenceStyleId including 'sekret'.
 *
 * TODO (PR C): call this inside buildReplyRequest.ts and
 * worker/sekret-reply.ts to activate these profiles at runtime.
 */
export function buildStyledRequest(presenceId: PresenceStyleId): StyledReplyRequest {
  const profile = getStyleProfile(presenceId);
  return {
    presenceId,
    systemPromptAddendum: profile.systemPromptSnippet,
    maxQuestions: profile.questionBudget,
    slangLevel: profile.slangLevel,
    warmthBias: profile.warmthScore,
    brevityBias: profile.brevityScore,
  };
}
