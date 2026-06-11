// screens/ParentRoomScreen.tsx
// The Parent Room — the room IS the dashboard.
//
// Uses actual room background art (the mockups become the assets):
//   bg-mom-room-{day/evening/night/deep-night/rain}.png
//   bg-dad-room-{day/evening/night/deep-night/rain}.png
//
// Full ImageBackground like the teen Room, scrollable content on top.
// Parent Se'kret lives in the room — not hidden in a menu.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Text, View, ScrollView, TouchableOpacity,
  ImageBackground, Animated, StyleSheet, Platform,
  Dimensions, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { IMAGES, getParentRoomBg } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────
export type ParentRoomStyle = 'mom' | 'dad';

// ─── Overlay tints — adjust how much the room art shows through ───────────────
// Mom rooms are lighter / warmer; dad rooms are darker / deeper.
const OVERLAY: Record<ParentRoomStyle, Record<string, [string, string, string]>> = {
  mom: {
    day:       ['rgba(255,235,250,0.08)', 'rgba(180,120,210,0.25)', 'rgba(80,30,120,0.70)'],
    evening:   ['rgba(60,20,90,0.15)',    'rgba(60,20,90,0.40)',    'rgba(20,5,40,0.82)'],
    night:     ['rgba(20,5,40,0.25)',     'rgba(20,5,40,0.50)',    'rgba(10,2,25,0.88)'],
    deepNight: ['rgba(10,2,25,0.30)',     'rgba(10,2,25,0.55)',    'rgba(5,1,15,0.90)'],
    rain:      ['rgba(20,10,40,0.28)',    'rgba(20,10,40,0.52)',   'rgba(10,5,25,0.88)'],
  },
  dad: {
    day:       ['rgba(255,245,220,0.05)', 'rgba(140,100,50,0.20)', 'rgba(40,20,5,0.72)'],
    evening:   ['rgba(50,25,5,0.15)',     'rgba(50,25,5,0.40)',    'rgba(20,8,2,0.82)'],
    night:     ['rgba(5,10,25,0.28)',     'rgba(5,10,25,0.52)',    'rgba(2,5,15,0.90)'],
    deepNight: ['rgba(2,5,15,0.32)',      'rgba(2,5,15,0.56)',     'rgba(1,3,10,0.92)'],
    rain:      ['rgba(5,8,20,0.30)',      'rgba(5,8,20,0.54)',     'rgba(2,4,12,0.90)'],
  },
};

// Text + accent colors tuned per style
const STYLE_TOKENS: Record<ParentRoomStyle, {
  accent: string; soft: string; text: string; textSub: string; card: string;
}> = {
  mom: { accent: '#c088d4', soft: '#f0d8ff', text: '#fff', textSub: '#e0c8f5',  card: 'rgba(45,18,70,0.75)' },
  dad: { accent: '#5a9ad8', soft: '#d0e8ff', text: '#fff', textSub: '#b8d0e8',  card: 'rgba(8,18,40,0.78)'  },
};

// Slightly lighter card for light-room variants (morning/day)
function getTimeSlot(weatherMode?: string): string {
  if (weatherMode === 'rain') return 'rain';
  const h = new Date().getHours();
  if (h >= 5  && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 || h < 1)  return 'night';
  return 'deepNight';
}

// ─── Room content ──────────────────────────────────────────────────────────────
const PARENT_MOODS = [
  { id: 'exhausted',  emoji: '😩', label: 'Exhausted' },
  { id: 'worried',    emoji: '😔', label: 'Worried' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { id: 'proud',      emoji: '🥹', label: 'Proud' },
  { id: 'hopeful',    emoji: '💜', label: 'Hopeful' },
  { id: 'relieved',   emoji: '😌', label: 'Relieved' },
  { id: 'learning',   emoji: '🌱', label: 'Learning' },
  { id: 'surviving',  emoji: '☕', label: 'Surviving' },
  { id: 'locked-in',  emoji: '🔥', label: 'Locked In' },
  { id: 'grateful',   emoji: '🙏', label: 'Grateful' },
];

const MOM_REMINDERS = ['breathe', 'be patient', 'stay present', 'choose grace', 'trust the process', 'celebrate small wins'];
const DAD_REMINDERS = ['lead with love', 'listen more', 'assume less', 'encourage always', 'protect their peace', 'celebrate small wins'];

const SEKRET_PRESENCE = [
  "don't let a 15-minute argument become a 15-day distance.",
  "take a breath. we're solving a Tuesday problem.",
  "that kid still loves you. y'all just speaking different languages today.",
  "you're more consistent than you think.",
  "one rough conversation doesn't erase years of showing up.",
  "being present IS the plan.",
  "you can't pour from an empty cup. that's not selfishness. that's math.",
  "small steps, big impact. every single time.",
  "the relationship is more important than being right tonight.",
  "progress over perfection. always.",
];

const ROOM_OBJECTS = [
  { icon: '📔', label: 'Pages',      sub: 'write it out',         route: 'pages' },
  { icon: '☕', label: 'Reflection', sub: 'daily check-in',       route: 'sekret' },
  { icon: '☁️', label: "Se'kret",   sub: 'your companion',       route: 'parentBridge' },
  { icon: '🌉', label: 'Bridge',     sub: "se'krets 2 tell",      route: 'parentBridge' },
  { icon: '🌐', label: 'Circle',     sub: 'parent circle',        route: 'circle' },
  { icon: '🏆', label: 'Wins',       sub: 'memory shelf',         route: 'growth' },
];

function getGreeting(style: ParentRoomStyle, slot: string): string {
  const name = style === 'mom' ? 'Mama' : 'Dad';
  if (slot === 'day')       return `Hey ${name}. You're doing it. ☕`;
  if (slot === 'evening')   return `Evening, ${name}. Breathe. 💜`;
  if (slot === 'rain')      return `It's a quiet one, ${name}. 🌧️`;
  if (slot === 'night')     return `Still up, ${name}? Rest matters too. 🌙`;
  if (slot === 'deepNight') return `Night, ${name}. Put it down for now. 🌙`;
  return `Good morning, ${name}. 🌿`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ParentRoomScreenProps {
  parentRoomStyle: ParentRoomStyle;
  parentMood:      string;
  setParentMood:   (m: string) => void;
  setScreen:       (s: string) => void;
  weatherMode?:    string;
  BottomNav:       React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ParentRoomScreen({
  parentRoomStyle,
  parentMood,
  setParentMood,
  setScreen,
  weatherMode,
  BottomNav,
}: ParentRoomScreenProps) {

  const slot       = useMemo(() => getTimeSlot(weatherMode), [weatherMode]);
  const tokens     = STYLE_TOKENS[parentRoomStyle];
  const overlay    = OVERLAY[parentRoomStyle][slot] ?? OVERLAY[parentRoomStyle].night;
  const reminders  = parentRoomStyle === 'mom' ? MOM_REMINDERS : DAD_REMINDERS;
  const greeting   = getGreeting(parentRoomStyle, slot);
  const roomBg     = getParentRoomBg(parentRoomStyle, weatherMode);

  const [presenceIdx, setPresenceIdx] = useState(() => Math.floor(Math.random() * SEKRET_PRESENCE.length));

  // ─── Animations ────────────────────────────────────────────────────────────
  const contentFade = useRef(new Animated.Value(0)).current;
  const cardFade    = useRef(new Animated.Value(0)).current;
  const breath      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(contentFade, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardFade,    { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const breathScale   = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.80, 1] });
  const cardW = (W - 52) / 2;

  return (
    <View style={styles.root}>

      {/* ── ROOM ART (full-screen) ──────────────────────────────────────── */}
      <ImageBackground
        source={roomBg}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* ── READABILITY GRADIENT OVERLAY ───────────────────────────────── */}
      <LinearGradient
        colors={overlay}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.42, 1]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── GREETING ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.greetRow, { opacity: contentFade }]}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={[styles.greetSub, { color: tokens.textSub }]}>
              {parentRoomStyle === 'mom' ? "SE'KRET 2 TELL • we're raising humans, not robots" : "SE'KRET 2 TELL • we're raising humans, not robots"}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: breathScale }], opacity: breathOpacity }}>
            <Image source={IMAGES.cloudHeadphones} style={styles.cloudBadge} resizeMode="contain" />
          </Animated.View>
        </Animated.View>

        {/* ── PARENT SE'KRET PRESENCE ──────────────────────────────────── */}
        <Animated.View style={{ opacity: contentFade }}>
          <TouchableOpacity
            style={[styles.presenceCard, { backgroundColor: tokens.card, borderColor: tokens.accent + '55' }]}
            onPress={() => setPresenceIdx(i => (i + 1) % SEKRET_PRESENCE.length)}
            activeOpacity={0.8}
          >
            <Text style={styles.presenceEmoji}>🎧</Text>
            <View style={styles.presenceBody}>
              <Text style={[styles.presenceText, { color: tokens.soft }]}>
                "{SEKRET_PRESENCE[presenceIdx]}"
              </Text>
              <Text style={[styles.presenceHint, { color: tokens.textSub }]}>tap for another →</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── HOW YOU FEELING ──────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={[styles.sectionLabel, { color: tokens.textSub }]}>How you feeling today?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
            {PARENT_MOODS.map(m => {
              const active = parentMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodChip,
                    {
                      backgroundColor: active ? tokens.accent + '44' : tokens.card,
                      borderColor:     active ? tokens.accent : tokens.accent + '44',
                    },
                  ]}
                  onPress={() => setParentMood(m.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: active ? tokens.accent : tokens.textSub }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── TODAY'S REMINDERS ────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={[styles.sectionLabel, { color: tokens.textSub }]}>
            {parentRoomStyle === 'mom' ? "Today's Reminders" : "Today's Reminders"}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.remindersRow}>
            {reminders.map(r => (
              <View key={r} style={[styles.reminderChip, { backgroundColor: tokens.card, borderColor: tokens.accent + '44' }]}>
                <Text style={[styles.reminderText, { color: tokens.soft }]}>{r}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── ROOM OBJECTS ─────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={[styles.sectionLabel, { color: tokens.textSub }]}>Your Room</Text>
          <View style={styles.objectGrid}>
            {ROOM_OBJECTS.map(obj => (
              <TouchableOpacity
                key={obj.label}
                style={[styles.objectCard, { width: cardW, backgroundColor: tokens.card, borderColor: tokens.accent + '55' }]}
                onPress={() => setScreen(obj.route)}
                activeOpacity={0.75}
              >
                <Text style={styles.objectIcon}>{obj.icon}</Text>
                <Text style={styles.objectLabel}>{obj.label}</Text>
                <Text style={[styles.objectSub, { color: tokens.textSub }]}>{obj.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── JOURNAL PEEK ─────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <TouchableOpacity
            style={[styles.journalCard, { backgroundColor: tokens.card, borderColor: tokens.accent + '44' }]}
            onPress={() => setScreen('pages')}
            activeOpacity={0.8}
          >
            <View style={styles.journalCardHeader}>
              <Text style={[styles.journalCardTitle, { color: tokens.soft }]}>
                {parentRoomStyle === 'mom' ? '📔 Mom Journal' : '📔 Dad Journal'}
              </Text>
              <Text style={[styles.journalCardOpen, { color: tokens.accent }]}>open →</Text>
            </View>
            <Text style={[styles.journalLine, { color: tokens.textSub }]}>today I felt: ___</Text>
            <Text style={[styles.journalLine, { color: tokens.textSub }]}>win today: ___</Text>
            <Text style={[styles.journalHint, { color: tokens.accent + 'aa' }]}>
              it's okay to not have it all figured out ♡
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── PARENT SE'KRET ADVISOR ───────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <TouchableOpacity
            style={[styles.advisorCard, { backgroundColor: tokens.accent + '22', borderColor: tokens.accent + '88' }]}
            onPress={() => setScreen('parentBridge')}
            activeOpacity={0.8}
          >
            <Text style={styles.advisorIcon}>🎧</Text>
            <View style={styles.advisorText}>
              <Text style={[styles.advisorTitle, { color: '#fff' }]}>Parent Se'kret</Text>
              <Text style={[styles.advisorSub, { color: tokens.textSub }]}>
                sitting on the stoop with you. street-smart. real.
              </Text>
            </View>
            <Text style={[styles.advisorArrow, { color: tokens.accent }]}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── WALL AFFIRMATION ─────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <View style={styles.wallAffirmation}>
            <Text style={[styles.wallMain, { color: tokens.accent }]}>
              {parentRoomStyle === 'mom' ? 'PROGRESS OVER PERFECTION' : 'BE PRESENT, NOT PERFECT'}
            </Text>
            <Text style={[styles.wallSub, { color: tokens.textSub }]}>
              {parentRoomStyle === 'mom'
                ? "she's building a life she loves"
                : "a good dad builds trust, not control"}
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0a0018' },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingBottom: 32 },

  // Greeting
  greetRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting:   { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 26, marginBottom: 2 },
  greetSub:   { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  cloudBadge: { width: 50, height: 50 },

  // Presence
  presenceCard: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 14, gap: 10 },
  presenceEmoji:{ fontSize: 22, marginTop: 2 },
  presenceBody: { flex: 1 },
  presenceText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  presenceHint: { fontSize: 11, fontWeight: '600', marginTop: 6 },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  // Mood
  moodRow:    { marginBottom: 16 },
  moodChip:   { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, alignItems: 'center' },
  moodEmoji:  { fontSize: 18, marginBottom: 2 },
  moodLabel:  { fontSize: 10, fontWeight: '600' },

  // Reminders
  remindersRow: { marginBottom: 16 },
  reminderChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  reminderText: { fontSize: 12, fontWeight: '600' },

  // Room objects
  objectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  objectCard: { borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  objectIcon: { fontSize: 26, marginBottom: 6 },
  objectLabel:{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  objectSub:  { fontSize: 10, fontStyle: 'italic' },

  // Journal peek
  journalCard:       { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  journalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  journalCardTitle:  { fontSize: 14, fontWeight: '700' },
  journalCardOpen:   { fontSize: 12, fontWeight: '600' },
  journalLine:       { fontSize: 13, fontStyle: 'italic', marginBottom: 5, paddingLeft: 4 },
  journalHint:       { fontSize: 11, marginTop: 4 },

  // Advisor
  advisorCard:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, gap: 12 },
  advisorIcon:  { fontSize: 28 },
  advisorText:  { flex: 1 },
  advisorTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  advisorSub:   { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  advisorArrow: { fontSize: 26, fontWeight: '300' },

  // Wall affirmation
  wallAffirmation: { alignItems: 'center', paddingVertical: 16 },
  wallMain:        { fontSize: 13, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 4 },
  wallSub:         { fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
});
