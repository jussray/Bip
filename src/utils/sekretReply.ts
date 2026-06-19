import { IMAGES } from '../../constants/theme';
import { fetchSekretBrainReply, type SekretAvatarState } from './api';
import { getSekretFallback } from '../../services/sekretVoice';
import { normalizeSekretPersonality } from '../../services/sekretPresence';
import type { PagesTab } from '../../screens/PagesScreen';

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

export type PagesReplyResult = { reply: string; tone: string; avatarState: SekretAvatarState };

export async function fetchPagesReplyDetails(input: { tab: PagesTab; text: string; mood?: string }): Promise<PagesReplyResult> {
  const avatarKey = tabToAvatarKey(input.tab);
  if (!avatarKey || !input.text.trim()) return { reply: '', tone: 'neutral', avatarState: 'neutral' };

  setAvatarState(avatarKey, 'thinking');
  const fallback = getSekretFallback(normalizeSekretPersonality(avatarKey), input.text);

  try {
    const response = await fetchSekretBrainReply({
      characterId: avatarKey,
      surface: 'journal',
      userText: input.text,
      mood: input.mood,
    });
    const nextState = inferAvatarState({ state: response.avatarState, mood: input.mood, tone: response.tone });
    setAvatarState(avatarKey, nextState);
    return { reply: response.reply || fallback, tone: response.tone, avatarState: nextState };
  } catch {
    const nextState: SekretAvatarState = avatarKey === 'cloud' || avatarKey === 'night' ? 'comforting' : 'responding';
    setAvatarState(avatarKey, nextState);
    return { reply: fallback, tone: avatarKey, avatarState: nextState };
  }
}

export async function fetchPagesReply(input: { tab: PagesTab; text: string; mood?: string }): Promise<string> {
  return (await fetchPagesReplyDetails(input)).reply;
}
