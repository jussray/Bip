// constants/theme.ts
// Se'kret Bip — Design Tokens + IMAGES Map
//
// IMPORTANT: every require() below points at a file that ACTUALLY EXISTS in
// assets/images/. When the original asset name is missing or still a 2-byte
// placeholder, we fall back to the closest matching real image so the bundle
// never crashes. Replace the fallback with the real asset later — the variable
// name stays the same so no screen code has to change.

// ── Raylene (real assets) ──────────────────────────────────────────────────
const rayleneNeutral   = require('../assets/images/raylene-neutral.png');
const rayleneHappy     = require('../assets/images/raylene-happy.png');
const rayleneWriting   = require('../assets/images/raylene-writing.png');
const rayleneWindow    = require('../assets/images/raylene-window.png');
const rayleneFullbody  = require('../assets/images/raylene-fullbody.png');
const rayleneHappyV3   = require('../assets/images/raylene-happy-v3.png');
const rayleneNeutralV3 = require('../assets/images/raylene-neutral-v3.png');

// ── Raylene (fallbacks for assets that are missing / placeholder) ──────────
const rayleneThinking      = rayleneNeutral;   // fallback → neutral
const rayleneWindowRainy   = rayleneWindow;    // fallback → window
const rayleneNightWindow   = rayleneWindow;    // fallback → window
const rayleneNightDoodle   = rayleneWriting;   // fallback → writing
const rayleneVoiceDay      = rayleneWindow;    // fallback → window (calm look)
const rayleneVoiceNight    = rayleneWindow;    // fallback → window
const raylene_Bippin2Day   = rayleneWriting;   // fallback → writing
const raylene_Bippin2Night = rayleneWriting;   // fallback → writing
const raylene_PeriodCalendar = rayleneWriting; // fallback → writing
const rayleneNeutralV2     = rayleneNeutral;   // fallback → neutral
const rayleneHappyV2       = rayleneHappy;     // fallback → happy
const rayleneWindowV2      = rayleneWindow;    // fallback → window
const rayleneWindowV3      = rayleneWindow;    // fallback → window

// ── Rylane (real assets) ───────────────────────────────────────────────────
const rylaneNeutral   = require('../assets/images/rylane-neutral.png');
const rylaneHappy     = require('../assets/images/rylane-happy.png');
const rylaneWriting   = require('../assets/images/rylane-writing.png');
const rylaneWindow    = require('../assets/images/rylane-window.png');
const rylaneFullbody  = require('../assets/images/rylane-fullbody.png');
const rylaneNeutralV2 = require('../assets/images/rylane-neutral-v2.png');

// ── Rylane (fallbacks) ─────────────────────────────────────────────────────
const rylaneThinking  = rylaneNeutral;  // fallback → neutral
const rylaneProfile   = rylaneFullbody; // fallback → fullbody portrait
const rylaneVoiceDay  = rylaneWindow;   // fallback → window
const rylaneVoiceNight = rylaneWindow;  // fallback → window

// ── Night (real assets) ────────────────────────────────────────────────────
// Night is his own character: curly black hair, purple Se'kret hoodie,
// headphones, sketchbook + mug. "Late night thoughts / protect his peace."
//
// The pixels for Night live in two files whose FILENAMES say "rylane" — these
// are AI-generation mislabels from earlier iterations. The image content was
// verified by visual scan: rylane-reference-board.png and rylane-profile-sheet.png
// both depict the curly-hair/purple-hoodie Night character, NOT the
// dreadlocks Rylane. We do not rename the files (every screen imports them);
// we just expose them under correct character keys here.
const nightReferenceBoard = require('../assets/images/rylane-reference-board.png');
const nightProfileSheet   = require('../assets/images/rylane-profile-sheet.png');

// ── Night (semantic aliases) ───────────────────────────────────────────────
// Until per-state, single-pose Night art lands, every Night state maps onto
// one of the two reference-sheet files. profile-sheet (vertical, portrait
// oriented) handles intimate states; reference-board (wider, full layout)
// handles open states. Both are real Night art — no placeholders, no
// borrowed faces from other characters.
const nightNeutral     = nightProfileSheet;
const nightHappy       = nightReferenceBoard;
const nightThinking    = nightProfileSheet;
const nightWriting     = nightProfileSheet;
const nightWindow      = nightProfileSheet;
const nightVoiceDay    = nightReferenceBoard;
const nightVoiceNight  = nightProfileSheet;
const nightFullbody    = nightReferenceBoard;

// ── Room Backgrounds ───────────────────────────────────────────────────────
const roomBg              = require('../assets/images/room-bg.png');
const roomBgDark          = require('../assets/images/room-bg-dark.png');
// NOTE: bg-raylene-room-night.png exists on disk but its filename contains an
// invisible unicode thin-space (U+2009) that breaks Metro's require resolver
// on web. Until the asset is renamed, fall back to roomBgDark so the bundle
// never crashes. Swap this line back to a require() once the file is renamed.
const bgRayleneRoomNight  = require('../assets/images/room-bg-dark.png');
// Fallbacks for missing room backgrounds:
const bgRayleneRoomDay    = roomBg;     // fallback → generic day room
const bgRylaneRoomDay     = roomBg;     // fallback → generic day room
const bgRylaneRoomNight   = roomBgDark; // fallback → generic dark room

// ── Screen Backgrounds (all real) ──────────────────────────────────────────
const bgComfort         = require('../assets/images/comfort-bg.png');
const bgJournal         = require('../assets/images/journal-bg.png');
const bgBridge          = require('../assets/images/bridge-bg.png');
const bgVoiceBip        = require('../assets/images/voice-bip-bg.png');
const bgParentDashboard = require('../assets/images/parent-dashboard-bg.png');
const bgWindow          = require('../assets/images/window.png');
const bgCalmHero        = rayleneWindow; // hero on Calm = Raylene at the window

// ── Cloud / Mascot (all real) ──────────────────────────────────────────────
const cloud             = require('../assets/images/cloud.png');
const cloudHappy        = require('../assets/images/cloud-happy.png');
const cloudHeadphones   = require('../assets/images/cloud-headphones.png');
const cloudHeadphonesV2 = require('../assets/images/cloud-headphones-v2.png');
const cloudSleepy       = require('../assets/images/cloud-sleepy.png');
const cloudStormy       = require('../assets/images/cloud-stormy.png');

// ── UI / Splash ────────────────────────────────────────────────────────────
const parentDashboard = require('../assets/images/parent-dashboard.png');
// Fallbacks for splash + circle mockup until real art lands:
const sekretSplash  = rayleneWindow; // calm splash hero
const circleMockup  = cloudHappy;    // soft circle preview

export const IMAGES = {
  // Raylene
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
  raylene_Bippin2Night,
  raylene_PeriodCalendar,

  // Rylane
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

  // Night (his own character — see comment block above for source files)
  nightReferenceBoard,
  nightProfileSheet,
  nightNeutral,
  nightHappy,
  nightThinking,
  nightWriting,
  nightWindow,
  nightVoiceDay,
  nightVoiceNight,
  nightFullbody,

  // Rooms
  bgRayleneRoomDay,
  bgRayleneRoomNight,
  bgRylaneRoomDay,
  bgRylaneRoomNight,
  roomBg,
  roomBgDark,

  // Screen backgrounds
  bgComfort,
  bgJournal,
  bgBridge,
  bgVoiceBip,
  bgParentDashboard,
  bgWindow,
  bgCalmHero,

  // Cloud / mascot
  cloud,
  cloudHappy,
  cloudHeadphones,
  cloudHeadphonesV2,
  cloudSleepy,
  cloudStormy,

  // UI / Splash
  sekretSplash,
  parentDashboard,
  circleMockup,
} as const;

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

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export function getRoomBg(character: 'raylene' | 'rylane', time: TimeOfDay) {
  if (character === 'raylene') {
    switch (time) {
      case 'night':   return IMAGES.bgRayleneRoomNight;
      case 'evening': return IMAGES.roomBgDark;
      case 'morning':
      case 'day':
      default:        return IMAGES.bgRayleneRoomDay;
    }
  }
  switch (time) {
    case 'night':   return IMAGES.bgRylaneRoomNight;
    case 'evening': return IMAGES.roomBgDark;
    case 'morning':
    case 'day':
    default:        return IMAGES.bgRylaneRoomDay;
  }
}

export const THEME_PACKS: Record<string, {
  name: string;
  emoji: string;
  background: string;
  card: string;
  accent: string;
  soft: string;
}> = {
  night:  { name: 'Golden Moon',  emoji: '🌙',  background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '🌸',  background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '🌧️', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '💜',  background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '🌌',  background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

export const SEKRET_PROFILES: Record<string, {
  name: string;
  emoji: string;
  title: string;
  vibe: string;
  greeting: string;
}> = {
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

export const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

export const COMFORT_MESSAGES = [
  'You are not too much.',
  'Rest is not giving up.',
  'You can feel this and still be okay.',
  "You don't have to explain your pain to deserve care.",
  'You made it through hard days before.',
  'Softness is not weakness.',
  'You deserve the same kindness you give others.',
  "It's okay to not be okay right now.",
];
