import {
  buildSekretAdaptationInstruction,
  buildSekretVoiceInstruction,
  getSekretFallback,
  keepSekretReply,
} from '../services/sekretVoice';
import { normalizeSekretPersonality } from '../services/sekretPresence';
import { buildOracleContext, type OracleProfile, type OracleSide } from '../services/oracleDiscovery';
import type { AvatarResponseRequest } from '../types/voiceIntelligence';
import { BACKEND_URL } from './env';

export async function fetchSekretReply(
  text: string,
  context = 'chat',
  mood?: string,
  personality?: string,
  previousMood?: string,
  privateProfile?: OracleProfile,
  profileSide: OracleSide = 'teen',
  privateContext: readonly string[] = [],
): Promise<string> {
  const voice = normalizeSekretPersonality(personality);
  const fallback = getSekretFallback(voice, text);
  const adaptationInstruction = buildSekretAdaptationInstruction(
    [...buildOracleContext(privateProfile, profileSide), ...privateContext].slice(0, 8),
  );

  if (!BACKEND_URL) return fallback;

  try {
    const res = await fetch(`${BACKEND_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context,
        mood,
        previous_mood: previousMood,
        personality: voice,
        voiceInstruction: buildSekretVoiceInstruction(
          voice,
          text,
          mood,
          previousMood,
          adaptationInstruction,
        ),
      }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json();
    return keepSekretReply(data.reply, fallback);
  } catch {
    return fallback;
  }
}

/** Public response boundary: Se'kret reasoning informs the selected avatar. */
export async function fetchAvatarVoiceBipReply(request: AvatarResponseRequest): Promise<string> {
  return fetchSekretReply(
    request.transcriptText,
    'voice-bip',
    request.mood,
    request.avatarKey,
    undefined,
    request.privateProfile,
    request.profileSide,
    [request.sekretUnderstanding.responseBrief, ...request.sekretUnderstanding.memoryContext],
  );
}
