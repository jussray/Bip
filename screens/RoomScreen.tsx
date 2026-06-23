import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

const { width, height } = Dimensions.get('window');

const DEBUG_HOTSPOTS = false;

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeOfDay  = 'morning' | 'day' | 'evening' | 'night';
type Pose =
  | 'neutral' | 'happy' | 'thinking' | 'writing' | 'window' | 'fullbody'
  | 'confident' | 'playful' | 'sad' | 'mad' | 'surprised' | 'crouching'
  | 'softsmile' | 'tired' | 'annoyed' | 'overwhelmed' | 'protective' | 'lonely'
  | 'hopeful' | 'relaxed' | 'listening' | 'hurting' | 'inhishead' | 'inlove';
type Mood       = 'Happy' | 'Sad' | 'Angry' | 'Tired' | 'Neutral' | string;

type RoomTarget =
  | 'home' | 'pages' | 'circle' | 'bippin2' | 'comfort' | 'calm'
  | 'voiceBip' | 'sekret' | 'cloudThoughts' | 'bridge' | 'parentBridge' | 's2tell'
  | 'settings' | 'more' | 'mindReset' | 'bodyReset' | 'periodCalendar' | 'dashboard'
  | 'companionPicker' | 'write' | 'goals' | 'memories' | 'music' | 'rewards' | 'vibeLab';

type RoomHotspot = {
  id:    string;
  x:     number;
  y:     number;
  route: RoomTarget;
  label: string;
  size?: number;
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

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
};

const getPresenceLine = (character: Character, timeOfDay: TimeOfDay): string => {
  if (character === 'cloud') return 'Cloud is drifting nearby.';
  if (character === 'night') return timeOfDay === 'night' ? 'Night is here. Just us awake.' : 'Night is watching over.';
  if (timeOfDay === 'night') return 'Cloud is floating around.';
  if (character === 'raylene') return 'Raylene is nearby.';
  return 'Rylane is posted up.';
};

const getGreeting = (character: Character, mood: Mood, timeOfDay: TimeOfDay, isVisible: boolean): string => {
  const moodKey = String(mood).toLowerCase();

  if (character === 'cloud') {
    if (moodKey.includes('sad'))   return 'Something feels heavy. You don\u2019t have to explain it.';
    if (moodKey.includes('tired')) return 'Tired. Yeah. Sit here for a bit. No pressure.';
    if (moodKey.includes('angry')) return 'It\u2019s loud out there. In here it\u2019s quiet.';
    if (moodKey.includes('happy')) return 'Something light is happening. I noticed.';
    if (timeOfDay === 'night')     return 'Late night brain dump? This is the spot.';
    return 'Brain loud? This is the brain dump room.';
  }

  if (character === 'night') {
    if (moodKey.includes('sad'))   return 'Still up because of it. I know.';
    if (moodKey.includes('tired')) return 'Exhausted but can\u2019t sleep. This window stays open.';
    if (moodKey.includes('angry')) return 'Something\u2019s burning. Let it sit here.';
    if (moodKey.includes('happy')) return 'You\u2019re up late and smiling. That\u2019s rare. Good.';
    if (timeOfDay === 'night')     return 'Just us. No performance required.';
    return 'The world is asleep. You found your way here.';
  }

  if (isVisible && timeOfDay === 'night') {
    return character === 'raylene'
      ? 'Come sit. We not doing the most tonight.'
      : 'Aight, you here now. Let\u2019s keep it real.';
  }

  if (moodKey.includes('sad')) {
    return character === 'raylene'
      ? 'Come sit. I already know it\u2019s been a lot.'
      : 'Nah, I can tell something hit you. Talk to me.';
  }
  if (moodKey.includes('angry')) {
    return character === 'raylene'
      ? 'Hold on. Who got you like this?'
      : 'Okay, who irritated us today? \uD83D\uDE12';
  }
  if (moodKey.includes('tired')) {
    return character === 'raylene'
      ? 'You look tired-tired. Sit down.'
      : 'You been running on fumes huh. Rest your head.';
  }
  if (moodKey.includes('happy')) {
    return character === 'raylene'
      ? 'Look at you. Something good happened.'
      : 'Aye, that face says good news.';
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
      ? 'Heavy night huh. You don\u2019t gotta carry it alone.'
      : 'Late night thoughts? Yeah, I figured.';
  }
  return character === 'raylene'
    ? 'Come sit. Tell me the real version.'
    : 'Aight. What we bippin about?';
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
    if (m.includes('love') || m.includes('crush') || m.includes('romantic'))  return 'inlove';
    if (m.includes('relax') || m.includes('calm') || m.includes('peace'))     return 'relaxed';
    if (m.includes('listen') || m.includes('music') || m.includes('headphone')) return 'listening';
    if (m.includes('think') || m.includes('confus') || m.includes('wonder'))  return 'thinking';
    if (m.includes('write') || m.includes('journal') || m.includes('note'))   return 'writing';
    if (m.includes('withdraw') || m.includes('dissociat') || m.includes('numb')) return 'inhishead';
    if (timeOfDay === 'night')                                                  return 'window';
    return 'neutral';
  }

  if (character === 'raylene') {
    if (m.includes('overwhelm') || m.includes('stress') || m.includes('anxious')) return 'crouching';
    if (m.includes('sad') || m.includes('cry') || m.includes('hurt'))         return 'sad';
    if (m.includes('angry') || m.includes('mad') || m.includes('frustrat'))   return 'mad';
    if (m.includes('surpris') || m.includes('shock') || m.includes('wow'))    return 'surprised';
    if (m.includes('happy') || m.includes('good') || m.includes('great') || m.includes('excit')) return 'happy';
    if (m.includes('playful') || m.includes('fun') || m.includes('goofy'))    return 'playful';
    if (m.includes('confident') || m.includes('proud') || m.includes('strong')) return 'confident';
    if (m.includes('tired') || m.includes('exhaust') || m.includes('drain'))  return 'crouching';
    if (m.includes('think') || m.includes('confus') || m.includes('wonder'))  return 'thinking';
    if (timeOfDay === 'night')                                                  return 'window';
    return 'neutral';
  }

  if (character === 'rylane') {
    if (m.includes('happy') || m.includes('good') || m.includes('great'))     return 'happy';
    if (m.includes('think') || m.includes('confus') || m.includes('wonder') ||
        m.includes('sad') || m.includes('angry') || m.includes('tired'))      return 'thinking';
    if (timeOfDay === 'night')                                                  return 'window';
    return 'neutral';
  }

  if (character === 'cloud') {
    if (m.includes('happy') || m.includes('good') || m.includes('excit'))     return 'happy';
    if (m.includes('think') || m.includes('focus') || m.includes('listen'))   return 'thinking';
    if (m.includes('tired') || m.includes('sleepy') || m.includes('exhaust')) return 'window';
    if (m.includes('sad') || m.includes('storm') || m.includes('overwhelm'))  return 'writing';
    return 'neutral';
  }

  return 'neutral';
};

const safeImage = (
  source: ImageSourcePropType | undefined,
  fallback: ImageSourcePropType
): ImageSourcePropType => source ?? fallback;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoomScreenProps {
  mood: Mood;
  selectedSekret: string;
  setSelectedSekret: (value: string) => void;
  setScreen: (screen: string) => void;
  t: Record<string, any>;
  updateRoomMemory?: (patch: Record<string, any>) => void;
  vibe: VibeKey;
  BottomNav: React.ReactNode;
  companion?: CompanionState;
  sekretMode?: string;
  // optional: last journal entry preview for "continue" CTA
  lastEntryPreview?: { companionName: string; snippet: string } | null;
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
  lastEntryPreview,
}: RoomScreenProps) {

  const character: Character =
    selectedSekret === 'rylane' ? 'rylane' :
    selectedSekret === 'cloud'  ? 'cloud'  :
    selectedSekret === 'night'  ? 'night'  :
    'raylene';

  const now        = useMemo(() => new Date(), []);
  const timeOfDay  = useMemo<TimeOfDay>(() => getTimeOfDay(), [now]);
  const roomPhase  = useMemo(() => getRoomPhase(now, vibe === 'rain' ? 'rain' : undefined), [now, vibe]);
  const vibePack   = THEME_PACKS[vibe];
  const roomImage  = getRoomScene(character, roomPhase);

  const hotspots = useMemo(() => {
    if (character === 'rylane') return RYLANE_HOTSPOTS;
    if (character === 'cloud')  return CLOUD_HOTSPOTS;
    if (character === 'night')  return NIGHT_HOTSPOTS;
    return RAYLENE_HOTSPOTS;
  }, [character]);

  // ─── State ──────────────────────────────────────────────────────────────
  const [isSekretVisible, setIsSekretVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit]       = useState(true);
  const [greeting, setGreeting]               = useState(
    () => getGreeting(character, mood, timeOfDay, false)
  );

  const pose = getPose(mood, timeOfDay, isFirstVisit, isSekretVisible, character);

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

  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

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

  useEffect(() => {
    setGreeting(getGreeting(character, mood, timeOfDay, isSekretVisible));
  }, [character, mood, timeOfDay, isSekretVisible]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(avatarAnim, {
        toValue: isSekretVisible ? 1 : 0,
        duration: isSekretVisible ? 420 : 220,
        easing: isSekretVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(avatarSlide, { toValue: isSekretVisible ? 0 : 14, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: isSekretVisible ? 1 : 0.96, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [isSekretVisible]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleHotspot = (target: RoomTarget) => {
    updateRoomMemory?.({ lastHotspot: target, lastVisit: new Date().toISOString() });
    setScreen(target);
  };

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
    if (isSekretVisible) {
      if (character === 'raylene') return 'Raylene is nearby';
      if (character === 'rylane')  return 'Rylane is posted up';
      if (character === 'cloud')   return 'Cloud is floating';
      return 'Night is here with you';
    }
    return getPresenceLine(character, timeOfDay);
  };

  const companionLabel =
    character === 'raylene' ? '💜 Raylene' :
    character === 'rylane'  ? '⚡ Rylane'  :
    character === 'cloud'   ? "☁️ Cloud"   :
                              "🌙 Night";

  const timeBadge = `${vibePack.emoji} ${vibePack.feeling}`;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Invisible hotspot layer — behind the bg image ──────────────── */}
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

      {/* ── Ambient weather ─────────────────────────────────────────────── */}
      <AmbientWeatherOverlay phase={roomPhase} />

      {/* ── Room background — full screen, taps pass through ────────────── */}
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
        {/* Bottom gradient so CTAs stay readable without covering the art */}
        <View style={styles.bottomGradient} pointerEvents="none" />
      </Animated.View>

      {/* ── Companion avatar (summon animation) ─────────────────────────── */}
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

      {/* ── Top bar: time badge + character switcher ─────────────────────── */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <View style={styles.topLeft}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{timeBadge}</Text>
          </View>
          {(sekretMode === 'cloud' || sekretMode === 'night') && (
            <View style={[
              styles.modeBadge,
              {
                backgroundColor: sekretMode === 'cloud' ? 'rgba(155,216,229,0.18)' : 'rgba(99,66,155,0.22)',
                borderColor: sekretMode === 'cloud' ? '#9bd8e5' : '#8b7bb8',
              }
            ]}>
              <Text style={[styles.modeBadgeText, { color: sekretMode === 'cloud' ? '#9bd8e5' : '#c4b5fd' }]}>
                {sekretMode === 'cloud' ? "☁️ Cloud mode" : "🌙 Night mode"}
              </Text>
            </View>
          )}
        </View>

        {/* Companion switcher */}
        <View style={styles.characterToggle}>
          {(
            [
              { char: 'raylene' as Character, label: '💜', active: styles.toggleBtnActivePink },
              { char: 'rylane'  as Character, label: '⚡', active: styles.toggleBtnActivePurple },
              { char: 'cloud'   as Character, label: '☁️', active: styles.toggleBtnActiveCloud },
              { char: 'night'   as Character, label: '🌙', active: styles.toggleBtnActiveNight },
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

      {/* ── Presence pill (breathing) ────────────────────────────────────── */}
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
        pointerEvents="none"
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

      {/* ── Night time badge ─────────────────────────────────────────────── */}
      {character === 'night' && (
        <View style={styles.nightTimeWrap} pointerEvents="none">
          <Text style={styles.nightTimeText}>
            {(() => {
              const h = now.getHours();
              const m = now.getMinutes();
              const h12 = h % 12 || 12;
              const ampm = h >= 12 ? 'PM' : 'AM';
              return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
            })()}
          </Text>
          <Text style={styles.nightStars}>✦ ✧ ✦</Text>
        </View>
      )}

      {/* ── Bottom CTAs — float over bottom gradient, never over the art ── */}
      <Animated.View style={[styles.bottomContent, { opacity: greetAnim }]}>

        {/* ── "Continue where you left off" — shown when entries exist ── */}
        {lastEntryPreview && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => setScreen('pages')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue your last conversation"
          >
            <Text style={[styles.continueName, { color: t.accent ?? '#c4b5fd' }]}>
              {lastEntryPreview.companionName} remembered something
            </Text>
            <Text style={styles.continueSnippet} numberOfLines={1}>
              "{lastEntryPreview.snippet}"
            </Text>
            <Text style={[styles.continueArrow, { color: t.soft ?? '#c4b5fd' }]}>continue →</Text>
          </TouchableOpacity>
        )}

        {/* ── Primary CTA: Talk to companion ──────────────────────────── */}
        <TouchableOpacity
          style={[styles.primaryBtn, { borderColor: t.accent ?? '#d946ef' }]}
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
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={isSekretVisible ? 'Open Pages' : `Talk to ${character}`}
        >
          <Text style={[styles.primaryBtnText, { color: '#fff' }]}>
            {isSekretVisible
              ? `open pages with ${companionLabel}`
              : `talk to ${companionLabel}`}
          </Text>
          {!isSekretVisible && (
            <Text style={[styles.primaryBtnSub, { color: t.soft ?? '#c4b5fd' }]}>
              "{greeting}"
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Secondary quick-action row ───────────────────────────────── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => setScreen('voiceBip')}
            accessibilityRole="button"
            accessibilityLabel="Voice Bip"
          >
            <Text style={styles.quickEmoji}>🎙️</Text>
            <Text style={styles.quickLabel}>voice bip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => setScreen('calm')}
            accessibilityRole="button"
            accessibilityLabel="Calm"
          >
            <Text style={styles.quickEmoji}>🌬️</Text>
            <Text style={styles.quickLabel}>calm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => setScreen('circle')}
            accessibilityRole="button"
            accessibilityLabel="Circle"
          >
            <Text style={styles.quickEmoji}>💬</Text>
            <Text style={styles.quickLabel}>circle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => setScreen('more')}
            accessibilityRole="button"
            accessibilityLabel="More"
          >
            <Text style={styles.quickEmoji}>✦</Text>
            <Text style={styles.quickLabel}>more</Text>
          </TouchableOpacity>
        </View>

        {BottomNav}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0d0014' },
  bg:      { width, height },
  overlay: { ...StyleSheet.absoluteFillObject },

  // Soft gradient at the bottom so CTAs read without covering room art
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.38,
    backgroundColor: 'transparent',
    // expo-linear-gradient not available in RoomScreen — simulate with semi-transparent
    // view layered on top. Real gradient added via LinearGradient in room.tsx if desired.
    background: 'linear-gradient(to top, rgba(13,0,20,0.82), transparent)',
  },

  // Avatar
  avatarWrap: {
    position: 'absolute',
    bottom: '21%',
    alignSelf: 'center',
    width: width * 0.56,
    height: height * 0.46,
    zIndex: 10,
  },
  avatar: { width: '100%', height: '100%' },

  // Top bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft:      { flexDirection: 'column', gap: 6 },
  timeBadge:    { backgroundColor: 'rgba(13,0,20,0.68)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  timeBadgeText:{ color: '#c4b5fd', fontSize: 12, fontWeight: '600' },
  modeBadge:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  modeBadgeText:{ fontSize: 11, fontWeight: '700' },

  // Companion switcher — emoji-only pills, compact
  characterToggle: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.35)',
    borderRadius: 18,
    backgroundColor: 'rgba(13,0,20,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActivePink:   { backgroundColor: 'rgba(217,70,239,0.28)', borderColor: '#d946ef' },
  toggleBtnActivePurple: { backgroundColor: 'rgba(124,58,237,0.28)', borderColor: '#7c3aed' },
  toggleBtnActiveCloud:  { backgroundColor: 'rgba(155,185,255,0.28)', borderColor: '#9bb9ff' },
  toggleBtnActiveNight:  { backgroundColor: 'rgba(47,31,91,0.55)', borderColor: '#bbb7ef' },
  toggleText: { fontSize: 18 },

  // Presence pill
  presencePill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 96 : 74,
    left: 16,
    backgroundColor: 'rgba(13,0,20,0.70)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  presenceDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d946ef' },
  presenceText: { color: '#e9d5ff', fontSize: 11, fontWeight: '700' },

  // Night time
  nightTimeWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 94,
    right: 18,
    alignItems: 'flex-end',
  },
  nightTimeText: { color: 'rgba(187,183,239,0.75)', fontSize: 13, fontWeight: '300', letterSpacing: 1.5 },
  nightStars:    { color: 'rgba(187,183,239,0.45)', fontSize: 10, marginTop: 2, letterSpacing: 4 },

  // Bottom CTA area
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingHorizontal: 16,
    gap: 10,
  },

  // "Continue" chip — subtle, appears above primary CTA
  continueBtn: {
    backgroundColor: 'rgba(13,0,20,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.22)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  continueName:    { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 3 },
  continueSnippet: { color: '#f0eaff', fontSize: 12, fontStyle: 'italic', lineHeight: 17 },
  continueArrow:   { fontSize: 10, fontWeight: '800', marginTop: 5, alignSelf: 'flex-end' },

  // Primary CTA button
  primaryBtn: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(13,0,20,0.80)',
    alignItems: 'center',
    shadowColor: '#d946ef',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  primaryBtnSub:  { fontSize: 12, fontStyle: 'italic', marginTop: 5, textAlign: 'center', opacity: 0.85 },

  // Quick-action row
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    backgroundColor: 'rgba(13,0,20,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.22)',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 3,
  },
  quickEmoji: { fontSize: 18 },
  quickLabel: { color: '#d4c9e8', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
});
