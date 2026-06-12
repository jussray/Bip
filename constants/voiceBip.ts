import type { ImageSourcePropType } from "react-native";
import { IMAGES, type Character, type RoomPhase } from "./theme";
import type { SekretPersonality } from "../services/sekretPresence";

export type VoiceBipAvatarKey = Character;
export type VoiceBipVoiceIdKey =
  | "rayleneVoiceId"
  | "rylaneVoiceId"
  | "cloudVoiceId"
  | "nightVoiceId";

export interface VoiceBipPrompt {
  emoji: string;
  text: string;
}

export interface VoiceBipAvatarDefinition {
  key: VoiceBipAvatarKey;
  selectionKey: string;
  displayName: string;
  emoji: string;
  role: string;
  energy: string;
  personality: SekretPersonality;
  voiceId: FutureVoiceId;
  accent: string;
  heroArt: {
    day: ImageSourcePropType | null;
    night: ImageSourcePropType | null;
  };
  prompts: readonly VoiceBipPrompt[];
  tips: readonly string[];
  greeting: string;
  presence: string;
  listening: string;
  responseLabel: string;
  archiveTitle: string;
}

export const VOICE_BIP_AVATARS: Record<VoiceBipAvatarKey, VoiceBipAvatarDefinition> = {
  raylene: {
    key: 'raylene',
    displayName: 'Raylene',
    emoji: '💜',
    role: 'Big sister',
    energy: 'Come here. Talk to me.',
    personality: 'raylene',
    voiceId: VOICE_BIP_VOICE_IDS.rayleneVoiceId,
    accent: '#e9a8d2',
    heroArt: { day: IMAGES.rayleneVoiceDay, night: IMAGES.rayleneVoiceNight },
    prompts: [
      { emoji: '💜', text: "What's something you've been carrying that you haven't said out loud yet?" },
      { emoji: '🌙', text: 'Tell me about a moment this week that felt heavier than it should have.' },
      { emoji: '🫶', text: "What do you need right now that nobody's asked you about?" },
      { emoji: '🌧️', text: 'Say the thing you keep stopping yourself from saying.' },
      { emoji: '✨', text: 'What went okay today — even just one small thing?' },
    ],
    tips: [
      'Find a private spot — car, room, bathroom, wherever',
      'You don’t need perfect words. Just talk.',
      'It’s okay to cry, pause, or start over',
      'I listen without judgment, always',
    ],
    greeting: 'Come here. Talk to me.',
    presence: 'Raylene’s here · warm and listening',
    listening: 'Raylene is listening… 💜',
    responseLabel: 'Raylene replied 💜',
    archiveTitle: 'Voice Bips with Raylene',
  },
  rylane: {
    key: 'rylane',
    displayName: 'Rylane',
    emoji: '⚡',
    role: 'Big brother / older cousin',
    energy: 'Aight. Say it straight.',
    personality: 'rylane',
    voiceId: VOICE_BIP_VOICE_IDS.rylaneVoiceId,
    accent: '#8f9cff',
    heroArt: { day: IMAGES.rylaneVoiceDay, night: IMAGES.rylaneVoiceNight },
    prompts: [
      { emoji: '⚡', text: "What's been sitting on your chest that you haven't put down yet?" },
      { emoji: '🧠', text: "Say it plain. No filter. What's actually on your mind right now?" },
      { emoji: '🎙️', text: 'Talk me through the last 24 hours, for real.' },
      { emoji: '🔊', text: 'What would you say if nobody was watching or judging?' },
      { emoji: '🏆', text: "What's one thing you handled today that nobody gave you credit for?" },
    ],
    tips: [
      'Find your spot — car, garage, walk, wherever feels real',
      'You don’t gotta sound smooth. Just say it.',
      'Pause. Curse. Restart. All allowed.',
      'I’m not grading you. I’m holding it with you.',
    ],
    greeting: 'Aight. Say it straight.',
    presence: 'Rylane’s here · no judgment, no lecture',
    listening: 'Rylane is listening… ⚡',
    responseLabel: 'Rylane replied ⚡',
    archiveTitle: 'Voice Bips with Rylane',
  },
  cloud: {
    key: 'cloud',
    displayName: 'Cloud',
    emoji: '☁️',
    role: 'Reflection',
    energy: 'We don’t have to rush this.',
    personality: 'cloud',
    voiceId: VOICE_BIP_VOICE_IDS.cloudVoiceId,
    accent: '#c8c9f5',
    heroArt: { day: AVATARS.cloud.fullbody, night: AVATARS.cloud.fullbody },
    prompts: [
      { emoji: '☁️', text: 'Let the words come slowly. There’s no rush here.' },
      { emoji: '🕯️', text: "What's one thing that felt heavy this week you haven't set down?" },
      { emoji: '🌊', text: 'Just breathe first. Then say whatever comes.' },
      { emoji: '🫧', text: 'What feels closest to the surface right now?' },
    ],
    tips: [
      'Start with one word if that’s all you have',
      'Silence is allowed. Take the space you need.',
      'You can pause and come back when the thought is ready',
      'Nothing has to be solved here',
    ],
    greeting: 'We don’t have to rush this.',
    presence: 'Cloud’s here · quiet and unhurried',
    listening: 'Cloud is listening… ☁️',
    responseLabel: 'Cloud replied ☁️',
    archiveTitle: 'Voice Bips with Cloud',
  },
  night: {
    key: 'night',
    displayName: 'Night',
    emoji: '🌙',
    role: 'Late-night presence',
    energy: 'I’m here while everybody else is asleep.',
    personality: 'night',
    voiceId: VOICE_BIP_VOICE_IDS.nightVoiceId,
    accent: '#bbb7ef',
    // Night has no dedicated avatar cutout yet. Keep Night’s complete room
    // identity rather than borrowing another character’s body art.
    heroArt: { day: null, night: null },
    prompts: [
      { emoji: '🌃', text: 'What keeps replaying in your head at night?' },
      { emoji: '🌙', text: 'What are you too tired to pretend is fine right now?' },
      { emoji: '😶‍🌫️', text: 'Say the part that gets louder after dark.' },
      { emoji: '🕯️', text: 'What do you need someone to stay awake with you for?' },
    ],
    tips: [
      'Let the room be quiet around you',
      'You don’t have to make tonight sound better than it feels',
      'Take your time between thoughts',
      'Night stays present; Night does not push',
    ],
    greeting: 'I’m here while everybody else is asleep.',
    presence: 'Night’s here · the light is still on',
    listening: 'Night is listening… 🌙',
    responseLabel: 'Night replied 🌙',
    archiveTitle: 'Voice Bips with Night',
  },
};

export const VOICE_BIP_AVATAR_KEYS = Object.freeze([
  'raylene',
  'rylane',
  'cloud',
  'night',
] as const);

export function normalizeVoiceBipAvatar(value?: string): VoiceBipAvatarKey {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'rylane') return 'rylane';
  if (normalized === 'cloud') return 'cloud';
  if (normalized === 'night') return 'night';
  return 'raylene';
  voiceIdKey: VoiceBipVoiceIdKey;
  heroArt: (phase: RoomPhase) => ImageSourcePropType;
  presence: string;
  listening: string;
  thinking: string;
  replyLabel: string;
  prompts: VoiceBipPrompt[];
  tips: string[];
}

export const VOICE_BIP_VOICE_IDS: Record<
  VoiceBipVoiceIdKey | "sekretVoiceId",
  string | null
> = {
  rayleneVoiceId: null,
  rylaneVoiceId: null,
  cloudVoiceId: null,
  nightVoiceId: null,
  sekretVoiceId: null,
};

const isDarkPhase = (phase: RoomPhase) =>
  phase === "evening" || phase === "night" || phase === "deepNight";

export const VOICE_BIP_AVATARS: Record<
  VoiceBipAvatarKey,
  VoiceBipAvatarDefinition
> = {
  raylene: {
    key: "raylene",
    selectionKey: "soft",
    displayName: "Raylene",
    emoji: "💜",
    role: "Big sister",
    energy: "Come here. Talk to me.",
    personality: "raylene",
    voiceIdKey: "rayleneVoiceId",
    heroArt: (phase) =>
      isDarkPhase(phase) ? IMAGES.rayleneVoiceNight : IMAGES.rayleneVoiceDay,
    presence: "Raylene’s here. Take your time.",
    listening: "Raylene is listening… 💜",
    thinking: "Raylene is sitting with what you said… 💜",
    replyLabel: "Raylene replied 💜",
    prompts: [
      {
        emoji: "💜",
        text: "What’s something you’ve been carrying that you haven’t said out loud yet?",
      },
      {
        emoji: "🌙",
        text: "Tell me about a moment this week that felt heavier than it should have.",
      },
      {
        emoji: "🫶",
        text: "What do you need right now that nobody’s asked you about?",
      },
      {
        emoji: "🌧️",
        text: "Say the thing you keep stopping yourself from saying.",
      },
      {
        emoji: "✨",
        text: "What went okay today — even just one small thing?",
      },
    ],
    tips: [
      "Find a private spot — car, room, bathroom, wherever",
      "You don’t need perfect words. Just talk.",
      "It’s okay to cry, pause, or start over",
      "Raylene listens without judgment, always",
    ],
  },
  rylane: {
    key: "rylane",
    selectionKey: "rylane",
    displayName: "Rylane",
    emoji: "⚡",
    role: "Big brother / older cousin",
    energy: "Aight. Say it straight.",
    personality: "rylane",
    voiceIdKey: "rylaneVoiceId",
    heroArt: (phase) =>
      isDarkPhase(phase) ? IMAGES.rylaneVoiceNight : IMAGES.rylaneVoiceDay,
    presence: "Rylane’s posted up. Say it straight.",
    listening: "Rylane is listening… ⚡",
    thinking: "Rylane is taking that in… ⚡",
    replyLabel: "Rylane replied ⚡",
    prompts: [
      {
        emoji: "⚡",
        text: "What’s been sitting on your chest that you haven’t put down yet?",
      },
      {
        emoji: "🧠",
        text: "Say it plain. No filter. What’s actually on your mind right now?",
      },
      { emoji: "🎙️", text: "Talk me through the last 24 hours, for real." },
      {
        emoji: "🔊",
        text: "What would you say if nobody was watching or judging?",
      },
      {
        emoji: "🏆",
        text: "What’s one thing you handled today that nobody gave you credit for?",
      },
    ],
    tips: [
      "Find your spot — car, garage, walk, wherever feels real",
      "You don’t gotta sound smooth. Just say it.",
      "Pause. Curse. Restart. All allowed.",
      "Rylane isn’t grading you. He’s holding it with you.",
    ],
  },
  cloud: {
    key: "cloud",
    selectionKey: "cloud",
    displayName: "Cloud",
    emoji: "☁️",
    role: "Reflection",
    energy: "We don’t have to rush this.",
    personality: "cloud",
    voiceIdKey: "cloudVoiceId",
    heroArt: (phase) =>
      isDarkPhase(phase)
        ? IMAGES.cloudAvatarWindow
        : IMAGES.cloudAvatarFullbody,
    presence: "Cloud is floating nearby. No rush.",
    listening: "Cloud is listening… ☁️",
    thinking: "Cloud is giving your words some space… ☁️",
    replyLabel: "Cloud replied ☁️",
    prompts: [
      { emoji: "☁️", text: "Let the words come slowly. There’s no rush here." },
      {
        emoji: "🕯️",
        text: "What’s one thing that felt heavy this week you haven’t set down?",
      },
      { emoji: "🌊", text: "Just breathe first. Then say whatever comes." },
      { emoji: "🫧", text: "What feeling needs a little more room right now?" },
    ],
    tips: [
      "Take one breath before you begin",
      "Silence can be part of the Bip too",
      "Start in the middle if the beginning feels far away",
      "Cloud will stay with the pace you choose",
    ],
  },
  night: {
    key: "night",
    selectionKey: "night",
    displayName: "Night",
    emoji: "🌙",
    role: "Late-night presence",
    energy: "I’m here while everybody else is asleep.",
    personality: "night",
    voiceIdKey: "nightVoiceId",
    heroArt: (phase) =>
      isDarkPhase(phase)
        ? IMAGES.nightAvatarWindow
        : IMAGES.nightAvatarFullbody,
    presence: "Night is here while everything else is quiet.",
    listening: "Night is listening… 🌙",
    thinking: "Night is still here with what you said… 🌙",
    replyLabel: "Night replied 🌙",
    prompts: [
      { emoji: "🌃", text: "What keeps replaying in your head at night?" },
      {
        emoji: "🌙",
        text: "What are you too tired to pretend is fine right now?",
      },
      { emoji: "😶‍🌫️", text: "Say the part that gets louder after dark." },
      { emoji: "🕰️", text: "What showed up once everybody else went quiet?" },
    ],
    tips: [
      "You can whisper it. Night is still listening.",
      "You don’t have to make it sound less messy",
      "Let the pauses be as long as they need to be",
      "Night can hold the thoughts that only show up late",
    ],
  },
};

export const VOICE_BIP_AVATAR_KEYS = Object.keys(
  VOICE_BIP_AVATARS,
) as VoiceBipAvatarKey[];

export function normalizeVoiceBipAvatar(value?: string): VoiceBipAvatarKey {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "rylane" || normalized.includes("rylane")) return "rylane";
  if (normalized === "cloud" || normalized.includes("cloud")) return "cloud";
  if (normalized === "night" || normalized.includes("night")) return "night";
  return "raylene";
}

export function getVoiceBipAvatar(value?: string): VoiceBipAvatarDefinition {
  return VOICE_BIP_AVATARS[normalizeVoiceBipAvatar(value)];
}
