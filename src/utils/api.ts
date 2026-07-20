/**
 * src/utils/api.ts
 *
 * Backward-compatible Se'kret API helpers. Network transport now flows through
 * the shared typed Worker client so every surface receives the same auth,
 * timeout, status-code, and trace behavior.
 */
import type {
  CompanionAvatarState,
  CompanionHistoryTurn,
  CompanionReplyRequest,
  CompanionReplySource,
} from '@/contracts/sekretApi';
import { sekretClient, WORKER_BASE_URL } from '@/services/backend/sekretClient';

export type VisibleSekretCharacterId = 'suhana' | 'sy' | 'cloud' | 'night';
export type LegacySekretCharacterId = 'raylene' | 'rylane';
export type SekretCharacterId = VisibleSekretCharacterId | 'sekret';
export type SekretSurface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery';
export type SekretAvatarState = CompanionAvatarState;
export type SekretReplySource = CompanionReplySource;
export type SekretHistoryTurn = CompanionHistoryTurn;

export interface SekretBrainResponse {
  reply: string;
  tone: string;
  avatarState: SekretAvatarState;
  safetyFlag: boolean;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
  replySource: SekretReplySource;
  traceId?: string;
  questionBudget?: number;
}

export interface SekretVoiceResponse {
  audioBase64: string;
  contentType: string;
  characterId: SekretCharacterId;
  traceId?: string;
}

const VISIBLE_NAMES: Record<SekretCharacterId, string> = {
  suhana: 'Suhana',
  sy: 'Sy',
  cloud: 'Cloud',
  night: 'Night',
  sekret: "Se'kret",
};

export function normalizeSekretCharacter(value?: string, fallback: SekretCharacterId = 'suhana'): SekretCharacterId {
  const raw = (value ?? '').trim().toLowerCase().replace(/[’']/g, '').replace(/[\s_-]+/g, '');
  if (raw === 'suhana' || raw === 'raylene' || raw.includes('suhana') || raw.includes('raylene') || raw === 'soft' || raw === 'star') return 'suhana';
  if (raw === 'sy' || raw === 'rylane' || raw.includes('rylane') || raw === 'bro') return 'sy';
  if (raw === 'cloud' || raw.includes('cloud')) return 'cloud';
  if (raw === 'night' || raw.includes('night')) return 'night';
  if (raw === 'sekret' || raw === 'secret' || raw === 'oracle' || raw.includes('sekret')) return 'sekret';
  return fallback;
}

export function getVisibleSekretName(characterId: SekretCharacterId): string {
  return VISIBLE_NAMES[characterId] ?? VISIBLE_NAMES.suhana;
}

function normalizeAvatarState(value?: unknown): SekretAvatarState {
  if (
    value === 'listening' || value === 'thinking' || value === 'comforting' ||
    value === 'happy' || value === 'concerned' || value === 'responding'
  ) return value;
  return 'neutral';
}

function normalizeReplySource(value?: unknown): SekretReplySource {
  return value === 'openai' ? 'openai' : 'fallback';
}

function normalizeHistory(value?: unknown[]): SekretHistoryTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: SekretHistoryTurn[] = [];
  for (const item of value.slice(-12)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const rawRole = record.role;
    const role: SekretHistoryTurn['role'] | null = rawRole === 'assistant' || rawRole === 'sekret'
      ? 'assistant'
      : rawRole === 'user' || rawRole === 'teen'
        ? 'user'
        : null;
    const rawContent = typeof record.content === 'string'
      ? record.content
      : typeof record.text === 'string'
        ? record.text
        : typeof record.reply === 'string'
          ? record.reply
          : '';
    const content = rawContent.trim().slice(0, 1200);
    if (role && content) turns.push({ role, content });
  }
  return turns.slice(-10);
}

function fallbackReply(characterId: SekretCharacterId, text: string): SekretBrainResponse {
  const crisis = /\b(suicidal|self[- ]?harm|not safe|abuse|danger)\b/i.test(text);
  if (crisis) {
    return {
      reply: "I'm an AI companion, not emergency help. If you're in danger, tell a trusted adult now or contact local emergency support.",
      tone: 'supportive-safety',
      avatarState: 'concerned',
      safetyFlag: true,
      parentShareSummary: null,
      suggestedComfortTool: 'safety-plan',
      replySource: 'fallback',
    };
  }
  const replies: Record<SekretCharacterId, string[]> = {
    suhana: [
      'Okay, I caught that. Which part feels loudest right now?',
      'You do not have to make it sound neat. Tell me the real version.',
      'That is a lot to sit with. Comfort, honesty, or a plan?',
      'Girl, okay. What actually happened?',
      'Porchlight read: something in that sentence had a second sentence behind it.',
    ],
    sy: [
      'Yeah. That is real. What is the part nobody is saying out loud?',
      'I got you. Vent first or next move first?',
      'Do not clean it up. Say the actual version.',
      'Aight. What is actually going on?',
      'Quiet-seat moment. One real thing at a time.',
    ],
    cloud: [
      'We can make this smaller. Start with the gentlest part.',
      'No rush. You do not have to solve the whole feeling right now.',
      'Cloud-room weather. No speech required yet.',
      'I can stay close without crowding. Start small.',
      'Tiny cloud report: pressure high, no speeches needed.',
    ],
    night: [
      'Yeah. Nights make everything talk louder. What keeps circling back?',
      'No need to organize it first. Say the hidden version.',
      'Twin-moon thought: one part wants the future, one part wants proof.',
      'Night is good for honesty. What almost came out earlier?',
      'Moon-ledger move: first ugly version, then we fix it.',
    ],
    sekret: [
      "I might be reading this wrong, but part of you wants to be understood without explaining every detail. Keep the part that fits.",
      "Something in this conversation points toward privacy and real connection wanting to exist together.",
      "There is a pattern near the edge of what you said. Not a verdict, just something worth noticing.",
      "The surface part is one thing. The part underneath seems harder to name.",
      "I am curious what you already know about this that has not made it into words yet.",
    ],
  };
  const options = replies[characterId] ?? replies.suhana;
  const index = Math.abs([...text].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) | 0, 0)) % options.length;
  return {
    reply: options[index],
    tone: characterId,
    avatarState: characterId === 'cloud' || characterId === 'night' || characterId === 'sekret' ? 'comforting' : 'responding',
    safetyFlag: false,
    parentShareSummary: null,
    suggestedComfortTool: characterId === 'sekret' ? 'self-discovery' : 'journal',
    replySource: 'fallback',
  };
}

export async function fetchSekretBrainReply(input: {
  characterId: SekretCharacterId;
  surface: SekretSurface;
  userText: string;
  mood?: string;
  memory?: Record<string, unknown>;
  parentSharingEnabled?: boolean;
  history?: SekretHistoryTurn[];
  userName?: string;
  displayName?: string;
  profileName?: string;
  conversationPhase?: string;
  phaseInstruction?: string;
  isArrival?: boolean;
  isFirstCompanionChat?: boolean;
}): Promise<SekretBrainResponse> {
  if (!WORKER_BASE_URL) return fallbackReply(input.characterId, input.userText);

  const request: CompanionReplyRequest = input;
  const result = await sekretClient.sendReply(request);
  if (!result.ok) return fallbackReply(input.characterId, input.userText);

  const data = result.data;
  const fallback = fallbackReply(input.characterId, input.userText);
  return {
    reply: data.reply || fallback.reply,
    tone: data.tone || input.characterId,
    avatarState: normalizeAvatarState(data.avatarState),
    safetyFlag: Boolean(data.safetyFlag),
    parentShareSummary: typeof data.parentShareSummary === 'string' ? data.parentShareSummary : null,
    suggestedComfortTool: typeof data.suggestedComfortTool === 'string' ? data.suggestedComfortTool : null,
    replySource: normalizeReplySource(data.replySource),
    traceId: data.traceId ?? result.meta.traceId,
  };
}

export async function fetchSekretVoice(input: {
  reply: string;
  characterId: SekretCharacterId;
}): Promise<SekretVoiceResponse | null> {
  if (!WORKER_BASE_URL || !input.reply.trim()) return null;
  const result = await sekretClient.synthesizeVoice(input);
  if (!result.ok || !result.data.audioBase64 || !result.data.contentType) return null;
  return {
    audioBase64: result.data.audioBase64,
    contentType: result.data.contentType,
    characterId: normalizeSekretCharacter(result.data.characterId, input.characterId),
    traceId: result.data.traceId ?? result.meta.traceId,
  };
}

export async function fetchSekretTranscribe(input: {
  audioBase64: string;
  contentType: string;
}): Promise<string | null> {
  if (!WORKER_BASE_URL || !input.audioBase64) return null;
  const result = await sekretClient.transcribeAudio(input);
  if (!result.ok) return null;
  const transcript = typeof result.data.transcript === 'string'
    ? result.data.transcript.trim()
    : typeof result.data.text === 'string'
      ? result.data.text.trim()
      : '';
  return transcript || null;
}

export async function fetchSekretReply(
  text: string,
  context: SekretSurface | string = 'journal',
  mood?: string,
  avatarKey?: string,
  _extra1?: unknown,
  privateProfile?: unknown,
  profileSide?: string,
  history?: unknown[],
): Promise<string> {
  const surface: SekretSurface = context === 'voiceBip' || context === 'comfort' || context === 'circle' || context === 'parentBridge' || context === 'selfDiscovery' ? context : 'journal';
  const memory = privateProfile && typeof privateProfile === 'object' ? privateProfile as Record<string, unknown> : undefined;
  const response = await fetchSekretBrainReply({
    characterId: normalizeSekretCharacter(avatarKey),
    surface,
    mood,
    userText: text,
    memory,
    parentSharingEnabled: profileSide === 'parent',
    history: normalizeHistory(history),
    isFirstCompanionChat: !history || history.length === 0,
  });
  return response.reply;
}
