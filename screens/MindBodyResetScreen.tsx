import React, { useRef, useEffect, useState } from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Animated, Image, StyleSheet, Platform,
} from 'react-native';

// ─── Local assets ─────────────────────────────────────────────────────────────
// assets/images/cloud-headphones.png  — mind reset circle art
// assets/images/cloud.png             — body reset circle art
// assets/images/raylene-avatar.png    — Raylene presence
// assets/images/rylane-avatar.png     — Rylane presence
const CLOUD_HEADPHONES = require('../assets/images/cloud-headphones.png');
const CLOUD            = require('../assets/images/cloud.png');

// Avatar map — character-aware hero presence
const AVATAR_ASSETS: Record<string, any> = {
  soft:   require('../assets/images/raylene-avatar.png'),
  rylane: require('../assets/images/rylane-avatar.png'),
  cloud:  require('../assets/images/raylene-avatar.png'),
  night:  require('../assets/images/raylene-avatar.png'),
};

// ─── Static data ──────────────────────────────────────────────────────────────

const MIND_STEPS = [
  { icon: '☁️', text: 'Unclench your jaw.' },
  { icon: '🌙', text: 'Relax your shoulders.' },
  { icon: '🫧', text: 'Take one slow breath in.' },
  { icon: '💭', text: 'Let one thought pass without chasing it.' },
  { icon: '🕯️', text: "Your mind doesn't have to solve everything tonight." },
];

const BODY_STEPS = [
  { icon: '🫧', text: 'Roll your shoulders slowly.' },
  { icon: '🌿', text: 'Stretch your neck gently.' },
  { icon: '💧', text: 'Drink a little water.' },
  { icon: '🧍🏾', text: 'Unclench your hands.' },
  { icon: '🌙', text: 'Let your body soften for a second.' },
];

const MIND_TOOLS = [
  { emoji: '🎵', label: 'Calm Sounds' },
  { emoji: '🧠', label: 'Brain Dump' },
  { emoji: '💜', label: '+Reminders' },
  { emoji: '🌙', label: 'Night Mode' },
];

const BODY_TOOLS = [
  { emoji: '🤸🏾', label: 'Stretch' },
  { emoji: '💧', label: 'Water Check' },
  { emoji: '🌿', label: 'Release' },
  { emoji: '😴', label: 'Rest Mode' },
];

const MOOD_CHIPS = [
  { label: 'Overwhelmed', emoji: '🌊' },
  { label: 'Anxious',     emoji: '💨' },
  { label: 'Numb',        emoji: '🫥' },
  { label: 'Tired',       emoji: '🌙' },
  { label: 'Okay',        emoji: '☁️' },
  { label: 'Good',        emoji: '💜' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface MindBodyResetScreenProps {
  screen: 'mindReset' | 'bodyReset';
  t: Record<string, any>;
  selectedSekret?: string;
  setScreen: (screen: string) => void;
  onComplete?: () => void;
  BottomNav: React.ReactNode;
}

export function MindBodyResetScreen({
  screen, t, selectedSekret = 'soft', setScreen, onComplete, BottomNav,
}: MindBodyResetScreenProps) {

  const isMind    = screen === 'mindReset';
  const isRylane  = selectedSekret === 'rylane';
  const charName  = isRylane ? 'Rylane' : "Se'kret";
  const charEmoji = isRylane ? '⚡' : '💜';

  // ─── Breathe animation ───────────────────────────────────────────────────
  const breatheAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim     = useRef(new Animated.Value(0.5)).current;
  const fadeIn       = useRef(new Animated.Value(0)).current;
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const breathLoopRef = useRef<any>(null);

  // Page fade-in
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, []);

  // Ambient glow pulse (always running)
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2200, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  // Breathe circle — only runs when user taps Start
  const startBreathing = () => {
    setBreathing(true);
    setBreathPhase('inhale');

    const cycle = () => {
      setBreathPhase('inhale');
      Animated.timing(breatheAnim, { toValue: 1.22, duration: 4000, useNativeDriver: true }).start(() => {
        setBreathPhase('hold');
        setTimeout(() => {
          setBreathPhase('exhale');
          Animated.timing(breatheAnim, { toValue: 1, duration: 4000, useNativeDriver: true }).start(() => {
            setBreathPhase('rest');
            setTimeout(() => {
              cycle(); // loop
            }, 1500);
          });
        }, 2000);
      });
    };

    cycle();
  };

  const stopBreathing = () => {
    setBreathing(false);
    setBreathPhase('inhale');
    breatheAnim.stopAnimation();
    Animated.timing(breatheAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  // ─── Mood state ──────────────────────────────────────────────────────────
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // ─── Tool stub alerts ────────────────────────────────────────────────────
  const handleTool = (label: string) => {
    // Stub — future: navigate or open modal
    // e.g. if (label === 'Brain Dump') setScreen('journal');
    //      if (label === 'Calm Sounds') setScreen('calm');
  };

  // ─── onComplete hook ─────────────────────────────────────────────────────
  useEffect(() => {
    onComplete?.();
  }, []);

  // ─── Style helpers ────────────────────────────────────────────────────────
  const scrapCard = (extra?: object) => [
    styles.scrapCard,
    { backgroundColor: t.card, borderColor: t.accent + '55' },
    extra,
  ] as any;

  // ─── Character quote ──────────────────────────────────────────────────────
  const quote = isRylane
    ? "Aight. Drop your shoulders. We not fighting the whole day at once."
    : "You don't have to carry everything today. Reset. Breathe. You're still becoming.";

  // ─── Breath phase label ───────────────────────────────────────────────────
  const phaseLabel: Record<string, string> = {
    inhale: 'inhale slowly…',
    hold:   'hold…',
    exhale: 'let it go…',
    rest:   'rest…',
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0.25, 0.55] });

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>

      {/* ── Ambient background glow ──────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bgGlow, { backgroundColor: t.accent, opacity: glowOpacity }]}
      />

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backChip} onPress={() => setScreen('home')}>
            <Text style={styles.backChipText}>← Room</Text>
          </TouchableOpacity>
          <View style={[styles.cloudBadge, { backgroundColor: t.card, borderColor: t.accent + '88' }]}>
            <Text style={styles.cloudBadgeText}>☁️ Cloud is here</Text>
          </View>
        </View>

        <Text style={[styles.logo, { color: t.soft }]}>
          {isMind ? 'Mind Reset ♡' : 'Body Reset 🫧'}
        </Text>
        <Text style={styles.subtitle}>
          {isMind ? 'Quiet the noise. Just for a minute.' : 'Your body carries a lot. Give it a moment.'}
        </Text>

        {/* ━━━ HERO — character presence ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.heroRow}>
          <Image
            source={AVATAR_ASSETS[selectedSekret] ?? AVATAR_ASSETS.soft}
            style={styles.heroAvatar}
            resizeMode="contain"
          />
          <View style={[styles.speechBubble, { backgroundColor: t.card, borderColor: t.accent + '66' }]}>
            <Text style={styles.speechText}>
              {isMind
                ? isRylane
                  ? "yo. brain off for a sec. you got this 🤝"
                  : "Hey. I'm right here. Let's breathe together 💜"
                : isRylane
                  ? "real talk — your body needs this break rn 🌿"
                  : "Your body works so hard for you. Let it rest 🫧"
              }
            </Text>
            <View style={[styles.bubbleTail, { borderTopColor: t.card }]} />
          </View>
        </View>

        {/* ━━━ BREATHE CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={scrapCard()}>
          <Text style={styles.cardLabel}>Breathe with me ♡</Text>

          {/* Glowing breathe circle */}
          <View style={styles.circleWrap}>
            {/* Outer glow ring */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glowRing,
                {
                  borderColor: t.accent,
                  transform: [{ scale: breatheAnim }],
                  opacity: breathing ? 0.45 : 0.18,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.circle,
                {
                  transform: [{ scale: breatheAnim }],
                  backgroundColor: t.accent,
                  shadowColor: t.accent,
                },
              ]}
            >
              <Image
                source={isMind ? CLOUD_HEADPHONES : CLOUD}
                style={styles.circleImg}
                resizeMode="contain"
              />
              <Text style={styles.circlePhase}>
                {breathing ? phaseLabel[breathPhase] : 'inhale • exhale'}
              </Text>
            </Animated.View>
          </View>

          {/* Inhale / hold / exhale guide row */}
          <View style={styles.breatheGuide}>
            {(['inhale', 'hold', 'exhale', 'rest'] as const).map(phase => (
              <View
                key={phase}
                style={[
                  styles.guideChip,
                  {
                    backgroundColor: breathing && breathPhase === phase
                      ? t.accent
                      : t.background,
                    borderColor: t.accent + '55',
                  },