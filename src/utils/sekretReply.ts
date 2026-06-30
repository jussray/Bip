import { IMAGES } from '../../constants/theme';
import { fetchSekretBrainReply, type SekretAvatarState, type SekretReplySource } from './api';
import {
  getConversationPhase,
  buildConversationPhaseInstruction,
} from '../../services/sekretVoice';
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
  replySource: SekretReplySource;
  fallbackUsed: boolean;
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
      replySource: 'fallback',
      fallbackUsed: true,
      fallbackReason: 'empty_input',
    };
  }

  const history = input.history ?? [];
  const historyLength = history.length;
  const phase = getConversationPhase(historyLength);
  const phaseInstruction = buildConversationPhaseInstruction(phase, historyLength, avatarKey);
  const workerHistory = history.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: message.text,
  }));

  setAvatarState(avatarKey, 'thinking');

  const response = await fetchSekretBrainReply({
    characterId: avatarKey,
    surface: 'journal',
    userText: input.text,
    mood: input.mood,
    history: workerHistory,
    conversationPhase: phase,
    phaseInstruction,
  });

  const nextState = inferAvatarState({
    state: response.avatarState,
    mood: input.mood,
    tone: response.tone,
  });

  setAvatarState(avatarKey, nextState);
  return {
    reply: response.reply,
    tone: response.tone,
    avatarState: nextState,
    replySource: response.replySource,
    fallbackUsed: response.fallbackUsed,
    fallbackReason: response.fallbackReason,
  };
}

export async function fetchPagesReply(input: {
  tab: PagesTab;
  text: string;
  mood?: string;
  history?: ChatMessage[];
}): Promise<string> {
  return (await fetchPagesReplyDetails(input)).reply;
}
