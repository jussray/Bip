import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Easing,
  ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES, AVATARS as THEME_AVATARS, THEME_PACKS, getRoomPhase, getRoomScene, type Character, type RoomPhase, type VibeKey } from '../constants/theme';
import type { CompanionState } from '../types/sekretCompanion';
import { SafeAsset } from '../components/SafeAsset';
import { AmbientWeatherOverlay } from '../components/AmbientWeatherOverlay';
import { useAmbientPlayer, AMBIENT_TRACKS, type AmbientKey } from '@/hooks/useAmbientPlayer';

const { width, height } = Dimensions.get('window');

const DEBUG_HOTSPOTS = false;

// ─── Types ────────────────────────────────────────────────────────────────────

// Character type imported from constants/theme (raylene | rylane | cloud | night)
type TimeOfDay  = 'morning' | 'day' | 'evening' | 'night';
type Pose =
  // shared baseline
  | 'neutral' | 'happy' | 'thinking' | 'writing' | 'window' | 'fullbody'
  // Raylene extended
  | 'confident' | 'playful' | 'sad' | 'mad' | 'surprised' | 'crouching'
  // Night extended
  | 'softsmile' | 'tired' | 'annoyed' | 'overwhelmed' | 'protective' | 'lonely'
  | 'hopeful' | 'relaxed' | 'listening' | 'hurting' | 'inhishead' | 'inlove';
type Mood       = 'Happy' | 'Sad' | 'Angry' | 'Tired' | 'Neutral' | string;

// RoomTarget kept as internal type for hotspot definitions.
// setScreen prop is widened to string to match index.tsx.
type RoomTarget =
  | 'home' | 'pages' | 'circle' | 'bippin2' | 'comfort' | 'calm'
  | 'voiceBip' | 'sekret' | 'cloudThoughts' | 'bridge' | 'parentBridge' | 's2tell'
  | 'settings' | 'more' | 'mindReset' | 'bodyReset' | 'periodCalendar' | 'dashboard'
  | 'companionPicker' | 'write' | 'goals' | 'memories' | 'music' | 'rewards' | 'vibeLab';

// Point-based invisible hotspot — position is the CENTER of the touch target.
// x/y are 0–1 fractions of screen width/height.
// Rendered BEHIND the bg image; bg uses pointerEvents="none" so taps fall through.
type RoomHotspot = {
  id:    string;
  x:     number;
  y:     number;
  route: RoomTarget;
  label: string;
  size?: number;   // touch target diameter, default 80
};

type AssetMap  = Record<TimeOfDay, ImageSourcePropType>;
type AvatarMap = Partial<Record<Pose, ImageSourcePropType>>;

// ─── Room / Avatar assets ─────────────────────────────────────────────────────

const ROOM_PHASE_OVERLAYS: Record<RoomPhase, string> = {
  day:       'rgba(255,225,180,0.08)',
  midday:    'rgba(255,210,140,0.10)',
  afternoon: 'rgba(200,130,60,0.12)',
  evening:   'rgba(91,45,120,0.18)',
  rain:      'rgba(35,85,125,0.30)',
  night:     'rgba(20,10,55,0.28)',
  deepNight: 'rgba(5,3,24,0.48)',
};

// Character-specific atmosphere tints layered on top of phase overlay.
// Cloud Room art is fully realized — no tint needed, art speaks for itself.
// Night Room art is already very dark — light deepening tint only.
const CHARACTER_OVERLAYS: Record<Character, string> = {
  raylene: 'transparent',
  rylane:  'transparent',
  cloud:   'transparent',
  night:   'rgba(6,2,22,0.25)',
};

const AVATARS: Record<Character, AvatarMap> = THEME_AVATARS as Record<Character, AvatarMap>;

const FALLBACK_AVATAR: Record<Character, ImageSourcePropType> = {
  raylene: IMAGES.rayleneNeutral,
  rylane:  IMAGES.rylaneNeutral,
  cloud:   IMAGES.cloudAvatarNeutral,
  night:   IMAGES.nightAvatarNeutral,
};

// ─── Hotspot maps ─────────────────────────────────────────────────────────────
// x/y = center of the touch target as a fraction of screen width/height (0–1).
// Hotspots render BEHIND the bg image; the image uses pointerEvents="none".
// No pulse rings, no hint labels — pure invisible CTAs.

const RAYLENE_HOTSPOTS: RoomHotspot[] = [
  { id: 'journal',     x: 0.52, y: 0.87, route: 'pages',        label: 'Journal'       },
  { id: 'bed',         x: 0.72, y: 0.58, route: 'comfort',       label: 'Bed'           },
  { id: 'cloudPillow', x: 0.60, y: 0.55, route: 'cloudThoughts', label: 'Cloud Pillow'  },
  { id: 'desk',        x: 0.24, y: 0.42, route: 'write',         label: 'Desk'          },
  { id: 'headphones',  x: 0.21, y: 0.84, route: 'voiceBip',      label: 'Headphones'    },
  { id: 'photos',      x: 0.82, y: 0.32, route: 'memories',      label: 'Photo Wall'    },
  { id: 'bookshelf',   x: 0.66, y: 0.42, route: 'rewards',       label: 'Bookshelf'     },
  { id: 'window',      x: 0.15, y: 0.18, route: 'vibeLab',       label: 'Window'        },
];

const RYLANE_HOTSPOTS: RoomHotspot[] = [
  { id: 'journal',    x: 0.52, y: 0.87, route: 'pages',        label: 'Journal'        },
  { id: 'bed',        x: 0.78, y: 0.52, route: 'comfort',       label: 'Bed'            },
  { id: 'headphones', x: 0.83, y: 0.70, route: 'voiceBip',      label: 'Headphones'     },
  { id: 'desk',       x: 0.26, y: 0.44, route: 'write',         label: 'Desk'           },
  { id: 'basketball', x: 0.60, y: 0.72, route: 'goals',         label: 'Basketball'     },
  { id: 'photos',     x: 0.70, y: 0.34, route: 'memories',      label: 'Photos'         },
  { id: 'cloudLamp',  x: 0.52, y: 0.28, route: 'cloudThoughts', label: 'Cloud Lamp'     },
  { id: 'jersey',     x: 0.76, y: 0.25, route: 'circle',        label: "SE'KRET Jersey" },
];

const CLOUD_HOTSPOTS: RoomHotspot[] = [
  { id: 'journal',      x: 0.52, y: 0.86, route: 'pages',        label: 'Journal'       },
  { id: 'cloudBed',     x: 0.60, y: 0.50, route: 'cloudThoughts', label: 'Bean Bag'     },
  { id: 'neonCloud',    x: 0.58, y: 0.25, route: 'comfort',       label: 'Neon Cloud'   },
  { id: 'desk',         x: 0.23, y: 0.48, route: 'write',         label: 'Desk'         },
  { id: 'recordPlayer', x: 0.92, y: 0.74, route: 'music',         label: 'Record Player' },
  { id: 'backpack',     x: 0.05, y: 0.82, route: 'memories',      label: 'Backpack'     },
  { id: 'bookshelf',    x: 0.94, y: 0.46, route: 'rewards',       label: 'Bookshelf'    },
  { id: 'cloudPhotos',  x: 0.78, y: 0.24, route: 'circle',        label: 'Photo Wall'   },
];

const NIGHT_HOTSPOTS: RoomHotspot[] = [
  { id: 'journal',      x: 0.50, y: 0.87, route: 'pages',        label: 'Journal'       },
  { id: 'moonChair',    x: 0.53, y: 0.43, route: 'cloudThoughts', label: 'Moon Chair'   },
  { id: 'microphone',   x: 0.88, y: 0.40, route: 'voiceBip',      label: 'Voice Bip'   },
  { id: 'recordPlayer', x: 0.92, y: 0.76, route: 'music',         label: 'Record Player' },
  { id: 'desk',         x: 0.25, y: 0.45, route: 'write',         label: 'Desk'         },
  { id: 'backpack',     x: 0.06, y: 0.84, route: 'memories',      label: 'Backpack'     },
  { id: 'candle',       x: 0.77, y: 0.90, route: 'comfort',       label: 'Candle'       },
  { id: 'bookshelf',    x: 0.94, y: 0.18, route: 'rewards',       label: 'Bookshelf'    },
];

// ─── Pure helpers (defined outside component — no recreation per render) ──────

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
};

const getPresenceLine = (character: Character, timeOfDay: TimeOfDay): string => {
  if (character === 'cloud') return timeOfDay === 'night' ? "Cloud's floating. Peaceful in here." : "Cloud Se'kret is nearby ☁️";
  if (character === 'night') return timeOfDay === 'night' ? "Night's here. Just us awake 🌙" : "Night Se'kret is around.";
  if (character === 'raylene') return timeOfDay === 'morning' ? 'Raylene is up. Morning energy 🌸' : 'Raylene is nearby 💜';
  return timeOfDay === 'night' ? 'Rylane is posted up. Late night mode.' : 'Rylane is around ⚡';
};

const getRoomCopy = (character: Character, timeOfDay: TimeOfDay): string => {
  const map: Record<Character, Record<TimeOfDay, string>> = {
    raylene: {
      morning: 'Morning light, real thoughts. Come sit \ud83c\udf38',
      day:     'Room open. Energy is alive today.',
      evening: 'Golden hour got the room feeling honest.',
      night:   "Heavy night or a good one \u2014 either way, the room's here.",
    },
    rylane: {
      morning: 'Early light, late thoughts. We move at your pace.',
      day:     "Room's awake. Let's get into it \u26a1",
      evening: 'Evening energy. Real talk or real rest \u2014 both valid.',
      night:   'Late night mode. Keep it low and real.',
    },
    cloud: {
      morning: 'Quiet in here \u2601\ufe0f brain dump whenever.',
      day:     'Cloud room is open. Let thoughts land or let joy settle.',
      evening: "Neon's on. Could be heavy. Could be glowing. Both welcome.",
      night:   "Just the cloud light and you. That's everything.",
    },
    night: {
      morning: 'The world is waking. You stayed up. Respect.',
      day:     'Day is loud. But this window stays open \ud83c\udf19',
      evening: 'Getting late. Good. This is our time.',
      night:   'Everybody asleep. Only us up. Stars out.',
    },
  };
  return map[character][timeOfDay];
};

const getPose = (
  mood: Mood,
  timeOfDay: TimeOfDay,
  isFirstVisit: boolean,
  isSekretVisible: boolean,
  character: Character,
): Pose => {
  if (isFirstVisit && isSekretVisible) return 'fullbody';

  const m = String(mood).toLowerCase();

  // ── Night: full 20-emotion palette ────────────────────────────────────────
  if (character === 'night') {
    if (m.includes('overwhelm') || m.includes('stress'))                       return 'overwhelmed';
    if (m.includes('hurt') || m.includes('broken') || m.includes('pain'))     return 'hurting';
    if (m.includes('sad') || m.includes('cry') || m.includes('griev'))        return 'sad';
    if (m.includes('lonel') || m.includes('alone') || m.includes('isolat'))   return 'lonely';
    if (m.includes('angry') || m.includes('mad') || m.includes('frustrat'))   return 'annoyed';
    if (m.includes('annoy') || m.includes('irritat'))                          return 'annoyed';
    if (m.includes('tired') || m.includes('exhaust') || m.includes('drain'))  return 'tired';
    if (m.includes('protect') || m.includes('defensiv') || m.includes('guard')) return 'protective';
    if (m.includes('hopeful') || m.includes('optimis') || m.includes('better')) return 'hopeful';
    if (m.includes('happy') || m.includes('good') || m.includes('great'))     return 'softsmile';
    if (m.includes('playful') || m.includes('fun') || m.includes('goofy'))    return 'playful';
    if (m.includes('excit') || m.includes('hype'))                             return 'playful';
    if (m.includes('love') || m.includes('crush') || m.includes('romantic') || m.includes('like')) return 'inlove';
    if (m.includes('relax') || m.includes('calm') || m.includes('peace') || m.includes('chill'))   return 'relaxed';
    if (m.includes('listen') || m.includes('music') || m.includes('headphone')) return 'listening';
    if (m.includes('think') || m.includes('confus') || m.includes('wonder'))  return 'thinking';
    if (m.includes('write') || m.includes('journal') || m.includes('note'))   return 'writing';
    if (m.includes('withdraw') || m.includes('dissociat') || m.includes('numb') || m.includes('disconn')) return 'inhishead';
    if (timeOfDay === 'night' || m.includes('late') || m.includes('window'))  return 'window';
    return 'neutral';
  }

  // ── Raylene: expanded 10-emotion palette ──────────────────────────────────
  if (character === 'raylene') {
    if (m.includes('overwhelm') || m.includes('stress') || m.includes('anxious')) return 'crouching';
    if (m.includes('sad') || m.includes('cry') || m.includes('hurt'))         return 'sad';
    if (m.includes('angry') || m.includes('mad') || m.includes('frustrat'))   return 'mad';
    if (m.includes('surpris') || m.includes('shock') || m.includes('wow'))    return 'surprised';
    if (m.includes('happy') || m.includes('good') || m.includes('great') || m.includes('excit')) return 'happy';
    if (m.includes('playful') || m.includes('fun') || m.includes('goofy'))    return 'playful';
    if (m.includes('confident') || m.includes('proud') || m.includes('strong') || m.includes('boss')) return 'confident';
    if (m.includes('tired') || m.includes('exhaust') || m.includes('drain'))  return 'crouching';
    if (m.includes('think') || m.includes('confus') || m.includes('wonder'))  return 'thinking';
    if (timeOfDay === 'night' || m.includes('late') || m.includes('quiet'))   return 'window';
    return 'neutral';
  }

  // ── Rylane: baseline palette (art not yet expanded) ───────────────────────
  if (character === 'rylane') {
    if (m.includes('happy') || m.includes('good') || m.includes('great'))     return 'happy';
    if (m.includes('think') || m.includes('confus') || m.includes('wonder') ||
        m.includes('sad') || m.includes('angry') || m.includes('tired'))      return 'thinking';
    if (timeOfDay === 'night')                                                  return 'window';
    return 'neutral';
  }

  // ── Cloud: mascot palette ─────────────────────────────────────────────────
  if (character === 'cloud') {
    if (m.includes('happy') || m.includes('good') || m.includes('excit'))     return 'happy';
    if (m.includes('think') || m.includes('focus') || m.includes('listen'))   return 'thinking';
    if (m.includes('tired') || m.includes('sleepy') || m.includes('exhaust')) return 'window'; // cloudSleepy
    if (m.includes('sad') || m.includes('storm') || m.includes('overwhelm'))  return 'writing'; // cloudStormy via writing key
    return 'neutral';
  }

  return 'neutral';
};

const getGreeting = (character: Character, mood: Mood, timeOfDay: TimeOfDay, isVisible: boolean): string => {
  const moodKey = String(mood).toLowerCase();

  // Cloud \u2014 observes, holds space, present for joy AND heaviness
  if (character === 'cloud') {
    if (moodKey.includes('glow') || moodKey.includes('loved') || moodKey.includes('proud')) return 'Something bright is in here today. I noticed \u2728';
    if (moodKey.includes('hyped') || moodKey.includes('excit'))  return 'High energy. This room can hold that too \u2601\uFE0F';
    if (moodKey.includes('grateful') || moodKey.includes('peace')) return 'Something settled in here. That\'s real.';
    if (moodKey.includes('sad'))   return 'Something feels heavy. You don\'t have to explain it.';
    if (moodKey.includes('tired')) return 'Tired. Yeah. Sit here for a bit. No pressure.';
    if (moodKey.includes('angry')) return 'It\'s loud out there. In here it\'s quiet.';
    if (moodKey.includes('happy')) return 'Something light is happening. I noticed.';
    if (timeOfDay === 'night')     return 'Late night brain dump \u2014 or late night glow? Either works.';
    return 'Brain loud or brain clear \u2014 both welcome here.';
  }

  // Night \u2014 2AM energy, present for stars AND storms
  if (character === 'night') {
    if (moodKey.includes('glow') || moodKey.includes('loved'))   return 'You\'re up late and you\'re okay tonight. I see that \uD83C\uDF19';
    if (moodKey.includes('hyped') || moodKey.includes('proud'))  return 'Late night energy hitting different. Let\'s stay in it.';
    if (moodKey.includes('grateful') || moodKey.includes('peace')) return 'Something quiet and good in here. Stars are out for a reason.';
    if (moodKey.includes('sad'))   return 'Still up because of it. I know.';
    if (moodKey.includes('tired')) return 'Exhausted but can\'t sleep. This window stays open.';
    if (moodKey.includes('angry')) return 'Something\'s burning. Let it sit here.';
    if (moodKey.includes('happy')) return 'You\'re up late and smiling. That\'s rare. Good.';
    if (timeOfDay === 'night')     return 'Just us. No performance required.';
    return 'The world is asleep. You found your way here.';
  }

  if (isVisible && timeOfDay === 'night') {
    return character === 'raylene'
      ? 'Come sit. We not doing the most tonight.'
      : 'Aight, you here now. Let\'s keep it real.';
  }

  // Raylene + Rylane \u2014 positive moods
  if (moodKey.includes('glow') || moodKey.includes('loved')) {
    return character === 'raylene'
      ? 'Look at you glowing \uD83C\uDF38 something good happened huh.'
      : 'Aye, I see you. That\'s a different energy today.';
  }
  if (moodKey.includes('hyped') || moodKey.includes('excit')) {
    return character === 'raylene'
      ? 'Okay okay OKAY. Tell me everything \uD83D\uDE2D'
      : 'Aye you hyped. I\'m hyped. What happened? \u26A1';
  }
  if (moodKey.includes('grateful') || moodKey.includes('peace')) {
    return character === 'raylene'
      ? 'Grateful energy looks good on you, fr.'
      : 'Grateful energy is rare. I see you though.';
  }
  if (moodKey.includes('proud')) {
    return character === 'raylene'
      ? 'That\'s the one. You should be proud \uD83D\uDCAA'
      : 'Aye, let\'s talk about the W. Real proud of you.';
  }

  // Heavy moods
  if (moodKey.includes('sad')) {
    return character === 'raylene'
      ? 'Come sit. I already know it\'s been a lot.'
      : 'Nah, I can tell something hit you. Talk to me.';
  }
  if (moodKey.includes('angry')) {
    return character === 'raylene'
      ? 'Hold on. Who got you like this?'
      : 'Okay, who irritated us today? \uD83D\uDE24';
  }
  if (moodKey.includes('tired')) {
    return character === 'raylene'
      ? 'You look tired-tired. Sit down.'
      : 'You been running on fumes huh. Rest your head.';
  }
  if (moodKey.includes('overwhelm') || moodKey.includes('anxious')) {
    return character === 'raylene'
      ? 'That\'s a lot to carry. Let\'s slow it down.'
      : 'One thing at a time. We got this.';
  }

  if (moodKey.includes('happy') || moodKey.includes('okay')) {
    return character === 'raylene'
      ? 'Look at you. Something good is happening.'
      : 'Aye, that energy. What\'s good?';
  }

  if (timeOfDay === 'morning') {
    return character === 'raylene'
      ? 'Morning. Tell me the real version of today.'
      : 'Morning check-in. What we on?';
  }
  if (timeOfDay === 'evening') {
    return character === 'raylene'
      ? 'Evening got truth in it. Start wherever.'
      : 'You made it to evening. That counts.';
  }
  if (timeOfDay === 'night') {
    return character === 'raylene'
      ? 'Late night in the room. You don\'t gotta carry it alone.'
      : 'Late night thoughts? Yeah, I figured.';
  }

  return character === 'raylene'
    ? 'Come sit. Tell me the real version.'
    : 'Aight. What we bippin about?';
};

const safeImage = (
  source: ImageSourcePropType | undefined,
  fallback: ImageSourcePropType
): ImageSourcePropType => source ?? fallback;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoomScreenProps {
  mood: Mood;
  selectedSekret: string;           // sekret key: 'soft' | 'rylane' | 'cloud' | 'night'
  setSelectedSekret: (value: string) => void;
  setScreen: (screen: string) => void;
  t: Record<string, any>;
  updateRoomMemory?: (patch: Record<string, any>) => void;
  vibe: VibeKey;
  BottomNav: React.ReactNode;
  companion?: CompanionState;
  sekretMode?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoomScreen({
  mood,
  selectedSekret,
  setSelectedSekret,
  setScreen,
  t,
  updateRoomMemory,
  vibe,
  BottomNav,
  companion,
  sekretMode,
}: RoomScreenProps) {

  const { activeTrack, play, isConfigured } = useAmbientPlayer();

  // ─── Derived ────────────────────────────────────────────────────────────
  const character: Character =
    selectedSekret === 'rylane' ? 'rylane' :
    selectedSekret === 'cloud'  ? 'cloud'  :
    selectedSekret === 'night'  ? 'night'  :
    'raylene';

  // Resolve the room once for the current visit. Always use the selected
  // character's room at the current time of day — rain vibe overrides time.
  const now = useMemo(() => new Date(), []);
  const timeOfDay = useMemo<TimeOfDay>(() => getTimeOfDay(), [now]);
  const roomPhase = useMemo(() => getRoomPhase(now, vibe === 'rain' ? 'rain' : undefined), [now, vibe]);
  const vibePack = THEME_PACKS[vibe];
  // Room background is always the character's own room at current phase,
  // keeping the world consistent regardless of cosmetic vibe choice.
  const roomImage = getRoomScene(character, roomPhase);

  const hotspots = useMemo(() => {
    if (character === 'rylane') return RYLANE_HOTSPOTS;
    if (character === 'cloud')  return CLOUD_HOTSPOTS;
    if (character === 'night')  return NIGHT_HOTSPOTS;
    return RAYLENE_HOTSPOTS;
  }, [character]);

  // ─── State ──────────────────────────────────────────────────────────────
  const [isSekretVisible, setIsSekretVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit]       = useState(true);  // persisted below
  const [greeting, setGreeting]               = useState(
    () => getGreeting(character, mood, timeOfDay, false)
  );

  const pose = getPose(mood, timeOfDay, isFirstVisit, isSekretVisible, character);

  const rememberedLine = useMemo(() => {
    if (!companion) return null;

    const repeatedMood = companion.checkIn?.id.includes('repeated-emotion');
    const moodKey = String(mood).toLowerCase();
    if (repeatedMood && moodKey.includes('tired')) {
      return "You've been calling a lot of things tired lately. I peeped that.";
    }
    if (repeatedMood && moodKey) {
      return `${mood} keeps pulling up lately. I remember.`;
    }

    const topic = companion.memorySummary.commonTopics[0];
    if (topic && companion.memorySummary.journalsWritten >= 2) {
      return `You keep circling back to ${topic}. We can stay with that part.`;
    }
    if (companion.memorySummary.streakDays >= 3) {
      return `You came back ${companion.memorySummary.streakDays} days straight. Lowkey proud of you.`;
    }
    if (companion.memorySummary.conversations >= 3) {
      return companion.presenceMessage;
    }
    return null;
  }, [companion, mood]);

  // ─── AsyncStorage: first-visit persistence ───────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('sekretbip_first_visit_done').then(done => {
      if (done === 'true') setIsFirstVisit(false);
    });
  }, []);

  // ─── Animations ─────────────────────────────────────────────────────────
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const greetAnim   = useRef(new Animated.Value(0)).current;
  const avatarAnim  = useRef(new Animated.Value(0)).current;
  const avatarSlide = useRef(new Animated.Value(14)).current;
  const avatarScale = useRef(new Animated.Value(0.96)).current;
  const glowAnim    = useRef(new Animated.Value(0.2)).current;
  const breathAnim  = useRef(new Animated.Value(0)).current;

  // Loop refs for cleanup
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Mount animations + loops
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 850, useNativeDriver: true }).start(() => {
      Animated.timing(greetAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    });

    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 1600, useNativeDriver: true }),
      ])
    );
    glowLoopRef.current.start();

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    );
    breathLoop.start();

    return () => {
      glowLoopRef.current?.stop();
      breathLoop.stop();
    };
  }, []);

  // Greeting updates on mood/character/time change
  useEffect(() => {
    setGreeting(getGreeting(character, mood, timeOfDay, isSekretVisible));
  }, [character, mood, timeOfDay, isSekretVisible]);

  // Avatar entrance / exit
  useEffect(() => {
    Animated.parallel([
      Animated.timing(avatarAnim, {
        toValue: isSekretVisible ? 1 : 0,
        duration: isSekretVisible ? 420 : 220,
        easing: isSekretVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(avatarSlide, {
        toValue: isSekretVisible ? 0 : 14,
        tension: 55, friction: 8, useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: isSekretVisible ? 1 : 0.96,
        tension: 60, friction: 9, useNativeDriver: true,
      }),
    ]).start();
  }, [isSekretVisible]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleHotspot = (target: RoomTarget) => {
    updateRoomMemory?.({ lastHotspot: target, lastVisit: new Date().toISOString() });
    setScreen(target);
  };

  // sekretKey maps Character → the key used in selectedSekret / SEKRET_PROFILES
  const sekretKey = (char: Character): string =>
    char === 'raylene' ? 'soft' : char;

  const handleCharacterSwitch = (char: Character) => {
    setSelectedSekret(sekretKey(char));
    setIsSekretVisible(false);
    updateRoomMemory?.({ character: char });
  };

  // ─── Derived display ──────────────────────────────────────────────────────

  const getPresence = () => {
    if (sekretMode === 'cloud') return 'Cloud is drifting through.';
    if (sekretMode === 'night') return 'Night mode is on.';
    if (isSekretVisible) return character === 'raylene' ? 'Raylene is nearby' : 'Rylane is posted up';
    if (isSekretVisible) {
      if (character === 'raylene') return 'Raylene is nearby';
      if (character === 'rylane')  return 'Rylane is posted up';
      if (character === 'cloud')   return 'Cloud is floating';
      return 'Night is here with you';
    }
    return getPresenceLine(character, timeOfDay);
  };

  const timeBadge = `${vibePack.emoji} ${vibePack.feeling}`;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Hotspot layer — invisible CTAs behind the bg image ─────────── */}
      {/* Rendered first so it sits below the bg in z-order.              */}
      {/* The bg uses pointerEvents="none", letting taps fall through.    */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {hotspots.map((spot) => (
          <TouchableOpacity
            key={spot.id}
            style={[
              {
                position: 'absolute',
                left: width * spot.x - (spot.size ?? 40),
                top: height * spot.y - (spot.size ?? 40),
                width: spot.size ?? 80,
                height: spot.size ?? 80,
              },
              DEBUG_HOTSPOTS && { backgroundColor: 'rgba(255,100,100,0.4)', borderWidth: 1, borderColor: 'red' },
            ]}
            onPress={() => handleHotspot(spot.route)}
            activeOpacity={0}
            accessibilityRole="button"
            accessibilityLabel={spot.label}
          />
        ))}
      </View>

      {/* ── Ambient weather — above hotspot layer, below bg ─────────────── */}
      <AmbientWeatherOverlay phase={roomPhase} />

      {/* ── Room background — visual only; taps pass through to hotspot layer ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]} pointerEvents="none">
        <SafeAsset
          source={roomImage}
          style={styles.bg}
          resizeMode="cover"
          assetName={`room-${character}-${roomPhase}`}
          fallbackColor="#1a0a2e"
          fillContainer
        />
        <View style={[styles.overlay, { backgroundColor: ROOM_PHASE_OVERLAYS[roomPhase] }]} />
        <View style={[styles.overlay, { backgroundColor: vibePack.background + '22' }]} />
        {CHARACTER_OVERLAYS[character] !== 'transparent' && (
          <View style={[styles.overlay, { backgroundColor: CHARACTER_OVERLAYS[character] }]} />
        )}
      </Animated.View>

      {/* Cloud Room: real art has cloud motifs — no emoji overlay needed */}

      {/* ── Night atmosphere — time badge ─────────────────────────────── */}
      {character === 'night' && (
        <View style={styles.nightTimeWrap} pointerEvents="none">
          <Text style={styles.nightTimeText}>
            {(() => {
              const now2 = new Date();
              const h = now2.getHours();
              const m = now2.getMinutes();
              const h12 = h % 12 || 12;
              const ampm = h >= 12 ? 'PM' : 'AM';
              return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
            })()}
          </Text>
          <Text style={styles.nightStars}>✦ ✧ ✦</Text>
        </View>
      )}

      {/* ── Avatar ──────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.avatarWrap,
          {
            opacity: avatarAnim,
            transform: [{ translateY: avatarSlide }, { scale: avatarScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={safeImage(AVATARS[character]?.[pose], FALLBACK_AVATAR[character])}
          style={styles.avatar}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessible={false}
        />
      </Animated.View>

      {/* Cloud mascot shortcut — only shown when not in Cloud identity mode */}
      {character !== 'cloud' && (
        <TouchableOpacity
          style={[styles.cloudPresence, { borderColor: vibePack.accent + '88' }]}
          onPress={() => setScreen('cloudThoughts')}
          accessibilityRole="button"
          accessibilityLabel="Cloud is here. Open Cloud Thoughts"
        >
          <Image source={IMAGES.cloudHappy} style={styles.cloudPresenceImage} resizeMode="contain" />
          <Text style={styles.cloudPresenceText}>Cloud's here</Text>
        </TouchableOpacity>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <View style={styles.topLeft}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{timeBadge}</Text>
          </View>
          {(sekretMode === 'cloud' || sekretMode === 'night') && (
            <View style={[styles.modeBadge, { backgroundColor: sekretMode === 'cloud' ? 'rgba(155,216,229,0.18)' : 'rgba(99,66,155,0.22)', borderColor: sekretMode === 'cloud' ? '#9bd8e5' : '#8b7bb8' }]}>
              <Text style={[styles.modeBadgeText, { color: sekretMode === 'cloud' ? '#9bd8e5' : '#c4b5fd' }]}>
                {sekretMode === 'cloud' ? "☁️ Cloud mode" : "🌙 Night mode"}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.myRoomBtn}
            onPress={() => setScreen('userRoom')}
            accessibilityRole="button"
            accessibilityLabel="Go to My Room"
          >
            <Text style={styles.myRoomBtnText}>✦ my room</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.characterToggle}>
          {(
            [
              { char: 'raylene' as Character, label: '💜 Raylene', active: styles.toggleBtnActivePink },
              { char: 'rylane'  as Character, label: '⚡ Rylane',  active: styles.toggleBtnActivePurple },
              { char: 'cloud'   as Character, label: '☁️ Cloud',   active: styles.toggleBtnActiveCloud },
              { char: 'night'   as Character, label: '🌙 Night',   active: styles.toggleBtnActiveNight },
            ] as const
          ).map(({ char, label, active }) => (
            <TouchableOpacity
              key={char}
              style={[styles.toggleBtn, character === char && active]}
              onPress={() => handleCharacterSwitch(char)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${char}`}
            >
              <Text style={styles.toggleText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── Presence pill ───────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.presencePill,
          {
            opacity: Animated.multiply(
              fadeAnim,
              breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] })
            ),
            transform: [{ scale: breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.presenceDot,
            {
              opacity: glowAnim,
              transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] }) }],
            },
          ]}
        />
        <Text style={styles.presenceText}>{getPresence()}</Text>
      </Animated.View>

      {/* ── Bottom content ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.bottomContent, { opacity: greetAnim }]}>

        {/* Greeting bubble */}
        <TouchableOpacity
          style={styles.greetingBubble}
          onPress={() => {
            setIsSekretVisible(v => {
              const next = !v;
              if (next && isFirstVisit) {
                setIsFirstVisit(false);
                AsyncStorage.setItem('sekretbip_first_visit_done', 'true');
              }
              updateRoomMemory?.({ lastSummon: new Date().toISOString(), character });
              return next;
            });
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isSekretVisible ? "Hide Se\u2019kret" : "Call Se\u2019kret"}
        >
          <Text style={styles.greetingChar}>
            {character === 'raylene' ? '💜 Raylene' :
             character === 'rylane'  ? '⚡ Rylane'  :
             character === 'cloud'   ? "☁️ Cloud Se'kret" :
                                       "🌙 Night Se'kret"}
          </Text>
          <Text style={styles.roomCopy}>{getRoomCopy(character, timeOfDay)}</Text>
          {!!rememberedLine && (
            <View style={styles.memoryTag}>
              <Text style={styles.memoryTagLabel}>I REMEMBER</Text>
              <Text style={styles.memoryTagText}>{rememberedLine}</Text>
            </View>
          )}
          <Text style={styles.greetingText}>"{rememberedLine || greeting}"</Text>
          <Text style={[styles.greetingTap, { color: t.soft }]}>
            {isSekretVisible ? 'tap to dismiss' : "tap to call Se\u2019kret"}
          </Text>
          {isSekretVisible ? (
            <TouchableOpacity
              style={[styles.roomCompanionButton, { borderColor: t.accent }]}
              onPress={() => setScreen('companionPicker')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open Se'kret companion picker"
            >
              <Text style={styles.roomCompanionButtonText}>talk to a companion →</Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Ambient jukebox — MySpace-era room music ─────────────── */}
          <View style={styles.ambientWrap}>
            {activeTrack && (
              <Text style={styles.ambientNowPlaying}>
                🎵 now playing · {AMBIENT_TRACKS[activeTrack].emoji} {AMBIENT_TRACKS[activeTrack].label}
              </Text>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ambientRow}
            >
              {(Object.keys(AMBIENT_TRACKS) as AmbientKey[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.ambientBtn,
                    activeTrack === key && styles.ambientBtnActive,
                    !isConfigured(key) && styles.ambientBtnDim,
                  ]}
                  onPress={() => play(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${AMBIENT_TRACKS[key].label} ambient`}
                >
                  <Text style={styles.ambientBtnText}>
                    {AMBIENT_TRACKS[key].emoji} {AMBIENT_TRACKS[key].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>

        {BottomNav}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:                  { flex: 1, backgroundColor: '#0d0014' },
  bg:                    { width, height },
  overlay:               { ...StyleSheet.absoluteFillObject },
  cloudPresence:         { position: 'absolute', top: Platform.OS === 'ios' ? 116 : 94, right: 18, width: 76, height: 76, borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(22,12,42,0.58)', alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  cloudPresenceImage:    { width: 47, height: 40 },
  cloudPresenceText:     { color: '#f3edff', fontSize: 9, fontWeight: '700', marginTop: -2 },

  hotspot:               { position: 'absolute' },
  hotspotGlow:           {
    borderRadius: 16,
    backgroundColor: 'rgba(244,114,182,0.08)',
    shadowColor: '#f472b6',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  hotspotDebug:          { borderWidth: 2, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.15)' },

  pulseRing:             {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
  },

  // Softer scrapbook-style hint card — warm cream sticky-note with a slight tilt
  tapHintWrap:           {
    position: 'absolute',
    top: -26,
    left: -2,
    backgroundColor: 'rgba(253,247,236,0.94)',
    borderColor: 'rgba(124,58,237,0.45)',
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#7c3aed',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tapHint:               {
    color: '#3b0764',
    fontSize: 10,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },

  avatarWrap:            {
    position: 'absolute',
    bottom: '21%',
    alignSelf: 'center',
    width: width * 0.56,
    height: height * 0.46,
    zIndex: 10,
  },
  avatar:                { width: '100%', height: '100%' },

  topBar:                {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft:               { flexDirection: 'column', gap: 6 },
  timeBadge:             {
    backgroundColor: 'rgba(13,0,20,0.68)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timeBadgeText:         { color: '#c4b5fd', fontSize: 12, fontWeight: '600' },
  modeBadge:             {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  modeBadgeText:         { fontSize: 11, fontWeight: '700' },
  myRoomBtn:             {
    backgroundColor: 'rgba(13,0,20,0.62)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.38)',
    alignSelf: 'flex-start',
  },
  myRoomBtnText:         { color: '#c4b5fd', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  characterToggle:       { flexDirection: 'row', gap: 8 },
  toggleBtn:             {
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(13,0,20,0.55)',
  },
  toggleBtnActivePink:   { backgroundColor: 'rgba(217,70,239,0.24)', borderColor: '#d946ef' },
  toggleBtnActivePurple: { backgroundColor: 'rgba(124,58,237,0.24)', borderColor: '#7c3aed' },
  toggleBtnActiveCloud:  { backgroundColor: 'rgba(155,185,255,0.28)', borderColor: '#9bb9ff' },
  toggleBtnActiveNight:  { backgroundColor: 'rgba(47,31,91,0.50)', borderColor: '#bbb7ef' },
  toggleText:            { color: '#f5f0ff', fontSize: 11, fontWeight: '700' },

  floatCloud:            { position: 'absolute' },

  nightTimeWrap:         {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 94,
    left: 18,
    alignItems: 'flex-start',
  },
  nightTimeText:         { color: 'rgba(187,183,239,0.75)', fontSize: 13, fontWeight: '300', letterSpacing: 1.5 },
  nightStars:            { color: 'rgba(187,183,239,0.45)', fontSize: 10, marginTop: 2, letterSpacing: 4 },

  presencePill:          {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 96 : 74,
    left: 16,
    backgroundColor: 'rgba(13,0,20,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  presenceDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d946ef' },
  presenceText:          { color: '#e9d5ff', fontSize: 11, fontWeight: '700' },

  bottomContent:         {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    paddingHorizontal: 16,
  },
  greetingBubble:        {
    backgroundColor: 'rgba(13,0,20,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.3)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  greetingChar:          { color: '#c4b5fd', fontSize: 11, fontWeight: '700', marginBottom: 5 },
  memoryTag:             { borderLeftWidth: 2, borderLeftColor: '#d8b4fe', paddingLeft: 9, marginTop: 8, marginBottom: 9 },
  memoryTagLabel:        { color: '#bca7d5', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginBottom: 3 },
  memoryTagText:         { color: '#f4eaff', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  roomCopy:              { color: '#f5f0ff', fontSize: 12, fontWeight: '700', opacity: 0.9, marginBottom: 6 },
  greetingText:          { color: '#f5f0ff', fontSize: 15, fontWeight: '600', lineHeight: 22, fontStyle: 'italic', marginBottom: 6 },
  roomCompanionButton: { marginTop: 10, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(17,24,39,0.72)' },
  roomCompanionButtonText: { color: '#f5f0ff', fontSize: 12, fontWeight: '800' },
  greetingTap:           { fontSize: 10, fontStyle: 'italic' },

  mainBtn:               {
    borderWidth: 1.5,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(13,0,20,0.75)',
    marginBottom: 10,
    shadowColor: '#d946ef',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  mainBtnText:           { fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

  controlRow:            { flexDirection: 'row', gap: 8, marginBottom: 10 },
  guideBtn:              {
    flex: 1,
    backgroundColor: 'rgba(13,0,20,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  guideBtnText:          { color: '#f5f0ff', fontSize: 11, fontWeight: '800' },

  quickRow:              { flexDirection: 'row', gap: 6, marginBottom: 10 },
  quickBtn:              {
    flex: 1,
    backgroundColor: 'rgba(13,0,20,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.25)',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickEmoji:            { fontSize: 16, marginBottom: 2 },
  quickLabel:            { color: '#E2E8F0', fontSize: 9, fontWeight: '700' },

  tagline:               { color: '#c4b5fd', fontSize: 12, textAlign: 'center', fontStyle: 'italic', opacity: 0.8 },

  // Ambient jukebox
  ambientWrap:           { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 8 },
  ambientNowPlaying:     { color: '#c4b5fd', fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6, opacity: 0.9 },
  ambientRow:            { gap: 6, paddingBottom: 2 },
  ambientBtn:            {
    backgroundColor:   'rgba(255,255,255,0.06)',
    borderWidth:       1,
    borderColor:       'rgba(196,181,253,0.2)',
    borderRadius:      16,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  ambientBtnActive:      {
    backgroundColor: 'rgba(167,139,250,0.22)',
    borderColor:     '#a78bfa',
  },
  ambientBtnDim:         { opacity: 0.38 },
  ambientBtnText:        { color: '#e9d5ff', fontSize: 11, fontWeight: '600' },
});
