type StaticAsset = ReturnType<typeof require>;

type PoseAssetEntry = {
  source: StaticAsset;
  generatedFile: string;
  activeFile: string;
  status: 'generated' | 'fallback';
};

type PhaseAssetEntry = {
  source: StaticAsset;
  file: string;
};

const nightNeutral = require('../../assets/images/companions/teen/night/neutral.png');

export const NIGHT_ROOM_POSE_ASSETS: Record<string, PoseAssetEntry> = {
  neutral: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/neutral.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'generated' },
  thinking: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/thinking.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  writing: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/writing.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  window: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/window.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  listening: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/listening.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  headphones: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/headphones.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  microphone: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/microphone.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  moonChair: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/moon-chair.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
  resting: { source: nightNeutral, generatedFile: 'assets/images/companions/teen/night/resting.png', activeFile: 'assets/images/companions/teen/night/neutral.png', status: 'fallback' },
};

export const NIGHT_ROOM_PHASE_ASSETS: Record<string, PhaseAssetEntry> = {
  day: { source: require('../../assets/images/resized-bg/bg-night-room-day.jpg'), file: 'assets/images/resized-bg/bg-night-room-day.jpg' },
  midday: { source: require('../../assets/images/resized-bg/bg-night-room-midday.jpg'), file: 'assets/images/resized-bg/bg-night-room-midday.jpg' },
  afternoon: { source: require('../../assets/images/resized-bg/bg-night-room-afternoon.jpg'), file: 'assets/images/resized-bg/bg-night-room-afternoon.jpg' },
  evening: { source: require('../../assets/images/resized-bg/bg-night-room-evening.jpg'), file: 'assets/images/resized-bg/bg-night-room-evening.jpg' },
  rain: { source: require('../../assets/images/resized-bg/bg-night-room-rain.jpg'), file: 'assets/images/resized-bg/bg-night-room-rain.jpg' },
  night: { source: require('../../assets/images/resized-bg/bg-night-room-night.jpg'), file: 'assets/images/resized-bg/bg-night-room-night.jpg' },
  deepNight: { source: require('../../assets/images/resized-bg/bg-night-room-deep-night.jpg'), file: 'assets/images/resized-bg/bg-night-room-deep-night.jpg' },
};
