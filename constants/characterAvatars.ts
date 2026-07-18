// CHARACTER AVATARS — full-size avatar art ONLY.
// Not stickers, not backgrounds. The companion/mascot presence images.
// tolan layer: Raylene, Rylane, Night (Tolan-style companion avatars).
// mascot layer: Cloud (app mascot, not a companion).

export type CharacterKey = 'raylene' | 'rylane' | 'cloud' | 'night';
export type AvatarLayer = 'tolan' | 'mascot';

export type AvatarMood =
  | 'neutral' | 'happy' | 'calm' | 'focused' | 'reflective'
  | 'sad' | 'stormy' | 'sleepy' | 'energetic' | 'loving' | 'curious';

export type AvatarState =
  | 'idle' | 'writing' | 'thinking' | 'voice-listening' | 'voice-thinking'
  | 'voice-responding' | 'voice-comforting' | 'window-day' | 'window-night'
  | 'window-rainy' | 'fullbody' | 'presence';

export type AvatarPose =
  | 'portrait' | 'fullbody' | 'window' | 'sitting' | 'standing' | 'floating' | 'closeup';

export type TimeOfDay = 'day' | 'night' | 'any';

export interface CharacterAvatar {
  character: CharacterKey;
  layer: AvatarLayer;
  assetKey: string;
  filename: string;
  mood: AvatarMood[];
  state: AvatarState[];
  pose: AvatarPose[];
  timeOfDay: TimeOfDay;
  roomUse: boolean;
  voiceUse: boolean;
  companionUse: boolean;
  renderable: boolean;
  referenceOnly: boolean;
}

export const AVATAR_REGISTRY: CharacterAvatar[] = [
  // ── Raylene (tolan) ────────────────────────────────────────────────────────
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneNeutral',     filename: 'raylene-neutral.png',           mood: ['neutral','calm'],            state: ['idle','presence'], pose: ['portrait'],          timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneNeutralV3',   filename: 'raylene-neutral-v3.png',        mood: ['neutral','calm'],            state: ['idle'],            pose: ['portrait'],          timeOfDay: 'any',   roomUse: false, voiceUse: false, companionUse: false, renderable: false, referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneHappy',       filename: 'raylene-happy.png',             mood: ['happy','energetic','loving'], state: ['idle'],           pose: ['portrait'],          timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneHappyV3',     filename: 'raylene-happy-v3.png',          mood: ['happy','energetic'],         state: ['idle'],            pose: ['portrait'],          timeOfDay: 'any',   roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneWriting',     filename: 'raylene-writing.png',           mood: ['focused','reflective'],      state: ['writing'],         pose: ['sitting'],           timeOfDay: 'any',   roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneWindow',      filename: 'raylene-window.png',            mood: ['reflective','calm'],         state: ['window-night'],    pose: ['window'],            timeOfDay: 'night', roomUse: true,  voiceUse: false, companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneWindowRainy', filename: 'raylene-window-rainy.png',      mood: ['sad','reflective','calm'],   state: ['window-rainy'],    pose: ['window'],            timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneFullbody',    filename: 'raylene-fullbody.png',          mood: ['neutral'],                   state: ['fullbody'],        pose: ['fullbody','standing'], timeOfDay: 'any', roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneVoiceDay',    filename: 'raylene-voice-day.png',         mood: ['energetic','happy'],         state: ['voice-listening','voice-responding'], pose: ['portrait'], timeOfDay: 'day',   roomUse: false, voiceUse: true,  companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneVoiceNight',  filename: 'raylene-voice-night.png',       mood: ['calm','reflective'],         state: ['voice-listening','voice-comforting'], pose: ['portrait'], timeOfDay: 'night', roomUse: false, voiceUse: true,  companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'raylene_Bippin2Day', filename: 'raylene-bippin2-day.png',       mood: ['happy','energetic'],         state: ['idle'],            pose: ['portrait'],          timeOfDay: 'day',   roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'raylene', layer: 'tolan', assetKey: 'rayleneThinking',    filename: 'raylene-thinking.png',          mood: ['curious','reflective'],      state: ['thinking','voice-thinking'], pose: ['portrait'], timeOfDay: 'any',   roomUse: false, voiceUse: true,  companionUse: true,  renderable: false, referenceOnly: true },
  { character: 'raylene', layer: 'tolan', assetKey: '',                   filename: 'raylene-period-calendar-day.png', mood: ['calm'],                    state: ['idle'],            pose: ['portrait'],          timeOfDay: 'day',   roomUse: false, voiceUse: false, companionUse: false, renderable: false, referenceOnly: true },
  { character: 'raylene', layer: 'tolan', assetKey: '',                   filename: 'raylene-bippin2-night.png',     mood: ['calm','reflective'],         state: ['idle'],            pose: ['portrait'],          timeOfDay: 'night', roomUse: false, voiceUse: false, companionUse: true,  renderable: false, referenceOnly: true },

  // ── Rylane (tolan) ─────────────────────────────────────────────────────────
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneNeutral',    filename: 'rylane-neutral.png',     mood: ['neutral'],            state: ['idle','presence'], pose: ['portrait'],          timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneNeutralV2',  filename: 'rylane-neutral-v2.png',  mood: ['neutral'],            state: ['idle'],            pose: ['portrait'],          timeOfDay: 'any',   roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneHappy',      filename: 'rylane-happy.png',       mood: ['happy','energetic'],  state: ['idle'],            pose: ['portrait'],          timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneThinking',   filename: 'rylane-thinking.png',    mood: ['curious','reflective'], state: ['thinking','voice-thinking'], pose: ['portrait'], timeOfDay: 'any', roomUse: false, voiceUse: true,  companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneWriting',    filename: 'rylane-writing.png',     mood: ['focused','reflective'], state: ['writing'],       pose: ['sitting'],           timeOfDay: 'any',   roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneWindow',     filename: 'rylane-window.png',      mood: ['reflective','calm'],  state: ['window-night'],    pose: ['window'],            timeOfDay: 'night', roomUse: true,  voiceUse: false, companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneWindowDay',  filename: 'rylane-window-day.png',  mood: ['calm','reflective'],  state: ['window-day'],      pose: ['window'],            timeOfDay: 'day',   roomUse: true,  voiceUse: false, companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneFullbody',   filename: 'rylane-fullbody.png',    mood: ['neutral'],            state: ['fullbody'],        pose: ['fullbody','standing'], timeOfDay: 'any', roomUse: false, voiceUse: false, companionUse: true,  renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneVoiceDay',   filename: 'rylane-voice-day.png',   mood: ['energetic','happy'],  state: ['voice-listening','voice-responding'], pose: ['portrait'], timeOfDay: 'day',   roomUse: false, voiceUse: true,  companionUse: false, renderable: true,  referenceOnly: false },
  { character: 'rylane', layer: 'tolan', assetKey: 'rylaneVoiceNight', filename: 'rylane-voice-night.png', mood: ['calm','reflective'],  state: ['voice-listening','voice-comforting'], pose: ['portrait'], timeOfDay: 'night', roomUse: false, voiceUse: true,  companionUse: false, renderable: true,  referenceOnly: false },

  // ── Cloud (mascot) ───────────────────────────────────────────────────────────
  { character: 'cloud', layer: 'mascot', assetKey: 'cloud',             filename: 'cloud.png',              mood: ['neutral','calm'],            state: ['idle','presence'], pose: ['floating'], timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: true,  renderable: true, referenceOnly: false },
  { character: 'cloud', layer: 'mascot', assetKey: 'cloudHappy',        filename: 'cloud-happy.png',        mood: ['happy','energetic','loving'], state: ['idle'],           pose: ['floating'], timeOfDay: 'any',   roomUse: true,  voiceUse: false, companionUse: true,  renderable: true, referenceOnly: false },
  { character: 'cloud', layer: 'mascot', assetKey: 'cloudHeadphones',   filename: 'cloud-headphones.png',   mood: ['calm','focused'],            state: ['voice-listening'], pose: ['floating'], timeOfDay: 'any',   roomUse: false, voiceUse: true,  companionUse: false, renderable: true, referenceOnly: false },
  { character: 'cloud', layer: 'mascot', assetKey: 'cloudHeadphonesV2', filename: 'cloud-headphones-v2.png', mood: ['calm','focused','energetic'], state: ['voice-listening'], pose: ['floating'], timeOfDay: 'any',  roomUse: false, voiceUse: true,  companionUse: false, renderable: true, referenceOnly: false },
  { character: 'cloud', layer: 'mascot', assetKey: 'cloudSleepy',       filename: 'cloud-sleepy.png',       mood: ['sleepy','calm'],             state: ['idle'],            pose: ['floating'], timeOfDay: 'night', roomUse: true,  voiceUse: false, companionUse: true,  renderable: true, referenceOnly: false },
  { character: 'cloud', layer: 'mascot', assetKey: 'cloudStormy',       filename: 'cloud-stormy.png',       mood: ['stormy','sad'],              state: ['idle'],            pose: ['floating'], timeOfDay: 'any',   roomUse: false, voiceUse: false, companionUse: false, renderable: true, referenceOnly: false },

  // ── Night (tolan, all referenceOnly) ─────────────────────────────────────────
  { character: 'night', layer: 'tolan', assetKey: 'nightAvatarDay',   filename: '(fallback: raylene-neutral.png)',      mood: ['neutral'],          state: ['idle','presence'], pose: ['portrait'], timeOfDay: 'any', roomUse: false, voiceUse: false, companionUse: false, renderable: false, referenceOnly: true },
  { character: 'night', layer: 'tolan', assetKey: 'nightAvatarNight', filename: '(fallback: raylene-voice-night.png)',  mood: ['calm','reflective'], state: ['idle'],           pose: ['portrait'], timeOfDay: 'any', roomUse: false, voiceUse: false, companionUse: false, renderable: false, referenceOnly: true },
  { character: 'night', layer: 'tolan', assetKey: 'nightAvatarRainy', filename: '(fallback: raylene-window-rainy.png)',  mood: ['sad','reflective'], state: ['window-rainy'],   pose: ['portrait'], timeOfDay: 'any', roomUse: false, voiceUse: false, companionUse: false, renderable: false, referenceOnly: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesTime(avatar: CharacterAvatar, timeOfDay?: TimeOfDay): boolean {
  if (!timeOfDay || timeOfDay === 'any') return true;
  return avatar.timeOfDay === timeOfDay || avatar.timeOfDay === 'any';
}

export function getAvatarForState(
  character: CharacterKey,
  state: AvatarState,
  timeOfDay?: TimeOfDay,
): CharacterAvatar | undefined {
  const candidates = AVATAR_REGISTRY.filter(
    a => a.character === character && a.state.includes(state) && a.renderable,
  );
  return candidates.find(a => matchesTime(a, timeOfDay)) ?? candidates[0];
}

export function getRoomAvatar(
  character: CharacterKey,
  timeOfDay?: TimeOfDay,
): CharacterAvatar | undefined {
  const candidates = AVATAR_REGISTRY.filter(
    a => a.character === character && a.roomUse && a.renderable,
  );
  return candidates.find(a => matchesTime(a, timeOfDay)) ?? candidates[0];
}

export function getVoiceAvatar(
  character: CharacterKey,
  timeOfDay?: TimeOfDay,
): CharacterAvatar | undefined {
  const candidates = AVATAR_REGISTRY.filter(
    a => a.character === character && a.voiceUse && a.renderable,
  );
  return candidates.find(a => matchesTime(a, timeOfDay)) ?? candidates[0];
}

export function getRenderableAvatars(character: CharacterKey): CharacterAvatar[] {
  return AVATAR_REGISTRY.filter(a => a.character === character && a.renderable);
}

export function getTolanlayerAvatars(character: CharacterKey): CharacterAvatar[] {
  return AVATAR_REGISTRY.filter(a => a.character === character && a.layer === 'tolan');
}

export function getMascotLayerAvatars(): CharacterAvatar[] {
  return AVATAR_REGISTRY.filter(a => a.layer === 'mascot');
}
