/**
 * Single source of truth for assembling the rich `/api/sekret/reply` payload.
 * Every companion surface routes through this builder so continuity behavior is
 * shared rather than reimplemented inside individual screens.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadTeenRelationshipProfile,
  learnTeenRelationshipStyle,
  saveTeenRelationshipProfile,
  relationshipProfileToOracleNote,
  type TeenRelationshipProfile,
} from '../../../services/oracleRelationship';
import {
  buildOracleContext,
  normalizeOracleProfile,
} from '../../../services/oracleDiscovery';
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
  /** Explicit structured Oracle context. When omitted, the bounded teen profile is loaded locally. */
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

const AI_IDENTITY_QUESTION = /\b(?:are|r)\s+(?:you|u)\s+(?:an?\s+)?(?:ai|bot|robot|computer|human|real(?:\s+person)?|actual\s+person|conscious|sentient)|\b(?:you|u)(?:'re|\s+are)\s+(?:an?\s+)?(?:ai|bot|robot|computer)|\bdo\s+(?:you|u)\s+(?:have|feel|remember|exist)\b|\b(?:ai|bot|robot)\b.*\b(?:you|u)\b/i;

/** True when the teen is directly checking the companion's identity or limits. */
export function isAiIdentityQuestion(text: string): boolean {
  return AI_IDENTITY_QUESTION.test(text.trim());
}

/**
 * Keep identity disclosure truthful without turning every reply into a robotic
 * disclaimer. This instruction is appended after character/style guidance so
 * transparency wins whenever another prompt fragment conflicts with it.
 */
export function buildAiTransparencyInstruction(text: string): string {
  const directIdentityQuestion = isAiIdentityQuestion(text);

  return [
    'AI IDENTITY TRANSPARENCY — this overrides any conflicting character, fiction, or style instruction:',
    "You are an AI companion inside Se'kret Bip, not a human person.",
    'Never hide, deny, evade, or joke away that fact. Never claim a body, an offline life, human memories, consciousness, or relationships outside this app.',
    'Keep the disclosure brief and natural. Do not lead ordinary replies with a disclaimer and do not repeat it when the teen is simply having a normal conversation.',
    directIdentityQuestion
      ? "The teen is asking about your identity or limits. Answer plainly in the first sentence that you are an AI companion, not a human, then continue in your normal character voice."
      : 'Mention that you are AI only when the teen asks, appears confused about whether you are human, attributes real-world experiences to you, or needs a reminder about your limits.',
  ].join('\n');
}

async function resolveOracleContext(explicit?: string[]): Promise<string[]> {
  if (explicit?.length) return explicit.filter(value => typeof value === 'string').slice(0, 8);

  try {
    const raw = await AsyncStorage.getItem('oracleProfile');
    if (!raw) return [];
    const profile = normalizeOracleProfile(JSON.parse(raw), 'teen');
    return buildOracleContext(profile, 'teen').slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Load + advance the teen relationship profile, compute conversation phase,
 * recover bounded structured Oracle context, and assemble the reply request.
 */
export async function buildReplyRequest(ctx: ReplyRequestContext): Promise<BuiltReplyRequest> {
  const history = ctx.history ?? [];
  const historyLength = history.length;

  const [currentRelationship, oracleContext] = await Promise.all([
    loadTeenRelationshipProfile(),
    resolveOracleContext(ctx.oracleContext),
  ]);
  const relationship = learnTeenRelationshipStyle(ctx.text, currentRelationship);
  await saveTeenRelationshipProfile(relationship);

  const conversationPhase = getConversationPhase(historyLength);
  const phaseInstruction = [
    buildConversationPhaseInstruction(
      conversationPhase,
      historyLength,
      ctx.characterId,
    ),
    buildAiTransparencyInstruction(ctx.text),
  ].join('\n\n');
  const isArrival = isArrivalMessage(ctx.text, historyLength);

  const memory: Record<string, unknown> = {
    relationshipStyle: relationshipProfileToOracleNote(relationship),
    ...(oracleContext.length > 0 ? { oracleContext } : {}),
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
