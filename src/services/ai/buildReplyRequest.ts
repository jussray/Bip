/**
 * src/services/ai/buildReplyRequest.ts
 *
 * Single source of truth for assembling the rich `/api/sekret/reply` payload.
 *
 * Every companion surface (main chat, journal, companion chat, page replies)
 * should route through this so a reply carries the same continuity signal:
 *   - learned relationship style (tone/nickname/profanity preferences)
 *   - conversation phase + phase instruction
 *   - long-term oracle understandings (memory)
 *   - the teen's name context
 *
 * Without this, a surface sends a thin payload and the companion feels generic
 * ("which part feels loudest right now?") instead of continuous
 * ("weren't you stressing about that test two days ago 😭").
 */
import {
  loadTeenRelationshipProfile,
  learnTeenRelationshipStyle,
  saveTeenRelationshipProfile,
  relationshipProfileToOracleNote,
  type TeenRelationshipProfile,
} from '../../../services/oracleRelationship';
import {
  getConversationPhase,
  buildConversationPhaseInstruction,
  isArrivalMessage,
  type ConversationPhase,
} from '../../../services/sekretVoice';
import type { SekretCharacterId, SekretSurface, SekretHistoryTurn } from '@/utils/api';

export interface ReplyRequestContext {
  characterId: SekretCharacterId;
  surface: SekretSurface;
  text: string;
  history?: SekretHistoryTurn[];
  mood?: string;
  parentSharingEnabled?: boolean;
  userName?: string;
  displayName?: string;
  profileName?: string;
  /** Long-term oracle understandings, e.g. buildOracleContext(oracleProfile, 'teen'). */
  oracleContext?: string[];
  /** Surface-specific memory keys folded into the memory bundle (e.g. teenGender). */
  extraMemory?: Record<string, unknown>;
}

export interface SekretReplyRequest {
  characterId: SekretCharacterId;
  surface: SekretSurface;
  userText: string;
  mood?: string;
  history: SekretHistoryTurn[];
  parentSharingEnabled: boolean;
  userName?: string;
  displayName?: string;
  profileName?: string;
  conversationPhase: ConversationPhase;
  phaseInstruction: string;
  isArrival: boolean;
  memory: Record<string, unknown>;
}

export interface BuiltReplyRequest {
  request: SekretReplyRequest;
  /** The learned relationship profile — callers reuse it for local fallbacks. */
  relationship: TeenRelationshipProfile;
}

/**
 * Load + advance the teen relationship profile, compute conversation phase, and
 * assemble the full reply request. Persists the learned profile as a side effect
 * (matching the main chat path) so every surface contributes to memory.
 */
export async function buildReplyRequest(ctx: ReplyRequestContext): Promise<BuiltReplyRequest> {
  const history = ctx.history ?? [];
  const historyLength = history.length;

  const currentRelationship = await loadTeenRelationshipProfile();
  const relationship = learnTeenRelationshipStyle(ctx.text, currentRelationship);
  await saveTeenRelationshipProfile(relationship);

  const conversationPhase = getConversationPhase(historyLength);
  const phaseInstruction = buildConversationPhaseInstruction(
    conversationPhase,
    historyLength,
    ctx.characterId,
  );
  const isArrival = isArrivalMessage(ctx.text, historyLength);

  const memory: Record<string, unknown> = {
    relationshipStyle: relationshipProfileToOracleNote(relationship),
    ...(ctx.oracleContext && ctx.oracleContext.length > 0 ? { oracleContext: ctx.oracleContext } : {}),
    ...(ctx.extraMemory ?? {}),
  };

  return {
    request: {
      characterId: ctx.characterId,
      surface: ctx.surface,
      userText: ctx.text,
      mood: ctx.mood,
      history,
      parentSharingEnabled: ctx.parentSharingEnabled ?? false,
      userName: ctx.userName,
      displayName: ctx.displayName,
      profileName: ctx.profileName,
      conversationPhase,
      phaseInstruction,
      isArrival,
      memory,
    },
    relationship,
  };
}
