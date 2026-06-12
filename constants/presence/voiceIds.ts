// constants/presence/voiceIds.ts
// Se'kret Bip — Voice Bip Presence System
// Future voice-provider hooks. PRESENCE COMES FIRST. No provider is wired.
//
// When voice generation is added (ElevenLabs, OpenAI TTS, etc.), populate
// these IDs and implement the resolver(s). The avatar layer never sees this
// directly — Oracle reads it during the `responding` state if/when needed.

import type { PresenceCharacter } from './avatarStates';

export type VoiceProvider = 'elevenlabs' | 'openai' | 'azure' | 'none';

export type CharacterVoice = {
  /** Provider-specific voice identifier (null = not configured). */
  id: string | null;
  /** Which TTS provider owns this voice. */
  provider: VoiceProvider;
  /** Speaking style hint passed to providers that support it. */
  style?: 'soft' | 'direct' | 'quiet' | 'calm';
  /** Optional speed multiplier, 1.0 = natural. */
  speed?: number;
};

export const VOICE_IDS: Record<PresenceCharacter | 'sekret', CharacterVoice> = {
  raylene: { id: null, provider: 'none', style: 'soft',   speed: 1.0 },
  rylane:  { id: null, provider: 'none', style: 'direct', speed: 1.0 },
  cloud:   { id: null, provider: 'none', style: 'quiet',  speed: 0.95 },
  night:   { id: null, provider: 'none', style: 'calm',   speed: 0.9  },
  sekret:  { id: null, provider: 'none', style: 'soft',   speed: 1.0  },
};

export function getCharacterVoice(character: PresenceCharacter): CharacterVoice {
  return VOICE_IDS[character];
}

/** Sentinel — flip to true after at least one VOICE_IDS entry is populated. */
export const VOICE_GENERATION_ENABLED = false;
