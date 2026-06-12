import {
  buildSekretVoiceInstruction,
  getSekretFallback,
  keepSekretReply,
} from '../services/sekretVoice';
import { normalizeSekretPersonality } from '../services/sekretPresence';

const BASE_URL = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_BACKEND_URL || '';

export async function fetchSekretReply(
  text: string,
  context = 'chat',
  mood?: string,
  personality?: string,
  previousMood?: string,
): Promise<string> {
  const voice = normalizeSekretPersonality(personality);
  const fallback = getSekretFallback(voice, text);

  if (!BASE_URL) return fallback;

  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context,
        mood,
        previous_mood: previousMood,
        personality: voice,
        voiceInstruction: buildSekretVoiceInstruction(voice, text, mood, previousMood),
      }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json();
    return keepSekretReply(data.reply, fallback);
  } catch {
    return fallback;
  }
}
