import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, Animated, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG — set true to see pink hotspot outlines while testing
// ─────────────────────────────────────────────────────────────────────────────
const DEBUG_HOTSPOTS = false;

// ─────────────────────────────────────────────────────────────────────────────
// ROOM BACKGROUNDS
// ─────────────────────────────────────────────────────────────────────────────
const ROOMS = {
  raylene: {
    morning: require('../assets/images/raylene-room-morning.png'),
    day:     require('../assets/images/raylene-room-day.png'),
    evening: require('../assets/images/raylene-room-evening.png'),
    night:   require('../assets/images/raylene-room-night.png'),
  },
  rylane: {
    morning: require('../assets/images/rylane-room-morning.png'),
    day:     require('../assets/images/rylane-room-day.png'),
    evening: require('../assets/images/rylane-room-evening.png'),
    night:   require('../assets/images/rylane-room-night.png'),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER AVATARS — pose selection by mood + context
// ─────────────────────────────────────────────────────────────────────────────
const AVATARS = {
  raylene: {
    neutral:  require('../assets/images/raylene-neutral.png'),
    happy:    require('../assets/images/raylene-happy.png'),
    thinking: require('../assets/images/raylene-thinking.png'),
    writing:  require('../assets/images/raylene-writing.png'),
    window:   require('../assets/images/raylene-window.png'),
    fullbody: require('../assets/images/raylene-fullbody.png'),
  },
  rylane: {
    neutral:  require('../assets/images/rylane-neutral.png'),
    happy:    require('../assets/images/rylane-happy.png'),
    thinking: require('../assets/images/rylane-thinking.png'),
    writing:  require('../assets/images/rylane-writing.png'),
    window:   require('../assets/images/rylane-window.png'),
    fullbody: require('../assets/images/rylane-fullbody.png'),
  },
};

type Pose = 'neutral' | 'happy' | 'thinking' | 'writing' | 'window' | 'fullbody';
type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';
type Character = 'raylene' | 'rylane';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
};

const getPose = (mood: string, timeOfDay: TimeOfDay, isFirstVisit: boolean): Pose => {
  if (isFirstVisit) return 'fullbody';
  if (timeOfDay === 'night' || mood === 'Sad' || mood === 'Tired') return 'window';
  if (mood === 'Happy') return 'happy';
  if (mood === 'Angry') return 'thinking';
  return 'neutral';
};

const getGreeting = (character: Character, mood: string, timeOfDay: TimeOfDay): string => {
  if (timeOfDay === 'night') {
    const lines = [
      "It's one of those nights huh.",
      "Your brain doing gymnastics again?",
      "Drink some water and tell me what's going on.",
      "We're not solving life tonight. Just this moment.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (timeOfDay === 'morning') {
    const lines = [
      "Morning. How we feeling today for real.",
      "You came back. I'm glad.",
      "New day. Tell me what's on your mind.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (mood === 'Sad')   return character === 'raylene' ? "Come sit. I've been thinking about you." : "Nah I could tell something was off. Talk.";
  if (mood === 'Angry') return character === 'raylene' ? "Hold on. Back up. Who got you out here like this?" : "Okay who we irritated at today? 😒";
  if (mood === 'Tired') return character === 'raylene' ? "Baby you look tired. Not the sleep kind." : "You been running on empty huh. Sit down.";
  if (mood === 'Happy') return character === 'raylene' ? "Look at you. Something good happened." : "Aye. You seem different today. Good different.";

  const rayleneDefaults = [
    "Come sit. Tell me the real version.",
    "Nah. Your face already told on you. What's up?",
    "Baby are we healing or are we pretending today? 👀",
    "I've been waiting on you.",
  ];
  const rylaneDefaults = [
    "Aight. Come in. What we bippin about?",
    "Bet. Spill.",
    "Nah cause what are we doing today? 😭",
    "Who approved your decisions lately? 👀",
  ];
  const pool = character === 'raylene' ? rayleneDefaults : rylaneDefaults;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ─────────────────────────────────────────────────────────────────────────────
// HOTSPOT DEFINITIONS
// Coordinates calibrated from room artwork.
// All values are percentage strings — scale with any screen size.
// Tweak here if needed after testing on device.
// ─────────────────────────────────────────────────────────────────────────────

// Raylene room hotspots (daytime layout reference — Image 1)
const RAYLENE_HOTSPOTS = [
  {
    id: 'pages',
    label: 'Journal 📖',
    target: 'pages',
    // Open notebook — bottom center foreground
    style: { bottom: '10%', left: '20%', width: '35%', height: '18%' },
  },
  {
    id: 'voiceBip',
    label: 'Headphones 🎙️',
    target: 'voiceBip',
    // Headphones on floor rug — bottom left
    style: { bottom: '14%', left: '2%', width: '18%', height: '12%' },
  },
  {
    id: 'cloudThoughts',
    label: 'Cloud Lamp ☁️',
    target: 'cloudThoughts',
    // Cloud lamp on desk — center left
    style: { top: '42%', left: '26%', width: '14%', height: '12%' },
  },
  {
    id: 'comfort',
    label: 'Bed 🌙',
    target: 'comfort',
    // Bed right side
    style: { top: '38%', right: '2%', width: '38%', height: '35%' },
  },
  {
    id: 'bippin2',
    label: 'Growth Board ⭐',
    target: 'bippin2',
    // Bippin2WomanHood whiteboard — top left wall
    style: { top: '4%', left: '18%', width: '24%', height: '28%' },
  },
  {
    id: 'circle',
    label: 'Photo Wall 🌐',
    target: 'circle',
    // Polaroid photo wall — far right
    style: { top: '4%', right: '0%', width: '18%', height: '55%' },
  },
  {
    id: 'calm',
    label: 'Window 🌤️',
    target: 'calm',
    // Window — far left
    style: { top: '4%', left: '0%', width: '18%', height: '50%' },
  },
  {
    id: 'summon',
    label: 'Se\'kret 💜',
    target: 'summon',
    // Hoodie on chair — left center
    style: { top: '38%', left: '4%', width: '20%', height: '30%' },
  },
];

// Rylane room hotspots (daytime layout reference — Image 7)
const RYLANE_HOTSPOTS = [
  {
    id: 'pages',
    label: 'Journal 📖',
    target: 'pages',
    // Open notebook — bottom center foreground
    style: { bottom: '8%', left: '22%', width: '38%', height: '20%' },
  },
  {
    id: 'voiceBip',
    label: 'Headphones 🎙️',
    target: 'voiceBip',
    // Headphones on desk — center
    style: { top: '40%', left: '28%', width: '14%', height: '10%' },
  },
  {
    id: 'cloudThoughts',
    label: 'Cloud Neon ☁️',
    target: 'cloudThoughts',
    // Neon cloud sign — center wall
    style: { top: '28%', left: '36%', width: '14%', height: '12%' },
  },
  {
    id: 'comfort',
    label: 'Bed 🌙',
    target: 'comfort',
    // Bed right side
    style: { top: '36%', right: '2%', width: '40%', height: '38%' },
  },
  {
    id: 'bippin2',
    label: 'Growth Board ⭐',
    target: 'bippin2',
    // Bippin2MannHood whiteboard — top left
    style: { top: '2%', left: '22%', width: '24%', height: '30%' },
  },
  {
    id: 'circle',
    label: 'Photo Wall 🌐',
    target: 'circle',
    // Polaroid wall — right side
    style: { top: '2%', right: '0%', width: '20%', height: '50%' },
  },
  {
    id: 'calm',
    label: 'Window 🌤️',
    target: 'calm',
    // Window — far left
    style: { top: '2%', left: '0%', width: '20%', height: '55%' },
  },
  {
    id: 'summon',
    label: 'Se\'kret ⚡',
    target: 'summon',
    // Hoodie on gaming chair — left
    style: { top: '30%', left: '2%', width: '24%', height: '36%' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface RoomScreenProps {
  mood: string;
  selectedSekret: string;
  setSelectedSekret: (value: string) => void;
  setScreen: (screen: string) => void;
  t: Record<string, any>;
  // MEMORY_HOOK: lastVisit?: string
  // MEMORY_HOOK: moodStreak?: number
  // MEMORY_HOOK: lastShared?: string
  // MEMORY_HOOK: daysSinceFirstBip?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function RoomScreen({
  mood,
  selectedSekret,
  setSelectedSekret,
  setScreen,
  t,
}: RoomScreenProps) {
  const timeOfDay  = getTimeOfDay();
  const character: Character = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
  const roomImage  = ROOMS[character][timeOfDay];
  const hotspots   = character === 'rylane' ? RYLANE_HOTSPOTS : RAYLENE_HOTSPOTS;

  // Avatar state
  const [isSekretVisible, setIsSekretVisible] = useState(false);
  const [isFirstVisit]   = useState(true); // MEMORY_HOOK: replace with persisted value
  const [greeting]       = useState(() => getGreeting(character, mood, timeOfDay));
  const pose = getPose(mood, timeOfDay, isFirstVisit && isSekretVisible);

  // Animations
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const greetAnim   = useRef(new Animated.Value(0)).current;
  const avatarAnim  = useRef(new Animated.Value(0)).current;
  const avatarSlide = useRef(new Animated.Value(40)).current;
  const glowAnim    = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Room fades in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 900, useNativeDriver: true,
    }).start(() => {
      // Greeting appears after room
      Animated.timing(greetAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    });

    // Greeting glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.7, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Avatar slide in when summoned
  useEffect(() => {
    if (isSekretVisible) {
      Animated.parallel([
        Animated.timing(avatarAnim, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.spring(avatarSlide, {
          toValue: 0, tension: 60, friction: 8, useNativeDriver: true,
        }),
      ]).start();
    } else {
      avatarAnim.setValue(0);
      avatarSlide.setValue(40);
    }
  }, [isSekretVisible]);

  const handleHotspot = (target: string) => {
    if (target === 'summon') {
      setIsSekretVisible(v => !v);
    } else {
      setScreen(target);
    }
  };

  const timeBadge = {
    morning: '☀️ morning',
    day:     '🌤️ afternoon',
    evening: '🌆 evening',
    night:   '🌙 late night',
  }[timeOfDay];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Room background ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        <Image
          source={roomImage}
          style={styles.bg}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.overlay} />
      </Animated.View>

      {/* ── Hotspot layer ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        {hotspots.map(spot => (
          <TouchableOpacity
            key={spot.id}
            style={[
              styles.hotspot,
              spot.style as any,
              DEBUG_HOTSPOTS && styles.hotspotDebug,
            ]}
            onPress={() => handleHotspot(spot.target)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={spot.label}
          >
            {DEBUG_HOTSPOTS && (
              <Text style={styles.debugLabel}>{spot.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── Summoned avatar ── */}
      {isSekretVisible && (
        <Animated.View
          style={[
            styles.avatarWrap,
            {
              opacity: avatarAnim,
              transform: [{ translateY: avatarSlide }],
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={AVATARS[character][pose]}
            style={styles.avatar}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      )}

      {/* ── Top bar ── */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{timeBadge}</Text>
        </View>

        {/* Character toggle */}
        <View style={styles.characterToggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              character === 'raylene' && { backgroundColor: 'rgba(217,70,239,0.25)', borderColor: '#d946ef' },
            ]}
            onPress={() => { setSelectedSekret('soft'); setIsSekretVisible(false); }}
          >
            <Text style={styles.toggleText}>💜 Raylene</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              character === 'rylane' && { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed' },
            ]}
            onPress={() => { setSelectedSekret('rylane'); setIsSekretVisible(false); }}
          >
            <Text style={styles.toggleText}>⚡ Rylane</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Bottom UI ── */}
      <Animated.View style={[styles.bottomContent, { opacity: greetAnim }]}>

        {/* Greeting bubble */}
        <TouchableOpacity
          style={styles.greetingBubble}
          onPress={() => setIsSekretVisible(v => !v)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isSekretVisible ? "Hide Se'kret" : "Call Se'kret"}
        >
          <Text style={styles.greetingChar}>
            {character === 'raylene' ? '💜 Raylene' : '⚡ Rylane'}
          </Text>
          <Text style={styles.greetingText}>"{greeting}"</Text>
          <Text style={[styles.greetingTap, { color: t.soft }]}>
            {isSekretVisible ? 'tap to dismiss' : 'tap to call Se\'kret'}
          </Text>
        </TouchableOpacity>

        {/* Main bip button */}
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

        {/* Quick nav */}
        <View style={styles.quickRow}>
          {[
            { emoji: '🏠', label: 'Home',   target: 'home'    },
            { emoji: '📖', label: 'Pages',  target: 'pages'   },
            { emoji: '🌐', label: 'Circle', target: 'circle'  },
            { emoji: '⭐', label: 'Growth', target: 'bippin2' },
          ].map(({ emoji, label, target }) => (
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

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0014',
  },
  bg: {
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,0,20,0.35)',
  },

  // Hotspots
  hotspot: {
    position: 'absolute',
  },
  hotspotDebug: {
    borderWidth: 2,
    borderColor: '#f472b6',
    backgroundColor: 'rgba(244,114,182,0.15)',
  },
  debugLabel: {
    color: '#f472b6',
    fontSize: 9,
    fontWeight: '900',
    padding: 2,
  },

  // Avatar
  avatarWrap: {
    position: 'absolute',
    bottom: '22%',
    alignSelf: 'center',
    width: width * 0.55,
    height: height * 0.45,
    zIndex: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },

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
  timeBadge: {
    backgroundColor: 'rgba(13,0,20,0.65)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timeBadgeText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  characterToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(13,0,20,0.55)',
  },
  toggleText: {
    color: '#f5f0ff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Bottom UI
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 16,
  },
  greetingBubble: {
    backgroundColor: 'rgba(13,0,20,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.3)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  greetingChar: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  greetingText: {
    color: '#f5f0ff',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  greetingTap: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  mainBtn: {
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
  mainBtnText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: 'rgba(13,0,20,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(167,114,192,0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickEmoji: {
    fontSize: 18,
    marginBottom: 3,
  },
  quickLabel: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  tagline: {
    color: '#c4b5fd',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
