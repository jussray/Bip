import {
  fetchSekretBrainReply,
  normalizeSekretCharacter,
  type SekretCharacterId,
  type SekretAvatarState,
  type SekretHistoryTurn,
  type SekretReplySource,
} from '@/utils/api';
import { buildSekretPresence } from '../../../services/sekretPresence';
import { emitEvent } from '@/features/activity/events';
import { COMPANION_CURRICULUM } from '@/config/companionCurriculum';

export type CompanionId = SekretCharacterId;
export type { SekretAvatarState };

export type CompanionSurface =
  | 'chat'
  | 'journal'
  | 'voiceBip'
  | 'comfort'
  | 'circle'
  | 'parentBridge'
  | 'selfDiscovery'
  | 'pages';

export interface CompanionReplyInput {
  companionId: CompanionId;
  surface: CompanionSurface;
  text: string;
  mood?: string;
  history?: SekretHistoryTurn[];
  parentSharingEnabled?: boolean;
  teenGender?: 'girl' | 'boy' | 'other' | null;
  memory?: Record<string, unknown>;
}

export interface CompanionReplyResult {
  reply: string;
  safetyFlag: boolean;
  avatarState: SekretAvatarState;
  tone: string;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
  replySource: SekretReplySource;
  fallbackUsed: boolean;
  fallbackReason: string | null;
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

export const COMPANION_PROFILES: Record<CompanionId, CompanionProfile> = {
  raylene: {
    id: 'raylene', name: 'Raylene', emoji: '🌸', title: 'Soft Big Sis',
    vibe: 'Warm, expressive, protective, and real.',
    greeting: COMPANION_CURRICULUM.raylene.greeting, accentColor: '#FF4FA3',
  },
  rylane: {
    id: 'rylane', name: 'Rylane', emoji: '⚡', title: 'Loyal Bro',
    vibe: 'Quiet loyalty. Keeps it real. Never talks down.',
    greeting: COMPANION_CURRICULUM.rylane.greeting, accentColor: '#7C83FF',
  },
  cloud: {
    id: 'cloud', name: "Cloud Se'kret", emoji: '☁️', title: 'Quiet Observer',
    vibe: 'Notices. Waits. Rarely pushes.',
    greeting: COMPANION_CURRICULUM.cloud.greeting, accentColor: '#7dd3fc',
  },
  night: {
    id: 'night', name: "Night Se'kret", emoji: '🌙', title: 'The Light Left On',
    vibe: 'Late-night builder. Future-focused. Honest.',
    greeting: COMPANION_CURRICULUM.night.greeting, accentColor: '#c4b5fd',
  },
  sekret: {
    id: 'sekret', name: "Se'kret", emoji: '✨', title: 'Inner Oracle',
    vibe: 'Reflects your patterns back to you.',
    greeting: "I've been listening. There's a pattern here — want to look at it together?",
    accentColor: '#fbbf24',
  },
};

export function toCompanionId(value: string): CompanionId {
  return normalizeSekretCharacter(value);
}

const CRISIS_PATTERN =
  /\b(kill myself|end my life|want to die|suicidal|self[- ]?harm|not safe|hurt myself|end it|disappear for real)\b/i;

export function isSafetyTrigger(text: string): boolean {
  return CRISIS_PATTERN.test(text);
}

type BackendSurface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery';

function toBackendSurface(surface: CompanionSurface): BackendSurface {
  if (surface === 'voiceBip') return 'voiceBip';
  if (surface === 'comfort') return 'comfort';
  if (surface === 'circle') return 'circle';
  if (surface === 'parentBridge') return 'parentBridge';
  if (surface === 'selfDiscovery') return 'selfDiscovery';
  return 'journal';
}

export async function sendCompanionMessage(
  input: CompanionReplyInput,
): Promise<CompanionReplyResult> {
  emitEvent('companion_message', { personalityId: input.companionId });

  const memory: Record<string, unknown> = { ...(input.memory ?? {}) };
  if (input.teenGender) memory.teenGender = input.teenGender;

  const result = await fetchSekretBrainReply({
    characterId: normalizeSekretCharacter(input.companionId),
    surface: toBackendSurface(input.surface),
    userText: input.text,
    mood: input.mood,
    history: input.history,
    parentSharingEnabled: input.parentSharingEnabled,
    memory: Object.keys(memory).length > 0 ? memory : undefined,
  });

  return {
    reply: result.reply,
    safetyFlag: result.safetyFlag,
    avatarState: result.avatarState,
    tone: result.tone,
    parentShareSummary: result.parentShareSummary,
    suggestedComfortTool: result.suggestedComfortTool,
    replySource: result.replySource,
    fallbackUsed: result.fallbackUsed,
    fallbackReason: result.fallbackReason,
  };
}

export function getCompanionGreeting(id: CompanionId): string {
  return COMPANION_PROFILES[id]?.greeting ?? COMPANION_PROFILES.raylene.greeting;
}

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
