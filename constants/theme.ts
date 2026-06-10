import type { ImageSourcePropType } from "react-native";

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
const sekretSplash = bgRayleneRoomNight;


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

export type VibeKey = "raylene" | "rylane" | "cloud" | "night" | "rain" | "sunset";

export type VibePack = {
  name: string;
  emoji: string;
  feeling: string;
  detail: string;
  background: string;
  card: string;
  accent: string;
  soft: string;
  room: ImageSourcePropType;
  overlay: readonly [string, string, string];
};

// Vibes are room atmospheres, not app color skins. Each one is grounded in
// an existing production room scene so previews and the live room stay honest.
export const THEME_PACKS: Record<VibeKey, VibePack> = {
  raylene: {
    name: "Raylene's Room",
    emoji: "💜",
    feeling: "scrapbook soft",
    detail: "lavender · warm pink glow · fairy lights",
    background: "#21102f",
    card: "#4b285f",
    accent: "#f19ac5",
    soft: "#f4d8f3",
    room: bgRayleneRoomEvening,
    overlay: ["rgba(42,20,61,0.08)", "rgba(87,42,103,0.28)", "rgba(24,9,39,0.62)"],
  },
  rylane: {
    name: "Rylane After Dark",
    emoji: "🌃",
    feeling: "city chill",
    detail: "indigo · midnight blue · window lights",
    background: "#0c102c",
    card: "#202353",
    accent: "#8f9cff",
    soft: "#d7dcff",
    room: bgRylaneRoomDeepNight,
    overlay: ["rgba(8,13,45,0.08)", "rgba(24,29,82,0.3)", "rgba(5,7,27,0.66)"],
  },
  cloud: {
    name: "Cloud Drift",
    emoji: "☁️",
    feeling: "quiet and floating",
    detail: "cloud white · lavender mist · soft blue",
    background: "#25253f",
    card: "#555577",
    accent: "#c8c9f5",
    soft: "#f0efff",
    room: bgRayleneRoomDay,
    overlay: ["rgba(229,231,255,0.16)", "rgba(143,148,194,0.22)", "rgba(42,37,70,0.52)"],
  },
  night: {
    name: "Night Comfort",
    emoji: "🌙",
    feeling: "late-night safe",
    detail: "deep violet · moonlight silver · stars",
    background: "#110a28",
    card: "#2d2051",
    accent: "#bbb7ef",
    soft: "#e7e5ff",
    room: bgRayleneRoomDeepNight,
    overlay: ["rgba(20,12,53,0.08)", "rgba(47,31,91,0.28)", "rgba(7,4,24,0.7)"],
  },
  rain: {
    name: "Window Rain",
    emoji: "🌧️",
    feeling: "reflective and held",
    detail: "muted blue-purple · rain glass · hush",
    background: "#17263c",
    card: "#30445f",
    accent: "#91b7dc",
    soft: "#d8e8f7",
    room: bgRayleneRoomRain,
    overlay: ["rgba(26,58,83,0.1)", "rgba(42,67,98,0.3)", "rgba(10,22,39,0.68)"],
  },
  sunset: {
    name: "Sunset Exhale",
    emoji: "🌆",
    feeling: "warm evening",
    detail: "purple-orange sky · lamp glow · unwind",
    background: "#321630",
    card: "#66334d",
    accent: "#f4a07f",
    soft: "#ffe0d1",
    room: bgRayleneRoomEvening,
    overlay: ["rgba(142,69,72,0.1)", "rgba(106,48,92,0.26)", "rgba(39,13,44,0.62)"],
  },
};

export const normalizeVibeKey = (key?: string): VibeKey => {
  if (key && key in THEME_PACKS) return key as VibeKey;
  if (key === "flower") return "raylene";
  if (key === "galaxy") return "rylane";
  if (key === "neon") return "night";
  return "raylene";
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
