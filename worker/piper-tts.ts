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

export interface PiperPhonemeAlignment {
  phoneme: string;
  startSeconds: number;
  durationSeconds: number;
}

export interface PiperSynthesisResult {
  bytes: Uint8Array;
  contentType: string;
  voice: string;
  alignments: PiperPhonemeAlignment[];
  alignmentsAvailable: boolean;
}

/**
 * These defaults must match the model stems baked into services/piper-tts/Dockerfile.
 * Environment overrides remain available so the provider can be swapped without
 * changing the mobile client or the canonical Worker contract.
 */
const DEFAULT_PIPER_VOICES: Record<PiperCharacterId, string> = {
  suhana: 'en_US-amy-medium',
  sy: 'en_US-ryan-medium',
  cloud: 'en_US-amy-low',
  night: 'en_US-lessac-low',
  sekret: 'en_US-amy-medium',
  parentCoach: 'en_US-amy-medium',
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

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseAlignments(value: unknown): PiperPhonemeAlignment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const phoneme = typeof record.phoneme === 'string' ? record.phoneme : '';
    const startSeconds = typeof record.startSeconds === 'number' ? record.startSeconds : Number.NaN;
    const durationSeconds = typeof record.durationSeconds === 'number' ? record.durationSeconds : Number.NaN;
    if (!phoneme || !Number.isFinite(startSeconds) || !Number.isFinite(durationSeconds) || durationSeconds < 0) return [];
    return [{ phoneme, startSeconds, durationSeconds }];
  });
}

async function synthesizeAligned(
  baseUrl: string,
  headers: Record<string, string>,
  text: string,
  voice: string,
): Promise<PiperSynthesisResult | null> {
  const response = await fetch(`${baseUrl}/synthesize-aligned`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, voice, format: 'wav' }),
  });

  // Old Piper deployments do not have this additive endpoint yet. Preserve
  // Voice Bip availability by falling through to the stable WAV endpoint.
  if (response.status === 404 || response.status === 405) return null;
  if (!response.ok) throw new Error(`Piper aligned TTS ${response.status}`);

  const data = await response.json() as Record<string, unknown>;
  const audioBase64 = typeof data.audioBase64 === 'string' ? data.audioBase64 : '';
  if (!audioBase64) throw new Error('Piper aligned TTS returned no audio');
  const alignments = parseAlignments(data.alignments);

  return {
    bytes: fromBase64(audioBase64),
    contentType: typeof data.contentType === 'string' ? data.contentType : 'audio/wav',
    voice: typeof data.voice === 'string' ? data.voice : voice,
    alignments,
    alignmentsAvailable: data.alignmentsAvailable === true && alignments.length > 0,
  };
}

export async function synthesizeWithPiper(input: {
  text: string;
  characterId: PiperCharacterId;
  env: PiperTtsEnv;
}): Promise<PiperSynthesisResult | null> {
  const baseUrl = input.env.PIPER_TTS_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) return null;
  const voice = getPiperVoice(input.characterId, input.env);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (input.env.PIPER_TTS_TOKEN?.trim()) headers.Authorization = `Bearer ${input.env.PIPER_TTS_TOKEN.trim()}`;
  const text = input.text.slice(0, 4000);

  const aligned = await synthesizeAligned(baseUrl, headers, text, voice);
  if (aligned) return aligned;

  const response = await fetch(`${baseUrl}/synthesize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, voice, format: 'wav' }),
  });
  if (!response.ok) throw new Error(`Piper TTS ${response.status}`);
  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'audio/wav',
    voice,
    alignments: [],
    alignmentsAvailable: false,
  };
}
