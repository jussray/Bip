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
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const DEBUG_HOTSPOTS = false;

// ─── Types ────────────────────────────────────────────────────────────────────

type Character  = 'raylene' | 'rylane';
type TimeOfDay  = 'morning' | 'day' | 'evening' | 'night';
type Pose       = 'neutral' | 'happy' | 'thinking' | 'writing' | 'window' | 'fullbody';
type Mood       = 'Happy' | 'Sad' | 'Angry' | 'Tired' | 'Neutral' | string;

// RoomTarget kept as internal type for hotspot definitions.
// setScreen prop is widened to string to match index.tsx.
type RoomTarget =
  | 'home' | 'pages' | 'circle' | 'bippin2' | 'comfort' | 'calm'
  | 'voiceBip' | 'sekret' | 'cloudThoughts' | 'bridge' | 'parentBridge'
  | 'settings' | 'more' | 'mindReset' | 'bodyReset' | 'periodCalendar';

type Hotspot = {
  id: string;
  label: string;
  target: RoomTarget;
  style: ViewStyle;
  hint?: string;
  pulse?: boolean;
};

type AssetMap  = Record<TimeOfDay, ImageSourcePropType>;
type AvatarMap = Record<Pose, ImageSourcePropType>;

// ─── Room / Avatar assets ─────────────────────────────────────────────────────

const ROOMS: Record<Character, AssetMap> = {
  raylene: {
    morning: IMAGES.bgRayleneRoomDay,
    day:     IMAGES.bgRayleneRoomDay,
    evening: IMAGES.roomBgDark,
    night:   IMAGES.bgRayleneRoomNight,
  },
  rylane: {
    morning: IMAGES.bgRylaneRoomDay,
    day:     IMAGES.bgRylaneRoomDay,
    evening: IMAGES.roomBgDark,
    night:   IMAGES.bgRylaneRoomNight,
  },
};

const AVATARS: Record<Character, AvatarMap> = {
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
};

const FALLBACK_ROOM: Record<Character, ImageSourcePropType> = {
  raylene: IMAGES.bgRayleneRoomDay,
  rylane:  IMAGES.bgRylaneRoomDay,
};

const FALLBACK_AVATAR: Record<Character, ImageSourcePropType> = {
  raylene: IMAGES.rayleneNeutral,
  rylane:  IMAGES.rylaneNeutral,
};

// ─── Hotspot maps ─────────────────────────────────────────────────────────────
// Fixed: cloudThoughts hotspots now target 'cloudThoughts' (was incorrectly 'calm')
// Fixed: Se'kret apostrophe in hint strings — use escaped version

const RAYLENE_HOTSPOTS: Hotspot[] = [
  {
    id: 'pages',
    label: 'Journal 📖',
    target: 'pages',
    hint: 'tap the journal',
    pulse: true,
    style: { bottom: '10%', left: '14%', width: '36%', height: '18%' },
  },
  {
    id: 'voiceBip',
    label: 'Headphones 🎙️',
    target: 'voiceBip',
    hint: 'tap headphones',
    style: { bottom: '14%', left: '2%', width: '18%', height: '12%' },
  },
  {
    id: 'cloudThoughts',
    label: 'Cloud Lamp ☁️',
    target: 'cloudThoughts',
    hint: 'tap the cloud',
    pulse: true,
    style: { top: '38%', left: '26%', width: '14%', height: '12%' },
  },
  {
    id: 'comfort',
    label: 'Bed 🌙',
    target: 'comfort',
    hint: 'tap the bed',
    style: { top: '38%', right: '6%', width: '34%', height: '34%' },
  },
  {
    id: 'bippin2',
    label: 'Growth Board ⭐',
    target: 'bippin2',
    hint: 'tap the board',
    style: { top: '4%', left: '22%', width: '24%', height: '26%' },
  },
  {
    id: 'circle',
    label: 'Photo Wall 🌐',
    target: 'circle',
    hint: 'tap the wall',
    style: { top: '4%', right: '0%', width: '18%', height: '55%' },
  },
  {
    id: 'calm',
    label: 'Window 🌤️',
    target: 'calm',
    hint: 'tap the window',
    pulse: true,
    style: { top: '4%', left: '0%', width: '18%', height: '50%' },
  },
  {
    id: 'summon',
    label: "Se’kret 💜",
    target: 'sekret',
    hint: "call Se’kret",
    style: { top: '38%', left: '4%', width: '20%', height: '30%' },
  },
];

const RYLANE_HOTSPOTS: Hotspot[] = [
  {
    id: 'pages',
    label: 'Journal 📖',
    target: 'pages',
    hint: 'tap the journal',
    pulse: true,
    style: { bottom: '8%', left: '18%', width: '38%', height: '20%' },
  },
  {
    id: 'voiceBip',
    label: 'Headphones 🎙️',
    target: 'voiceBip',
    hint: 'tap headphones',
    style: { top: '40%', left: '28%', width: '14%', height: '10%' },
  },
  {
    id: 'cloudThoughts',
    label: 'Cloud Neon ☁️',
    target: 'cloudThoughts',
    hint: 'tap the cloud',
    pulse: true,
    style: { top: '26%', left: '36%', width: '14%', height: '12%' },
  },
  {
    id: 'comfort',
    label: 'Bed 🌙',
    target: 'comfort',
    hint: 'tap the bed',
    style: { top: '36%', right: '6%', width: '36%', height: '36%' },
  },
  {
    id: 'bippin2',
    label: 'Growth Board ⭐',
    target: 'bippin2',
    hint: 'tap the board',
    style: { top: '2%', left: '26%', width: '24%', height: '28%' },
  },
  {
    id: 'circle',
    label: 'Photo Wall 🌐',
    target: 'circle',
    hint: 'tap the wall',
    style: { top: '2%', right: '0%', width: '20%', height: '50%' },
  },
  {
    id: 'calm',
    label: 'Window 🌤️',
    target: 'calm',
    hint: 'tap the window',
    pulse: true,
    style: { top: '2%', left: '0%', width: '20%', height: '55%' },
  },
  {
    id: 'summon',
    label: "Se’kret ⚡",
    target: 'sekret',
    hint: "call Se’kret",
    style: { top: '30%', left: '2%', width: '24%', height: '36%' },
  },
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
  if (timeOfDay === 'night') return 'Cloud is floating around.';
  if (character === 'raylene') return 'Raylene is nearby.';
  return 'Rylane is posted up.';
};

const getRoomCopy = (character: Character, timeOfDay: TimeOfDay): string => {
  const map: Record<Character, Record<TimeOfDay, string>> = {
    raylene: {
      morning: 'Soft light. Quiet thoughts. Come sit.',
      day:     'Room open. Energy low-key alive.',
      evening: 'Golden hour got the room feeling honest.',
      night:   "Heavy night. The room's still here with you.",
    },
    rylane: {
      morning: 'Early light, late thoughts. We move gentle.',
      day:     "Room's awake. Let's get into it.",
      evening: 'Evening\u2019s here. That means real talk time.',
      night:   'Late night mode. Keep it low and real.',
    },
  };
  return map[character][timeOfDay];
};

const getPose = (mood: Mood, timeOfDay: TimeOfDay, isFirstVisit: boolean, isSekretVisible: boolean): Pose => {
  if (isFirstVisit && isSekretVisible) return 'fullbody';
  if (timeOfDay === 'night' || mood === 'Sad' || mood === 'Tired') return 'window';
  if (mood === 'Happy') return 'happy';
  if (mood === 'Angry') return 'thinking';
  return 'neutral';
};

const getGreeting = (character: Character, mood: Mood, timeOfDay: TimeOfDay, isVisible: boolean): string => {
  const moodKey = String(mood).toLowerCase();

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

const safeImage = (
  source: ImageSourcePropType | undefined,
  fallback: ImageSourcePropType
): ImageSourcePropType => source ?? fallback;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoomScreenProps {
  mood: Mood;
  selectedSekret: Character;
  setSelectedSekret: (value: Character) => void;
  setScreen: (screen: string) => void;   // widened to string — matches index.tsx
  t: Record<string, any>;
  updateRoomMemory?: (patch: Record<string, any>) => void;  // Supabase/RoomMemory hook
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoomScreen({
  mood,
  selectedSekret,
  setSelectedSekret,
  setScreen,
  t,
  updateRoomMemory,
}: RoomScreenProps) {

  // ─── Derived ────────────────────────────────────────────────────────────
  const character: Character = selectedSekret === 'rylane' ? 'rylane' : 'raylene';

  // timeOfDay calculated once per mount (doesn't change during a session)
  const timeOfDay = useMemo<TimeOfDay>(() => getTimeOfDay(), []);

  const roomImage = useMemo(
    () => safeImage(ROOMS[character]?.[timeOfDay], FALLBACK_ROOM[character]),
    [character, timeOfDay]
  );

  const hotspots = useMemo(
    () => character === 'rylane' ? RYLANE_HOTSPOTS : RAYLENE_HOTSPOTS,
    [character]
  );

  // ─── State ──────────────────────────────────────────────────────────────
  const [isSekretVisible, setIsSekretVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit]       = useState(true);  // persisted below
  const [showGuide, setShowGuide]             = useState(false);
  const [hintSpot, setHintSpot]               = useState<string | null>(null);
  const [greeting, setGreeting]               = useState(
    () => getGreeting(character, mood, timeOfDay, false)
  );

  const pose = getPose(mood, timeOfDay, isFirstVisit, isSekretVisible);

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
  const guideAnim   = useRef(new Animated.Value(0)).current;
  const hintAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(0)).current;
  // Slow ambient breath used by the presence pill at the bottom of the room.
  // Subtle, infinite loop driven by the existing breath effect in the screen.
  const breathAnim  = useRef(new Animated.Value(0)).current;

  // Loop refs for cleanup
  const glowLoopRef  = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

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

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current.start();

    // Slow ambient breath for the presence pill
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    );
    breathLoop.start();

    // Auto hint on first load
    const guideTimer = setTimeout(() => {
      setHintSpot('pages');
      setTimeout(() => setHintSpot(null), 1800);
    }, 700);

    return () => {
      clearTimeout(guideTimer);
      glowLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      breathLoop.stop();
    };
  }, []);

  // ─── hintAnim drives hint opacity — now actually wired ──────────────────
  // FIXED: hintAnim was never started; hint was permanently invisible
  useEffect(() => {
    if (hintSpot) {
      Animated.timing(hintAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    } else {
      Animated.timing(hintAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [hintSpot]);

  // Greeting updates on mood/character/time change
  useEffect(() => {
    setGreeting(getGreeting(character, mood, timeOfDay, isSekretVisible));
  }, [character, mood, timeOfDay, isSekretVisible]);

  // Guide overlay fade
  useEffect(() => {
    if (showGuide) {
      Animated.timing(guideAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        setShowGuide(false);
        Animated.timing(guideAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showGuide]);

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
    if (target === 'sekret') {
      setIsSekretVisible(v => {
        const next = !v;
        // First time summoning — mark first visit done
        if (next && isFirstVisit) {
          setIsFirstVisit(false);
          AsyncStorage.setItem('sekretbip_first_visit_done', 'true');
        }
        updateRoomMemory?.({ lastSummon: new Date().toISOString(), character });
        return next;
      });
      setHintSpot('summon');
      setTimeout(() => setHintSpot(null), 1200);
      return;
    }
    updateRoomMemory?.({ lastHotspot: target, lastVisit: new Date().toISOString() });
    setScreen(target);
  };

  const handleCharacterSwitch = (char: Character) => {
    setSelectedSekret(char);
    setIsSekretVisible(false);
    setHintSpot('summon');
    setTimeout(() => setHintSpot(null), 1500);  // FIXED: hint was never cleared on toggle
    updateRoomMemory?.({ character: char });
  };

  // ─── Derived display ──────────────────────────────────────────────────────

  const getPresence = () => {
    if (isSekretVisible) return character === 'raylene' ? 'Raylene is nearby' : 'Rylane is posted up';
    return getPresenceLine(character, timeOfDay);
  };

  const timeBadge = {
    morning: '☀️ morning',
    day:     '🌤️ afternoon',
    evening: '🌆 evening',
    night:   '🌙 late night',
  }[timeOfDay];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Room background ─────────────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        <Image
          source={roomImage}
          style={styles.bg}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onError={() => undefined}
        />
        <View style={styles.overlay} />
      </Animated.View>

      {/* ── Hotspots ────────────────────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        {hotspots.map((spot) => {
          const isHinted    = hintSpot === spot.id;
          const showTapHint = isHinted || (spot.pulse && showGuide);

          return (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.hotspot,
                spot.style,
                DEBUG_HOTSPOTS && styles.hotspotDebug,
                showTapHint && styles.hotspotGlow,
              ]}
              onPress={() => handleHotspot(spot.target)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={spot.label}
            >
              {/* Pulse ring for pulse hotspots */}
              {spot.pulse && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.pulseRing,
                    {
                      opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                      transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
                      borderColor: t.accent,
                    },
                  ]}
                />
              )}

              {/* Tap hint label — FIXED: now actually visible via hintAnim useEffect */}
              {showTapHint && !DEBUG_HOTSPOTS && (
                <Animated.View
                  style={[
                    styles.tapHintWrap,
                    {
                      opacity: hintAnim,
                      transform: [{ translateY: hintAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
                    },
                  ]}
                >
                  <Text style={styles.tapHint}>{spot.hint ?? 'Tap'}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

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

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{timeBadge}</Text>
        </View>

        <View style={styles.characterToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, character === 'raylene' && styles.toggleBtnActivePink]}
            onPress={() => handleCharacterSwitch('raylene')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Raylene"
          >
            <Text style={styles.toggleText}>💜 Raylene</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, character === 'rylane' && styles.toggleBtnActivePurple]}
            onPress={() => handleCharacterSwitch('rylane')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Rylane"
          >
            <Text style={styles.toggleText}>⚡ Rylane</Text>
          </TouchableOpacity>
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
            setIsSekretVisible(v => !v);
            setHintSpot('summon');
            setTimeout(() => setHintSpot(null), 1200);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isSekretVisible ? "Hide Se\u2019kret" : "Call Se\u2019kret"}
        >
          <Text style={styles.greetingChar}>
            {character === 'raylene' ? '💜 Raylene' : '⚡ Rylane'}
          </Text>
          <Text style={styles.roomCopy}>{getRoomCopy(character, timeOfDay)}</Text>
          <Text style={styles.greetingText}>"{greeting}"</Text>
          <Text style={[styles.greetingTap, { color: t.soft }]}>
            {isSekretVisible ? 'tap to dismiss' : "tap to call Se\u2019kret"}
          </Text>
        </TouchableOpacity>

        {/* Drop a Bip CTA */}
        <TouchableOpacity
          style={[styles.mainBtn, { borderColor: t.accent }]}
          onPress={() => setScreen('sekret')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Drop a Bip"
        >
          <Text style={[styles.mainBtnText, { color: t.accent }]}>
            Drop a Bip {character === 'raylene' ? '💜' : '⚡'}
          </Text>
        </TouchableOpacity>

        {/* Control row */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.guideBtn}
            onPress={() => {
              setShowGuide(true);
              setHintSpot('pages');
              setTimeout(() => setHintSpot(null), 2000);
            }}
            accessibilityRole="button"
            accessibilityLabel="Room Guide"
          >
            <Text style={styles.guideBtnText}>Room Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideBtn}
            onPress={() => setHintSpot(prev => prev ? null : 'pages')}
            accessibilityRole="button"
            accessibilityLabel="Tap hint"
          >
            <Text style={styles.guideBtnText}>Tap Hint</Text>
          </TouchableOpacity>
        </View>

        {/* Quick row — FIXED: now includes voiceBip and calm */}
        <View style={styles.quickRow}>
          {([
            { emoji: '🏠',       label: 'Home',   target: 'home'    },
            { emoji: '📖',       label: 'Pages',  target: 'pages'   },
            { emoji: '🎙️', label: 'Voice',  target: 'voiceBip' },
            { emoji: '🌙',       label: 'Calm',   target: 'calm'    },
            { emoji: '🌐',       label: 'Circle', target: 'circle'  },
            { emoji: '⭐',             label: 'Growth', target: 'bippin2' },
          ] as { emoji: string; label: string; target: string }[]).map(({ emoji, label, target }) => (
            <TouchableOpacity
              key={target}
              style={styles.quickBtn}
              onPress={() => setScreen(target)}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={styles.quickEmoji}>{emoji}</Text>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.tagline}>your room. your voice. always you. ♡</Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:                  { flex: 1, backgroundColor: '#0d0014' },
  bg:                    { width, height },
  overlay:               { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,0,20,0.34)' },

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
  timeBadge:             {
    backgroundColor: 'rgba(13,0,20,0.68)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timeBadgeText:         { color: '#c4b5fd', fontSize: 12, fontWeight: '600' },

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
  toggleText:            { color: '#f5f0ff', fontSize: 11, fontWeight: '700' },

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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
  roomCopy:              { color: '#f5f0ff', fontSize: 12, fontWeight: '700', opacity: 0.9, marginBottom: 6 },
  greetingText:          { color: '#f5f0ff', fontSize: 15, fontWeight: '600', lineHeight: 22, fontStyle: 'italic', marginBottom: 6 },
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
});
