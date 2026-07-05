/**
 * Core chat message function.
 * Sends a message to the Cloudflare Worker with companion and Oracle context.
 */
import type { PersonalityId } from '@/types';
import {
  learnTeenRelationshipStyle,
  loadTeenRelationshipProfile,
  relationshipProfileToOracleNote,
  saveTeenRelationshipProfile,
  type TeenRelationshipProfile,
} from '../../../services/oracleRelationship';
import {
  getArrivalReply,
  getConversationPhase,
  isArrivalMessage,
  keepSekretReply,
  getSekretFallback,
  buildConversationPhaseInstruction,
  type ConversationPhase,
} from '../../../services/sekretVoice';
import { backendAuthHeaders } from '../../utils/backendAuth';
import { logRuntimeAuditEvent } from '@/services/runtimeAudit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface SendMessageOptions {
  mood?: string;
  history?: ChatMessage[];
  userName?: string;
  displayName?: string;
  profileName?: string;
  surface?: 'journal' | 'voiceBip' | 'comfort' | 'circle' | 'parentBridge' | 'selfDiscovery' | 'parentCoach';
  parentSharingEnabled?: boolean;
  oracleContext?: string[];
}

export interface WorkerReplyMeta {
  detectedIntent?: string;
  usedGreetingVariant?: boolean;
  replySource?: 'openai' | 'fallback';
  tone?: string;
  safetyFlag?: boolean;
  suggestedComfortTool?: string | null;
  parentShareSummary?: string | null;
}

/**
 * The structured result returned by sendMessage.
 * All callers that previously received a bare string can access `.reply`.
 */
export interface SendMessageResult {
  reply: string;
  /** Where the reply actually came from. */
  replySource: 'worker' | 'local-fallback' | 'safety';
  /** True whenever we did NOT get a usable Worker response. */
  fallbackUsed: boolean;
  /** Human-readable reason a fallback was used, or null when Worker succeeded. */
  fallbackReason: string | null;
}

const BASE_URL = ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

function mayMirrorProfanity(profile: TeenRelationshipProfile): boolean {
  return profile.profanityPreference === 'light-mirroring';
}

/**
 * Local fallback reply — used ONLY when the Worker is unreachable or returns
 * a non-OK status. The arrival-greeting branch has been removed: greeting
 * messages now travel to the Worker like any other message so the Worker can
 * shape the opening tone with full phaseInstruction context.
 */
function localFallback(
  personalityId: PersonalityId,
  text: string,
  relationship: TeenRelationshipProfile,
): string {
  const lower = text.toLowerCase();
  const isShortContinuation = /^(idk|nothing|lol|lmao|ok|okay|yeah|nah|sure|random|fine|k+)\s*[!?.]*$/i.test(lower);
  const sad = /\b(sad|cry|lonely|alone|hurt|heavy|depressed|overwhelmed)\b/.test(lower);
  const angry = /\b(angry|mad|pissed|annoyed|frustrated)\b/.test(lower);
  const planning = /\b(plan|goal|idea|business|project|school|future|dream|create|music|art|write)\b/.test(lower);
  const reset = /\b(failed|fell off|gave up|stopped|missed|behind|procrastinat)\w*\b/.test(lower);
  const mirror = mayMirrorProfanity(relationship);

  if (isShortContinuation) {
    if (personalityId === 'rylane') return "Aight, I'm here. Talk.";
    if (personalityId === 'cloud') return "Hey. No pressure — whatever you want to say, or nothing at all.";
    if (personalityId === 'night') return "Still here. No rush.";
    return "Hey! Random or did something actually happen?";
  }

  if (personalityId === 'rylane') {
    if (angry) return mirror
      ? "Yeah, that shit would set anybody off. Before you move on it, what line got crossed?"
      : "Yeah, that would set anybody off. Before you move on it, what line got crossed?";
    if (sad) return "That sounds heavy for real. You do not have to dress it up — what part is hitting hardest?";
    return relationship.nicknameComfort === 'dislikes'
      ? "Say the real version. What is going on?"
      : "Aight, say the real version. What is going on?";
  }

  if (personalityId === 'cloud') {
    if (sad) return "We can make this smaller first. One breath, then one sentence — or no sentence yet.";
    return "No rush. Start with the smallest piece that feels safe to say.";
  }

  if (personalityId === 'night') {
    if (planning) return "Hold up — that idea has something. What is the goal, and what is one step you can set up tonight?";
    if (reset) return "One off day is not your identity. What made the plan fall apart, and what changes this time?";
    if (sad) return "We can sit with it for a minute. Then we decide whether tonight needs rest, reflection, or one small move forward.";
    return "Are we trying to understand this, plan it, create something, or finish one small part?";
  }

  if (personalityId === 'oracle') {
    return "What does this keep revealing about who you are, what you value, or what you are trying to become?";
  }

  if (angry) return mirror
    ? "Okay, that shit really got under your skin. What happened right before it shifted?"
    : "Okay, that really got under your skin. What happened right before it shifted?";
  if (sad) return "Tell me the part you keep trying to make sound smaller.";
  return relationship.nicknameComfort === 'dislikes'
    ? "Okay. What really happened?"
    : "Girl, okay. What really happened?";
}

// ── Overload signatures (keep public API backward-compatible) ─────────────

export async function sendMessage(
  personalityId: PersonalityId,
  text: string,
  context: string,
  options: SendMessageOptions,
): Promise<SendMessageResult>;
export async function sendMessage(
  personalityId: PersonalityId,
  text: string,
  context: string,
  mood?: string,
  history?: ChatMessage[],
): Promise<SendMessageResult>;

// ── Implementation ────────────────────────────────────────────────────────

export async function sendMessage(
  personalityId: PersonalityId,
  text: string,
  context: string = 'chat',
  moodOrOptions?: string | SendMessageOptions,
  legacyHistory?: ChatMessage[],
): Promise<SendMessageResult> {
  const options: SendMessageOptions = typeof moodOrOptions === 'object' && moodOrOptions !== null
    ? moodOrOptions
    : { mood: moodOrOptions as string | undefined, history: legacyHistory };

  const { mood, history = [], userName, displayName, profileName, surface, parentSharingEnabled, oracleContext } = options;
  const historyLength = history.length;

  const currentRelationship = await loadTeenRelationshipProfile();
  const learnedRelationship = learnTeenRelationshipStyle(text, currentRelationship);
  await saveTeenRelationshipProfile(learnedRelationship);

  // isArrivalMessage is still used to inform phaseInstruction sent to the
  // Worker — but we NO LONGER short-circuit here and skip the Worker call.
  // Greeting messages now reach the Worker so it can shape the opening tone
  // with full context. The pre-Worker arrival return has been removed.

  const phase: ConversationPhase = getConversationPhase(historyLength);
  const phaseInstruction = buildConversationPhaseInstruction(phase, historyLength, personalityId);
  const isArrival = isArrivalMessage(text, historyLength);

  const normalizedSurface: SendMessageOptions['surface'] =
    surface ??
    (context === 'pages' ? 'journal'
      : context === 'voiceBip' ? 'voiceBip'
        : context === 'comfort' ? 'comfort'
          : context === 'circle' ? 'circle'
            : context === 'parentBridge' ? 'parentBridge'
              : context === 'selfDiscovery' ? 'selfDiscovery'
                : context === 'parentCoach' ? 'parentCoach'
                  : 'journal');

  // ── No backend URL ───────────────────────────────────────────────────────
  if (!BASE_URL) {
    const fallbackText = personalityId === 'parentCoach'
      ? "Hey. Glad you're here. What's going on at home?"
      : localFallback(personalityId, text, learnedRelationship);
    if (__DEV__) {
      console.warn(
        '[sendMessage] No EXPO_PUBLIC_BACKEND_URL set — using local fallback.',
        { companion: personalityId, surface: normalizedSurface, userText: text },
      );
    }
    return {
      reply: fallbackText,
      replySource: 'local-fallback',
      fallbackUsed: true,
      fallbackReason: 'EXPO_PUBLIC_BACKEND_URL is not configured',
    };
  }

  const workerHistory = history.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: m.text,
  }));

  const payload = {
    userText: text,
    characterId: personalityId,
    surface: normalizedSurface,
    mood,
    history: workerHistory,
    parentSharingEnabled: parentSharingEnabled ?? false,
    userName,
    displayName,
    profileName,
    conversationPhase: phase,
    phaseInstruction,
    isArrival,
    memory: {
      relationshipStyle: relationshipProfileToOracleNote(learnedRelationship),
      ...(oracleContext && oracleContext.length > 0 ? { oracleContext } : {}),
    },
  };

  if (__DEV__) {
    console.log('[sendMessage] → Worker', {
      companion: personalityId,
      surface: normalizedSurface,
      url: `${BASE_URL}/api/sekret/reply`,
      isArrival,
      phase,
      payloadBytes: JSON.stringify(payload).length,
      historyLength,
      hasMood: Boolean(mood),
      hasOracleContext: Boolean(oracleContext?.length),
    });
  }

  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: await backendAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (__DEV__) {
      console.log('[sendMessage] ← Worker', {
        companion: personalityId,
        surface: normalizedSurface,
        status: res.status,
        ok: res.ok,
      });
    }

    if (!res.ok) {
      const reason = `Worker responded ${res.status}`;
      console.error(`[sendMessage] ${reason}`);
      const fallbackText = localFallback(personalityId, text, learnedRelationship);
      return {
        reply: fallbackText,
        replySource: 'local-fallback',
        fallbackUsed: true,
        fallbackReason: reason,
      };
    }

    const data = await res.json() as { reply?: string; replySource?: string; detectedIntent?: string };
    const rawReply = data.reply ?? '';

    if (!rawReply) {
      const reason = 'Worker returned empty reply';
      console.error(`[sendMessage] ${reason}, using fallback`);
      const fallbackText = localFallback(personalityId, text, learnedRelationship);
      return {
        reply: fallbackText,
        replySource: 'local-fallback',
        fallbackUsed: true,
        fallbackReason: reason,
      };
    }

    const sekretFallback = getSekretFallback(personalityId, text);
    const guardedReply = keepSekretReply(rawReply, sekretFallback);
    const guardBlocked = guardedReply !== rawReply.trim();

    if (__DEV__ && guardBlocked) {
      console.warn('[sendMessage] keepSekretReply blocked Worker reply — substituted character fallback.', {
        companion: personalityId,
        blocked: rawReply.slice(0, 80),
        substituted: guardedReply.slice(0, 80),
      });
    }

    // ── Retention: log every successful companion chat (fire-and-forget) ──
    logRuntimeAuditEvent('manual', {
      event_type: 'companion_chat_sent',
      screen: normalizedSurface ?? 'chat',
      severity: 'info',
      metadata: {
        companion: personalityId,
        surface: normalizedSurface,
        reply_source: data.replySource ?? 'worker',
        history_length: historyLength,
        fallback_used: false,
      },
    }).catch(() => {/* silent — never block the reply */});

    return {
      reply: guardedReply,
      replySource: 'worker',
      fallbackUsed: false,
      fallbackReason: null,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error('[sendMessage] Worker fetch failed:', reason);
    const fallbackText = localFallback(personalityId, text, learnedRelationship);
    return {
      reply: fallbackText,
      replySource: 'local-fallback',
      fallbackUsed: true,
      fallbackReason: `fetch error: ${reason}`,
    };
  }
}

function makeMessageId(role: ChatMessage['role']): string {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeUserMessage(text: string): ChatMessage {
  return { id: makeMessageId('user'), role: 'user', text, timestamp: Date.now() };
}

export function makeAssistantMessage(text: string): ChatMessage {
  return { id: makeMessageId('assistant'), role: 'assistant', text, timestamp: Date.now() };
}
