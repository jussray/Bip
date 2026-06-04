// constants/theme.ts
// Se’kret Bip — Design Tokens + IMAGES Map

// ── Raylene
const rayleneNeutral = require(’../assets/images/raylene-neutral.png’);
const rayleneHappy = require(’../assets/images/raylene-happy.png’);
const rayleneThinking = require(’../assets/images/raylene-thinking.png’);
const rayleneWriting = require(’../assets/images/raylene-writing.png’);
const rayleneWindow = require(’../assets/images/raylene-window.png’);
const rayleneWindowRainy = require(’../assets/images/raylene-window-rainy.png’);
const rayleneNightWindow = require(’../assets/images/raylene-night-window.png’);
const rayleneNightDoodle = require(’../assets/images/raylene-night-doodle.png’);
const rayleneFullbody = require(’../assets/images/raylene-fullbody.png’);

const rayleneVoiceDay = require(’../assets/images/raylene-voice-day.png’);
const rayleneVoiceNight = require(’../assets/images/raylene-voice-night.png’);

const raylene_Bippin2Day = require(’../assets/images/raylene-writing.png’);
const raylene_Bippin2Night = require(’../assets/images/raylene-writing.png’);

const raylene_PeriodCalendar = require(’../assets/images/raylene-period-calendar-day.png’);

const rayleneNeutralV2 = require(’../assets/images/raylene-neutral-v2.png’);
const rayleneNeutralV3 = require(’../assets/images/raylene-neutral-v3.png’);
const rayleneHappyV2 = require(’../assets/images/raylene-happy-v2.png’);
const rayleneHappyV3 = require(’../assets/images/raylene-happy-v3.png’);
const rayleneWindowV2 = require(’../assets/images/raylene-window-v2.png’);
const rayleneWindowV3 = require(’../assets/images/raylene-window-v2.png’);

// ── Rylane
const rylaneNeutral = require(’../assets/images/rylane-neutral.png’);
const rylaneHappy = require(’../assets/images/rylane-happy.png’);
const rylaneThinking = require(’../assets/images/rylane-thinking.png’);
const rylaneWriting = require(’../assets/images/rylane-writing.png’);
const rylaneWindow = require(’../assets/images/rylane-window.png’);
const rylaneFullbody = require(’../assets/images/rylane-fullbody.png’);
const rylaneProfile = require(’../assets/images/rylane-profile.png’);

const rylaneVoiceDay = require(’../assets/images/rylane-voice-day.png’);
const rylaneVoiceNight = require(’../assets/images/rylane-voice-night.png’);

const rylaneNeutralV2 = require(’../assets/images/rylane-neutral-v2.png’);

// ── Room Backgrounds
const bgRayleneRoomDay = require(’../assets/images/bg-raylene-room-day.png’);
const bgRayleneRoomNight = require(’../assets/images/bg-raylene-room-night.png’);
const bgRylaneRoomDay = require(’../assets/images/bg-rylane-room-day.png’);
const bgRylaneRoomNight = require(’../assets/images/bg-rylane-room-night.png’);
const roomBg = require(’../assets/images/room-bg.png’);
const roomBgDark = require(’../assets/images/room-bg-dark.png’);

// ── Screen Backgrounds
const bgComfort = require(’../assets/images/comfort-bg.png’);
const bgJournal = require(’../assets/images/journal-bg.png’);
const bgBridge = require(’../assets/images/bridge-bg.png’);
const bgVoiceBip = require(’../assets/images/voice-bip-bg.png’);
const bgParentDashboard = require(’../assets/images/parent-dashboard-bg.png’);
const bgWindow = require(’../assets/images/window.png’);
const bgCalmHero = require(’../assets/images/raylene-window.png’);

// ── Cloud / Mascot
const cloud = require(’../assets/images/cloud.png’);
const cloudHappy = require(’../assets/images/cloud-happy.png’);
const cloudHeadphones = require(’../assets/images/cloud-headphones.png’);
const cloudHeadphonesV2 = require(’../assets/images/cloud-headphones-v2.png’);
const cloudSleepy = require(’../assets/images/cloud-sleepy.png’);
const cloudStormy = require(’../assets/images/cloud-stormy.png’);

// ── UI / Splash
const sekretSplash = require(’../assets/images/sekret-splash.png’);
const parentDashboard = require(’../assets/images/parent-dashboard.png’);
const circleMockup = require(’../assets/images/circle-mockup.png’);

export const IMAGES = {
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

bgRayleneRoomDay,
bgRayleneRoomNight,
bgRylaneRoomDay,
bgRylaneRoomNight,
roomBg,
roomBgDark,

bgComfort,
bgJournal,
bgBridge,
bgVoiceBip,
bgParentDashboard,
bgWindow,
bgCalmHero,

cloud,
cloudHappy,
cloudHeadphones,
cloudHeadphonesV2,
cloudSleepy,
cloudStormy,

sekretSplash,
parentDashboard,
circleMockup,
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

export type TimeOfDay = ‘morning’ | ‘day’ | ‘evening’ | ‘night’;

export function getRoomBg(character: ‘raylene’ | ‘rylane’, time: TimeOfDay) {
if (character === ‘raylene’) {
switch (time) {
case ‘night’:
return IMAGES.bgRayleneRoomNight;
case ‘evening’:
return IMAGES.roomBgDark;
case ‘morning’:
case ‘day’:
default:
return IMAGES.bgRayleneRoomDay;
}
}

switch (time) {
case ‘night’:
return IMAGES.bgRylaneRoomNight;
case ‘evening’:
return IMAGES.roomBgDark;
case ‘morning’:
case ‘day’:
default:
return IMAGES.bgRylaneRoomDay;
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
night: { name: ‘Golden Moon’, emoji: ‘🌙’, background: ‘#3A2503’, card: ‘#5B3A00’, accent: ‘#FFD84D’, soft: ‘#FFF3B0’ },
flower: { name: ‘Soft Pink’, emoji: ‘🌸’, background: ‘#4A1028’, card: ‘#6D1B3B’, accent: ‘#FF4FA3’, soft: ‘#FFD6E7’ },
rain: { name: ‘Rain Blue’, emoji: ‘🌧️’, background: ‘#243447’, card: ‘#36506B’, accent: ‘#4DA3FF’, soft: ‘#B6DCFF’ },
neon: { name: ‘Night Purple’, emoji: ‘💜’, background: ‘#160028’, card: ‘#2B0A4D’, accent: ‘#D946EF’, soft: ‘#F5B8FF’ },
galaxy: { name: ‘Galaxy Night’, emoji: ‘🌌’, background: ‘#151A40’, card: ‘#2A2D73’, accent: ‘#7C83FF’, soft: ‘#D7D9FF’ },
};

export const SEKRET_PROFILES: Record<string, {
name: string;
emoji: string;
title: string;
vibe: string;
greeting: string;
}> = {
soft: {
name: “Se’kret”,
emoji: ‘🌸’,
title: ‘Soft Big Sis’,
vibe: ‘Warm, expressive, protective, and real.’,
greeting: “Hey love. I’m here. Tell me what’s on your mind.”,
},
rylane: {
name: ‘Rylane’,
emoji: ‘⚡’,
title: ‘Loyal Bro’,
vibe: ‘Quiet loyalty. Keeps it real. Never talks down.’,
greeting: “Aight, I’m here. What’s been heavy?”,
},
cloud: {
name: “Cloud Se’kret”,
emoji: ‘☁️’,
title: ‘Quiet Comfort’,
vibe: ‘Soft, calm, low-pressure presence.’,
greeting: ‘No pressure. We can just sit here for a minute.’,
},
night: {
name: “Night Se’kret”,
emoji: ‘🌙’,
title: ‘Late-Night Listener’,
vibe: ‘Minimal words, calm energy, safe space.’,
greeting: “I’m here. You don’t gotta explain perfectly.”,
},
};

export const HOME_MESSAGES = [
“Don’t stay up carrying the whole world tonight.”,
‘Rest is productive too.’,
‘You deserve softness too.’,
‘Heavy days do not define you.’,
‘Your mind deserves rest.’,
‘Breathe slowly tonight.’,
‘You made it through today.’,
];

export const COMFORT_MESSAGES = [
‘You are not too much.’,
‘Rest is not giving up.’,
‘You can feel this and still be okay.’,
‘You don’t have to explain your pain to deserve care.’,
‘You made it through hard days before.’,
‘Softness is not weakness.’,
‘You deserve the same kindness you give others.’,
‘It’s okay to not be okay right now.’,
]