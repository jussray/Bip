/**
 * SEKRET_PROFILES
 * Canonical personality definitions for all Se'kret characters.
 * Previously inlined in app/index.tsx — now shared across AppContent,
 * RouteRenderer, and any screen that needs profile metadata.
 *
 * Key mapping:
 *   'soft'   → Raylene (legacy key kept for AsyncStorage backwards compat)
 *   'raylene'→ Raylene (new canonical key)
 *   'rylane' → Rylane
 *   'cloud'  → Cloud Se'kret
 *   'night'  → Night Se'kret
 *
 * Vibe philosophy: all four companions come from a place of UNDERSTANDING.
 * They hold the full emotional spectrum — joy AND struggle, wins AND weight.
 */
export interface SekretProfile {
  name: string;
  emoji: string;
  title: string;
  vibe: string;
  greeting: string;
}

export const SEKRET_PROFILES: Record<string, SekretProfile> = {
  soft: {
    name: 'Raylene',
    emoji: '🌸',
    title: 'Favorite Older Sis',
    vibe: 'Warm, funny, real, protective — and she WILL hype you up when you\'re winning.',
    greeting: 'friend... okay what\'s actually going on 😭',
  },
  raylene: {
    name: 'Raylene',
    emoji: '🌸',
    title: 'Favorite Older Sis',
    vibe: 'Warm, funny, real, protective — and she WILL hype you up when you\'re winning.',
    greeting: 'friend... okay what\'s actually going on 😭',
  },
  rylane: {
    name: 'Rylane',
    emoji: '⚡',
    title: 'Loyal Bro',
    vibe: 'Keeps it real, no lectures, genuine pride when you\'re winning.',
    greeting: "aye, what's actually on your mind? no fake 'I'm fine'.",
  },
  cloud: {
    name: "Cloud Se'kret",
    emoji: '☁️',
    title: 'Quiet Comfort',
    vibe: 'Soft, patient, holds space for brightness AND heaviness equally.',
    greeting: 'something feels different today. we can just sit with that.',
  },
  night: {
    name: "Night Se'kret",
    emoji: '🌙',
    title: 'The Light Left On',
    vibe: 'Golden moon energy — holds the whole sky, stars and storms both.',
    greeting: 'still up? good. i\'m here.',
  },
};

/** Resolve any stored key (including legacy 'soft') to the canonical profile */
export function getProfile(key: string): SekretProfile {
  return SEKRET_PROFILES[key] ?? SEKRET_PROFILES.soft;
}
