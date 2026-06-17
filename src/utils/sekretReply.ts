/**
 * src/utils/sekretReply.ts
 *
 * Thin helper layer between PagesScreen and the Cloudflare Worker.
 * Physical implementation — utils/sekretReply.ts is the legacy shim.
 */
import { fetchSekretReply } from './api';
import { buildSekretVoiceInstruction, getSekretFallback } from '../../services/sekretVoice';
import { normalizeSekretPersonality } from '../../services/sekretPresence';
import type { PagesTab } from '../../screens/PagesScreen';

const REPLY_TABS = new Set<PagesTab>(['raylene', 'rylane', 'cloud', 'night']);

export function tabToAvatarKey(
  tab: PagesTab,
): 'raylene' | 'rylane' | 'cloud' | 'night' | null {
  if (!REPLY_TABS.has(tab)) return null;
  return tab as 'raylene' | 'rylane' | 'cloud' | 'night';
}

export const THINKING_LABELS: Record<string, string> = {
  raylene: 'Raylene is thinking\u2026',
  rylane:  'Rylane is thinking\u2026',
  cloud:   'Cloud is thinking\u2026',
  night:   'Night is thinking\u2026',
};

export async function fetchPagesReply({
  tab, text, mood,
}: {
  tab: PagesTab;
  text: string;
  mood?: string;
}): Promise<string> {
  const avatarKey = tabToAvatarKey(tab);
  if (!avatarKey || !text.trim()) return '';
  const voice = normalizeSekretPersonality(avatarKey);
  const fallback = getSekretFallback(voice, text);
  buildSekretVoiceInstruction(voice, text, mood, undefined, undefined);
  try {
    const reply = await fetchSekretReply(
      text, 'pages', mood, avatarKey, undefined, undefined, 'teen', [],
    );
    return reply || fallback;
  } catch {
    return fallback;
  }
}
