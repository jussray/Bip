import { IMAGES } from '../../constants/theme';
import { fetchSekretBrainReply, type SekretAvatarState } from './api';
import {
  getSekretFallback,
  getConversationPhase,
  buildConversationPhaseInstruction,
  isArrivalMessage,
  keepSekretReply,
} from '../../services/sekretVoice';
import { normalizeSekretPersonality } from '../../services/sekretPresence';
import type { PagesTab } from '../../screens/PagesScreen';
import type { ChatMessage } from '../../src/services/ai/chat';

export type PagesAvatarKey = 'raylene' | 'rylane' | 'cloud' | 'night';
const REPLY_TABS = new Set<PagesTab>(['raylene', 'rylane', 'cloud', 'night']);

const avatarState: Record<PagesAvatarKey, SekretAvatarState> = {
  raylene: 'neutral',
  rylane: 'neutral',
  cloud: 'neutral',
  night: 'neutral',
};

const avatarAssets: Record<PagesAvatarKey, Record<SekretAvatarState, any>> = {
  raylene: {
    neutral: IMAGES.rayleneNeutral,
    listening: IMAGES.rayleneThinking,
    thinking: IMAGES.rayleneThinking,
    comforting: IMAGES.rayleneWindow,
    happy: IMAGES.rayleneHappy,
    concerned: IMAGES.rayleeneSad,
    responding: IMAGES.rayleneConfident,
  },
  rylane: {
    neutral: IMAGES.rylaneNeutral,
    listening: IMAGES.rylaneThinking,
    thinking: IMAGES.rylaneThinking,
    comforting: IMAGES.rylaneWindow,
    happy: IMAGES.rylaneHappy,
    concerned: IMAGES.rylaneWindow,
    responding: IMAGES.rylaneFullbody,
  },
  cloud: {
    neutral: IMAGES.cloudAvatarNeutral,
    listening: IMAGES.cloudAvatarThinking,
    thinking: IMAGES.cloudAvatarThinking,
    comforting: IMAGES.cloudAvatarWindow,
    happy: IMAGES.cloudAvatarHappy,
    concerned: IMAGES.cloudAvatarWindow,
    responding: IMAGES.cloudAvatarWriting,
  },
  night: {
    neutral: IMAGES.nightNeutral,
    listening: IMAGES.nightListening,
    thinking: IMAGES.nightThinking,
    comforting: IMAGES.nightRelaxed,
    happy: IMAGES.nightHappy,
    concerned: IMAGES.nightProtective,
    responding: IMAGES.nightSoftsmile,
  },
};

function installDynamicAvatar(
  imageKey: 'rayleneNeutral' | 'rylaneNeutral' | 'cloudAvatarNeutral' | 'nightNeutral',
  character: PagesAvatarKey,
) {
  Object.defineProperty(IMAGES, imageKey, {
    configurable: true,
    enumerable: true,
    get: () => avatarAssets[character][avatarState[character]] || avatarAssets[character].neutral,
  });
}

installDynamicAvatar('rayleneNeutral', 'raylene');
installDynamicAvatar('rylaneNeutral', 'rylane');
installDynamicAvatar('cloudAvatarNeutral', 'cloud');
installDynamicAvatar('nightNeutral', 'night');

function setAvatarState(character: PagesAvatarKey, state: SekretAvatarState) {
  avatarState[character] = state;
}

function inferAvatarState(input: { state: SekretAvatarState; mood?: string; tone?: string }): SekretAvatarState {
  if (input.state !== 'neutral') return input.state;
  const signal = `${input.mood || ''} ${input.tone || ''}`.toLowerCase();
  if (/hope|okay|good|happy|proud/.test(signal)) return 'happy';
  if (/heavy|hurt|sad|numb|worried|safety|concern/.test(signal)) return 'concerned';
  if (/soft|calm|comfort|gentle|quiet/.test(signal)) return 'comforting';
  return 'responding';
}

export function tabToAvatarKey(tab: PagesTab): PagesAvatarKey | null {
  return REPLY_TABS.has(tab) ? tab as PagesAvatarKey : null;
}

export const THINKING_LABELS: Record<string, string> = {
  raylene: 'Raylene is thinking…',
  rylane: 'Rylane is thinking…',
  cloud: 'Cloud is thinking…',
  night: 'Night is thinking…',
};

export type PagesReplyResult = {
  reply: string;
  tone: string;
  avatarState: SekretAvatarState;
  /** Where the reply actually came from. */
  replySource: 'worker' | 'local-fallback';
  /** True whenever the Worker was not used. */
  fallbackUsed: boolean;
  /** Human-readable reason a fallback was used, or null when Worker succeeded. */
  fallbackReason: string | null;
};

export async function fetchPagesReplyDetails(input: {
  tab: PagesTab;
  text: string;
  mood?: string;
  history?: ChatMessage[];
}): Promise<PagesReplyResult> {
  const avatarKey = tabToAvatarKey(input.tab);
  if (!avatarKey || !input.text.trim()) {
    return {
      reply: '',
      tone: 'neutral',
      avatarState: 'neutral',
      replySource: 'local-fallback',
      fallbackUsed: true,
      fallbackReason: 'empty input or unrecognised tab',
    };
  }

  const history = input.history ?? [];
  const historyLength = history.length;
  const phase = getConversationPhase(historyLength);
  const personality = normalizeSekretPersonality(avatarKey);
  const fallback = getSekretFallback(personality, input.text);
  const isArrival = isArrivalMessage(input.text, historyLength);

  // isArrival is forwarded to the Worker inside phaseInstruction so the Worker
  // can apply opening-tone rules. We do NOT short-circuit here anymore —
  // greeting messages reach the Worker like any other message.

  setAvatarState(avatarKey, 'thinking');

  const phaseInstruction = buildConversationPhaseInstruction(phase, historyLength, avatarKey);
  const workerHistory = history.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: m.text,
  }));

  if (__DEV__) {
    console.log('[fetchPagesReplyDetails] → Worker', {
      companion: avatarKey,
      surface: 'journal',
      isArrival,
      phase,
      historyLength,
      hasMood: Boolean(input.mood),
      userTextLength: input.text.length,
    });
  }

  try {
    const request = {
      characterId: avatarKey,
      surface: 'journal' as const,
      userText: input.text,
      mood: input.mood,
      history: workerHistory,
      conversationPhase: phase,
      phaseInstruction,
      isArrival,
    };

    const response = await fetchSekretBrainReply(request as Parameters<typeof fetchSekretBrainReply>[0]);

    if (__DEV__) {
      console.log('[fetchPagesReplyDetails] ← Worker', {
        companion: avatarKey,
        replySource: response.replySource ?? 'worker',
        tone: response.tone,
        replyLength: (response.reply ?? '').length,
      });
    }

    const nextState = inferAvatarState({
      state: response.avatarState,
      mood: input.mood,
      tone: response.tone,
    });

    setAvatarState(avatarKey, nextState);

    const guardedReply = keepSekretReply(response.reply, fallback);
    const guardBlocked = guardedReply !== (response.reply ?? '').trim();

    if (__DEV__ && guardBlocked) {
      console.warn('[fetchPagesReplyDetails] keepSekretReply blocked Worker reply.', {
        companion: avatarKey,
        blocked: (response.reply ?? '').slice(0, 80),
        substituted: guardedReply.slice(0, 80),
      });
    }

    return {
      reply: guardedReply,
      tone: response.tone,
      avatarState: nextState,
      replySource: 'worker',
      fallbackUsed: false,
      fallbackReason: null,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error('[fetchPagesReplyDetails] Worker fetch failed:', reason);
    const nextState: SekretAvatarState = avatarKey === 'cloud' || avatarKey === 'night'
      ? 'comforting'
      : 'responding';
    setAvatarState(avatarKey, nextState);
    return {
      reply: fallback,
      tone: avatarKey,
      avatarState: nextState,
      replySource: 'local-fallback',
      fallbackUsed: true,
      fallbackReason: `fetch error: ${reason}`,
    };
  }
}

export async function fetchPagesReply(input: {
  tab: PagesTab;
  text: string;
  mood?: string;
  history?: ChatMessage[];
}): Promise<string> {
  return (await fetchPagesReplyDetails(input)).reply;
}
