// constants/presence/timeOfDay.ts
// Se'kret Bip — Voice Bip Presence System
// 6-phase time-of-day for presence rendering.
//
// IMPORTANT: This is ADDITIVE. The legacy `TimeOfDay` in constants/theme.ts
// (`'morning' | 'day' | 'evening' | 'night'`) keeps working unchanged. This
// file introduces a richer `PresenceTime` that the new presence layer uses,
// and provides bidirectional adapters so old screens and new screens can
// coexist without churn.

import type { TimeOfDay as LegacyTimeOfDay } from '../theme';

/** Six-phase time-of-day used by the Voice Bip Presence System. */
export type PresenceTime =
  | 'day'        // mid-morning brightness
  | 'midday'     // peak light
  | 'afternoon'  // warm slant light
  | 'evening'    // dusk / golden hour
  | 'night'      // deep dark
  | 'rain';      // weather override — rain trumps time-of-day for mood

/**
 * Resolve PresenceTime from the local clock.
 *
 * 'rain' must be passed in explicitly (e.g. from a weather hook). Without
 * weather data, we never fabricate rain — we just bucket the hour.
 */
export function getPresenceTime(
  hour: number,
  options: { isRaining?: boolean } = {}
): PresenceTime {
  if (options.isRaining) return 'rain';
  if (hour >= 5  && hour < 11) return 'day';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Map a legacy 4-phase TimeOfDay to the new 6-phase scheme. */
export function fromLegacyTime(t: LegacyTimeOfDay): PresenceTime {
  switch (t) {
    case 'morning': return 'day';
    case 'day':     return 'midday';
    case 'evening': return 'evening';
    case 'night':   return 'night';
    default:        return 'day';
  }
}

/**
 * Project a 6-phase PresenceTime back to the legacy 4-phase TimeOfDay so the
 * existing `getRoomBg(character, time)` helper in theme.ts keeps working.
 */
export function toLegacyTime(t: PresenceTime): LegacyTimeOfDay {
  switch (t) {
    case 'day':        return 'morning';
    case 'midday':     return 'day';
    case 'afternoon':  return 'day';
    case 'evening':    return 'evening';
    case 'night':      return 'night';
    case 'rain':       return 'evening'; // rain reads as dim, evening-like
    default:           return 'day';
  }
}

/** Short label for badges. */
export const PRESENCE_TIME_BADGE: Record<PresenceTime, string> = {
  day:       '☀️ day',
  midday:    '🌞 midday',
  afternoon: '🌤️ afternoon',
  evening:   '🌆 evening',
  night:     '🌙 night',
  rain:      '🌧️ rain',
};

/**
 * Tint overlay color per phase. Composited on top of the room background by
 * PresenceAvatar to give every phase its own light quality even when the
 * underlying art is the same `day`/`night` file.
 */
export const PRESENCE_TINT: Record<PresenceTime, string> = {
  day:       'rgba(255,236,189,0.00)', // no tint — let the art breathe
  midday:    'rgba(255,247,210,0.06)', // warm bright wash
  afternoon: 'rgba(255,180,120,0.10)', // amber slant
  evening:   'rgba(120,80,180,0.18)',  // dusk purple
  night:     'rgba(13,9,20,0.32)',     // deep cool dark
  rain:      'rgba(80,100,140,0.22)',  // cool grey-blue
};
