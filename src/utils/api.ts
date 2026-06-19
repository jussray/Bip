/**
 * src/utils/api.ts
 *
 * Canonical backend API helpers. OpenAI is called only by the secure backend;
 * the Expo app sends teen-safe request context and never receives or stores an
 * OPENAI_API_KEY.
 */
const BASE_URL = ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

export type SekretCharacterId = 'raylene' | 'rylane' | 'cloud' | 'night';
export type SekretSurface = 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge';
export type SekretAvatarState = 'neutral' | 'listening' | 'thinking' | 'comforting' | 'happy' | 'concerned' | 'responding';

export interface SekretBrainResponse {
  reply: string;
  tone: string;
  avatarState: SekretAvatarState;
  safetyFlag: boolean;
  parentShareSummary: string | null;
  suggestedComfortTool: string | null;
}

export interface SekretVoiceResponse {
  audioBase64: string;
  contentType: string;
  characterId: SekretCharacterId;
}

function normalizeCharacter(value?: string): SekretCharacterId {
  if (value === 'rylane' || value === 'cloud' || value === 'night') return value;
  return 'raylene';
}

function normalizeAvatarState(value?: unknown): SekretAvatarState {
  if (
    value === 'listening' || value === 'thinking' || value === 'comforting' ||
    value === 'happy' || value === 'concerned' || value === 'responding'
  ) return value;
  return 'neutral';
}

function fallbackReply(characterId: SekretCharacterId, text: string): SekretBrainResponse {
  const crisis = /\b(kill myself|end my life|want to die|suicidal|self[- ]?harm|not safe|abuse|danger)\b/i.test(text);
  if (crisis) {
    return {
      reply: "I'm an AI companion, not emergency help. If you're in danger or might hurt yourself, tell a trusted adult now, call 911, call/text 988, or text HOME to 741741.",
      tone: 'supportive-safety',
      avatarState: 'concerned',
      safetyFlag: true,
      parentShareSummary: null,
      suggestedComfortTool: 'safety-plan',
    };
  }
  const replies: Record<SekretCharacterId, string> = {
    raylene: "I'm glad you wrote it down. I'm an AI companion, not a person, but I can help you sort the next small piece.",
    rylane: "Good. You said it. I'm an AI companion, so don't make me the only place for it — what's the real part?",
    cloud: "No rush. I'm an AI companion, and we can make this smaller for one breath.",
    night: "Stay close. I'm an AI companion, not a person; if it gets too heavy, pull in someone safe.",
  };
  return {
    reply: replies[characterId],
    tone: characterId,
    avatarState: characterId === 'cloud' || characterId === 'night' ? 'comforting' : 'responding',
    safetyFlag: false,
    parentShareSummary: null,
    suggestedComfortTool: 'journal',
  };
}

export async function fetchSekretBrainReply(input: {
  characterId: SekretCharacterId;
  surface: SekretSurface;
  userText: string;
  mood?: string;
  memory?: Record<string, unknown>;
  parentSharingEnabled?: boolean;
}): Promise<SekretBrainResponse> {
  if (!BASE_URL) return fallbackReply(input.characterId, input.userText);
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`api error ${res.status}`);
    const data = await res.json() as Partial<SekretBrainResponse>;
    const fallback = fallbackReply(input.characterId, input.userText);
    return {
      reply: data.reply || fallback.reply,
      tone: data.tone || input.characterId,
      avatarState: normalizeAvatarState(data.avatarState),
      safetyFlag: Boolean(data.safetyFlag),
      parentShareSummary: typeof data.parentShareSummary === 'string' ? data.parentShareSummary : null,
      suggestedComfortTool: typeof data.suggestedComfortTool === 'string' ? data.suggestedComfortTool : null,
    };
  } catch {
    return fallbackReply(input.characterId, input.userText);
  }
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
    return { audioBase64: data.audioBase64, contentType: data.contentType, characterId: normalizeCharacter(data.characterId) };
  } catch {
    return null;
  }
}

export async function fetchSekretReply(
  text: string,
  context: SekretSurface | string = 'journal',
  mood?: string,
  avatarKey?: string,
  _extra1?: unknown,
  _privateProfile?: unknown,
  profileSide?: string,
  _history?: unknown[],
): Promise<string> {
  const surface: SekretSurface = context === 'voiceBip' || context === 'comfort' || context === 'circle' || context === 'parentBridge' ? context : 'journal';
  const response = await fetchSekretBrainReply({
    characterId: normalizeCharacter(avatarKey),
    surface,
    mood,
    userText: text,
    parentSharingEnabled: profileSide === 'parent',
  });
  return response.reply;
}
