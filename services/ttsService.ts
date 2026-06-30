/**
 * ttsService.ts
 *
 * Bridges the Se'kret Bip Piper TTS server to in-app audio playback.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { playOnce } from './audio/audioPlayback';
import type { VoiceBipAvatarKey } from '../constants/voiceBip';

const PIPER_URL = (process.env.EXPO_PUBLIC_PIPER_TTS_URL ?? '').replace(/\/$/, '');
const PIPER_TOKEN = process.env.EXPO_PUBLIC_PIPER_API_TOKEN ?? '';

type AvatarVoiceModelKey = VoiceBipAvatarKey | 'sekret';

const PIPER_VOICE_MODEL: Record<AvatarVoiceModelKey, string> = {
  raylene: 'en_US-amy-medium',
  rylane: 'en_US-ryan-medium',
  cloud: 'en_US-amy-low',
  night: 'en_US-lessac-low',
  sekret: 'en_US-amy-medium',
};

const TTS_CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}bip_tts_cache/`;

async function ensureTtsCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TTS_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(TTS_CACHE_DIR, { intermediates: true });
  }
}

async function deleteCacheFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export class TtsServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'TtsServiceError';
  }
}

export async function speakAsAvatar(
  text: string,
  avatarKey: AvatarVoiceModelKey,
): Promise<void> {
  if (!PIPER_URL) {
    console.warn('[ttsService] EXPO_PUBLIC_PIPER_TTS_URL is not set. Skipping TTS.');
    return;
  }

  const voice = PIPER_VOICE_MODEL[avatarKey];
  const endpoint = `${PIPER_URL}/synthesize`;
  const cacheFilename = `tts_${avatarKey}_${Date.now()}.wav`;

  await ensureTtsCacheDir();
  const destUri = `${TTS_CACHE_DIR}${cacheFilename}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (PIPER_TOKEN) {
    headers.Authorization = `Bearer ${PIPER_TOKEN}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, voice, format: 'wav' }),
    });
  } catch (err) {
    throw new TtsServiceError(
      `[ttsService] Network error reaching Piper server at ${endpoint}: ${String(err)}`,
    );
  }

  if (!response.ok) {
    const statusCode = response.status;
    let errorMessage = `[ttsService] Piper server returned HTTP ${statusCode}`;
    if (statusCode === 404) errorMessage += ` (voice '${voice}' not installed)`;
    if (statusCode === 500) errorMessage += ' (synthesis failed)';
    if (statusCode === 504) errorMessage += ' (synthesis timed out)';
    throw new TtsServiceError(errorMessage, statusCode);
  }

  try {
    const arrayBuffer = await response.arrayBuffer();
    await FileSystem.writeAsStringAsync(destUri, arrayBufferToBase64(arrayBuffer), {
      encoding: FileSystem.EncodingType.Base64,
    });
    await playOnce(destUri);
  } finally {
    deleteCacheFile(destUri).catch(() => {});
  }
}

export interface PiperHealthResult {
  ok: boolean;
  voices: string[];
  error?: string;
}

export async function checkPiperHealth(): Promise<PiperHealthResult> {
  if (!PIPER_URL) {
    return { ok: false, voices: [], error: 'EXPO_PUBLIC_PIPER_TTS_URL is not set' };
  }

  try {
    const response = await fetch(`${PIPER_URL}/health`);
    if (!response.ok) {
      return { ok: false, voices: [], error: `HTTP ${response.status}` };
    }

    const data = await response.json() as { ok: boolean; voices: string[] };
    return { ok: data.ok, voices: data.voices };
  } catch (err) {
    return { ok: false, voices: [], error: String(err) };
  }
}
