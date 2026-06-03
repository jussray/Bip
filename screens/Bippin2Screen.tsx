import React, { useState, useRef, useEffect } from 'react';
import {
  Text, TouchableOpacity, ScrollView, View,
  Image, Animated, StyleSheet, Platform,
} from 'react-native';

// ─── Artwork system ───────────────────────────────────────────────────────────
// Swap hero images here when dedicated Bippin2 artwork arrives.
// Currently uses fullbody as hero fallback per spec.
const ART: Record<string, Record<string, any>> = {
  raylene: {
    hero:     require('../assets/images/raylene-fullbody.png'),   // swap for bippin2-raylene-hero.png when available
    neutral:  require('../assets/images/raylene-neutral.png'),
    window:   require('../assets/images/raylene-window.png'),
    thinking: require('../assets/images/raylene-thinking.png'),
  },
  rylane: {
    hero:     require('../assets/images/rylane-fullbody.png'),    // swap for bippin2-rylane-hero.png when available
    neutral:  require('../assets/images/rylane-neutral.png'),
    window:   require('../assets/images/rylane-window.png'),
    thinking: require('../assets/images/rylane-thinking.png'),
  },
};

// ─── Static data — Womanhood ──────────────────────────────────────────────────

const W_CHIPS = [
  { key: 'period',   emoji: '🩸', label: 'First Period\nSupport' },
  { key: 'cycle',    emoji: '🌙', label: 'Cycle\nWellness' },
  { key: 'mood',     emoji: '💜', label: 'Mood + Body\nCheck-in' },
  { key: 'comfort',  emoji: '🕯️', label: 'Comfort\nMode' },
  { key: 'sekret',   emoji: '☁️', label: "Ask\nSe'kret" },
  { key: 'journal',  emoji: '📓', label: 'Private\nJournal' },
];

const W_MOOD_CHIPS = [
  { label: 'happy',     emoji: '😊' },
  { label: 'calm',      emoji: '🌿' },
  { label: 'tired',     emoji: '😴' },
  { label: 'scared',    emoji: '😨' },
  { label: 'emotional', emoji: '💜' },
  { label: 'okay',      emoji: '☁️' },
];

const W_BIP_FLOW = [
  { icon: '☁️', step: 'notice',   sub: 'how you feel' },
  { icon: '📓', step: 'name it',  sub: 'be real' },
  { icon: '💜', step: 'nourish',  sub: 'yourself' },
  { icon: '🎧', step: 'release',  sub: 'let it out' },
  { icon: '⭐', step: 'grow',     sub: 'keep bippin' },
];

// ─── Static data — Manhood ────────────────────────────────────────────────────

const M_CHIPS = [
  { key: 'puberty',     emoji: '⚡', label: 'Puberty\nGuide' },
  { key: 'body',        emoji: '🧍🏾', label: 'Body\nChanges' },
  { key: 'confidence',  emoji: '⭐', label: 'Confidence\nBoost' },
  { key: 'hygiene',     emoji: '🧴', label: 'Hygiene +\nSelf-Care' },
  { key: 'mind',        emoji: '🧠', label: 'Mind\nCheck-in' },
  { key: 'journal',     emoji: '📓', label: 'Private\nJournal' },
];

const M_MOOD_CHIPS = [
  { label: 'happy',    emoji: '😊' },
  { label: 'calm',     emoji: '🌿' },
  { label: 'stressed', emoji: '⚡' },
  { label: 'angry',    emoji: '😤' },
  { label: 'tired',    emoji: '😴' },
  { label: 'okay',     emoji: '☁️' },
];

const M_BIP_FLOW = [
  { icon: '☁️', step: 'notice',  sub: "what's up" },
  { icon: '📓', step: 'name it', sub: 'be honest' },
  { icon: '⚡', step: 'reset',   sub: 'refocus' },
  { icon: '🎧', step: 'release', sub: 'clear it out' },
  { icon: '🏆', step: 'grow',    sub: 'level up' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Bippin2ScreenProps {
  t: Record<string, any>;
  mood: string;
  selectedSekret: string;      // 'soft' | 'rylane' | 'cloud' | 'night'
  setScreen: (screen: string) => void;
  onMilestone?: () => void;
  BottomNav: React.ReactNode;
  streakDays?: number;
}

export function Bippin2Screen({
  t, mood, selectedSekret, setScreen, onMilestone, BottomNav, streakDays = 0,
}: Bippin2ScreenProps) {

  // ─── Identity ─────────────────────────────────────────────────────────────
  const isRylane   = selectedSekret === 'rylane';
  const charName   = isRylane ? 'Rylane' : 'Raylene';
  const charEmoji  = isRylane ? '⚡' : '💜';
  const art        = ART[isRylane ? 'rylane' : 'raylene'];

  // Rylane gets a cooler blue-electric tint, Raylene keeps the warm neon-pink.
  // Both read from t (theme) but we overlay an identity accent for unique feel.
  const idAccent   = isRylane ? '#4DA3FF' : t.accent;   // blue for Rylane, theme accent for Raylene
  const idSoft     = isRylane ? '#B6DCFF' : t.soft;

  // ─── Animation ────────────────────────────────────────────────────────────
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2600, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.18, 0.42] });

  // ─── Local state ──────────────────────────────────────────────────────────
  const [selectedMood, setSelectedMood]   = useState<string | null>(null);
  const [energyLevel]                     = useState(72);   // future: AsyncStorage / Supabase mood_checkins
  const [sleepHours]                      = useState('6h 42m'); // future: Supabase sleep_tracker

  // ─── Feature chip navigation ──────────────────────────────────────────────
  const handleChip = (key: string) => {
    const routes: Record<string, string> = {
      period:     'periodCalendar',
      cycle:      'periodCalendar',
      mood:       'calm',
      comfort:    'comfort',
      sekret:     'sekret',
      journal:    'journal',
      puberty:    'sekret',        // stub — future: dedicated puberty guide screen
      body:       'sekret',        // stub
      confidence: 'bippin2',       // stub — future: confidence boost section
      hygiene:    'sekret',        // stub
      mind:       'calm',
    };
    const route = routes[key];
    if (route) setScreen(route);
  };

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const scrapCard = (extra?: object) => [
    styles.scrapCard,
    { backgroundColor: t.card, borderColor: idAccent + '44' },
    extra,
  ] as any;

  const accentBtn = (extra?: object) => [
    styles.accentBtn,
    { backgroundColor: idAccent, shadowColor: idAccent },
    extra,
  ] as any;

  // ─── Greeting copy ────────────────────────────────────────────────────────
  const greeting = isRylane
    ? { title: `Good night, ${charName} ⚡`, body: "Keep building the best version of you.\nYou've got this." }
    : { title: `Good night, ${charName} 💜`, body: "Your body is changing.\nThat's not something to fear or hide." };

  const streakLabel = isRylane ? 'focus streak'      : 'connection streak';
  const streakSub   = isRylane ? 'consistency builds confidence.' : "you're showing up for you.";
  const streakNote  = isRylane ? 'proud of you, seriously.' : "you're doing great. ✨";

  const chips      = isRylane ? M_CHIPS      : W_CHIPS;
  const moodChips  = isRylane ? M_MOOD_CHIPS : W_MOOD_CHIPS;
  const bipFlow    = isRylane ? M_BIP_FLOW   : W_BIP_FLOW;

  // ─── Cloud mascot speech ──────────────────────────────────────────────────
  const cloudSpeech = isRylane
    ? "yo. i'm here. what's on your mind rn? 🤝"
    : "hey. whatever you're feeling right now — it's valid 💜";

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>

      {/* ── Ambient background glow ────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bgGlow, { backgroundColor: idAccent, opacity: glowOpacity }]}
      />

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backChip} onPress={() => setScreen('home')}>
            <Text style={styles.backChipText}>← Room</Text>
          </TouchableOpacity>
          <View style={[styles.privateBadge, { backgroundColor: t.card, borderColor: idAccent + '66' }]}>
            <Text style={styles.privateBadgeText}>🔒 private</Text>
          </View>
        </View>

        <Text style={[styles.screenTitle, { color: idAccent }]}>
          {isRylane ? 'Bippin 2\nManhood ⚡' : 'Bippin 2\nWomanhood 💜'}
        </Text>
        <Text style={[styles.screenSub, { color: idSoft }]}>
          {isRylane ? 'growing into yourself. 💙' : 'growing at your own pace. 💜'}
        </Text>

        {/* ━━━ HERO — character presence ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.heroSection}>
          {/* Character portrait */}
          <Image source={art.hero} style={styles.heroArt} resizeMode="contain" />

          {/* Greeting + streak card */}
          <View style={styles.heroRight}>
            <View style={scrapCard(styles.greetCard)}>
              <Text style={[styles.greetTitle, { color: idSoft }]}>{greeting.title}</Text>
              <Text style={styles.greetBody}>{greeting.body}</Text>
            </View>
            <View style={[styles.streakCard, { backgroundColor: t.card, borderColor: idAccent + '55' }]}>
              <Text style={[styles.streakLabel, { color: idAccent }]}>{streakLabel}</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFlame}>{isRylane ? '🔵' : '🔥'}</Text>
                <Text style={[styles.streakDays, { color: '#fff' }]}>{streakDays} days</Text>
              </View>
              <Text style={styles.streakSub}>{streakSub}</Text>
              <Text style={[styles.streakNote, { color: idSoft }]}>{streakNote}</Text>
            </View>
          </View>
        </View>

        {/* ━━━ CLOUD MASCOT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.cloudRow}>
          <Text style={styles.cloudMascot}>{isRylane ? '💙' : '💜'}☁️</Text>
          <View style={[styles.cloudBubble, { backgroundColor: t.card, borderColor: idAccent + '55' }]}>
            <Text style={styles.cloudText}>{cloudSpeech}