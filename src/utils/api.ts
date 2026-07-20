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

export type VisibleSekretCharacterId = 'raylene' | 'rylane' | 'cloud' | 'night';
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
}

export interface SekretVoiceResponse {
  audioBase64: string;
  contentType: string;
  characterId: SekretCharacterId;
  traceId?: string;
}

export function normalizeSekretCharacter(value?: string, fallback: SekretCharacterId = 'raylene'): SekretCharacterId {
  const raw = (value ?? '').trim().toLowerCase().replace(/[’']/g, '');
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
  const crisis = /\b(kill myself|end my life|want to die|suicidal|self[- ]?harm|not safe|abuse|danger)\b/i.test(text);
  if (crisis) {
    return {
      reply: "I'm an AI companion, not emergency help. If you're in danger or might hurt yourself, tell a trusted adult now, call 911, call/text 988, or text HOME to 741741.",
      tone: 'supportive-safety',
      avatarState: 'concerned',
      safetyFlag: true,
      parentShareSummary: null,
      suggestedComfortTool: 'safety-plan',
      replySource: 'fallback',
    };
  }
  const replies: Record<SekretCharacterId, string[]> = {
    raylene: [
      "Okay, I hear you. Which part feels the loudest right now?",
      "You do not have to make it sound neat. Tell me the messy version.",
      "That is a lot to sit with. Do you need comfort, honesty, or a plan?",
      "Hey, you showed up and that matters. What is on your mind?",
      "I am here and I am not going anywhere. Start wherever you want.",
      "That sounds like it has been sitting with you for a while. What is the weight of it?",
      "We do not have to have this figured out. What do you need most right now?",
      "You mentioned a lot there. Which piece feels the most unfinished?",
      "Okay, I want to understand this properly. Can you walk me through what happened?",
      "That is valid. What would it look like if this got even a little better?",
      "I am proud of you for saying something. What is the part that was hard to admit?",
      "You do not have to protect me from the hard version. Tell me what is really going on.",
      "Okay. Take a breath. Now tell me the honest version, not the edited one.",
      "What would it feel like to let someone actually help you with this?",
      "You are not too much. Which part has been feeling the loudest lately?",
    ],
    rylane: [
      "Yeah, that is real. What is the part you have not said out loud yet?",
      "I hear you. Do you want to vent or figure out your next move?",
      "You do not have to act unbothered in here. Give me the honest version.",
      "Okay, no cap — what is actually going on?",
      "You showed up, so something is on your mind. Talk to me.",
      "Say it the way it really feels, not the cleaned-up version.",
      "I am not here to judge it. I am here to actually hear it.",
      "What is the move you keep almost making but not doing?",
      "Real talk — what would you do if you were not worried about how it sounds?",
      "I got you. What is the thing underneath what you just said?",
      "Nobody in here is keeping score. What happened?",
      "You have been carrying something. Set it down for a second and talk.",
      "Yo, what part of this keeps coming back to you?",
      "I am not going to hit you with advice yet. Tell me the whole thing first.",
      "What do you actually want out of this conversation — to vent, to plan, or to figure something out?",
    ],
    cloud: [
      "We can make this smaller. Tell me the gentlest place to begin.",
      "No rush. You do not have to solve the whole feeling right now.",
      "We do not have to fix it. We can just name what hurts first.",
      "You are safe here. Take your time.",
      "There is no wrong way to say this. What feels closest to true?",
      "Sometimes just naming the feeling out loud is enough for now. What word fits?",
      "I will hold this with you. What is the softest piece we could start with?",
      "You do not have to be brave about it. What are you actually feeling?",
      "We can sit with this as long as you need. Nothing here is urgent.",
      "What is the part you have been gentlest with yourself about? That one is worth attention.",
      "I am not going anywhere. What would feel like the smallest bit of relief right now?",
      "You came here, which means part of you wants to say something. I am listening.",
      "No pressure to figure anything out. Sometimes talking is just its own thing.",
      "What would you say to a friend going through exactly this?",
      "You are allowed to not be okay. What is the true version of how this feels?",
    ],
    night: [
      "Yeah… nights make everything talk louder. What keeps circling back?",
      "You do not have to pretend you are fine in here. Tell me the hidden version.",
      "Let us not rush past it. What is underneath the first thing you said?",
      "Late nights have a way of making things feel bigger and more true at the same time. Which is this?",
      "You still up for a reason. What is your head doing right now?",
      "What is the thought that has been following you around today?",
      "Some things only become clear in the quiet. What is getting clearer for you?",
      "You can think out loud in here. No need to have it organized first.",
      "What is the version of this you have been keeping to yourself?",
      "Night is good for honesty. What is the thing you almost said earlier?",
      "Tell me what is keeping you awake — not the surface version, the real one.",
      "What does your gut say about this, before your brain tries to logic it away?",
      "When you imagine how this looks a year from now, what do you feel?",
      "What question are you sitting with that you have not let yourself answer yet?",
      "We have got time. Walk me through what is actually going on.",
    ],
    sekret: [
      "I’m noticing a pattern in what you shared: part of you wants to be understood without having to explain every detail. I could be reading that wrong, but does that feel close?",
      "Here’s what I’m hearing underneath it: you may be carrying more than you let people see. I’m not treating that like a fact—what part fits, and what part doesn’t?",
      "Your answers seem to point toward wanting both privacy and real connection. That can exist together. Which side feels harder to ask for right now?",
      "There’s something recurring in the way you approach this. Not a problem—just a pattern. Does it show up in other parts of your life too?",
      "I notice you framed that as something that happened to you. Do you also have a sense of your own role in it, however small? I’m not assigning blame—just curious what you see.",
      "What you described sounds like it has layers. The part on the surface, and then something underneath that is harder to name. What is the harder part?",
      "I am picking up on something between what you said and what you did not say. Is there a part of this you decided not to include?",
      "The way you described that tells me something about what you value. What matters most to you in situations like this?",
      "You keep returning to this. That is information. What do you think it means that this keeps coming up?",
      "What would the most honest version of this look like—the one where you do not edit for how it sounds?",
      "I notice you immediately moved to what you should do. What are you feeling before you get to that?",
      "What does this situation keep asking of you that you are not sure you want to give?",
      "The tension you are describing is real. What would it feel like to stop trying to resolve it and just acknowledge it exists?",
      "What part of this do you most want someone to understand about you?",
      "I am curious what you already know about this that you have not said out loud yet.",
    ],
  };
  const options = replies[characterId];
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
  });
  return response.reply;
}
