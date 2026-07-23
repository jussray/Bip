// screens/ComfortScreen.tsx
// Se'kret Bip — Comfort Mode 🚨
// Vision: Rainy room. Soft purple light. Cloud is here. Feels like a hug.
// Triggered by SOS / Comfort Mode. Should feel like someone is beside you,
// not a help center.
//
// Polish pass (2026-06-07):
//   - Rainy room backdrop (bgComfort + character window fallback) with blur
//   - Real LinearGradient wash (top + bottom)
//   - Cloud floats with breath + drift loops
//   - Falling rain streaks (8 animated lines, randomized delays)
//   - selectedSekret + mood wired through (both optional)
//   - Character-aware copy: Cloud-lead (quiet) / Raylene (soft) / Rylane (loyal)
//   - Mood-tinted glow on hero + 'says' card
//   - Companion presence pill ('cloud is here · rainy room')
//   - Curly quotes throughout
//
// Previous fixes preserved: A1/A2, B1/B2/B3, D1

import React, { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES } from '../constants/theme';
import { AmbientWeatherOverlay } from '../components/AmbientWeatherOverlay';
import { MOOD_GLOW } from '../constants/moodGlow';
import { MiniReactionSticker, type MiniStickerCharacter } from '../components/MiniReactionSticker';
import { SyncBadge, type SyncStatus } from '../components/SyncBadge';
import {
  Text, ScrollView, View, Image, StyleSheet,
  Platform, TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';

const RAINY_BG = IMAGES.bgComfort;

const CLOUD_ROTATION = [
  IMAGES.cloudStormy,
  IMAGES.cloudHappy,
  IMAGES.cloudHeadphones,
  IMAGES.cloudSleepy,
  IMAGES.cloud,
  IMAGES.cloudHeadphonesV2,
];

// Each cloud pose maps to a matching ambient weather phase.
// stormy→rain, happy→sun, headphones→golden afternoon, sleepy→night, neutral→day, headphonesV2→evening
const CLOUD_PHASES = ['rain', 'day', 'afternoon', 'night', 'midday', 'evening'] as const;

const { width: SCREEN_W } = Dimensions.get('window');

// ── Comfort messages ───────────────────────────────────────────────────────
const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Soft moment. Slow breath. Stay with me.' },
];

// ── Grounding steps ────────────────────────────────────────────────────────
const GROUNDING_STEPS = [
  { id: 1, text: 'Put both feet on the floor.' },
  { id: 2, text: 'Name 3 things you can see.' },
  { id: 3, text: 'Take one slow breath.' },
  { id: 4, text: 'Tap Calm if you need to breathe.', action: 'calm' },
];

// ── Props ──────────────────────────────────────────────────────────────────
interface ComfortScreenProps {
  t:               Record<string, any>;
  setScreen:       (screen: string) => void;
  onComplete?:     () => void;
  BottomNav:       React.ReactNode;
  selectedSekret?: string;
  character?:      MiniStickerCharacter;
  mood?:           string;
  companion?: {
    presenceMessage: string;
  };
  syncStatus?: SyncStatus;
}

export function ComfortScreen({
  t, setScreen, onComplete, BottomNav,
  selectedSekret = 'suhana', character, mood, companion, syncStatus,
}: ComfortScreenProps) {

  const [checked, setChecked] = useState<number[]>([]);
  const [msgIdx, setMsgIdx] = useState(0);
  const [cloudIdx, setCloudIdx] = useState(0);
  const cloudFadeAnim = useRef(new Animated.Value(1)).current;

  // Character / mood ────────────────────────────────────────────────────────
  const isSy = selectedSekret === 'sy';
  const charLabel = isSy ? 'sy' : 'suhana';
  const charEmoji = isSy ? '⚡' : '💜';
  const moodKey   = mood?.toLowerCase?.() ?? mood ?? '';
  const moodGlow  = MOOD_GLOW[moodKey] ?? MOOD_GLOW[mood ?? ''] ?? MOOD_GLOW.Tired;

  // Copy variants ───────────────────────────────────────────────────────────
  const heroCopy = isSy
    ? { title: 'Comfort Mode 🚨', sub: "Heavy moment. I'm right here." }
    : { title: 'Comfort Mode 🚨', sub: 'When it feels heavy, Bip stays with you.' }; // default

  const notAloneCopy = isSy
    ? { title: "You're not in this alone.",  sub: 'No fix. No fix-it talk. Just here.' }
    : { title: 'You are not alone in this moment.', sub: 'This is a safe space. Take your time. No rush.' };

  const allDoneCopy = isSy
    ? `${charEmoji} that was step by step. real respect.`
    : `${charEmoji} you did it. one small step at a time.`;

  const calmBtnCopy = isSy ? '🌙 Slide into Calm Space' : '🌙 Go to Calm Space';
  const betterCopy  = isSy
    ? "I'm good now ›"
    : "I'm feeling a little better ›";

  // Track session on mount
  useEffect(() => {
    onComplete?.();
  }, []);

  // Cloud float + breath loops
  const cloudFloat  = useRef(new Animated.Value(0)).current;
  const cloudBreath = useRef(new Animated.Value(0)).current;
  const pillBreath  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudFloat, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudFloat, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudBreath, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudBreath, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pillBreath, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pillBreath, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cloudStyle = {
    transform: [
      { translateY: cloudFloat.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }) },
      { scale:      cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
    ],
    opacity: cloudBreath.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
  };
  const pillStyle = {
    opacity: pillBreath.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
    transform: [{ scale: pillBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
  };

  // Rain streaks ────────────────────────────────────────────────────────────
  const RAIN_COUNT = 10;
  const rainAnims = useRef(
    Array.from({ length: RAIN_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    rainAnims.forEach((anim, i) => {
      const loop = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 1400 + Math.random() * 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => { if (finished) loop(); });
      };
      // stagger starts
      setTimeout(loop, i * 180 + Math.random() * 400);
    });
  }, []);

  // Cloud image rotation with cross-fade
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(cloudFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setCloudIdx(i => (i + 1) % CLOUD_ROTATION.length);
        Animated.timing(cloudFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const toggleStep = (id: number, action?: string) => {
    setChecked(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
    if (action === 'calm') setScreen('calm');
  };

  const allDone = checked.length === GROUNDING_STEPS.length;

  const card = (extra?: object) =>
    [styles.card, { backgroundColor: t.card, borderColor: t.accent }, extra] as any;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <AmbientWeatherOverlay phase={CLOUD_PHASES[cloudIdx]} />

      {/* ── Ambient rainy room backdrop (fixed, behind scroll) ── */}
      <View style={styles.bgWrap} pointerEvents="none">
        <Image source={RAINY_BG} style={styles.bgImage} resizeMode="cover" blurRadius={3} />

        {/* Mood-tinted scrim */}
        <View style={[styles.bgMoodScrim, { backgroundColor: moodGlow + '10' }]} />

        {/* Heavy purple wash */}
        <LinearGradient
          colors={['rgba(13,0,20,0.65)', 'rgba(13,0,20,0.55)', 'rgba(13,0,20,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Rain streaks */}
        {rainAnims.map((anim, i) => {
          const left = (i / RAIN_COUNT) * SCREEN_W + Math.random() * 24;
          return (
            <Animated.View
              key={i}
              style={[
                styles.rainStreak,
                {
                  left,
                  opacity: anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.45, 0.45, 0] }),
                  transform: [{
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 700] }),
                  }],
                },
              ]}
            />
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Companion presence pill (top right) */}
        <Animated.View style={[styles.presencePill, pillStyle]} pointerEvents="none">
          <Text style={styles.presenceText}>{companion?.presenceMessage || 'cloud is here · rainy room'}</Text>
        </Animated.View>

        <Text style={[styles.logo, { textShadowColor: moodGlow + '99' }]}>{heroCopy.title}</Text>
        <Text style={styles.subtitle}>{heroCopy.sub}</Text>
        <SyncBadge status={syncStatus ?? 'idle'} />

        {/* Cloud — rotates through all poses with cross-fade */}
        <Animated.View style={[styles.cloudWrap, cloudStyle]}>
          <Animated.Image
            source={CLOUD_ROTATION[cloudIdx]}
            style={[styles.artworkMedium, { opacity: cloudFadeAnim }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* You are not alone card */}
        <View style={[card({ shadowColor: moodGlow }), styles.cardGlow]}>
          <Text style={styles.cardEmoji}>💙</Text>
          <Text style={[styles.cardText, { color: '#fff' }]}>{notAloneCopy.title}</Text>
          <Text style={[styles.entryText, { color: t.soft }]}>{notAloneCopy.sub}</Text>
          <MiniReactionSticker character={character ?? null} screenContext="comfort" size={40} />
        </View>

        {/* Grounding checklist */}
        <Text style={[styles.sectionTitle, { color: t.accent }]}>Grounding Steps</Text>
        <View style={card()}>
          {GROUNDING_STEPS.map(step => {
            const done = checked.includes(step.id);
            return (
              <TouchableOpacity
                key={step.id}
                style={styles.stepRow}
                onPress={() => toggleStep(step.id, step.action)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.stepCheck,
                  { borderColor: t.accent, backgroundColor: done ? t.accent : 'transparent' },
                ]}>
                  {done && <Text style={styles.stepCheckMark}>✓</Text>}
                </View>
                <Text style={[
                  styles.stepText,
                  {
                    color: done ? t.soft : '#fff',
                    textDecorationLine: done ? 'line-through' : 'none',
                  },
                ]}>
                  {step.id}. {step.text}
                </Text>
                {step.action === 'calm' && !done && (
                  <Text style={[styles.stepAction, { color: t.accent }]}>→ Calm</Text>
                )}
              </TouchableOpacity>
            );
          })}

          {allDone && (
            <View style={[styles.allDoneBadge, { backgroundColor: 'rgba(13,0,20,0.6)', borderColor: t.accent }]}>
              <Text style={[styles.allDoneText, { color: t.soft }]}>{allDoneCopy}</Text>
            </View>
          )}
        </View>

        {/* Character says — cycling */}
        <Text style={[styles.sectionTitle, { color: t.accent }]}>{charLabel} says {charEmoji}</Text>
        <View style={[card({ shadowColor: moodGlow }), styles.cardGlow]}>
          <Text style={styles.cardEmoji}>{COMFORT_MESSAGES[msgIdx].emoji}</Text>
          <Text style={[styles.cardText, { color: '#fff' }]}>{COMFORT_MESSAGES[msgIdx].text}</Text>
          <TouchableOpacity
            style={[styles.anotherBtn, { backgroundColor: '#334155' }]}
            onPress={() => setMsgIdx(i => (i + 1) % COMFORT_MESSAGES.length)}
          >
            <Text style={styles.anotherBtnText}>Another Calm Thought ✨</Text>
          </TouchableOpacity>
        </View>

        {/* Exit path + Calm navigation */}
        <TouchableOpacity
          style={[styles.calmBtn, { backgroundColor: t.accent, shadowColor: moodGlow }]}
          onPress={() => setScreen('calm')}
        >
          <Text style={styles.calmBtnText}>{calmBtnCopy}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.betterBtn, { borderColor: t.accent }]}
          onPress={() => setScreen('home')}
        >
          <Text style={[styles.betterBtnText, { color: t.soft }]}>{betterCopy}</Text>
        </TouchableOpacity>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1 },
  bgWrap:        StyleSheet.absoluteFill,
  bgImage:       { width: '100%', height: '100%' },
  bgMoodScrim:   StyleSheet.absoluteFill,
  rainStreak:    {
    position: 'absolute', top: 0, width: 1.5, height: 22,
    backgroundColor: 'rgba(180,210,255,0.55)', borderRadius: 1,
  },
  scroll:        { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}) },
  presencePill:  {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(168,85,247,0.22)',
    borderColor: 'rgba(168,85,247,0.5)', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 8,
  },
  presenceText:  { color: '#e9d5ff', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  logo:          {
    fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8,
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  subtitle:      { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  cloudWrap:     { alignItems: 'center' },
  artworkMedium: { width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
  card:          { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardGlow:      { shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  cardEmoji:     { fontSize: 32, marginBottom: 8 },
  cardText:      { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:     { fontSize: 14, marginBottom: 6, lineHeight: 20 },
  sectionTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 10, marginTop: 4 },

  // Grounding steps
  stepRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  stepCheck:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepCheckMark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepText:      { flex: 1, fontSize: 14, lineHeight: 20 },
  stepAction:    { fontSize: 12, fontWeight: '700' },
  allDoneBadge:  { marginTop: 12, borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
  allDoneText:   { fontSize: 13, textAlign: 'center', fontWeight: '600' },

  // Comfort message
  anotherBtn:     { padding: 11, borderRadius: 14, marginTop: 8 },
  anotherBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  // Exit buttons
  calmBtn:       {
    padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center',
    shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  calmBtnText:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  betterBtn:     { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 24, alignItems: 'center' },
  betterBtnText: { fontSize: 15, fontWeight: '600' },
});
