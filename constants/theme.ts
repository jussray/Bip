export const THEME_PACKS: Record<string, any> = {
  night: {
    name: 'Golden Moon',
    emoji: '🌙',
    background: '#3A2503',
    card: '#5B3A00',
    accent: '#FFD84D',
    soft: '#FFF3B0',
  },
  flower: {
    name: 'Soft Pink',
    emoji: '🌸',
    background: '#4A1028',
    card: '#6D1B3B',
    accent: '#FF4FA3',
    soft: '#FFD6E7',
  },
  rain: {
    name: 'Rain Blue',
    emoji: '🌧️',
    background: '#243447',
    card: '#36506B',
    accent: '#4DA3FF',
    soft: '#B6DCFF',
  },
  neon: {
    name: 'Night Purple',
    emoji: '💜',
    background: '#160028',
    card: '#2B0A4D',
    accent: '#D946EF',
    soft: '#F5B8FF',
  },
  galaxy: {
    name: 'Galaxy Night',
    emoji: '🌌',
    background: '#151A40',
    card: '#2A2D73',
    accent: '#7C83FF',
    soft: '#D7D9FF',
  },
};

export const SEKRET_PROFILES: Record<string, any> = {
  soft: {
    name: "Se'kret",
    emoji: '🌸',
    title: 'Soft Big Sis',
    vibe: 'Warm, expressive, protective, and real.',
    greeting: "Hey love. I'm here. Tell me what's on your mind.",
  },
  rylane: {
    name: 'Rylane',
    emoji: '⚡',
    title: 'Loyal Bro',
    vibe: 'Quiet loyalty. Keeps it real. Never talks down.',
    greeting: "Aight, I'm here. What's been heavy?",
  },
  cloud: {
    name: "Cloud Se'kret",
    emoji: '☁️',
    title: 'Quiet Comfort',
    vibe: 'Soft, calm, low-pressure presence.',
    greeting: 'No pressure. We can just sit here for a minute.',
  },
  night: {
    name: "Night Se'kret",
    emoji: '🌙',
    title: 'Late-Night Listener',
    vibe: 'Minimal words, calm energy, safe space.',
    greeting: "I'm here. You don't gotta explain perfectly.",
  },
};

export const MOODS = [
  { id: 'Happy', emoji: '😊' },
  { id: 'Sad', emoji: '😔' },
  { id: 'Angry', emoji: '😡' },
  { id: 'Tired', emoji: '😴' },
];

export const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Soft moment. Slow breath. Stay with me.' },
];

export const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

export const HEAVY_WORDS = [
  'alone',
  'hurt',
  'tired',
  'done',
  'empty',
  'cry',
  'sad',
  'scared',
  'anxious',
  'panic',
];

export const C = {
  bg: '#0d0914',
  card: '#130d1f',
  card2: '#1a1030',
  purple: '#7c3aed',
  pink: '#ec4899',
  pinkHot: '#f472b6',
  lavender: '#c4b5fd',
  white: '#f5f0ff',
  muted: '#7c6899',
  mutedLt: '#a78cc0',
  border: 'rgba(167,114,192,0.15)',
  borderPk: 'rgba(244,114,182,0.25)',
};

export const IMAGES = {
  raylene: {
    thinking: require('../assets/images/raylene-thinking.png'),
    writing: require('../assets/images/raylene-writing.png'),
    neutral: require('../assets/images/raylene-neutral.png'),
    happy: require('../assets/images/raylene-happy.png'),
    window: require('../assets/images/raylene-window.png'),
  },
  rylane: {
    thinking: require('../assets/images/rylane-writing.png'),
    writing: require('../assets/images/rylane-writing.png'),
    neutral: require('../assets/images/rylane-neutral.png'),
    happy: require('../assets/images/rylane-neutral.png'),
    window: require('../assets/images/rylane-standing.png'),
  },
  cloud: require('../assets/images/cloud.png'),
  cloudHeadphones: require('../assets/images/cloud-headphones.png'),
  cloudStormy: require('../assets/images/cloud-stormy.png'),
  roomBg: require('../assets/images/room-bg.png'),
  roomBgDark: require('../assets/images/room-bg-dark.png'),
  mom: require('../assets/images/mom.png'),
};