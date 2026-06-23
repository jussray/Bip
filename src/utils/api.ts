/**
 * src/utils/api.ts
 *
 * Canonical backend API helpers. OpenAI is called only by the secure backend;
 * the Expo app sends teen-safe request context and never receives or stores an
 * OPENAI_API_KEY.
 */
const BASE_URL = ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

export type VisibleSekretCharacterId = 'raylene' | 'rylane' | 'cloud' | 'night';
export type SekretCharacterId = VisibleSekretCharacterId | 'sekret';
export type SekretSurface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery';
export type SekretAvatarState = 'neutral' | 'listening' | 'thinking' | 'comforting' | 'happy' | 'concerned' | 'responding';
export type SekretReplySource = 'openai';

export interface SekretHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface SekretBrainResponse {
  reply: string;
  tone: string;
  avatarState: SekretAvatarState;
  safetyFlag: boolean;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
  replySource: SekretReplySource;
}

export interface SekretVoiceResponse {
  audioBase64: string;
  contentType: string;
  characterId: SekretCharacterId;
}

export function normalizeSekretCharacter(value?: string, fallback: SekretCharacterId = 'raylene'): SekretCharacterId {
  const raw = (value ?? '').trim().toLowerCase().replace(/['']/g, '');
  if (raw === 'raylene' || raw.includes('raylene')) return 'raylene';
  if (raw === 'rylane' || raw.includes('rylane')) return 'rylane';
  if (raw === 'cloud' || raw.includes('cloud')) return 'cloud';
  if (raw === 'night' || raw.includes('night')) return 'night';
  if (raw === 'sekret' || raw === 'secret' || raw === 'oracle' || raw.includes('sekret')) return 'sekret';
  return fallback;
}

export function getVisibleSekretName(characterId: SekretCharacterId): string {
  if (characterId === 'sekret') return "Se'kret";
  return characterId.charAt(0).toUpperCase() + characterId.slice(1);
}

function normalizeAvatarState(value?: unknown): SekretAvatarState {
  if (
    value === 'listening' || value === 'thinking' || value === 'comforting' ||
    value === 'happy' || value === 'concerned' || value === 'responding'
  ) return value;
  return 'neutral';
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

/**
 * Calls the secure backend to get a companion reply.
 * Throws on any failure — callers are responsible for catching and showing
 * an appropriate error state. No fake replies are ever returned.
 */
export async function fetchSekretBrainReply(input: {
  characterId: SekretCharacterId;
  surface: SekretSurface;
  userText: string;
  mood?: string;
  memory?: Record<string, unknown>;
  parentSharingEnabled?: boolean;
  history?: SekretHistoryTurn[];
}): Promise<SekretBrainResponse> {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured.');
  }

  console.log('[Se\'kret AI request]', {
    characterId: input.characterId,
    surface: input.surface,
    mood: input.mood || null,
    userText: input.userText,
    historyLength: input.history?.length ?? 0,
  });

  const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error('[fetchSekretBrainReply] API error', { status: res.status, body: errorBody });
    throw new Error(`AI reply failed: ${res.status}`);
  }

  const data = await res.json() as Partial<SekretBrainResponse>;

  if (!data.reply) {
    throw new Error('AI reply was empty.');
  }

  const result: SekretBrainResponse = {
    reply: data.reply,
    tone: data.tone || input.characterId,
    avatarState: normalizeAvatarState(data.avatarState),
    safetyFlag: Boolean(data.safetyFlag),
    parentShareSummary: typeof data.parentShareSummary === 'string' ? data.parentShareSummary : null,
    suggestedComfortTool: typeof data.suggestedComfortTool === 'string' ? data.suggestedComfortTool : null,
    replySource: 'openai',
  };

  console.log('[Se\'kret AI response]', {
    replySource: result.replySource,
    tone: result.tone,
    avatarState: result.avatarState,
    safetyFlag: result.safetyFlag,
    reply: result.reply,
  });

  return result;
}

export async function fetchSekretVoice(input: {
  reply: string;
  characterId: SekretCharacterId;
}): Promise<SekretVoiceResponse | null> {
  if (!BASE_URL || !input.reply.trim()) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`voice api error ${res.status}`);
    const data = await res.json() as Partial<SekretVoiceResponse>;
    if (!data.audioBase64 || !data.contentType) return null;
    return { audioBase64: data.audioBase64, contentType: data.contentType, characterId: normalizeSekretCharacter(data.characterId, input.characterId) };
  } catch {
    return null;
  }
}

export async function fetchSekretTranscribe(input: {
  audioBase64: string;
  contentType: string;
}): Promise<string | null> {
  if (!BASE_URL || !input.audioBase64) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json() as { transcript?: string };
    const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
    return transcript || null;
  } catch {
    return null;
  }
}

/**
 * Legacy shim — prefer fetchSekretBrainReply directly in new code.
 */
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
  });
  return response.reply;
}
