// constants/presence/avatarStates.ts
// Se'kret Bip — Voice Bip Presence System
//
// The (character × time × state) resolver. The matrix is logically 4 × 6 × 4
// = 96 cells, but real artwork only covers a subset. Rather than fabricating
// placeholders, we resolve each cell through a deterministic fallback chain
// built from images that actually exist in `assets/images/`.
//
// When new artwork is added (e.g. `raylene-voice-midday.png`), wire it into
// IMAGES in theme.ts and add one line below. Nothing else needs to change.
//
// Inspiration: Tolan's emotional layering — a small base art set, animated
// and lit by state, feels alive without exploding asset counts.

import { IMAGES } from '../theme';
import type { PresenceTime } from './timeOfDay';

/** The four presence states for every avatar. */
export type PresenceState =
  | 'listening'   // user is speaking; avatar is present, attentive
  | 'thinking'    // user finished; deliberate pause before response
  | 'responding'  // avatar replies (text now, voice later)
  | 'comforting'; // post-response settle; warm + safe + open

/** The four avatars supported by Voice Bip. */
export type PresenceCharacter = 'raylene' | 'rylane' | 'cloud' | 'night';

/** Adapter from the existing selectedSekret string to PresenceCharacter. */
export function toPresenceCharacter(selectedSekret: string): PresenceCharacter {
  switch (selectedSekret) {
    case 'rylane': return 'rylane';
    case 'cloud':  return 'cloud';
    case 'night':  return 'night';
    case 'soft':
    default:       return 'raylene';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-character asset banks. Each character lists which `IMAGES` keys map to
// which (time × state) cell. Missing cells are filled by `resolveAvatarAsset`
// using each character's `chain` of fallbacks (strict, no invented files).
// ─────────────────────────────────────────────────────────────────────────────

type AssetCell = { time: PresenceTime; state: PresenceState; asset: any };

const RAYLENE_CELLS: readonly AssetCell[] = [
  // Explicit voice-mode art (the strongest signal we have today)
  { time: 'day',       state: 'listening',  asset: IMAGES.rayleneVoiceDay },
  { time: 'midday',    state: 'listening',  asset: IMAGES.rayleneVoiceDay },
  { time: 'afternoon', state: 'listening',  asset: IMAGES.rayleneVoiceDay },
  { time: 'evening',   state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'night',     state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'rain',      state: 'listening',  asset: IMAGES.rayleneWindowRainy },

  // Thinking — looks up / inward; we have a dedicated `thinking` asset
  { time: 'day',       state: 'thinking',   asset: IMAGES.rayleneThinking },
  { time: 'midday',    state: 'thinking',   asset: IMAGES.rayleneThinking },
  { time: 'afternoon', state: 'thinking',   asset: IMAGES.rayleneThinking },
  { time: 'evening',   state: 'thinking',   asset: IMAGES.rayleneThinking },
  { time: 'night',     state: 'thinking',   asset: IMAGES.rayleneNightDoodle },
  { time: 'rain',      state: 'thinking',   asset: IMAGES.rayleneWindowRainy },

  // Responding — open / warm. Closest fits: happy variants and writing pose.
  { time: 'day',       state: 'responding', asset: IMAGES.rayleneHappy },
  { time: 'midday',    state: 'responding', asset: IMAGES.rayleneHappyV2 },
  { time: 'afternoon', state: 'responding', asset: IMAGES.rayleneHappyV3 },
  { time: 'evening',   state: 'responding', asset: IMAGES.rayleneWriting },
  { time: 'night',     state: 'responding', asset: IMAGES.rayleneNightWindow },
  { time: 'rain',      state: 'responding', asset: IMAGES.rayleneWindowRainy },

  // Comforting — settled, neutral, safe
  { time: 'day',       state: 'comforting', asset: IMAGES.rayleneNeutral },
  { time: 'midday',    state: 'comforting', asset: IMAGES.rayleneNeutralV2 },
  { time: 'afternoon', state: 'comforting', asset: IMAGES.rayleneNeutralV3 },
  { time: 'evening',   state: 'comforting', asset: IMAGES.rayleneWindow },
  { time: 'night',     state: 'comforting', asset: IMAGES.rayleneNightWindow },
  { time: 'rain',      state: 'comforting', asset: IMAGES.rayleneWindowRainy },
];

const RYLANE_CELLS: readonly AssetCell[] = [
  { time: 'day',       state: 'listening',  asset: IMAGES.rylaneVoiceDay },
  { time: 'midday',    state: 'listening',  asset: IMAGES.rylaneVoiceDay },
  { time: 'afternoon', state: 'listening',  asset: IMAGES.rylaneVoiceDay },
  { time: 'evening',   state: 'listening',  asset: IMAGES.rylaneVoiceNight },
  { time: 'night',     state: 'listening',  asset: IMAGES.rylaneVoiceNight },
  { time: 'rain',      state: 'listening',  asset: IMAGES.rylaneWindow },

  { time: 'day',       state: 'thinking',   asset: IMAGES.rylaneThinking },
  { time: 'midday',    state: 'thinking',   asset: IMAGES.rylaneThinking },
  { time: 'afternoon', state: 'thinking',   asset: IMAGES.rylaneThinking },
  { time: 'evening',   state: 'thinking',   asset: IMAGES.rylaneThinking },
  { time: 'night',     state: 'thinking',   asset: IMAGES.rylaneThinking },
  { time: 'rain',      state: 'thinking',   asset: IMAGES.rylaneWindow },

  { time: 'day',       state: 'responding', asset: IMAGES.rylaneHappy },
  { time: 'midday',    state: 'responding', asset: IMAGES.rylaneHappy },
  { time: 'afternoon', state: 'responding', asset: IMAGES.rylaneHappy },
  { time: 'evening',   state: 'responding', asset: IMAGES.rylaneWriting },
  { time: 'night',     state: 'responding', asset: IMAGES.rylaneWriting },
  { time: 'rain',      state: 'responding', asset: IMAGES.rylaneWindow },

  { time: 'day',       state: 'comforting', asset: IMAGES.rylaneNeutral },
  { time: 'midday',    state: 'comforting', asset: IMAGES.rylaneNeutralV2 },
  { time: 'afternoon', state: 'comforting', asset: IMAGES.rylaneNeutral },
  { time: 'evening',   state: 'comforting', asset: IMAGES.rylaneWindow },
  { time: 'night',     state: 'comforting', asset: IMAGES.rylaneWindow },
  { time: 'rain',      state: 'comforting', asset: IMAGES.rylaneWindow },
];

const CLOUD_CELLS: readonly AssetCell[] = [
  // Cloud is a non-human mascot — we map its 4 mood sprites onto state.
  { time: 'day',       state: 'listening',  asset: IMAGES.cloudHeadphones },
  { time: 'midday',    state: 'listening',  asset: IMAGES.cloudHeadphonesV2 },
  { time: 'afternoon', state: 'listening',  asset: IMAGES.cloudHeadphones },
  { time: 'evening',   state: 'listening',  asset: IMAGES.cloudHeadphones },
  { time: 'night',     state: 'listening',  asset: IMAGES.cloudHeadphones },
  { time: 'rain',      state: 'listening',  asset: IMAGES.cloudStormy },

  { time: 'day',       state: 'thinking',   asset: IMAGES.cloud },
  { time: 'midday',    state: 'thinking',   asset: IMAGES.cloud },
  { time: 'afternoon', state: 'thinking',   asset: IMAGES.cloud },
  { time: 'evening',   state: 'thinking',   asset: IMAGES.cloudSleepy },
  { time: 'night',     state: 'thinking',   asset: IMAGES.cloudSleepy },
  { time: 'rain',      state: 'thinking',   asset: IMAGES.cloudStormy },

  { time: 'day',       state: 'responding', asset: IMAGES.cloudHappy },
  { time: 'midday',    state: 'responding', asset: IMAGES.cloudHappy },
  { time: 'afternoon', state: 'responding', asset: IMAGES.cloudHappy },
  { time: 'evening',   state: 'responding', asset: IMAGES.cloudHappy },
  { time: 'night',     state: 'responding', asset: IMAGES.cloudHappy },
  { time: 'rain',      state: 'responding', asset: IMAGES.cloud },

  { time: 'day',       state: 'comforting', asset: IMAGES.cloud },
  { time: 'midday',    state: 'comforting', asset: IMAGES.cloud },
  { time: 'afternoon', state: 'comforting', asset: IMAGES.cloud },
  { time: 'evening',   state: 'comforting', asset: IMAGES.cloudSleepy },
  { time: 'night',     state: 'comforting', asset: IMAGES.cloudSleepy },
  { time: 'rain',      state: 'comforting', asset: IMAGES.cloudStormy },
];

// Night is a *mood* persona, not a separate illustrated character. We use the
// Raylene night-window art set as the visible body, leaning fully into night
// art across all phases. When dedicated Night artwork is added, swap here.
const NIGHT_CELLS: readonly AssetCell[] = [
  { time: 'day',       state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'midday',    state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'afternoon', state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'evening',   state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'night',     state: 'listening',  asset: IMAGES.rayleneVoiceNight },
  { time: 'rain',      state: 'listening',  asset: IMAGES.rayleneWindowRainy },

  { time: 'day',       state: 'thinking',   asset: IMAGES.rayleneNightDoodle },
  { time: 'midday',    state: 'thinking',   asset: IMAGES.rayleneNightDoodle },
  { time: 'afternoon', state: 'thinking',   asset: IMAGES.rayleneNightDoodle },
  { time: 'evening',   state: 'thinking',   asset: IMAGES.rayleneNightDoodle },
  { time: 'night',     state: 'thinking',   asset: IMAGES.rayleneNightDoodle },
  { time: 'rain',      state: 'thinking',   asset: IMAGES.rayleneWindowRainy },

  { time: 'day',       state: 'responding', asset: IMAGES.rayleneNightWindow },
  { time: 'midday',    state: 'responding', asset: IMAGES.rayleneNightWindow },
  { time: 'afternoon', state: 'responding', asset: IMAGES.rayleneNightWindow },
  { time: 'evening',   state: 'responding', asset: IMAGES.rayleneNightWindow },
  { time: 'night',     state: 'responding', asset: IMAGES.rayleneNightWindow },
  { time: 'rain',      state: 'responding', asset: IMAGES.rayleneWindowRainy },

  { time: 'day',       state: 'comforting', asset: IMAGES.rayleneNightWindow },
  { time: 'midday',    state: 'comforting', asset: IMAGES.rayleneNightWindow },
  { time: 'afternoon', state: 'comforting', asset: IMAGES.rayleneNightWindow },
  { time: 'evening',   state: 'comforting', asset: IMAGES.rayleneNightWindow },
  { time: 'night',     state: 'comforting', asset: IMAGES.rayleneNightWindow },
  { time: 'rain',      state: 'comforting', asset: IMAGES.rayleneWindowRainy },
];

/** All character cells, keyed for fast lookup. */
const CHARACTER_CELLS: Record<PresenceCharacter, readonly AssetCell[]> = {
  raylene: RAYLENE_CELLS,
  rylane:  RYLANE_CELLS,
  cloud:   CLOUD_CELLS,
  night:   NIGHT_CELLS,
};

/** Ultimate-safe fallback used only if everything else is missing. */
const ULTIMATE_FALLBACK = IMAGES.sekretSplash;

/**
 * Resolve the asset for a (character, time, state) cell.
 *
 * Fallback chain:
 *   1. exact (character, time, state)
 *   2. same character + state, time = 'day' (the most-illustrated phase)
 *   3. same character + state, time = 'night'
 *   4. same character + 'comforting' (the safest pose) at the requested time
 *   5. ULTIMATE_FALLBACK (sekret-splash) — never null, never crash
 */
export function resolveAvatarAsset(
  character: PresenceCharacter,
  time: PresenceTime,
  state: PresenceState
): any {
  const bank = CHARACTER_CELLS[character];

  const exact = bank.find(c => c.time === time && c.state === state);
  if (exact?.asset) return exact.asset;

  const dayFallback = bank.find(c => c.time === 'day' && c.state === state);
  if (dayFallback?.asset) return dayFallback.asset;

  const nightFallback = bank.find(c => c.time === 'night' && c.state === state);
  if (nightFallback?.asset) return nightFallback.asset;

  const comfortFallback = bank.find(c => c.time === time && c.state === 'comforting');
  if (comfortFallback?.asset) return comfortFallback.asset;

  return ULTIMATE_FALLBACK;
}

/**
 * Per-state motion config consumed by PresenceAvatar.tsx. Kept here so design
 * tweaks live next to the asset bank.
 */
export const STATE_MOTION: Record<PresenceState, {
  scaleFrom: number;
  scaleTo: number;
  opacityFrom: number;
  opacityTo: number;
  durationMs: number;
}> = {
  // Slow attentive breath — alive, not distracting
  listening:  { scaleFrom: 1.00, scaleTo: 1.015, opacityFrom: 0.96, opacityTo: 1.00, durationMs: 2400 },
  // Slight inward stillness — the deliberate pause
  thinking:   { scaleFrom: 0.99, scaleTo: 1.00,  opacityFrom: 0.92, opacityTo: 0.98, durationMs: 1800 },
  // Warm open lift while replying
  responding: { scaleFrom: 1.00, scaleTo: 1.025, opacityFrom: 1.00, opacityTo: 1.00, durationMs: 2000 },
  // Settled, slow, safe
  comforting: { scaleFrom: 1.00, scaleTo: 1.01,  opacityFrom: 0.98, opacityTo: 1.00, durationMs: 3000 },
};

/**
 * The deliberate "human" thinking pause, in milliseconds. The screen waits
 * this long after the user stops speaking before transitioning into
 * `responding`. Tuned to feel considered, not laggy.
 */
export const THINKING_PAUSE_MS = 1400;

/**
 * How long `responding` lingers before settling into `comforting` when no
 * external "response finished" signal arrives.
 */
export const RESPONDING_MIN_MS = 1200;

/**
 * How long `comforting` stays before returning to `idle` (which renders as
 * the comforting pose at rest).
 */
export const COMFORTING_HOLD_MS = 6000;
