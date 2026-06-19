import { fetchSekretBrainReply, type SekretAvatarState } from './api';
import { getSekretFallback } from '../../services/sekretVoice';
import { normalizeSekretPersonality } from '../../services/sekretPresence';
import type { PagesTab } from '../../screens/PagesScreen';

const REPLY_TABS = new Set<PagesTab>(['raylene', 'rylane', 'cloud', 'night']);

export function tabToAvatarKey(tab: PagesTab): 'raylene' | 'rylane' | 'cloud' | 'night' | null {
  return REPLY_TABS.has(tab) ? tab as 'raylene' | 'rylane' | 'cloud' | 'night' : null;
}

export const THINKING_LABELS: Record<string, string> = {
  raylene: 'Raylene is thinking…', rylane: 'Rylane is thinking…',
  cloud: 'Cloud is thinking…', night: 'Night is thinking…',
};

export type PagesReplyResult = { reply: string; tone: string; avatarState: SekretAvatarState };

export async function fetchPagesReplyDetails(input: { tab: PagesTab; text: string; mood?: string }): Promise<PagesReplyResult> {
  const avatarKey = tabToAvatarKey(input.tab);
  if (!avatarKey || !input.text.trim()) return { reply: '', tone: 'neutral', avatarState: 'neutral' };
  const fallback = getSekretFallback(normalizeSekretPersonality(avatarKey), input.text);
  try {
    const response = await fetchSekretBrainReply({ characterId: avatarKey, surface: 'journal', userText: input.text, mood: input.mood });
    return { reply: response.reply || fallback, tone: response.tone, avatarState: response.avatarState };
  } catch {
    return { reply: fallback, tone: avatarKey, avatarState: avatarKey === 'cloud' || avatarKey === 'night' ? 'comforting' : 'responding' };
  }
}

export async function fetchPagesReply(input: { tab: PagesTab; text: string; mood?: string }): Promise<string> {
  return (await fetchPagesReplyDetails(input)).reply;
}
