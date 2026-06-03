// constants/theme.ts
// Se'kret Bip — Design Tokens, IMAGES Map, THEME_PACKS, SEKRET_PROFILES
//
// IMAGES map reflects the EXACT filenames present in assets/images/ as of June 2026.
// Every key maps to the closest available real asset.
// Keys marked "// TODO:" need the real artwork uploaded — current value is the best fallback.
//
// ONE REQUIRED RENAME before building:
//   git mv "assets/images/raylene- bippin2-day.png" assets/images/raylene-bippin2-day.png

// ── Character Art ──────────────────────────────────────────────────────────
export const IMAGES = {
  // Raylene — core poses
  rayleneNeutral:    require('../assets/images/raylene-neutral.png'),
  rayleneHappy:      require('../assets/images/raylene-happy.png'),
  rayleneThinking:   require('../assets/images/raylene-thinking.png'),
  rayleneWriting:    require('../assets/images/raylene-writing.png'),
  rayleneWindow:     require('../assets/images/raylene-window.png'),
  rayleneFullbody:   require('../assets/images/raylene-fullbody.png'),

  // Raylene — voice room
  rayleneVoiceDay:   require('../assets/images/raylene-voice-day.png'),
  rayleneVoiceNight: require('../assets/images/raylene-voice-night.png'),

  // Raylene — versioned / special
  rayleneHappyV2:    require('../assets/images/raylene-happy-v2.png'),
  rayleneHappyV3:    require('../assets/images/raylene-happy-v3.png'),
  rayleneNeutralV2:  require('../assets/images/raylene-neutral-v2.png'),
  rayleneNeutralV3:  require('../assets/images/raylene-neutral-v3.png'),
  rayleneWindowV2:   require('../assets/images/raylene-window-v2.png'),
  rayleneWindowV3:   require('../assets/images/raylene-window-v3.png'),

  // Raylene — screen-specific
  rayleneNightWindow:    require('../assets/images/raylene-night-window.png'),
  rayleneNightDoodle:    require('../assets/images/raylene-night-doodle.png'),
  rayleneWindowRainy:    require('../assets/images/raylene-window-rainy.png'),
  rayleneThinkingSheet:  require('../assets/images/raylene-thinking-sheet.png'),
  raylene_fanSheet:      require('../assets/images/raylene-fan-sheet.png'),

  // Raylene — Bippin2 day (rename required first: remove space)
  // git mv "assets/images/raylene- bippin2-day.png" assets/images/raylene-bippin2-day.png
  raylene_bippin2Day:    require('../assets/images/raylene-bippin2-day.png'),
  // TODO: raylene_bippin2Night — upload raylene-bippin2-night.png (currently uses raylene-writing.png)

  // Raylene — avatar (TODO: upload raylene-avatar.png; using neutral as fallback)
  rayleneAvatar:     require('../assets/images/raylene-neutral.png'),

  // ── Rylane — core poses ──────────────────────────────────────────────────
  rylaneNeutral:     require('../assets/images/rylane-neutral.png'),
  rylaneHappy:       require('../assets/images/rylane-happy.png'),
  rylaneThinking:    require('../assets/images/rylane-thinking.png'),
  rylaneWriting:     require('../assets/images/rylane-writing.png'),
  rylaneWindow:      require('../assets/images/rylane-window.png'),
  rylaneFullbody:    require('../assets/images/rylane-fullbody.png'),

  // Rylane — voice room
  rylaneVoiceDay:    require('../assets/images/rylane-voice-day.png'),
  rylaneVoiceNight:  require('../assets/images/rylane-voice-night.png'),

  // Rylane — avatar / profile
  rylaneProfile:     require('../assets/images/rylane-profile.png'),
  // rylaneAvatar is rylane-profile.png — the confirmed avatar file
  rylaneAvatar:      require('../assets/images/rylane-profile.png'),

  // Rylane — versioned
  rylaneNeutralV2:   require('../assets/images/rylane-neutral-v2.png'),

  // ── Room Backgrounds ──────────────────────────────────────────────────────
  // Only these backgrounds currently exist in the repo.
  // Time-of-day fallback strategy:
  //   morning → day background
  //   afternoon → day background
  //   evening → room-bg-dark.png
  //   night → night variant
  raylene_roomDay:     require('../assets/images/bg-raylene-room-day.png'),
  raylene_roomNight:   require('../assets/images/night-room-v2.png'),
  raylene_roomDark:    require('../assets/images/room-bg-dark.png'),
  rylane_roomDay:      require('../assets/images/bg-rylane-room-day.png'),
  rylane_roomNight:    require('../assets/images/bg-rylane-room-night.png'),
  rylane_roomDark:     require('../assets/images/room-bg-dark.png'),

  // Generic room fallbacks
  roomBg:              require('../assets/images/room-bg.png'),
  roomBgDark:          require('../assets/images/room-bg-dark.png'),
  nightRoomV2:         require('../assets/images/night-room-v2.png'),

  // ── Screen Backgrounds ────────────────────────────────────────────────────
  comfortBg:           require('../assets/images/comfort-bg.png'),
  journalBg:           require('../assets/images/journal-bg.png'),
  bridgeBg:            require('../assets/images/bridge-bg.png'),
  voiceBipBg:          require('../assets/images/voice-bip-bg.png'),
  parentDashboardBg:   require('../assets/images/parent-dashboard-bg.png'),
  parentDashboard:     require('../assets/images/parent-dashboard.png'),
  circleMockup:        require('../assets/images/circle-mockup.png'),

  // Calm screen hero — using raylene-window.png as stand-in
  // TODO: upload sekret-calm-hero.png for the real calm art
  calmHero:            require('../assets/images/raylene-window.png'),

  // ── Cloud / Mood Art ──────────────────────────────────────────────────────
  cloud:               require('../assets/images/cloud.png'),
  cloudHappy:          require('../assets/images/cloud-happy.png'),
  cloudHeadphones:     require('../assets/images/cloud-headphones.png'),
  cloudHeadphonesV2:   require('../assets/images/cloud-headphones-v2.png'),
  cloudSleepy:         require('../assets/images/cloud-sleepy.png'),
  cloudStormy:         require('../assets/images/cloud-stormy.png'),

  // ── Splash / App Icon ─────────────────────────────────────────────────────
  sekretSplash:        require('../assets/images/sekret-splash.png'),

  // ── Period Calendar ───────────────────────────────────────────────────────
  // Truncated name in repo: raylene-period-calendar-d... (full name unknown)
  // TODO: confirm full filename; placeholder key provided
  // raylene_periodCalendar: require('../assets/images/raylene-period-calendar-day.png'),

  // ── Window (generic) ─────────────────────────────────────────────────────
  window:              require('../assets/images/window.png'),

  // ── Reference / Design Sheets (not used in runtime — for dev reference) ──
  // rayleneReferenceSheet, rayleneRainyWindowSheet, raylaneReferenceBoard etc.
} as const;

// ── Room Background Helper ─────────────────────────────────────────────────
// Use this in RoomScreen instead of a raw require() per time slot.
// Returns the correct background image for the character + time of day.
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export function getRoomBg(character: 'raylene' | 'rylane', time: TimeOfDay) {
  if (character === 'raylene') {
    if (time === 'night')           return IMAGES.raylene_roomNight;
    if (time === 'evening')         return IMAGES.raylene_roomDark;
    return IMAGES.raylene_roomDay;  // morning + day
  } else {
    if (time === 'night')           return IMAGES.rylane_roomNight;
    if (time === 'evening')         return IMAGES.rylane_roomDark;
    return IMAGES.rylane_roomDay;   // morning + day
  }
}

// ── AVATARS Map (used in RoomScreen, VoiceBipScreen) ──────────────────────
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

// ── Theme Packs ───────────────────────────────────────────────────────────
export const THEME_PACKS: Record<string, {
  name: string; emoji: string;
  background: string; card: string; accent: string; soft: string;
}> = {
  night:  { name: 'Golden Moon',  emoji: '🌙', background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '🌸', background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '🌧️', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '💜', background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '🌌', background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

// ── Sekret Profiles ───────────────────────────────────────────────────────
export const SEKRET_PROFILES: Record<string, {
  name: string; emoji: string; title: string; vibe: string; greeting: string;
}> = {
  soft:   {
    name: "Se\u2019kret",       emoji: '🌸',
    title: 'Soft Big Sis',
    vibe: 'Warm, expressive, protective, and real.',
    greeting: "Hey love. I\u2019m here. Tell me what\u2019s on your mind.",
  },
  rylane: {
    name: 'Rylane',             emoji: '⚡',
    title: 'Loyal Bro',
    vibe: 'Quiet loyalty. Keeps it real. Never talks down.',
    greeting: "Aight, I\u2019m here. What\u2019s been heavy?",
  },
  cloud:  {
    name: "Cloud Se\u2019kret", emoji: '☁️',
    title: 'Quiet Comfort',
    vibe: 'Soft, calm, low-pressure presence.',
    greeting: "No pressure. We can just sit here for a minute.",
  },
  night:  {
    name: "Night Se\u2019kret", emoji: '🌙',
    title: 'Late-Night Listener',
    vibe: 'Minimal words, calm energy, safe space.',
    greeting: "I\u2019m here. You don\u2019t gotta explain perfectly.",
  },
};

// ── Comfort Messages ──────────────────────────────────────────────────────
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

// ── Home Messages (rotating) ──────────────────────────────────────────────
export const HOME_MESSAGES = [
  "Don\u2019t stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];
