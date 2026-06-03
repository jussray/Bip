import React, { useRef, useEffect } from 'react';
import { IMAGES } from '../constants/theme';
import {
  Text, TouchableOpacity, ScrollView,
  View, Animated, Image, StyleSheet, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ─── Assets ───────────────────────────────────────────────────────────────────
const CLOUD_ASSETS: Record<string, any> = {
  raylene: IMAGES.cloud,
  rylane:  IMAGES.cloud,
};

const ART: Record<string, Record<string, any>> = {
  raylene: {
    neutral:  IMAGES.rayleneNeutral,
    thinking: IMAGES.rayleneThinking,
    window:   IMAGES.rayleneWindow,
  },
  rylane: {
    neutral:  IMAGES.rylaneNeutral,
    thinking: IMAGES.rylaneThinking,
    window:   IMAGES.rylaneWindow,
  },
};

// ─── Static data ──────────────────────────────────────────────────────────────

const MOODS = [
  { id: 'Happy', emoji: '😊' },
  { id: 'Sad',   emoji: '😔' },
  { id: 'Angry', emoji: '😡' },
  { id: 'Tired', emoji: '😴' },
];

const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

// Quick actions — typed, easy to extend
// Route map: pages = JournalScreen, voiceBip, calm, circle, bridge/parentBridge
const QUICK_ACTIONS: { emoji: string; label: string; to: string }[] = [
  { emoji: '✍️', label: 'Write It Out', to: 'pages'        },
  { emoji: '🎙️', label: 'Voice Bip',   to: 'voiceBip'     },
  { emoji: '🌙', label: 'Calm',         to: 'calm'         },
  { emoji: '🌐', label: 'Circle',       to: 'circle'       },
  { emoji: '🌉', label: 'Bridge',       to: '__bridge__'   }, // resolved at runtime below
];

const getHeroText = (mood: string) => {
  if (mood === 'Happy') return "I'm glad\nyou're smiling\ntonight 🌤️";
  if (mood === 'Sad')   return "I'm here with\nyou tonight ☁️";
  if (mood === 'Angry') return "Let it out,\nyou're safe here 🔥";
  if (mood === 'Tired') return "Rest your heart\ntonight 🌙";
  return 'Welcome back 🌙';
};

const getMoodResponse = (mood: string, isRylane: boolean) => {
  if (isRylane) {
    if (mood === 'Sad')   return "nah, you not going through this alone. i'm right here.";
    if (mood === 'Angry') return "your feelings make sense. let it out. i got you.";
    if (mood === 'Tired') return "you gave it everything today. rest is part of the work.";
    return "i see you. you're doing way better than you think.";
  }
  if (mood === 'Sad')   return "Heavy nights don't last forever. I'm right here with you.";
  if (mood === 'Angry') return "Your feelings make sense. You're safe to let it out here.";
  if (mood === 'Tired') return "Rest is an act of self-love. You've done enough today.";
  return "I read your energy tonight. You're doing better than you think.";
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  mood: string;
  selectMood: (mood: string) => void;
  t: Record<string, any>;
  currentSekret: Record<string, any>;
  selectedSekret: string;           // character identity key
  homeMessageIndex: number;
  userSide: string;
  setScreen: (screen: string) => void;
  onMoodSelect?: (mood: string) => void;  // Supabase/RoomMemory hook
  BottomNav: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeScreen({
  mood, selectMood, t, currentSekret, selectedSekret,
  homeMessageIndex, userSide, setScreen, onMoodSelect, BottomNav,
}: HomeScreenProps) {

  const isRylane  = selectedSekret === 'rylane';
  const charKey   = isRylane ? 'rylane' : 'raylene';
  const art       = ART[charKey];
  const cloudImg  = CLOUD_ASSETS[charKey];

  // ─── Animations ─────────────────────────────────────────────────────────
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Page entrance
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Breathe cloud loop
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.12, duration: 3000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1,    duration: 3000, useNativeDriver: true }),
      ])
    );
    breathe.start();

    // Ambient glow pulse
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2800, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => { breathe.stop(); glow.stop(); };
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.15, 0.38] });

  // ─── Style helpers ───────────────────────────────────────────────────────
  const card = (extra?: object) => [
    styles.card, { backgroundColor: t.card, borderColor: t.accent + '55' }, extra,
  ] as any;

  // ─── Mood select handler (also fires Supabase hook) ───────────────────────
  const handleMoodSelect = (m: string) => {
    selectMood(m);
    onMoodSelect?.(m);
  };

  // ─── Reminder message (bounds-guarded) ───────────────────────────────────
  const reminder = HOME_MESSAGES[homeMessageIndex] ?? HOME_MESSAGES[0];

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <StatusBar style="light" />

      {/* ── Ambient background glow ─────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bgGlow, { backgroundColor: t.accent, opacity: glowOpacity }]}
      />

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━━ PARENT BADGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {userSide === 'parent' && (
          <View style={styles.parentBadge}>
            <Text style={styles.parentBadgeText}>🌿 PARENT SIDE</Text>
          </View>
        )}

        {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Text style={[styles.logo, { color: t.soft }]}>
          Se'kret Bip {currentSekret.emoji}
        </Text>
        <Text style={styles.subtitle}>your space. your voice. always you.</Text>

        {/* ━━━ BREATHING CLOUD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View
          style={[styles.cloudWrap, { transform: [{ scale: breatheAnim }] }]}
        >
          <Image source={cloudImg} style={styles.cloudImg} resizeMode="contain" />
        </Animated.View>

        {/* ━━━ HERO MESSAGE CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={card()}>
          <View style={styles.heroCardTop}>
            <Image source={art.neutral} style={styles.heroArt} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroCardBy, { color: t.soft }]}>
                {currentSekret.name} says...
              </Text>
              <Text style={[styles.heroText, { color: '#fff' }]}>
                {getHeroText(mood)}
              </Text>
            </View>
          </View>
          <Text style={styles.entryText}>
            Your Se'kret is {currentSekret.name} energy.
          </Text>
        </View>

        {/* ━━━ TONIGHT'S REMINDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={card()}>
          <Text style={styles.cardText}>Tonight's Reminder ✨</Text>
          <Text style={styles.entryText}>{reminder}</Text>
        </View>

        {/* ━━━ MOOD SELECTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Text style={[styles.sectionTitle, { color: t.soft }]}>
          How's your heart right now? 💜
        </Text>
        <View style={styles.moodRow}>
          {MOODS.map(m => {
            const active = mood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.moodBubble,
                  active && {
                    backgroundColor: t.accent,
                    shadowColor: t.accent,
                    shadowOpacity: 0.8,
                    shadowRadius: 12,
                    elevation: 8,
                  },
                ]}
                onPress={() => handleMoodSelect(m.id)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ━━━ SE'KRET SEES YOU — mood-aware, character-aware ━━━━━━━━━━━━━ */}
        <View style={card()}>
          <Text style={styles.cardText}>
            {currentSekret.name} sees you {currentSekret.emoji}
          </Text>
          <Text style={styles.entryText}>
            {getMoodResponse(mood, isRylane)}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: t.accent, shadowColor: t.accent }]}
              onPress={() => setScreen('sekret')}
            >
              <Text style={styles.actionBtnText}>💬 Talk more</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: t.card, borderWidth: 1, borderColor: t.accent + '66' }]}
              onPress={() => setScreen('calm')}
            >
              <Text style={styles.actionBtnText}>🌙 Calm me</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ━━━ QUICK ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Text style={[styles.sectionTitle, { color: t.soft }]}>Quick Actions ⚡</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => {
            // Resolve bridge route at runtime based on userSide
            const route = action.to === '__bridge__'
              ? (userSide === 'parent' ? 'parentBridge' : 'bridge')
              : action.to;
            return (
              <TouchableOpacity
                key={action.label}
                style={[styles.quickCard, { backgroundColor: t.card, borderColor: t.accent + '55' }]}
                onPress={() => setScreen(route)}
              >
                <Text style={styles.quickEmoji}>{action.emoji}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 36 }} />
      </Animated.ScrollView>

      {/* BottomNav always pinned outside ScrollView */}
      {BottomNav}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:           { flex: 1 },
  bgGlow:         {
    position: 'absolute', top: -80, alignSelf: 'center',
    width: 320, height: 320, borderRadius: 160,
  },
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  parentBadge:    { backgroundColor: '#065F46', borderRadius: 10, padding: 6, alignSelf: 'center', marginBottom: 10 },
  parentBadgeText:{ color: '#6EE7B7', fontSize: 12, fontWeight: '700' },

  logo:           { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 16 },

  cloudWrap:      { alignItems: 'center', marginVertical: 14 },
  cloudImg:       { width: 100, height: 100 },

  card:           {
    padding: 18, borderRadius: 22, marginBottom: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  heroCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  heroArt:        { width: 60, height: 72, borderRadius: 12 },
  heroCardBy:     { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  heroText:       { fontSize: 22, fontWeight: 'bold', lineHeight: 30 },
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },

  sectionTitle:   { fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },

  moodRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, gap: 8 },
  moodBubble:     {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center',
  },
  moodEmoji:      { fontSize: 28 },

  actionRow:      { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn:      {
    flex: 1, padding: 12, borderRadius: 16, alignItems: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  actionBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  quickCard:      {
    width: '30%', flexGrow: 1, padding: 14, borderRadius: 18,
    alignItems: 'center', borderWidth: 1, gap: 5,
  },
  quickEmoji:     { fontSize: 24 },
  quickLabel:     { color: '#CBD5E1', fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
