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
const rayleneNeutralV3 = rayleneNeutral;

// ── Raylene (pose variants; voice/window-rainy now have real assets) ──────
const rayleneThinking    = rayleneNeutral; // fallback → neutral
const rayleneWindowRainy = require("../assets/images/raylene-window-rainy.png");
const rayleneNightWindow = rayleneWindowRainy; // night window → rainy window (closer semantic)
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
const rylaneWindowDay  = require("../assets/images/rylane-window-day.png");

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
const bgRayleneRoomDay       = require("../assets/images/bg-raylene-room-day.png");
const bgRayleneRoomMidday    = require("../assets/images/bg-raylene-room-midday.png");
const bgRayleneRoomAfternoon = require("../assets/images/bg-raylene-room-afternoon.png");
const bgRayleneRoomEvening   = require("../assets/images/bg-raylene-room-evening.png");
const bgRayleneRoomRain      = require("../assets/images/bg-raylene-room-rain.png");
const bgRayleneRoomNight     = require("../assets/images/bg-raylene-room-night.png");
const bgRayleneRoomDeepNight = require("../assets/images/bg-raylene-room-deep-night.png");

const bgRylaneRoomDay       = require("../assets/images/bg-rylane-room-day.png");
const bgRylaneRoomMidday    = require("../assets/images/bg-rylane-room-midday.png");
const bgRylaneRoomAfternoon = require("../assets/images/bg-rylane-room-afternoon.png");
const bgRylaneRoomEvening   = require("../assets/images/bg-rylane-room-evening.png");
const bgRylaneRoomRain      = require("../assets/images/bg-rylane-room-rain.png");
const bgRylaneRoomNight     = require("../assets/images/bg-rylane-room-night.png");
const bgRylaneRoomDeepNight = require("../assets/images/bg-rylane-room-deep-night.png");

// ── Cloud Room Backgrounds — REAL ASSETS ──────────────────────────────────
// Cloud Room identity: cozy purple room, cloud neon sign, city window view,
// open journals, bean bag, headphones, brain-dump backpack, scrapbook walls.
// NOT a floating sky — it's the place you go when your brain is loud.
const bgCloudRoomDay       = require("../assets/images/bg-cloud-room-day.png");
const bgCloudRoomMidday    = require("../assets/images/bg-cloud-room-midday.png");
const bgCloudRoomAfternoon = require("../assets/images/bg-cloud-room-afternoon.png");
const bgCloudRoomEvening   = require("../assets/images/bg-cloud-room-evening.png");
const bgCloudRoomNight     = require("../assets/images/bg-cloud-room-night.png");
const bgCloudRoomDeepNight = require("../assets/images/bg-cloud-room-deep-night.png");
const bgCloudRoomRain      = require("../assets/images/bg-cloud-room-rain.png");

// ── Night Room Backgrounds — REAL ASSETS ──────────────────────────────────
// Night Room identity: crescent moon chair, galaxy bedding, "Voice Bip Corner"
// light-box sign, city window with clock, sticky notes everywhere, 2AM energy.
// NOT Raylene's room — completely different furniture, palette, and spirit.
const bgNightRoomDay       = require("../assets/images/bg-night-room-day.png");
const bgNightRoomMidday    = require("../assets/images/bg-night-room-midday.png");
const bgNightRoomAfternoon = require("../assets/images/bg-night-room-afternoon.png");
const bgNightRoomEvening   = require("../assets/images/bg-night-room-evening.png");
const bgNightRoomNight     = require("../assets/images/bg-night-room-night.png");
const bgNightRoomDeepNight = require("../assets/images/bg-night-room-deep-night.png");
const bgNightRoomRain      = require("../assets/images/bg-night-room-rain.png");

// ── Night Avatar — REAL ASSETS NEEDED ─────────────────────────────────────
// Replace when night-*.png ships: night-neutral · night-window · night-comfort · night-listening
// Night sits by the window — raylene-window-rainy is the closest semantic match.
const nightAvatarNeutral  = rayleneWindowRainy;
const nightAvatarHappy    = rayleneNightWindow;
const nightAvatarThinking = rayleneThinking;
const nightAvatarWriting  = rayleneWriting;
const nightAvatarWindow   = rayleneWindowRainy;
const nightAvatarFullbody = rayleneNeutral;

// ── Parent Room Backgrounds ────────────────────────────────────────────────
const bgMomRoomDay       = require("../assets/images/bg-mom-room-day.png");
const bgMomRoomEvening   = require("../assets/images/bg-mom-room-evening.png");
const bgMomRoomNight     = require("../assets/images/bg-mom-room-night.png");
const bgMomRoomDeepNight = require("../assets/images/bg-mom-room-deep-night.png");
const bgMomRoomRain      = require("../assets/images/bg-mom-room-rain.png");

const bgDadRoomDay       = require("../assets/images/bg-dad-room-day.png");
const bgDadRoomEvening   = require("../assets/images/bg-dad-room-evening.png");
const bgDadRoomNight     = require("../assets/images/bg-dad-room-night.png");
const bgDadRoomDeepNight = require("../assets/images/bg-dad-room-deep-night.png");
const bgDadRoomRain      = require("../assets/images/bg-dad-room-rain.png");

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

// ── Cloud Avatar (cloud mascot IS Cloud's presence — declared after cloud assets) ─────────
const cloudAvatarNeutral  = cloud;
const cloudAvatarHappy    = cloudHappy;
const cloudAvatarThinking = cloudHeadphones;
const cloudAvatarWriting  = cloudHeadphonesV2;
const cloudAvatarWindow   = cloudSleepy;
const cloudAvatarFullbody = cloudHappy;

// ── Sticker Layer (real assets — assets/images/stickers/) ──────────────────
// 53 individual stickers cut from the character sticker sheets.
// 19 raylene / 19 rylane / 15 cloud. These are the small sticker-layer art,
// distinct from the full-size avatar/mascot images above.
const rayStickerStanding    = require("../assets/images/stickers/raylene/raylene-sticker-standing.png");
const rayStickerLounging    = require("../assets/images/stickers/raylene/raylene-sticker-lounging.png");
const rayStickerStudying    = require("../assets/images/stickers/raylene/raylene-sticker-studying.png");
const rayStickerSleepy      = require("../assets/images/stickers/raylene/raylene-sticker-sleepy.png");
const rayStickerPeace       = require("../assets/images/stickers/raylene/raylene-sticker-peace.png");
const rayStickerListening   = require("../assets/images/stickers/raylene/raylene-sticker-listening.png");
const rayStickerComfort     = require("../assets/images/stickers/raylene/raylene-sticker-comfort.png");
const rayStickerSunglasses  = require("../assets/images/stickers/raylene/raylene-sticker-sunglasses.png");
const rayStickerHappy       = require("../assets/images/stickers/raylene/raylene-sticker-happy.png");
const rayStickerJournaling  = require("../assets/images/stickers/raylene/raylene-sticker-journaling.png");
const rayStickerThinking    = require("../assets/images/stickers/raylene/raylene-sticker-thinking.png");
const rayStickerBoba        = require("../assets/images/stickers/raylene/raylene-sticker-boba.png");
const rayStickerCrown       = require("../assets/images/stickers/raylene/raylene-sticker-crown.png");
const rayStickerSunnies     = require("../assets/images/stickers/raylene/raylene-sticker-sunnies.png");
const rayStickerHoodie      = require("../assets/images/stickers/raylene/raylene-sticker-hoodie.png");
const rayStickerSekretBip   = require("../assets/images/stickers/raylene/raylene-sticker-sekret-bip.png");
const rayStickerSekretHeart = require("../assets/images/stickers/raylene/raylene-sticker-sekret-heart.png");
const rayStickerPillow      = require("../assets/images/stickers/raylene/raylene-sticker-pillow.png");
const rayStickerIconCloud   = require("../assets/images/stickers/raylene/raylene-sticker-icon-cloud.png");

const rylStickerMini        = require("../assets/images/stickers/rylane/rylane-sticker-mini.png");
const rylStickerReading     = require("../assets/images/stickers/rylane/rylane-sticker-reading.png");
const rylStickerPhone       = require("../assets/images/stickers/rylane/rylane-sticker-phone.png");
const rylStickerThinking    = require("../assets/images/stickers/rylane/rylane-sticker-thinking.png");
const rylStickerSitting     = require("../assets/images/stickers/rylane/rylane-sticker-sitting.png");
const rylStickerHeadphones  = require("../assets/images/stickers/rylane/rylane-sticker-headphones.png");
const rylStickerHoodie      = require("../assets/images/stickers/rylane/rylane-sticker-hoodie.png");
const rylStickerCalm        = require("../assets/images/stickers/rylane/rylane-sticker-calm.png");
const rylStickerStormy      = require("../assets/images/stickers/rylane/rylane-sticker-stormy.png");
const rylStickerPeace       = require("../assets/images/stickers/rylane/rylane-sticker-peace.png");
const rylStickerHappy       = require("../assets/images/stickers/rylane/rylane-sticker-happy.png");
const rylStickerSleepy      = require("../assets/images/stickers/rylane/rylane-sticker-sleepy.png");
const rylStickerNight       = require("../assets/images/stickers/rylane/rylane-sticker-night.png");
const rylStickerMusic       = require("../assets/images/stickers/rylane/rylane-sticker-music.png");
const rylStickerLateNight   = require("../assets/images/stickers/rylane/rylane-sticker-late-night.png");
const rylStickerProtect     = require("../assets/images/stickers/rylane/rylane-sticker-protect.png");
const rylStickerWhyILove    = require("../assets/images/stickers/rylane/rylane-sticker-why-i-love.png");
const rylStickerWriting     = require("../assets/images/stickers/rylane/rylane-sticker-writing.png");
const rylStickerSpeech      = require("../assets/images/stickers/rylane/rylane-sticker-speech.png");

const cloudStickerSleepy    = require("../assets/images/stickers/cloud/cloud-sticker-sleepy.png");
const cloudStickerHappy     = require("../assets/images/stickers/cloud/cloud-sticker-happy.png");
const cloudStickerListening = require("../assets/images/stickers/cloud/cloud-sticker-listening.png");
const cloudStickerVoiceBip  = require("../assets/images/stickers/cloud/cloud-sticker-voice-bip.png");
const cloudStickerJournal   = require("../assets/images/stickers/cloud/cloud-sticker-journal.png");
const cloudStickerComfort   = require("../assets/images/stickers/cloud/cloud-sticker-comfort.png");
const cloudStickerHug       = require("../assets/images/stickers/cloud/cloud-sticker-hug.png");
const cloudStickerProud     = require("../assets/images/stickers/cloud/cloud-sticker-proud.png");
const cloudStickerStormy    = require("../assets/images/stickers/cloud/cloud-sticker-stormy.png");
const cloudStickerCrying    = require("../assets/images/stickers/cloud/cloud-sticker-crying.png");
const cloudStickerCozy      = require("../assets/images/stickers/cloud/cloud-sticker-cozy.png");
const cloudStickerDreamy    = require("../assets/images/stickers/cloud/cloud-sticker-dreamy.png");
const cloudStickerThinking  = require("../assets/images/stickers/cloud/cloud-sticker-thinking.png");
const cloudStickerBippinBrb = require("../assets/images/stickers/cloud/cloud-sticker-bippin-brb.png");
const cloudStickerCheer     = require("../assets/images/stickers/cloud/cloud-sticker-cheer.png");

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
  rylaneWindowDay,

  // Cloud Room Backgrounds
  bgCloudRoomDay,
  bgCloudRoomMidday,
  bgCloudRoomAfternoon,
  bgCloudRoomEvening,
  bgCloudRoomNight,
  bgCloudRoomDeepNight,
  bgCloudRoomRain,

  // Night Room Backgrounds
  bgNightRoomDay,
  bgNightRoomMidday,
  bgNightRoomAfternoon,
  bgNightRoomEvening,
  bgNightRoomNight,
  bgNightRoomDeepNight,
  bgNightRoomRain,

  // Cloud Avatars
  cloudAvatarNeutral,
  cloudAvatarHappy,
  cloudAvatarThinking,
  cloudAvatarWriting,
  cloudAvatarWindow,
  cloudAvatarFullbody,

  // Night Avatars (fallbacks until real art ships)
  nightAvatarNeutral,
  nightAvatarHappy,
  nightAvatarThinking,
  nightAvatarWriting,
  nightAvatarWindow,
  nightAvatarFullbody,

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
  bgRayleneRoomMidday,
  bgRayleneRoomAfternoon,
  bgRayleneRoomEvening,
  bgRayleneRoomRain,
  bgRayleneRoomNight,
  bgRayleneRoomDeepNight,
  bgRylaneRoomDay,
  bgRylaneRoomMidday,
  bgRylaneRoomAfternoon,
  bgRylaneRoomEvening,
  bgRylaneRoomRain,
  bgRylaneRoomNight,
  bgRylaneRoomDeepNight,

  // Parent Rooms
  bgMomRoomDay,
  bgMomRoomEvening,
  bgMomRoomNight,
  bgMomRoomDeepNight,
  bgMomRoomRain,
  bgDadRoomDay,
  bgDadRoomEvening,
  bgDadRoomNight,
  bgDadRoomDeepNight,
  bgDadRoomRain,

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

  // Raylene stickers
  rayStickerStanding,
  rayStickerLounging,
  rayStickerStudying,
  rayStickerSleepy,
  rayStickerPeace,
  rayStickerListening,
  rayStickerComfort,
  rayStickerSunglasses,
  rayStickerHappy,
  rayStickerJournaling,
  rayStickerThinking,
  rayStickerBoba,
  rayStickerCrown,
  rayStickerSunnies,
  rayStickerHoodie,
  rayStickerSekretBip,
  rayStickerSekretHeart,
  rayStickerPillow,
  rayStickerIconCloud,

  // Rylane stickers
  rylStickerMini,
  rylStickerReading,
  rylStickerPhone,
  rylStickerThinking,
  rylStickerSitting,
  rylStickerHeadphones,
  rylStickerHoodie,
  rylStickerCalm,
  rylStickerStormy,
  rylStickerPeace,
  rylStickerHappy,
  rylStickerSleepy,
  rylStickerNight,
  rylStickerMusic,
  rylStickerLateNight,
  rylStickerProtect,
  rylStickerWhyILove,
  rylStickerWriting,
  rylStickerSpeech,

  // Cloud stickers
  cloudStickerSleepy,
  cloudStickerHappy,
  cloudStickerListening,
  cloudStickerVoiceBip,
  cloudStickerJournal,
  cloudStickerComfort,
  cloudStickerHug,
  cloudStickerProud,
  cloudStickerStormy,
  cloudStickerCrying,
  cloudStickerCozy,
  cloudStickerDreamy,
  cloudStickerThinking,
  cloudStickerBippinBrb,
  cloudStickerCheer,

  // UI / Splash
  sekretSplash,
} as const;

export type Character = 'raylene' | 'rylane' | 'cloud' | 'night';

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
  cloud: {
    neutral:  IMAGES.cloudAvatarNeutral,
    happy:    IMAGES.cloudAvatarHappy,
    thinking: IMAGES.cloudAvatarThinking,
    writing:  IMAGES.cloudAvatarWriting,
    window:   IMAGES.cloudAvatarWindow,
    fullbody: IMAGES.cloudAvatarFullbody,
  },
  night: {
    neutral:  IMAGES.nightAvatarNeutral,
    happy:    IMAGES.nightAvatarHappy,
    thinking: IMAGES.nightAvatarThinking,
    writing:  IMAGES.nightAvatarWriting,
    window:   IMAGES.nightAvatarWindow,
    fullbody: IMAGES.nightAvatarFullbody,
  },
};

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type RoomPhase = "day" | "midday" | "afternoon" | "evening" | "rain" | "night" | "deepNight";

export function getRoomPhase(
  date = new Date(),
  weatherMode?: string,
): RoomPhase {
  if (weatherMode === "rain") return "rain";
  const hour = date.getHours();
  if (hour >= 5  && hour < 10) return "day";
  if (hour >= 10 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  if (hour >= 21 && hour < 24) return "night";
  return "deepNight"; // midnight–5 AM
}

const ROOM_SCENES: Record<Character, Record<RoomPhase, ImageSourcePropType>> = {
  raylene: {
    day: IMAGES.bgRayleneRoomDay,
    midday: IMAGES.bgRayleneRoomDay,
    afternoon: IMAGES.bgRayleneRoomEvening,
    evening: IMAGES.bgRayleneRoomEvening,
    night: IMAGES.bgRayleneRoomNight,
    deepNight: IMAGES.bgRayleneRoomDeepNight,
    rain: IMAGES.bgRayleneRoomRain,
  },
  rylane: {
    day: IMAGES.bgRylaneRoomDay,
    midday: IMAGES.bgRylaneRoomDay,
    afternoon: IMAGES.bgRylaneRoomEvening,
    evening: IMAGES.bgRylaneRoomEvening,
    night: IMAGES.bgRylaneRoomNight,
    deepNight: IMAGES.bgRylaneRoomDeepNight,
    rain: IMAGES.bgRylaneRoomRain,
  },
  cloud: {
    day: IMAGES.bgCloudRoomDay,
    midday: IMAGES.bgCloudRoomMidday,
    afternoon: IMAGES.bgCloudRoomAfternoon,
    evening: IMAGES.bgCloudRoomEvening,
    night: IMAGES.bgCloudRoomNight,
    deepNight: IMAGES.bgCloudRoomDeepNight,
    rain: IMAGES.bgCloudRoomRain,
  },
  night: {
    day: IMAGES.bgNightRoomDay,
    midday: IMAGES.bgNightRoomMidday,
    afternoon: IMAGES.bgNightRoomAfternoon,
    evening: IMAGES.bgNightRoomEvening,
    night: IMAGES.bgNightRoomNight,
    deepNight: IMAGES.bgNightRoomDeepNight,
    rain: IMAGES.bgNightRoomRain,
  },
};

function normalizeRoomPhase(phase: RoomPhase | string): RoomPhase {
  if (phase === 'deep-night') return 'deepNight';
  if (phase === 'day' || phase === 'midday' || phase === 'afternoon' || phase === 'evening' || phase === 'night' || phase === 'deepNight' || phase === 'rain') {
    return phase;
  }
  return 'day';
}

export function getRoomScene(
  character: Character,
  phase: RoomPhase | string,
): ImageSourcePropType {
  const prefix = ROOM_PREFIX[character] ?? "bgRayleneRoom";
  // deepNight → "DeepNight", midday → "Midday", afternoon → "Afternoon", etc.
  const suffix = phase === "deepNight" ? "DeepNight"
               : phase === "midday"    ? "Midday"
               : phase === "afternoon" ? "Afternoon"
               : phase.charAt(0).toUpperCase() + phase.slice(1);
  const key = `${prefix}${suffix}` as keyof typeof IMAGES;
  // If an asset is truly missing for this phase, fall back to the nearest phase.
  if (!IMAGES[key]) {
    if (phase === "midday")    return getRoomScene(character, "day");
    if (phase === "afternoon") return getRoomScene(character, "evening");
  }
  return (IMAGES[key] ?? IMAGES.bgRayleneRoomDay) as ImageSourcePropType;
}

export function getRoomBg(
  character: Character,
  time: TimeOfDay | RoomPhase | 'deep-night' | string,
  weatherMode?: string,
): ImageSourcePropType {
  if (weatherMode === 'rain') return getRoomScene(character, 'rain');
  return getRoomScene(character, time === 'morning' ? 'day' : time);
}

export function getParentRoomBg(
  style: "mom" | "dad",
  weatherMode?: string,
) {
  const h = new Date().getHours();
  let phase: RoomPhase;
  if (weatherMode === "rain") phase = "rain";
  else if (h >= 5  && h < 12) phase = "day";
  else if (h >= 12 && h < 17) phase = "day";
  else if (h >= 17 && h < 21) phase = "evening";
  else if (h >= 21 || h < 1)  phase = "night";
  else                         phase = "deepNight";
  const prefix = style === "mom" ? "bgMomRoom" : "bgDadRoom";
  const suffix = phase === "deepNight" ? "DeepNight" : phase.charAt(0).toUpperCase() + phase.slice(1);
  return IMAGES[`${prefix}${suffix}` as keyof typeof IMAGES];
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
    room: bgCloudRoomEvening,
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
    room: bgNightRoomDeepNight,
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

// Normalize a sekret selector key (e.g. 'soft' from legacy code) to a Character.
// 'soft' is the internal key for Raylene; all others map 1-to-1.
export const normalizeCharacterKey = (key?: string): Character => {
  if (key === "rylane") return "rylane";
  if (key === "cloud")  return "cloud";
  if (key === "night")  return "night";
  return "raylene"; // 'soft', 'raylene', or any unknown → raylene
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
    name: "Raylene",
    emoji: "🌸",
    title: "Favorite Older Sister",
    vibe: "Funny, warm, protective, and impossible to fool.",
    greeting: "friend... 😭 okay, what happened?",
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
    title: "Quiet Observer",
    vibe: "Notices. Waits. Rarely pushes.",
    greeting: "something feels different today.",
  },
  night: {
    name: "Night Se'kret",
    emoji: "🌙",
    title: "The Light Left On",
    vibe: "Presence. Not conversation.",
    greeting: "rough night?",
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
