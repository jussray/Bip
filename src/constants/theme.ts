/**
 * src/constants/theme.ts
 *
 * Canonical location (moved from constants/theme.ts in Step 3).
 * All theme packs, personality profiles, mood data, message arrays,
 * image maps, avatar maps, and room-background helpers.
 *
 * Import via: import { THEME_PACKS, MOODS, IMAGES } from '@/constants';
 */
import type { Theme, SekretProfile } from '@/types';

export const THEME_PACKS: Record<string, Theme> = {
  night: {
    name:       'Golden Moon',
    emoji:      '🌙',
    background: '#3A2503',
    card:       '#5B3A00',
    accent:     '#FFD84D',
    soft:       '#FFF3B0',
  },
  flower: {
    name:       'Soft Pink',
    emoji:      '🌸',
    background: '#4A1028',
    card:       '#6D1B3B',
    accent:     '#FF4FA3',
    soft:       '#FFD6E7',
  },
  rain: {
    name:       'Rain Blue',
    emoji:      '🌧️',
    background: '#243447',
    card:       '#36506B',
    accent:     '#4DA3FF',
    soft:       '#B6DCFF',
  },
  neon: {
    name:       'Night Purple',
    emoji:      '💜',
    background: '#160028',
    card:       '#2B0A4D',
    accent:     '#D946EF',
    soft:       '#F5B8FF',
  },
  galaxy: {
    name:       'Galaxy Night',
    emoji:      '🌌',
    background: '#151A40',
    card:       '#2A2D73',
    accent:     '#7C83FF',
    soft:       '#D7D9FF',
  },
};

export const SEKRET_PROFILES: Record<string, SekretProfile> = {
  soft: {
    name:     "Se'kret",
    emoji:    '🌸',
    title:    'Soft Big Sis',
    vibe:     'Warm, expressive, protective, and real.',
    greeting: "Hey love. I'm here. Tell me what's on your mind.",
  },
  rylane: {
    name:     'Rylane',
    emoji:    '⚡',
    title:    'Loyal Bro',
    vibe:     'Quiet loyalty. Keeps it real. Never talks down.',
    greeting: "Aight, I'm here. What's been heavy?",
  },
  cloud: {
    name:     "Cloud Se'kret",
    emoji:    '☁️',
    title:    'Quiet Comfort',
    vibe:     'Soft, calm, low-pressure presence.',
    greeting: 'No pressure. We can just sit here for a minute.',
  },
  night: {
    name:     "Night Se'kret",
    emoji:    '🌙',
    title:    'Late-Night Listener',
    vibe:     'Minimal words, calm energy, safe space.',
    greeting: "I'm here. You don't gotta explain perfectly.",
  },
};

export const MOODS = [
  { id: 'Happy', emoji: '😊' },
  { id: 'Sad',   emoji: '😔' },
  { id: 'Angry', emoji: '😡' },
  { id: 'Tired', emoji: '😴' },
];

export const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Slow breath. Stay with me.' },
];

export const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

export const HEAVY_WORDS = [
  'alone', 'hurt',    'tired', 'done',    'empty',
  'cry',   'sad',     'scared','anxious', 'panic',
];

// ─── Vibe / Room ──────────────────────────────────────────────────────────────

export type VibeKey = 'soft' | 'rylane' | 'cloud' | 'night';

/**
 * Character is the four personality IDs used for avatar/room lookups.
 * Screens that previously imported `Character` from theme now resolve here.
 */
export type Character = VibeKey;

/**
 * Four-phase time-of-day used by room backgrounds, presence, and screen themes.
 */
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

/**
 * Three-phase room phase (sub-division of TimeOfDay used by RoomScreen).
 */
export type RoomPhase = 'day' | 'evening' | 'night';

const VALID_VIBE_KEYS: VibeKey[] = ['soft', 'rylane', 'cloud', 'night'];

export function normalizeVibeKey(raw: string | undefined): VibeKey {
  return VALID_VIBE_KEYS.includes(raw as VibeKey) ? (raw as VibeKey) : 'soft';
}

/**
 * Normalize any string to a valid Character/VibeKey.
 * Used by SekretScreen and RoomScreen to prevent implicit-any indexing.
 */
export function normalizeCharacterKey(raw: string | undefined): Character {
  return normalizeVibeKey(raw);
}

export const ROOM_BACKGROUNDS: Record<VibeKey, string> = {
  soft:   '#4A1028',
  rylane: '#243447',
  cloud:  '#151A40',
  night:  '#3A2503',
};

export function getRoomBg(vibe: VibeKey): string {
  return ROOM_BACKGROUNDS[vibe] ?? ROOM_BACKGROUNDS.soft;
}

// ─── Parent room background ───────────────────────────────────────────────────

/** Solid fallback background for the parent-side room/pages. */
export function getParentRoomBg(): string {
  return '#1A0A2E';
}

// ─── Room scene / phase helpers ───────────────────────────────────────────────

export interface AvatarMap {
  neutral: number;
  happy?:  number;
  window?: number;
  voice?:  number;
}

export type SceneKey = 'default' | 'writing' | 'window' | 'voiceBip';

export interface RoomScene {
  bg:     string;
  avatar: AvatarMap;
}

/**
 * Return the room phase from an hour (0-23).
 * Replaces the `getRoomPhase` import that many screens expected.
 */
export function getRoomPhase(hour: number): RoomPhase {
  if (hour >= 6  && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Return a room scene descriptor for a given character and phase.
 * `BackgroundLayer` and `RoomScreen` call this.
 */
export function getRoomScene(character: Character, phase: RoomPhase): RoomScene {
  const bg = ROOM_BACKGROUNDS[character] ?? ROOM_BACKGROUNDS.soft;
  // Avatar map filled lazily — callers that need specific poses use IMAGES directly.
  const avatar: AvatarMap = { neutral: AVATARS[character] };
  return { bg, avatar };
}

// ─── Image maps ───────────────────────────────────────────────────────────────

export const IMAGES: Record<string, number> = {
  rayleneNeutral:      require('../../assets/images/raylene-neutral.png'),
  rayleneHappy:        require('../../assets/images/raylene-happy.png'),
  rayleneHappyV3:      require('../../assets/images/raylene-happy-v3.png'),
  rayleneWriting:      require('../../assets/images/raylene-writing.png'),
  rayleneWindow:       require('../../assets/images/raylene-window.png'),
  rayleneWindowRainy:  require('../../assets/images/raylene-window-rainy.png'),
  rayleneFullbody:     require('../../assets/images/raylene-fullbody.png'),
  rayleneVoiceDay:     require('../../assets/images/raylene-voice-day.png'),
  rayleneVoiceNight:   require('../../assets/images/raylene-voice-night.png'),
  raylene_Bippin2Day:  require('../../assets/images/raylene-voice-day.png'),
  rylaneNeutral:       require('../../assets/images/rylane-neutral.png'),
  rylaneNeutralV2:     require('../../assets/images/rylane-neutral-v2.png'),
  rylaneHappy:         require('../../assets/images/rylane-happy.png'),
  rylaneThinking:      require('../../assets/images/rylane-thinking.png'),
  rylaneWriting:       require('../../assets/images/rylane-writing.png'),
  rylaneWindow:        require('../../assets/images/rylane-window.png'),
  rylaneWindowDay:     require('../../assets/images/rylane-window-day.png'),
  rylaneFullbody:      require('../../assets/images/rylane-fullbody.png'),
  rylaneVoiceDay:      require('../../assets/images/rylane-voice-day.png'),
  rylaneVoiceNight:    require('../../assets/images/rylane-voice-night.png'),
  cloud:               require('../../assets/images/cloud.png'),
  cloudHappy:          require('../../assets/images/cloud-happy.png'),
  cloudHeadphones:     require('../../assets/images/cloud-headphones.png'),
  cloudHeadphonesV2:   require('../../assets/images/cloud-headphones-v2.png'),
  cloudSleepy:         require('../../assets/images/cloud-sleepy.png'),
  cloudStormy:         require('../../assets/images/cloud-stormy.png'),
};

// ─── Avatar map ───────────────────────────────────────────────────────────────

export const AVATARS: Record<VibeKey, number> = {
  soft:   IMAGES.rayleneNeutral,
  rylane: IMAGES.rylaneNeutral,
  cloud:  IMAGES.cloud,
  night:  IMAGES.rayleneVoiceNight,
};
