// @ts-nocheck
import type { ImageSourcePropType } from 'react-native';
import { AVATARS, IMAGES, type Character } from './theme';
import type { SekretPersonality } from '../services/sekretPresence';

export type VoiceBipAvatarKey = Character;
export type FutureVoiceId = string | null;

/**
 * Reserved backend voice identifiers. They intentionally remain null until a
 * first-party voice generation layer is selected and configured.
 */
export const VOICE_BIP_VOICE_IDS = {
  rayleneVoiceId: null as FutureVoiceId,
  rylaneVoiceId: null as FutureVoiceId,
  cloudVoiceId: null as FutureVoiceId,
  nightVoiceId: null as FutureVoiceId,
  sekretVoiceId: null as FutureVoiceId,
} as const;

export type AvatarVoiceProfileKey = VoiceBipAvatarKey | 'sekret';

export interface AvatarVoiceProfile {
  key: AvatarVoiceProfileKey;
  voiceId: FutureVoiceId;
  enabled: false;
  provider: 'none';
}

/** Oracle is intentionally absent: it reasons privately and never speaks. */
export const AVATAR_VOICE_PROFILES: Record<AvatarVoiceProfileKey, AvatarVoiceProfile> = {
  raylene: { key: 'raylene', voiceId: VOICE_BIP_VOICE_IDS.rayleneVoiceId, enabled: false, provider: 'none' },
  rylane: { key: 'rylane', voiceId: VOICE_BIP_VOICE_IDS.rylaneVoiceId, enabled: false, provider: 'none' },
  cloud: { key: 'cloud', voiceId: VOICE_BIP_VOICE_IDS.cloudVoiceId, enabled: false, provider: 'none' },
  night: { key: 'night', voiceId: VOICE_BIP_VOICE_IDS.nightVoiceId, enabled: false, provider: 'none' },
  sekret: { key: 'sekret', voiceId: VOICE_BIP_VOICE_IDS.sekretVoiceId, enabled: false, provider: 'none' },
};

export interface VoiceBipPrompt {
  emoji: string;
  text: string;
}

export interface VoiceBipAvatarDefinition {
  key: VoiceBipAvatarKey;
  displayName: string;
  emoji: string;
  role: string;
  energy: string;
  personality: SekretPersonality;
  voiceId: FutureVoiceId;
  accent: string;
  heroArt: {
    day: ImageSourcePropType | null;
    night: ImageSourcePropType | null;
  };
  prompts: readonly VoiceBipPrompt[];
  tips: readonly string[];
  greeting: string;
  presence: string;
  listening: string;
  responseLabel: string;
  archiveTitle: string;
}

export const VOICE_BIP_AVATARS: Record<VoiceBipAvatarKey, VoiceBipAvatarDefinition> = {
  raylene: {
    key: 'raylene',
    displayName: 'Raylene',
    emoji: '💜',
    role: 'Big sister',
    energy: 'Come here. Talk to me.',
    personality: 'raylene',
    voiceId: VOICE_BIP_VOICE_IDS.rayleneVoiceId,
    accent: '#e9a8d2',
    heroArt: { day: IMAGES.rayleneVoiceDay, night: IMAGES.rayleneVoiceNight },
    prompts: [
      { emoji: '💜', text: "What's something you've been carrying that you haven't said out loud yet?" },
      { emoji: '🌙', text: 'Tell me about a moment this week that felt heavier than it should have.' },
      { emoji: '🫶', text: "What do you need right now that nobody's asked you about?" },
      { emoji: '🌧️', text: 'Say the thing you keep stopping yourself from saying.' },
      { emoji: '✨', text: 'What went okay today — even just one small thing?' },
    ],
    tips: [
      'Find a private spot — car, room, bathroom, wherever',
      'You don’t need perfect words. Just talk.',
      'It’s okay to cry, pause, or start over',
      'I listen without judgment, always',
    ],
    greeting: 'Come here. Talk to me.',
    presence: 'Raylene’s here · warm and listening',
    listening: 'Raylene is listening… 💜',
    responseLabel: 'Raylene replied 💜',
    archiveTitle: 'Voice Bips with Raylene',
  },
  rylane: {
    key: 'rylane',
    displayName: 'Rylane',
    emoji: '⚡',
    role: 'Big brother / older cousin',
    energy: 'Aight. Say it straight.',
    personality: 'rylane',
    voiceId: VOICE_BIP_VOICE_IDS.rylaneVoiceId,
    accent: '#8f9cff',
    heroArt: { day: IMAGES.rylaneVoiceDay, night: IMAGES.rylaneVoiceNight },
    prompts: [
      { emoji: '⚡', text: "What's been sitting on your chest that you haven't put down yet?" },
      { emoji: '🧠', text: "Say it plain. No filter. What's actually on your mind right now?" },
      { emoji: '🎙️', text: 'Talk me through the last 24 hours, for real.' },
      { emoji: '🔊', text: 'What would you say if nobody was watching or judging?' },
      { emoji: '🏆', text: "What's one thing you handled today that nobody gave you credit for?" },
    ],
    tips: [
      'Find your spot — car, garage, walk, wherever feels real',
      'You don’t gotta sound smooth. Just say it.',
      'Pause. Curse. Restart. All allowed.',
      'I’m not grading you. I’m holding it with you.',
    ],
    greeting: 'Aight. Say it straight.',
    presence: 'Rylane’s here · no judgment, no lecture',
    listening: 'Rylane is listening… ⚡',
    responseLabel: 'Rylane replied ⚡',
    archiveTitle: 'Voice Bips with Rylane',
  },
  cloud: {
    key: 'cloud',
    displayName: 'Cloud',
    emoji: '☁️',
    role: 'Reflection',
    energy: 'We don’t have to rush this.',
    personality: 'cloud',
    voiceId: VOICE_BIP_VOICE_IDS.cloudVoiceId,
    accent: '#c8c9f5',
    heroArt: { day: AVATARS.cloud.fullbody, night: AVATARS.cloud.fullbody },
    prompts: [
      { emoji: '☁️', text: 'Let the words come slowly. There’s no rush here.' },
      { emoji: '🕯️', text: "What's one thing that felt heavy this week you haven't set down?" },
      { emoji: '🌊', text: 'Just breathe first. Then say whatever comes.' },
      { emoji: '🫧', text: 'What feels closest to the surface right now?' },
    ],
    tips: [
      'Start with one word if that’s all you have',
      'Silence is allowed. Take the space you need.',
      'You can pause and come back when the thought is ready',
      'Nothing has to be solved here',
    ],
    greeting: 'We don’t have to rush this.',
    presence: 'Cloud’s here · quiet and unhurried',
    listening: 'Cloud is listening… ☁️',
    responseLabel: 'Cloud replied ☁️',
    archiveTitle: 'Voice Bips with Cloud',
  },
  night: {
    key: 'night',
    displayName: 'Night',
    emoji: '🌙',
    role: 'Late-night presence',
    energy: 'I’m here while everybody else is asleep.',
    personality: 'night',
    voiceId: VOICE_BIP_VOICE_IDS.nightVoiceId,
    accent: '#bbb7ef',
    // Night has no dedicated avatar cutout yet. Keep Night’s complete room
    // identity rather than borrowing another character’s body art.
    heroArt: { day: null, night: null },
    prompts: [
      { emoji: '🌃', text: 'What keeps replaying in your head at night?' },
      { emoji: '🌙', text: 'What are you too tired to pretend is fine right now?' },
      { emoji: '😶‍🌫️', text: 'Say the part that gets louder after dark.' },
      { emoji: '🕯️', text: 'What do you need someone to stay awake with you for?' },
    ],
    tips: [
      'Let the room be quiet around you',
      'You don’t have to make tonight sound better than it feels',
      'Take your time between thoughts',
      'Night stays present; Night does not push',
    ],
    greeting: 'I’m here while everybody else is asleep.',
    presence: 'Night’s here · the light is still on',
    listening: 'Night is listening… 🌙',
    responseLabel: 'Night replied 🌙',
    archiveTitle: 'Voice Bips with Night',
  },
};

export const VOICE_BIP_AVATAR_KEYS = Object.freeze([
  'raylene',
  'rylane',
  'cloud',
  'night',
] as const);

export function normalizeVoiceBipAvatar(value?: string): VoiceBipAvatarKey {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'rylane') return 'rylane';
  if (normalized === 'cloud') return 'cloud';
  if (normalized === 'night') return 'night';
  return 'raylene';
}
