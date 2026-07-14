/**
 * src/features/sekret/companionEngine.ts
 *
 * Companion Engine — Phase 2C
 *
 * Single entry point for all companion interactions across every surface.
 * Previously each screen had its own import chain (api.ts, sekretCompanion.ts,
 * sekretCompanionReply.ts, sekretReply.ts). This file unifies them.
 *
 * Public surface:
 *   sendCompanionMessage()  — sends to AI backend, emits companion_message event
 *   getCompanionGreeting()  — opening line per companion
 *   getPresenceMessage()    — context-aware ambient presence line
 *   isSafetyTrigger()       — crisis phrase detection
 *   toCompanionId()         — normalizes legacy keys ('soft', 'oracle', etc.)
 *   COMPANION_PROFILES      — unified display config (name, emoji, title, vibe)
 *
 * What it does NOT do:
 *   - Manage memory/session persistence (stays in sekretCompanion.ts + sync.ts)
 *   - Render anything (no React here)
 *   - Replace existing AI infrastructure (wraps fetchSekretBrainReply)
 */

import {
  fetchSekretBrainReply,
  normalizeSekretCharacter,
  type SekretCharacterId,
  type SekretAvatarState,
  type SekretHistoryTurn,
} from '@/utils/api';
import { buildSekretPresence } from '../../../services/sekretPresence';
import { buildReplyRequest } from '@/services/ai/buildReplyRequest';
import { emitEvent } from '@/features/activity/events';
import { COMPANION_CURRICULUM } from '@/config/companionCurriculum';
import type { CompanionReplySource } from '@/contracts/sekretApi';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CompanionId = SekretCharacterId; // 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret'
export type { SekretAvatarState };

export type CompanionSurface =
  | 'chat'           // persistent full chat session
  | 'journal'        // in-journal companion prompt
  | 'voiceBip'       // voice recording context
  | 'comfort'        // breathe/comfort session
  | 'circle'         // circle post helper
  | 'parentBridge'   // bridge sharing screen
  | 'selfDiscovery'  // oracle / self-discovery flow
  | 'pages';         // Pages companion tabs (raylene/rylane)

export interface CompanionReplyInput {
  companionId: CompanionId;
  surface: CompanionSurface;
  text: string;
  mood?: string;
  history?: SekretHistoryTurn[];
  parentSharingEnabled?: boolean;
  teenGender?: 'girl' | 'boy' | 'other' | null;
  /** Long-term oracle understandings, e.g. buildOracleContext(oracleProfile, 'teen'). */
  oracleContext?: string[];
  userName?: string;
  displayName?: string;
  profileName?: string;
}

export interface CompanionReplyResult {
  reply: string;
  safetyFlag: boolean;
  avatarState: SekretAvatarState;
  tone: string;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
  /** Whether the reply came from OpenAI or the on-device fallback path. */
  replySource: CompanionReplySource;
  /** Questions the companion has left this session (0 = no more questions). */
  questionBudget?: number;
}

export interface CompanionProfile {
  id: CompanionId;
  name: string;
  emoji: string;
  title: string;
  vibe: string;
  greeting: string;
  accentColor: string;
}

// ── Companion profiles ─────────────────────────────────────────────────────────
// Unified display config across all surfaces.
// Greetings come from companionCurriculum (single source of truth for identity).

export const COMPANION_PROFILES: Record<CompanionId, CompanionProfile> = {
  raylene: {
    id:          'raylene',
    name:        'Raylene',
    emoji:       '🌸',
    title:       'Soft Big Sis',
    vibe:        'Warm, expressive, protective, and real.',
    greeting:    COMPANION_CURRICULUM.raylene.greeting,
    accentColor: '#FF4FA3',
  },
  rylane: {
    id:          'rylane',
    name:        'Rylane',
    emoji:       '⚡',
    title:       'Loyal Bro',
    vibe:        'Quiet loyalty. Keeps it real. Never talks down.',
    greeting:    COMPANION_CURRICULUM.rylane.greeting,
    accentColor: '#7C83FF',
  },
  cloud: {
    id:          'cloud',
    name:        "Cloud Se'kret",
    emoji:       '☁️',
    title:       'Quiet Observer',
    vibe:        'Notices. Waits. Rarely pushes.',
    greeting:    COMPANION_CURRICULUM.cloud.greeting,
    accentColor: '#7dd3fc',
  },
  night: {
    id:          'night',
    name:        "Night Se'kret",
    emoji:       '🌙',
    title:       'The Light Left On',
    vibe:        'Late-night builder. Future-focused. Honest.',
    greeting:    COMPANION_CURRICULUM.night.greeting,
    accentColor: '#c4b5fd',
  },
  sekret: {
    id:          'sekret',
    name:        "Se'kret",
    emoji:       '✨',
    title:       'Inner Oracle',
    vibe:        'Reflects your patterns back to you.',
    greeting:    "I've been listening. There's a pattern here — want to look at it together?",
    accentColor: '#fbbf24',
  },
};

// ── Companion ID normalizer ────────────────────────────────────────────────────
// Handles legacy keys: 'soft' → 'raylene', 'oracle' → 'sekret', etc.

export function toCompanionId(value: string): CompanionId {
  return normalizeSekretCharacter(value);
}

// ── Safety detection ───────────────────────────────────────────────────────────
// Tier 1 check (client-side). Backend also checks; this surfaces the flag
// immediately so the screen can show an in-UI support nudge without waiting.

const CRISIS_PATTERN =
  /\b(kill myself|end my life|want to die|suicidal|self[- ]?harm|not safe|hurt myself|end it|disappear for real)\b/i;

export function isSafetyTrigger(text: string): boolean {
  return CRISIS_PATTERN.test(text);
}

// ── Surface mapping ────────────────────────────────────────────────────────────
// Engine surfaces 'chat' and 'pages' don't exist in the backend contract;
// map them to the closest semantic equivalent.

type BackendSurface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery';

function toBackendSurface(surface: CompanionSurface): BackendSurface {
  if (surface === 'voiceBip')      return 'voiceBip';
  if (surface === 'comfort')       return 'comfort';
  if (surface === 'circle')        return 'circle';
  if (surface === 'parentBridge')  return 'parentBridge';
  if (surface === 'selfDiscovery') return 'selfDiscovery';
  return 'journal'; // chat, journal, pages → journal
}

// ── Core: sendCompanionMessage ─────────────────────────────────────────────────

/**
 * Send a message to a companion and receive their reply.
 *
 * Emits 'companion_message' before the network call so the point ledger
 * records the interaction regardless of whether the backend responds.
 * Falls back silently if the backend is unavailable — never throws.
 */
export async function sendCompanionMessage(
  input: CompanionReplyInput,
): Promise<CompanionReplyResult> {
  emitEvent('companion_message', { personalityId: input.companionId });

  const { request } = await buildReplyRequest({
    characterId:          normalizeSekretCharacter(input.companionId),
    surface:              toBackendSurface(input.surface),
    text:                 input.text,
    mood:                 input.mood,
    history:              input.history,
    parentSharingEnabled: input.parentSharingEnabled,
    oracleContext:        input.oracleContext,
    userName:             input.userName,
    displayName:          input.displayName,
    profileName:          input.profileName,
    extraMemory:          input.teenGender ? { teenGender: input.teenGender } : undefined,
  });

  const result = await fetchSekretBrainReply(request);

  return {
    reply:                result.reply,
    safetyFlag:           result.safetyFlag,
    avatarState:          result.avatarState,
    tone:                 result.tone,
    parentShareSummary:   result.parentShareSummary,
    suggestedComfortTool: result.suggestedComfortTool,
    replySource:          (result.replySource ?? 'openai') as CompanionReplySource,
    questionBudget:       typeof result.questionBudget === 'number' ? result.questionBudget : undefined,
  };
}

// ── Greeting ───────────────────────────────────────────────────────────────────

/**
 * Returns the companion's opening line — shown on first load or when chat
 * history is empty. Sourced from COMPANION_CURRICULUM (single source of truth).
 */
export function getCompanionGreeting(id: CompanionId): string {
  return COMPANION_PROFILES[id]?.greeting ?? COMPANION_PROFILES.raylene.greeting;
}

// ── Presence message ───────────────────────────────────────────────────────────

/**
 * Context-aware ambient message — shown as subtitle text, room nudge, or
 * pre-action prompt (e.g. before the teen starts a journal or voice bip).
 */
export function getPresenceMessage(
  id: CompanionId,
  context: { mood?: string; screen?: string; isLateNight?: boolean } = {},
): string {
  if (id === 'sekret') {
    return context.isLateNight
      ? 'quiet hours. good time to listen to yourself.'
      : 'ready when you are.';
  }
  return buildSekretPresence(undefined, id, context.screen);
}
