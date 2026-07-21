export interface PiperTtsEnv {
  PIPER_TTS_URL?: string;
  PIPER_TTS_TOKEN?: string;
  PIPER_SUHANA_VOICE?: string;
  PIPER_SY_VOICE?: string;
  PIPER_CLOUD_VOICE?: string;
  PIPER_NIGHT_VOICE?: string;
  PIPER_SEKRET_VOICE?: string;
  PIPER_PARENT_COACH_VOICE?: string;
}

export type PiperCharacterId = 'suhana' | 'sy' | 'cloud' | 'night' | 'sekret' | 'parentCoach';

const DEFAULT_PIPER_VOICES: Record<PiperCharacterId, string> = {
  suhana: 'suhana', sy: 'sy', cloud: 'cloud', night: 'night', sekret: 'sekret', parentCoach: 'parentCoach',
};

function getPiperVoice(characterId: PiperCharacterId, env: PiperTtsEnv): string {
  const configured = characterId === 'suhana' ? env.PIPER_SUHANA_VOICE
    : characterId === 'sy' ? env.PIPER_SY_VOICE
      : characterId === 'cloud' ? env.PIPER_CLOUD_VOICE
        : characterId === 'night' ? env.PIPER_NIGHT_VOICE
          : characterId === 'parentCoach' ? env.PIPER_PARENT_COACH_VOICE
            : env.PIPER_SEKRET_VOICE;
  return configured?.trim() || DEFAULT_PIPER_VOICES[characterId];
}

export async function synthesizeWithPiper(input: { text: string; characterId: PiperCharacterId; env: PiperTtsEnv; }) {
  const baseUrl = input.env.PIPER_TTS_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) return null;
  const voice = getPiperVoice(input.characterId, input.env);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (input.env.PIPER_TTS_TOKEN?.trim()) headers.Authorization = `Bearer ${input.env.PIPER_TTS_TOKEN.trim()}`;
  const response = await fetch(`${baseUrl}/synthesize`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: input.text.slice(0, 4000), voice, format: 'wav' }),
  });
  if (!response.ok) throw new Error(`Piper TTS ${response.status}`);
  return { bytes: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get('content-type') || 'audio/wav', voice };
}
