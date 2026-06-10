// constants/theme.ts
// Se'kret Bip — Design Tokens + IMAGES Map
//
// IMPORTANT: every require() below points at a file that ACTUALLY EXISTS in
// assets/images/. When the original asset name is missing or still a 2-byte
// placeholder, we fall back to the closest matching real image so the bundle
// never crashes. Replace the fallback with the real asset later — the variable
// name stays the same so no screen code has to change.

// ── Raylene (real assets) ──────────────────────────────────────────────────
const rayleneNeutral = require("../assets/images/raylene-neutral.png");
const rayleneHappy = require("../assets/images/raylene-happy.png");
const rayleneWriting = require("../assets/images/raylene-writing.png");
const rayleneWindow = require("../assets/images/raylene-window.png");
const rayleneFullbody = require("../assets/images/raylene-fullbody.png");
const rayleneHappyV3 = require("../assets/images/raylene-happy-v3.png");
const rayleneNeutralV3 = require("../assets/images/raylene-neutral-v3.png");

// ── Raylene (pose variants; voice/window-rainy now have real assets) ──────
const rayleneThinking    = rayleneNeutral; // fallback → neutral
const rayleneWindowRainy = require("../assets/images/raylene-window-rainy.png");
const rayleneNightWindow = rayleneWindow; // fallback → window
const rayleneNightDoodle = rayleneWriting; // fallback → writing
const rayleneVoiceDay    = require("../assets/images/raylene-voice-day.png");
const rayleneVoiceNight  = require("../assets/images/raylene-voice-night.png");
const raylene_Bippin2Day = rayleneWriting; // fallback → writing
const raylene_Bippin2Night = rayleneWriting; // fallback → writing
const raylene_PeriodCalendar = rayleneWriting; // fallback → writing
const rayleneNeutralV2 = rayleneNeutral; // fallback → neutral
const rayleneHappyV2 = rayleneHappy; // fallback → happy
const rayleneWindowV2 = rayleneWindow; // fallback → window
const rayleneWindowV3 = rayleneWindow; // fallback → window

// ── Rylane (real assets) ───────────────────────────────────────────────────
const rylaneNeutral = require("../assets/images/rylane-neutral.png");
const rylaneHappy = require("../assets/images/rylane-happy.png");
const rylaneWriting = require("../assets/images/rylane-writing.png");
const rylaneWindow = require("../assets/images/rylane-window.png");
const rylaneFullbody = require("../assets/images/rylane-fullbody.png");
const rylaneNeutralV2 = require("../assets/images/rylane-neutral-v2.png");

// ── Rylane (thinking now has real asset; voice assets real) ──────────────
const rylaneThinking   = require("../assets/images/rylane-thinking.png");
const rylaneProfile    = rylaneFullbody; // fallback → fullbody portrait
const rylaneVoiceDay   = require("../assets/images/rylane-voice-day.png");
const rylaneVoiceNight = require("../assets/images/rylane-voice-night.png");

// ── Room Backgrounds ───────────────────────────────────────────────────────
const bgRayleneRoomDay       = require("../assets/images/bg-raylene-room-day.png");
const bgRayleneRoomEvening   = require("../assets/images/bg-raylene-room-evening.png");
const bgRayleneRoomRain      = require("../assets/images/bg-raylene-room-rain.png");
const bgRayleneRoomNight     = require("../assets/images/bg-raylene-room-night.png");
const bgRayleneRoomDeepNight = require("../assets/images/bg-raylene-room-deep-night.png");

const bgRylaneRoomNight     = require("../assets/images/bg-rylane-room-night.png");
const bgRylaneRoomDay       = require("../assets/images/bg-rylane-room-day.png");
const bgRylaneRoomEvening   = require("../assets/images/bg-rylane-room-evening.png");
const bgRylaneRoomRain      = require("../assets/images/bg-rylane-room-rain.png");
const bgRylaneRoomDeepNight = require("../assets/images/bg-rylane-room-deep-night.png");

// ── Screen Backgrounds (all real) ──────────────────────────────────────────
const bgComfort         = require('../assets/images/comfort-bg.png');
const bgJournal         = require('../assets/images/journal-bg.png');
const bgBridge          = require('../assets/images/bridge-bg.png');
const bgVoiceBip        = require('../assets/images/voice-bip-bg.png');
// Circle is assembled from React Native controls over a generic atmosphere asset.
// Design mockups live outside assets/ and are never loaded by the application.
const bgCircle          = require('../assets/images/room-bg-dark.png');
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
// The native splash is color-only in app.json. The branded splash experience is
// composed in SplashScreen from text, controls, mascots, and valid scene artwork.
const sekretSplash = roomArtwork;
const bgComfort = require("../assets/images/comfort-bg.png");
const bgJournal = require("../assets/images/journal-bg.png");
const bgBridge = require("../assets/images/bridge-bg.png");
const bgVoiceBip = require("../assets/images/voice-bip-bg.png");
// Circle's own mockup is corrupt, so use the valid generic night backdrop here.
// This stays separate from room art: room screens always resolve through getRoomScene().
const bgCircle = require("../assets/images/room-bg-dark.png");
const bgWindow = require("../assets/images/window.png");
const bgCalmHero = rayleneWindow; // hero on Calm = Raylene at the window

// ── Cloud / Mascot (all real) ──────────────────────────────────────────────
const cloud = require("../assets/images/cloud.png");
const cloudHappy = require("../assets/images/cloud-happy.png");
const cloudHeadphones = require("../assets/images/cloud-headphones.png");
const cloudHeadphonesV2 = require("../assets/images/cloud-headphones-v2.png");
const cloudSleepy = require("../assets/images/cloud-sleepy.png");
const cloudStormy = require("../assets/images/cloud-stormy.png");

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

  // Rooms
  bgRayleneRoomDay,
  bgRayleneRoomEvening,
  bgRayleneRoomRain,
  bgRayleneRoomNight,
  bgRayleneRoomDeepNight,
  bgRylaneRoomDay,
  bgRylaneRoomEvening,
  bgRylaneRoomRain,
  bgRylaneRoomNight,
  bgRylaneRoomDeepNight,

  // Screen backgrounds
  bgComfort,
  bgJournal,
  bgBridge,
  bgVoiceBip,
  bgCircle,
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
} as const;

export const AVATARS: Record<string, Record<string, any>> = {
  raylene: {
    neutral: IMAGES.rayleneNeutral,
    happy: IMAGES.rayleneHappy,
    thinking: IMAGES.rayleneThinking,
    writing: IMAGES.rayleneWriting,
    window: IMAGES.rayleneWindow,
    fullbody: IMAGES.rayleneFullbody,
  },
  rylane: {
    neutral: IMAGES.rylaneNeutral,
    happy: IMAGES.rylaneHappy,
    thinking: IMAGES.rylaneThinking,
    writing: IMAGES.rylaneWriting,
    window: IMAGES.rylaneWindow,
    fullbody: IMAGES.rylaneFullbody,
  },
};

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type RoomPhase = "day" | "evening" | "rain" | "night" | "deepNight";

export function getRoomPhase(
  date = new Date(),
  weatherMode?: string,
): RoomPhase {
  if (weatherMode === "rain") return "rain";
  const hour = date.getHours();
  if (hour >= 6 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 || hour < 1) return "night";
  return "deepNight";
}

export function getRoomScene(
  character: "raylene" | "rylane",
  phase: RoomPhase,
) {
  const prefix = character === "rylane" ? "bgRylaneRoom" : "bgRayleneRoom";
  const suffix =
    phase === "deepNight"
      ? "DeepNight"
      : phase.charAt(0).toUpperCase() + phase.slice(1);
  return IMAGES[`${prefix}${suffix}` as keyof typeof IMAGES];
}

export function getRoomBg(
  character: "raylene" | "rylane",
  time: TimeOfDay,
  weatherMode?: string,
) {
  const phase =
    weatherMode === "rain"
      ? "rain"
      : time === "evening"
        ? "evening"
        : time === "night"
          ? getRoomPhase(new Date(), weatherMode)
          : "day";
  return getRoomScene(character, phase);
}

export const THEME_PACKS: Record<
  string,
  {
    name: string;
    emoji: string;
    background: string;
    card: string;
    accent: string;
    soft: string;
  }
> = {
  night: {
    name: "Golden Moon",
    emoji: "🌙",
    background: "#3A2503",
    card: "#5B3A00",
    accent: "#FFD84D",
    soft: "#FFF3B0",
  },
  flower: {
    name: "Soft Pink",
    emoji: "🌸",
    background: "#4A1028",
    card: "#6D1B3B",
    accent: "#FF4FA3",
    soft: "#FFD6E7",
  },
  rain: {
    name: "Rain Blue",
    emoji: "🌧️",
    background: "#243447",
    card: "#36506B",
    accent: "#4DA3FF",
    soft: "#B6DCFF",
  },
  neon: {
    name: "Night Purple",
    emoji: "💜",
    background: "#160028",
    card: "#2B0A4D",
    accent: "#D946EF",
    soft: "#F5B8FF",
  },
  galaxy: {
    name: "Galaxy Night",
    emoji: "🌌",
    background: "#151A40",
    card: "#2A2D73",
    accent: "#7C83FF",
    soft: "#D7D9FF",
  },
};

export const SEKRET_PROFILES: Record<
  string,
  {
    name: string;
    emoji: string;
    title: string;
    vibe: string;
    greeting: string;
  }
> = {
  soft: {
    name: "Se'kret",
    emoji: "🌸",
    title: "Soft Big Sis",
    vibe: "Warm, expressive, protective, and real.",
    greeting: "Hey love. I'm here. Tell me what's on your mind.",
  },
  rylane: {
    name: "Rylane",
    emoji: "⚡",
    title: "Loyal Bro",
    vibe: "Quiet loyalty. Keeps it real. Never talks down.",
    greeting: "Aight, I'm here. What's been heavy?",
  },
  cloud: {
    name: "Cloud Se'kret",
    emoji: "☁️",
    title: "Quiet Comfort",
    vibe: "Soft, calm, low-pressure presence.",
    greeting: "No pressure. We can just sit here for a minute.",
  },
  night: {
    name: "Night Se'kret",
    emoji: "🌙",
    title: "Late-Night Listener",
    vibe: "Minimal words, calm energy, safe space.",
    greeting: "I'm here. You don't gotta explain perfectly.",
  },
};

export const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  "Rest is productive too.",
  "You deserve softness too.",
  "Heavy days do not define you.",
  "Your mind deserves rest.",
  "Breathe slowly tonight.",
  "You made it through today.",
];

export const COMFORT_MESSAGES = [
  "You are not too much.",
  "Rest is not giving up.",
  "You can feel this and still be okay.",
  "You don't have to explain your pain to deserve care.",
  "You made it through hard days before.",
  "Softness is not weakness.",
  "You deserve the same kindness you give others.",
  "It's okay to not be okay right now.",
];
