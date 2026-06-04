// constants/theme.ts
// Se'kret Bip — Design Tokens + IMAGES Map
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMAGES MAP — PRODUCTION RULES:
//
//   1. ONLY files confirmed to exist in assets/images/ are included.
//   2. All paths use the flat assets/images/ structure currently in repo.
//      When/if you move to subfolders, update paths here — screens don't change.
//   3. Three files require git action before this map works fully:
//        git mv "assets/images/raylene- bippin2-day.png" assets/images/raylene-bippin2-day.png
//        git mv assets/images/night-room-v2.png assets/images/bg-raylene-room-night.png
//        git rm assets/images/rylane-wndow.png
//   4. Fallback keys (marked // FALLBACK) use existing art until real art is uploaded.
//      Replace the require() path when the real file lands.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Raylene ───────────────────────────────────────────────────────────────────
// Core runtime poses
const rayleneNeutral     = require('../assets/images/raylene-neutral.png');
const rayleneHappy       = require('../assets/images/raylene-happy.png');
const rayleneThinking    = require('../assets/images/raylene-thinking.png');
const rayleneWriting     = require('../assets/images/raylene-writing.png');
const rayleneWindow      = require('../assets/images/raylene-window.png');
const rayleneWindowRainy = require('../assets/images/raylene-window-rainy.png');
const rayleneNightWindow = require('../assets/images/raylene-night-window.png');
const rayleneNightDoodle = require('../assets/images/raylene-night-doodle.png');
const rayleneFullbody    = require('../assets/images/raylene-fullbody.png');

// Voice Bip art
const rayleneVoiceDay    = require('../assets/images/raylene-voice-day.png');
const rayleneVoiceNight  = require('../assets/images/raylene-voice-night.png');
// Bippin2 — requires rename: "raylene- bippin2-day.png" → "raylene-bippin2-day.png"c
const raylene_Bippin2Day = require('../assets/images/raylene-writing.png');
// TODO: raylene-bippin2-night.png — not yet uploaded. Using raylene-writing.png until available.

// Period calendar — verify full filename (shown truncated in GitHub)
// Likely: raylene-period-calendar-day.png
const raylene_PeriodCalendar = require('../assets/images/raylene-period-calendar-day.png');

// Alternate iterations (available but not primary runtime)
const rayleneNeutralV2   = require('../assets/images/raylene-neutral-v2.png');
const rayleneNeutralV3   = require('../assets/images/raylene-neutral-v3.png');
const rayleneHappyV2     = require('../assets/images/raylene-happy-v2.png');
const rayleneHappyV3     = require('../assets/images/raylene-happy-v3.png');
const rayleneWindowV2    = require('../assets/images/raylene-window-v2.png'); 

// ── Rylane ────────────────────────────────────────────────────────────────────
const rylaneNeutral      = require('../assets/images/rylane-neutral.png');
const rylaneHappy        = require('../assets/images/rylane-happy.png');
const rylaneThinking     = require('../assets/images/rylane-thinking.png');
const rylaneWriting      = require('../assets/images/rylane-writing.png');
const rylaneWindow       = require('../assets/images/rylane-window.png');
const rylaneFullbody     = require('../assets/images/rylane-fullbody.png');
const rylaneProfile      = require('../assets/images/rylane-profile.png'); // also used as avatar

// Voice Bip art
const rylaneVoiceDay     = require('../assets/images/rylane-voice-day.png');
const rylaneVoiceNight   = require('../assets/images/rylane-voice-night.png');

// Alternate iterations
const rylaneNeutralV2    = require('../assets/images/rylane-neutral-v2.png');

// ── Room Backgrounds ──────────────────────────────────────────────────────────
// raylene-room-night requires: git mv night-room-v2.png bg-raylene-room-night.png
const bgRayleneRoomDay   = require('../assets/images/bg-raylene-room-day.png');
const bgRayleneRoomNight = require('../assets/images/bg-raylene-room-day.png'); // after rename
const bgRylaneRoomDay    = require('../assets/images/bg-rylane-room-day.png');
const bgRylaneRoomNight  = require('../assets/images/bg-rylane-room-night.png');
const roomBg             = require('../assets/images/room-bg.png');       // generic day fallback
const roomBgDark         = require('../assets/images/room-bg-dark.png'); // generic night fallback

// TODO: Upload when artwork is ready —
//   bg-raylene-room-morning.png  (golden morning variant)
//   bg-raylene-room-evening.png  (sunset variant)
//   bg-raylene-room-rain.png     (rainy scene — art exists locally, not in repo)
//   bg-rylane-room-morning.png
//   bg-rylane-room-evening.png
//   bg-rylane-room-rain.png

// ── Screen Backgrounds ────────────────────────────────────────────────────────
const bgComfort          = require('../assets/images/comfort-bg.png');
const bgJournal          = require('../assets/images/journal-bg.png');
const bgBridge           = require('../assets/images/bridge-bg.png');
const bgVoiceBip         = require('../assets/images/voice-bip-bg.png');
const bgParentDashboard  = require('../assets/images/parent-dashboard-bg.png');
const bgWindow           = require('../assets/images/window.png');

// TODO: Upload when artwork is ready —
//   sekret-calm-hero.png   (CalmScreen hero — currently using raylene-window.png)
// FALLBACK:
const bgCalmHero         = require('../assets/images/raylene-window.png'); // FALLBACK

// ── Cloud / Mascot ────────────────────────────────────────────────────────────
const cloud              = require('../assets/images/cloud.png');
const cloudHappy         = require('../assets/images/cloud-happy.png');
const cloudHeadphones    = require('../assets/images/cloud-headphones.png');
const cloudHeadphonesV2  = require('../assets/images/cloud-headphones-v2.png');
const cloudSleepy        = require('../assets/images/cloud-sleepy.png');
const cloudStormy        = require('../assets/images/cloud-stormy.png');

// ── UI / Splash ───────────────────────────────────────────────────────────────
const sekretSplash       = require('../assets/images/sekret-splash.png');
const parentDashboard    = require('../assets/images/parent-dashboard.png');
const circleMockup       = require('../assets/images/circle-mockup.png');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMAGES EXPORT — single source of truth for all require() calls
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const IMAGES = {
  // ── Raylene ──────────────────────────────────────────────────────
  rayleneNeutral,
  rayleneNeutralV2,
  rayleneNeutralV3,
  rayleneHappy,
  rayleneHappyV2,
  rayleneHappyV3,
  rayleneThinking,
  rayleneWriting,
  rayleneWindow,
  rayleneWindowRainy,
  rayleneWindowV2,
  rayleneWindowV3,
  rayleneNightWindow,
  rayleneNightDoodle,
  rayleneFullbody,
  rayleneVoiceDay,
  rayleneVoiceNight,
  raylene_Bippin2Day,
  raylene_Bippin2Night,   // FALLBACK: raylene-writing.png until real art uploaded
  raylene_PeriodCalendar,

  // ── Rylane ───────────────────────────────────────────────────────
  rylaneNeutral,
  rylaneNeutralV2,
  rylaneHappy,
  rylaneThinking,
  rylaneWriting,
  rylaneWindow,
  rylaneFullbody,
  rylaneProfile,
  rylaneVoiceDay,
  rylaneVoiceNight,

  // ── Room backgrounds ─────────────────────────────────────────────
  bgRayleneRoomDay,
  bgRayleneRoomNight,
  bgRylaneRoomDay,
  bgRylaneRoomNight,
  roomBg,
  roomBgDark,

  // ── Screen backgrounds ───────────────────────────────────────────
  bgComfort,
  bgJournal,
  bgBridge,
  bgVoiceBip,
  bgParentDashboard,
  bgWindow,
  bgCalmHero,             // FALLBACK: raylene-window.png

  // ── Clouds ───────────────────────────────────────────────────────
  cloud,
  cloudHappy,
  cloudHeadphones,
  cloudHeadphonesV2,
  cloudSleepy,
  cloudStormy,

  // ── UI ───────────────────────────────────────────────────────────
  sekretSplash,
  parentDashboard,
  circleMockup,
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AVATARS MAP — used by RoomScreen, VoiceBipScreen, SettingsScreen
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const AVATARS: Record<string, Record<string, any>> = {
  raylene: {
    neutral:  IMAGES.rayleneNeutral,
    happy:    IMAGES.rayleneHappy,
    thinking: IMAGES.rayleneThinking,
    writing:  IMAGES.rayleneWriting,
    window:   IMAGES.rayleneWindow,
    fullbody: IMAGES.rayleneFullbody,
  },
  rylane: {
    neutral:  IMAGES.rylaneNeutral,
    happy:    IMAGES.rylaneHappy,
    thinking: IMAGES.rylaneThinking,
    writing:  IMAGES.rylaneWriting,
    window:   IMAGES.rylaneWindow,
    fullbody: IMAGES.rylaneFullbody,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROOM BACKGROUND HELPER
// Returns the correct background for a character + time of day.
// Falls back gracefully when a time variant doesn't exist yet.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export function getRoomBg(character: 'raylene' | 'rylane', time: TimeOfDay) {
  if (character === 'raylene') {
    switch (time) {
      case 'night':   return IMAGES.bgRayleneRoomNight;
      case 'evening': return IMAGES.roomBgDark;          // TODO: real evening art
      case 'morning': return IMAGES.bgRayleneRoomDay;    // TODO: real morning art
      default:        return IMAGES.bgRayleneRoomDay;
    }
  } else {
    switch (time) {
      case 'night':   return IMAGES.bgRylaneRoomNight;
      case 'evening': return IMAGES.roomBgDark;           // TODO: real evening art
      case 'morning': return IMAGES.bgRylaneRoomDay;     // TODO: real morning art
      default:        return IMAGES.bgRylaneRoomDay;
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THEME PACKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const THEME_PACKS: Record<string, {
  name: string; emoji: string;
  background: string; card: string; accent: string; soft: string;
}> = {
  night:  { name: 'Golden Moon',  emoji: '\uD83C\uDF19', background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '\uD83C\uDF38', background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '\uD83C\uDF27\uFE0F', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '\uD83D\uDC9C', background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '\uD83C\uDF0C', background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEKRET PROFILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SEKRET_PROFILES: Record<string, {
  name: string; emoji: string; title: string; vibe: string; greeting: string;
}> = {
  soft:   {
    name:     "Se\u2019kret",
    emoji:    '\uD83C\uDF38',
    title:    'Soft Big Sis',
    vibe:     'Warm, expressive, protective, and real.',
    greeting: "Hey love. I\u2019m here. Tell me what\u2019s on your mind.",
  },
  rylane: {
    name:     'Rylane',
    emoji:    '\u26A1',
    title:    'Loyal Bro',
    vibe:     'Quiet loyalty. Keeps it real. Never talks down.',
    greeting: "Aight, I\u2019m here. What\u2019s been heavy?",
  },
  cloud:  {
    name:     "Cloud Se\u2019kret",
    emoji:    '\u2601\uFE0F',
    title:    'Quiet Comfort',
    vibe:     'Soft, calm, low-pressure presence.',
    greeting: "No pressure. We can just sit here for a minute.",
  },
  night:  {
    name:     "Night Se\u2019kret",
    emoji:    '\uD83C\uDF19',
    title:    'Late-Night Listener',
    vibe:     'Minimal words, calm energy, safe space.',
    greeting: "I\u2019m here. You don\u2019t gotta explain perfectly.",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME MESSAGES — rotating affirmations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const HOME_MESSAGES = [
  "Don\u2019t stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMFORT MESSAGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const COMFORT_MESSAGES = [
  "You are not too much.",
  "Rest is not giving up.",
  "You can feel this and still be okay.",
  "You don\u2019t have to explain your pain to deserve care.",
  "You made it through hard days before.",
  "Softness is not weakness.",
  "You deserve the same kindness you give others.",
  "It\u2019s okay to not be okay right now.",
];
