// constants/characterAssets.ts
// Se'kret Bip — Character Asset Registry
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all character artwork metadata.
// Every entry maps to an existing IMAGES key — no new filenames, no dynamic
// require() paths, no UI changes.
//
// referenceOnly: true  → sheet/board used for art direction only, never rendered
// referenceOnly: false → finished PNG, safe to render in any screen
//
// Helpers exported at bottom:
//   getCharacterSticker(character, mood, pose?)
//   getVoicePresenceImage(character, timeOfDay)
//   getReferenceAssets(character?)
// ─────────────────────────────────────────────────────────────────────────────

import { IMAGES } from './theme';
import type { ImageSourcePropType } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Character = 'raylene' | 'rylane' | 'cloud' | 'night';

export type Mood =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'writing'
  | 'window'
  | 'listening'
  | 'sleepy'
  | 'stormy';

export type Pose =
  | 'bust'        // cropped portrait — most chat/reaction uses
  | 'fullbody'    // full standing — room entry, splash, bippin2 hero
  | 'window'      // at-window pose — calm, home ambient
  | 'voice'       // headphones/mic pose — voice bip screens
  | 'profile';    // profile/ID card crop — settings, crew

export type TimeOfDay = 'day' | 'night';

export type AssetFeature =
  | 'sticker'         // small reaction/emotion chip
  | 'presence'        // room ambient floating art
  | 'hero'            // large screen hero
  | 'voicePresence'   // VoiceBip character art
  | 'periodSupport'   // PeriodCalendar companion
  | 'reference';      // art direction / reference only

export interface CharacterAssetEntry {
  key:           keyof typeof IMAGES;
  character:     Character;
  mood:          Mood;
  pose:          Pose;
  features:      AssetFeature[];
  state?:        string;          // e.g. 'rainy', 'deepNight', 'v2', 'v3'
  referenceOnly: boolean;
  notes?:        string;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const CHARACTER_ASSETS: CharacterAssetEntry[] = [

  // ── Raylene ───────────────────────────────────────────────────────────────

  {
    key: 'rayleneNeutral',
    character: 'raylene', mood: 'neutral', pose: 'bust',
    features: ['sticker', 'presence', 'hero'],
    referenceOnly: false,
    notes: 'Primary raylene neutral — most used across screens',
  },
  {
    key: 'rayleneNeutralV2',
    character: 'raylene', mood: 'neutral', pose: 'bust',
    features: ['sticker'],
    state: 'v2',
    referenceOnly: false,
    notes: 'Fallback → rayleneNeutral. Swap when v2 art ships.',
  },
  {
    key: 'rayleneNeutralV3',
    character: 'raylene', mood: 'neutral', pose: 'bust',
    features: ['sticker'],
    state: 'v3',
    referenceOnly: false,
  },
  {
    key: 'rayleneHappy',
    character: 'raylene', mood: 'happy', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
  },
  {
    key: 'rayleneHappyV2',
    character: 'raylene', mood: 'happy', pose: 'bust',
    features: ['sticker'],
    state: 'v2',
    referenceOnly: false,
    notes: 'Fallback → rayleneHappy',
  },
  {
    key: 'rayleneHappyV3',
    character: 'raylene', mood: 'happy', pose: 'bust',
    features: ['sticker'],
    state: 'v3',
    referenceOnly: false,
  },
  {
    key: 'rayleneThinking',
    character: 'raylene', mood: 'thinking', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneNeutral until raylene-thinking.png ships',
  },
  {
    key: 'rayleneWriting',
    character: 'raylene', mood: 'writing', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
    notes: 'Used for journal, bippin2 fallbacks, period calendar fallback',
  },
  {
    key: 'rayleneWindow',
    character: 'raylene', mood: 'neutral', pose: 'window',
    features: ['hero', 'presence'],
    referenceOnly: false,
    notes: 'At-window pose — Calm hero, Home ambient',
  },
  {
    key: 'rayleneWindowRainy',
    character: 'raylene', mood: 'neutral', pose: 'window',
    features: ['presence'],
    state: 'rainy',
    referenceOnly: false,
    notes: 'Rainy-day window variant — also used as nightAvatarNeutral/Window fallback',
  },
  {
    key: 'rayleneWindowV2',
    character: 'raylene', mood: 'neutral', pose: 'window',
    features: ['presence'],
    state: 'v2',
    referenceOnly: false,
    notes: 'Fallback → rayleneWindow',
  },
  {
    key: 'rayleneWindowV3',
    character: 'raylene', mood: 'neutral', pose: 'window',
    features: ['presence'],
    state: 'v3',
    referenceOnly: false,
    notes: 'Fallback → rayleneWindow',
  },
  {
    key: 'rayleneNightWindow',
    character: 'raylene', mood: 'neutral', pose: 'window',
    features: ['presence'],
    state: 'night',
    referenceOnly: false,
    notes: 'Fallback → rayleneWindowRainy (closest semantic for night window)',
  },
  {
    key: 'rayleneNightDoodle',
    character: 'raylene', mood: 'writing', pose: 'bust',
    features: ['presence'],
    state: 'night',
    referenceOnly: false,
    notes: 'Fallback → rayleneWriting',
  },
  {
    key: 'rayleneFullbody',
    character: 'raylene', mood: 'neutral', pose: 'fullbody',
    features: ['hero'],
    referenceOnly: false,
    notes: 'Full standing — Room entry, Bippin2 hero',
  },
  {
    key: 'rayleneVoiceDay',
    character: 'raylene', mood: 'listening', pose: 'voice',
    features: ['voicePresence'],
    state: 'day',
    referenceOnly: false,
    notes: 'Headphones/mic — VoiceBip daytime',
  },
  {
    key: 'rayleneVoiceNight',
    character: 'raylene', mood: 'listening', pose: 'voice',
    features: ['voicePresence'],
    state: 'night',
    referenceOnly: false,
    notes: 'Headphones/mic — VoiceBip nighttime',
  },
  {
    key: 'raylene_Bippin2Day',
    character: 'raylene', mood: 'happy', pose: 'fullbody',
    features: ['hero'],
    state: 'day',
    referenceOnly: false,
    notes: 'Bippin2 / Womanhood hero — day variant',
  },
  {
    key: 'raylene_Bippin2Night',
    character: 'raylene', mood: 'happy', pose: 'fullbody',
    features: ['hero'],
    state: 'night',
    referenceOnly: false,
    notes: 'Fallback → rayleneWriting until night Bippin2 art ships',
  },
  {
    key: 'raylene_PeriodCalendar',
    character: 'raylene', mood: 'neutral', pose: 'bust',
    features: ['periodSupport', 'presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneWriting until raylene-period-calendar-day.png ships',
  },

  // ── Rylane ────────────────────────────────────────────────────────────────

  {
    key: 'rylaneNeutral',
    character: 'rylane', mood: 'neutral', pose: 'bust',
    features: ['sticker', 'presence', 'hero'],
    referenceOnly: false,
    notes: 'Primary rylane neutral',
  },
  {
    key: 'rylaneNeutralV2',
    character: 'rylane', mood: 'neutral', pose: 'bust',
    features: ['sticker'],
    state: 'v2',
    referenceOnly: false,
  },
  {
    key: 'rylaneHappy',
    character: 'rylane', mood: 'happy', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
  },
  {
    key: 'rylaneThinking',
    character: 'rylane', mood: 'thinking', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
    notes: 'Real asset — rylane-thinking.png exists on disk',
  },
  {
    key: 'rylaneWriting',
    character: 'rylane', mood: 'writing', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
  },
  {
    key: 'rylaneWindow',
    character: 'rylane', mood: 'neutral', pose: 'window',
    features: ['hero', 'presence'],
    referenceOnly: false,
  },
  {
    key: 'rylaneWindowDay',
    character: 'rylane', mood: 'neutral', pose: 'window',
    features: ['presence'],
    state: 'day',
    referenceOnly: false,
    notes: 'Daytime window variant',
  },
  {
    key: 'rylaneFullbody',
    character: 'rylane', mood: 'neutral', pose: 'fullbody',
    features: ['hero'],
    referenceOnly: false,
    notes: 'Full standing — Room entry, Bippin2 hero',
  },
  {
    key: 'rylaneProfile',
    character: 'rylane', mood: 'neutral', pose: 'profile',
    features: ['sticker'],
    referenceOnly: false,
    notes: 'Fallback → rylaneFullbody. Used in Settings, MindBodyReset.',
  },
  {
    key: 'rylaneVoiceDay',
    character: 'rylane', mood: 'listening', pose: 'voice',
    features: ['voicePresence'],
    state: 'day',
    referenceOnly: false,
  },
  {
    key: 'rylaneVoiceNight',
    character: 'rylane', mood: 'listening', pose: 'voice',
    features: ['voicePresence'],
    state: 'night',
    referenceOnly: false,
  },

  // ── Cloud (mascot character) ───────────────────────────────────────────────

  {
    key: 'cloud',
    character: 'cloud', mood: 'neutral', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
    notes: 'Base cloud mascot — Splash, MindBodyReset, CloudThoughts',
  },
  {
    key: 'cloudHappy',
    character: 'cloud', mood: 'happy', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
    notes: 'Also used as cloudAvatarHappy + cloudAvatarFullbody',
  },
  {
    key: 'cloudHeadphones',
    character: 'cloud', mood: 'listening', pose: 'voice',
    features: ['voicePresence', 'sticker'],
    referenceOnly: false,
    notes: 'Calm, CloudThoughts, MindBodyReset, ParentRoom header',
  },
  {
    key: 'cloudHeadphonesV2',
    character: 'cloud', mood: 'listening', pose: 'voice',
    features: ['sticker'],
    state: 'v2',
    referenceOnly: false,
    notes: 'cloudAvatarWriting fallback — available but not yet used in screens',
  },
  {
    key: 'cloudSleepy',
    character: 'cloud', mood: 'neutral', pose: 'window',
    features: ['sticker'],
    referenceOnly: false,
    notes: 'cloudAvatarWindow — available but not yet used directly in screens',
  },
  {
    key: 'cloudStormy',
    character: 'cloud', mood: 'stormy', pose: 'bust',
    features: ['sticker', 'presence'],
    referenceOnly: false,
    notes: 'Comfort screen, Circle screen',
  },
  {
    key: 'cloudAvatarNeutral',
    character: 'cloud', mood: 'neutral', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'RoomScreen cloud presence — maps to cloud',
  },
  {
    key: 'cloudAvatarHappy',
    character: 'cloud', mood: 'happy', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Maps to cloudHappy',
  },
  {
    key: 'cloudAvatarThinking',
    character: 'cloud', mood: 'thinking', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Maps to cloudHeadphones',
  },
  {
    key: 'cloudAvatarWriting',
    character: 'cloud', mood: 'writing', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Maps to cloudHeadphonesV2',
  },
  {
    key: 'cloudAvatarWindow',
    character: 'cloud', mood: 'neutral', pose: 'window',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Maps to cloudSleepy',
  },
  {
    key: 'cloudAvatarFullbody',
    character: 'cloud', mood: 'happy', pose: 'fullbody',
    features: ['hero'],
    referenceOnly: false,
    notes: 'Maps to cloudHappy — fullbody art pending',
  },

  // ── Night (Se'kret Night identity) ───────────────────────────────────────

  {
    key: 'nightAvatarNeutral',
    character: 'night', mood: 'neutral', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneWindowRainy. Replace when night-neutral.png ships.',
  },
  {
    key: 'nightAvatarHappy',
    character: 'night', mood: 'happy', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneNightWindow',
  },
  {
    key: 'nightAvatarThinking',
    character: 'night', mood: 'thinking', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneThinking (which itself fallbacks to rayleneNeutral)',
  },
  {
    key: 'nightAvatarWriting',
    character: 'night', mood: 'writing', pose: 'bust',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneWriting',
  },
  {
    key: 'nightAvatarWindow',
    character: 'night', mood: 'neutral', pose: 'window',
    features: ['presence'],
    referenceOnly: false,
    notes: 'Fallback → rayleneWindowRainy',
  },
  {
    key: 'nightAvatarFullbody',
    character: 'night', mood: 'neutral', pose: 'fullbody',
    features: ['hero'],
    referenceOnly: false,
    notes: 'Fallback → rayleneNeutral. Replace when night-fullbody.png ships.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * getCharacterSticker(character, mood, pose?)
 *
 * Returns the best matching renderable image source for a given character + mood.
 * Optional pose narrows the match (e.g. 'window', 'fullbody').
 * Falls back to neutral bust if no exact match is found.
 *
 * Usage:
 *   <Image source={getCharacterSticker('raylene', 'happy')} />
 *   <Image source={getCharacterSticker('rylane', 'thinking', 'bust')} />
 */
export function getCharacterSticker(
  character: Character,
  mood: Mood,
  pose?: Pose,
): ImageSourcePropType {
  const candidates = CHARACTER_ASSETS.filter(
    a =>
      a.character === character &&
      a.mood === mood &&
      !a.referenceOnly &&
      (pose ? a.pose === pose : true) &&
      (a.features.includes('sticker') ||
       a.features.includes('presence') ||
       a.features.includes('hero')),
  );

  // Prefer exact pose match, then any renderable match
  const exact = candidates.find(a => pose && a.pose === pose);
  const best  = exact ?? candidates[0];

  if (!best) {
    // Fallback chain: neutral bust for the character
    const fallback = CHARACTER_ASSETS.find(
      a => a.character === character && a.mood === 'neutral' && a.pose === 'bust' && !a.referenceOnly,
    );
    if (fallback) return IMAGES[fallback.key] as ImageSourcePropType;
    return IMAGES.rayleneNeutral as ImageSourcePropType;
  }

  return IMAGES[best.key] as ImageSourcePropType;
}

/**
 * getVoicePresenceImage(character, timeOfDay)
 *
 * Returns the voice/headphones presence image for VoiceBip screen.
 * Cloud character returns cloudHeadphones regardless of time.
 *
 * Usage:
 *   <Image source={getVoicePresenceImage('raylene', 'night')} />
 */
export function getVoicePresenceImage(
  character: Character,
  timeOfDay: TimeOfDay,
): ImageSourcePropType {
  const match = CHARACTER_ASSETS.find(
    a =>
      a.character === character &&
      a.features.includes('voicePresence') &&
      !a.referenceOnly &&
      (a.state === timeOfDay || !a.state),
  );

  if (match) return IMAGES[match.key] as ImageSourcePropType;

  // Fallbacks by character if no voice art exists
  const fallbacks: Record<Character, keyof typeof IMAGES> = {
    raylene: 'rayleneNeutral',
    rylane:  'rylaneNeutral',
    cloud:   'cloudHeadphones',
    night:   'nightAvatarWindow',
  };
  return IMAGES[fallbacks[character]] as ImageSourcePropType;
}

/**
 * getReferenceAssets(character?)
 *
 * Returns all asset entries tagged referenceOnly: true.
 * Optionally filter by character.
 * Use this to document what reference sheets exist — never pass these to <Image>.
 *
 * These are UUID-named files in assets/images/ that were uploaded as reference art.
 * They are documented here for inventory purposes only.
 *
 * Usage:
 *   const refs = getReferenceAssets('raylene');
 *   console.log(refs.map(r => r.key));
 */
export function getReferenceAssets(character?: Character): CharacterAssetEntry[] {
  return CHARACTER_ASSETS.filter(
    a => a.referenceOnly && (character ? a.character === character : true),
  );
}

/**
 * getCharacterAvatar(character, mood)
 *
 * Convenience wrapper for RoomScreen / presence use cases.
 * Returns the room-presence avatar image for a character + mood.
 *
 * Usage:
 *   <Image source={getCharacterAvatar('cloud', 'thinking')} />
 */
export function getCharacterAvatar(
  character: Character,
  mood: Mood,
): ImageSourcePropType {
  const match = CHARACTER_ASSETS.find(
    a =>
      a.character === character &&
      a.mood === mood &&
      !a.referenceOnly &&
      (a.features.includes('presence') || a.features.includes('sticker')),
  );

  if (match) return IMAGES[match.key] as ImageSourcePropType;
  return getCharacterSticker(character, 'neutral', 'bust');
}

// ── Assets pending real art (checklist) ───────────────────────────────────────
// These keys exist in IMAGES but currently use fallbacks.
// When the real PNG ships, update constants/theme.ts require() — characterAssets.ts needs no change.
//
// raylene:
//   rayleneThinking        → needs: raylene-thinking.png
//   raylene_PeriodCalendar → needs: raylene-period-calendar-day.png
//   raylene_Bippin2Night   → needs: raylene-bippin2-night.png
//   rayleneNightDoodle     → needs: raylene-night-doodle.png (distinct art)
//
// night character:
//   nightAvatarNeutral     → needs: night-neutral.png
//   nightAvatarHappy       → needs: night-happy.png
//   nightAvatarThinking    → needs: night-thinking.png
//   nightAvatarWriting     → needs: night-writing.png
//   nightAvatarWindow      → needs: night-window.png
//   nightAvatarFullbody    → needs: night-fullbody.png
//
// cloud:
//   cloudAvatarFullbody    → needs: cloud-fullbody.png (dedicated standing art)
