// screens/ParentRoomScreen.tsx
// The Parent Room — the room IS the dashboard.
//
// Mom Room: warm lavender, soft cream, candles, journal, plants, family photos.
//   Feels like: "I finally sat down for five minutes."
// Dad Room: deep navy/indigo, warm wood, coffee, quiet strength.
//   Feels like: "I don't have to carry everything alone."
//
// Time of day drives the ambient palette — morning to deep night to rain.
// Parent Se'kret lives inside the room, appears naturally.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Text, View, ScrollView, TouchableOpacity,
  Animated, StyleSheet, Platform, Dimensions, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { IMAGES } from '../constants/theme';
import { PARENT_SEKRET_RESPONSES, PARENT_TOPICS } from '../constants/parentSekret';

const { width: W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────
export type ParentRoomStyle = 'mom' | 'dad';
type TimeSlot = 'morning' | 'day' | 'evening' | 'night' | 'rain';

interface RoomPalette {
  bg:      [string, string, string];
  windowTint: string;
  accent:  string;
  soft:    string;
  card:    string;
  wall:    string;
  text:    string;
  textSub: string;
  isLight: boolean;
}

// ─── Palettes ─────────────────────────────────────────────────────────────────
const PALETTES: Record<ParentRoomStyle, Record<TimeSlot, RoomPalette>> = {
  mom: {
    morning: { bg: ['#f0e8f5','#ddc8ec','#c8a8e0'], windowTint: '#fff5c8cc', accent: '#b389d0', soft: '#f5eeff', card: 'rgba(220,200,238,0.85)', wall: 'rgba(210,188,235,0.60)', text: '#2a1240', textSub: '#6040a0', isLight: true },
    day:     { bg: ['#e8dff5','#ccb5e5','#b498d8'], windowTint: '#f0e8d8cc', accent: '#9f7ac5', soft: '#ede4ff', card: 'rgba(210,190,232,0.85)', wall: 'rgba(200,178,228,0.60)', text: '#250f3a', textSub: '#5838a0', isLight: true },
    evening: { bg: ['#2d1845','#3f2260','#2a1545'], windowTint: '#d488306a', accent: '#c088d4', soft: '#f0d8ff', card: 'rgba(50,22,72,0.90)',    wall: 'rgba(60,28,85,0.70)',   text: '#f5eeff', textSub: '#d0a8f0', isLight: false },
    night:   { bg: ['#1a0f30','#22154a','#150c28'], windowTint: '#40409018', accent: '#9b72cf', soft: '#e8d5ff', card: 'rgba(28,14,48,0.92)',    wall: 'rgba(35,18,60,0.70)',   text: '#f0e8ff', textSub: '#c0a0e8', isLight: false },
    rain:    { bg: ['#1e1535','#28204a','#181030'], windowTint: '#4a5a8038', accent: '#8067b5', soft: '#d8ccf5', card: 'rgba(24,16,42,0.90)',    wall: 'rgba(32,22,55,0.70)',   text: '#ece5ff', textSub: '#b0a0d8', isLight: false },
  },
  dad: {
    morning: { bg: ['#f5f0e8','#e8d8c0','#d8c8a8'], windowTint: '#ffe8a0cc', accent: '#8b7355', soft: '#f8f2e5', card: 'rgba(240,226,200,0.85)', wall: 'rgba(230,215,188,0.60)', text: '#2a2010', textSub: '#5a4832', isLight: true },
    day:     { bg: ['#ece4d0','#d8c8a8','#c8b890'], windowTint: '#ffd880aa', accent: '#7a6248', soft: '#f5ece0', card: 'rgba(232,218,190,0.85)', wall: 'rgba(220,205,175,0.60)', text: '#251808', textSub: '#503c28', isLight: true },
    evening: { bg: ['#2a1a0a','#3d2810','#281808'], windowTint: '#c0501055', accent: '#c47e30', soft: '#f5d8a0', card: 'rgba(40,25,8,0.90)',    wall: 'rgba(50,32,10,0.70)',   text: '#f5e8d0', textSub: '#d4a860', isLight: false },
    night:   { bg: ['#070e1c','#0d1828','#050c18'], windowTint: '#1a3a6830', accent: '#4d7ab5', soft: '#b0c8e8', card: 'rgba(8,14,26,0.92)',    wall: 'rgba(12,20,38,0.70)',   text: '#e8f0ff', textSub: '#8ab0d8', isLight: false },
    rain:    { bg: ['#0c1018','#141c28','#0a0e18'], windowTint: '#2a3a5040', accent: '#3d5a80', soft: '#a0b8d0', card: 'rgba(10,14,22,0.90)',   wall: 'rgba(16,22,36,0.70)',   text: '#e0e8f5', textSub: '#7898c0', isLight: false },
  },
};

// ─── Room content ─────────────────────────────────────────────────────────────
const MOM_REMINDERS = [
  'breathe', 'be patient', 'stay present',
  'choose grace', 'trust the process', 'celebrate small wins',
];
const DAD_REMINDERS = [
  'lead with love', 'listen more', 'assume less',
  'encourage always', 'protect their peace', 'celebrate small wins',
];

const PARENT_MOODS = [
  { id: 'exhausted',   emoji: '😩', label: 'Exhausted' },
  { id: 'worried',     emoji: '😔', label: 'Worried' },
  { id: 'frustrated',  emoji: '😤', label: 'Frustrated' },
  { id: 'proud',       emoji: '🥹', label: 'Proud' },
  { id: 'hopeful',     emoji: '💜', label: 'Hopeful' },
  { id: 'relieved',    emoji: '😌', label: 'Relieved' },
  { id: 'learning',    emoji: '🌱', label: 'Learning' },
  { id: 'surviving',   emoji: '☕', label: 'Surviving' },
  { id: 'locked-in',   emoji: '🔥', label: 'Locked In' },
  { id: 'grateful',    emoji: '🙏', label: 'Grateful' },
];

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

const ROOM_OBJECTS: Array<{ icon: string; label: string; sub: string; route: string; mom?: string; dad?: string }> = [
  { icon: '📔', label: 'Pages',      sub: 'write it out',         route: 'pages' },
  { icon: '☕', label: 'Reflection', sub: 'daily check-in',       route: 'sekret' },
  { icon: '☁️', label: "Se'kret",   sub: 'your companion',       route: 'parentBridge' },
  { icon: '🌉', label: 'Bridge',     sub: "se'krets 2 tell",      route: 'parentBridge' },
  { icon: '🌐', label: 'Circle',     sub: 'parent circle',        route: 'circle' },
  { icon: '🏆', label: 'Wins',       sub: 'memory shelf',         route: 'growth' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTimeSlot(weatherMode?: string): TimeSlot {
  if (weatherMode === 'rain') return 'rain';
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function getGreeting(roomStyle: ParentRoomStyle, timeSlot: TimeSlot): string {
  const name = roomStyle === 'mom' ? 'Mama' : 'Dad';
  if (timeSlot === 'morning') return `Good morning, ${name}. 🌿`;
  if (timeSlot === 'day')     return `Hey ${name}. You're doing it. ☕`;
  if (timeSlot === 'evening') return `Evening, ${name}. Breathe. 💜`;
  if (timeSlot === 'rain')    return `It's a quiet one, ${name}. 🌧️`;
  return `Still up, ${name}? Rest matters too. 🌙`;
}

function getWallText(roomStyle: ParentRoomStyle): { main: string; sub: string } {
  if (roomStyle === 'dad') return { main: "FOCUS · DISCIPLINE · GROWTH", sub: "a good dad builds trust, not control" };
  return { main: "PROGRESS OVER PERFECTION", sub: "she's building a life she loves" };
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

  const timeSlot   = useMemo(() => getTimeSlot(weatherMode), [weatherMode]);
  const P          = PALETTES[parentRoomStyle][timeSlot];
  const reminders  = parentRoomStyle === 'mom' ? MOM_REMINDERS : DAD_REMINDERS;
  const wallText   = getWallText(parentRoomStyle);
  const greeting   = getGreeting(parentRoomStyle, timeSlot);

  const [presenceIdx, setPresenceIdx] = useState(() => Math.floor(Math.random() * SEKRET_PRESENCE.length));

  // ─── Animations ────────────────────────────────────────────────────────────
  const roomFade  = useRef(new Animated.Value(0)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;
  const breath    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(roomFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const breathScale   = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  const cardW = (W - 52) / 2;

  return (
    <View style={styles.root}>
      <LinearGradient colors={P.bg} style={StyleSheet.absoluteFill} />

      {/* Window light overlay */}
      <View style={[StyleSheet.absoluteFill, styles.windowOverlay, { backgroundColor: P.windowTint }]} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── GREETING ────────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: roomFade }}>
          <View style={styles.greetRow}>
            <Text style={[styles.greeting, { color: P.text }]}>{greeting}</Text>
            <TouchableOpacity
              style={[styles.roomToggle, { borderColor: P.accent + '88' }]}
              onPress={() => {}}
            >
              <Text style={[styles.roomToggleText, { color: P.accent }]}>
                {parentRoomStyle === 'mom' ? '💜 Mom Room' : '👑 Dad Room'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── WALL SECTION ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.wallSection, { backgroundColor: P.wall, opacity: roomFade }]}>
          <View style={styles.wallLeft}>
            <Text style={[styles.sekret2Tell, { color: P.accent }]}>SE'KRET 2 TELL</Text>
            <Text style={[styles.sekret2TellSub, { color: P.textSub }]}>we're raising humans, not robots</Text>
            <Text style={[styles.wallMainText, { color: P.text }]}>{wallText.main}</Text>
            <Text style={[styles.wallSubText, { color: P.textSub }]}>{wallText.sub}</Text>
          </View>
          <Animated.View style={[styles.cloudContainer, { transform: [{ scale: breathScale }], opacity: breathOpacity }]}>
            <Image source={IMAGES.cloudHeadphones} style={styles.cloudImg} resizeMode="contain" />
            <Text style={[styles.cloudLabel, { color: P.accent }]}>se'kret</Text>
          </Animated.View>
        </Animated.View>

        {/* ─── PARENT SE'KRET PRESENCE ──────────────────────────────────────── */}
        <Animated.View style={[styles.presenceCard, { backgroundColor: P.card, borderColor: P.accent + '55', opacity: cardFade }]}>
          <Text style={[styles.presenceIcon, { transform: [{ scale: 1 }] }]}>🎧</Text>
          <Text style={[styles.presenceText, { color: P.text }]}>
            "{SEKRET_PRESENCE[presenceIdx % SEKRET_PRESENCE.length]}"
          </Text>
          <TouchableOpacity onPress={() => setPresenceIdx(i => i + 1)}>
            <Text style={[styles.presenceNext, { color: P.textSub }]}>next thought →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── TODAY'S REMINDERS ────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={[styles.sectionLabel, { color: P.textSub }]}>Today's Reminders</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.remindersRow}>
            {reminders.map(r => (
              <View key={r} style={[styles.reminderChip, { backgroundColor: P.card, borderColor: P.accent + '44' }]}>
                <Text style={[styles.reminderText, { color: P.text }]}>{r}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ─── HOW YOU FEELING ──────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={[styles.sectionLabel, { color: P.textSub }]}>How you feeling today?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
            {PARENT_MOODS.map(m => {
              const active = parentMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodChip,
                    { backgroundColor: active ? P.accent + '33' : P.card, borderColor: active ? P.accent : P.accent + '44' },
                  ]}
                  onPress={() => setParentMood(m.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: active ? P.accent : P.textSub }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ─── ROOM OBJECTS ─────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={[styles.sectionLabel, { color: P.textSub }]}>Your Room</Text>
          <View style={styles.objectGrid}>
            {ROOM_OBJECTS.map((obj) => (
              <TouchableOpacity
                key={obj.route + obj.label}
                style={[styles.objectCard, { width: cardW, backgroundColor: P.card, borderColor: P.accent + '55' }]}
                onPress={() => setScreen(obj.route)}
                activeOpacity={0.75}
              >
                <Text style={styles.objectIcon}>{obj.icon}</Text>
                <Text style={[styles.objectLabel, { color: P.text }]}>{obj.label}</Text>
                <Text style={[styles.objectSub, { color: P.textSub }]}>{obj.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ─── JOURNAL PEEK ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.journalPeek, { backgroundColor: P.card, borderColor: P.accent + '44', opacity: cardFade }]}>
          <View style={styles.journalPeekHeader}>
            <Text style={[styles.journalPeekTitle, { color: P.text }]}>
              {parentRoomStyle === 'mom' ? '📔 Mom Journal' : '📔 Dad Journal'}
            </Text>
            <TouchableOpacity onPress={() => setScreen('pages')}>
              <Text style={[styles.journalPeekOpen, { color: P.accent }]}>open →</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.journalPeekLine, { color: P.textSub }]}>today I felt: ___</Text>
          <Text style={[styles.journalPeekLine, { color: P.textSub }]}>win today: ___</Text>
          <Text style={[styles.journalPeekHint, { color: P.accent + 'aa' }]}>tap to write · it's okay to not have it all figured out ♡</Text>
        </Animated.View>

        {/* ─── PARENT SE'KRET ADVISOR ENTRY ─────────────────────────────────── */}
        <Animated.View style={{ opacity: cardFade }}>
          <TouchableOpacity
            style={[styles.advisorCard, { backgroundColor: P.accent + '22', borderColor: P.accent + '88' }]}
            onPress={() => setScreen('parentBridge')}
            activeOpacity={0.8}
          >
            <Text style={[styles.advisorIcon]}>🎧</Text>
            <View style={styles.advisorText}>
              <Text style={[styles.advisorTitle, { color: P.text }]}>Parent Se'kret</Text>
              <Text style={[styles.advisorSub, { color: P.textSub }]}>
                sitting on the stoop with you. street-smart. real.
              </Text>
            </View>
            <Text style={[styles.advisorArrow, { color: P.accent }]}>›</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      {BottomNav}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, padding: 16, paddingTop: Platform.OS === 'ios' ? 58 : 38, paddingBottom: 32 },

  windowOverlay: { top: 0, height: 180 },

  // Greeting row
  greetRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  greeting:       { fontSize: 17, fontWeight: '700', flex: 1, lineHeight: 24 },
  roomToggle:     { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  roomToggleText: { fontSize: 12, fontWeight: '700' },

  // Wall section
  wallSection:    { borderRadius: 18, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  wallLeft:       { flex: 1, paddingRight: 8 },
  sekret2Tell:    { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
  sekret2TellSub: { fontSize: 10, fontStyle: 'italic', marginBottom: 8 },
  wallMainText:   { fontSize: 14, fontWeight: '800', lineHeight: 20, marginBottom: 4 },
  wallSubText:    { fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  cloudContainer: { alignItems: 'center' },
  cloudImg:       { width: 56, height: 56 },
  cloudLabel:     { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  // Presence card
  presenceCard:   { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  presenceIcon:   { fontSize: 24, marginTop: 2 },
  presenceText:   { flex: 1, fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  presenceNext:   { fontSize: 11, fontWeight: '600', marginTop: 6 },

  // Reminders
  sectionLabel:   { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  remindersRow:   { marginBottom: 16 },
  reminderChip:   { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  reminderText:   { fontSize: 12, fontWeight: '600' },

  // Mood
  moodRow:        { marginBottom: 16 },
  moodChip:       { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, alignItems: 'center' },
  moodEmoji:      { fontSize: 18, marginBottom: 2 },
  moodLabel:      { fontSize: 10, fontWeight: '600' },

  // Room objects grid
  objectGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  objectCard:     { borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  objectIcon:     { fontSize: 28, marginBottom: 6 },
  objectLabel:    { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  objectSub:      { fontSize: 11, fontStyle: 'italic' },

  // Journal peek
  journalPeek:       { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  journalPeekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  journalPeekTitle:  { fontSize: 14, fontWeight: '700' },
  journalPeekOpen:   { fontSize: 12, fontWeight: '600' },
  journalPeekLine:   { fontSize: 13, fontStyle: 'italic', marginBottom: 5, paddingLeft: 4 },
  journalPeekHint:   { fontSize: 11, marginTop: 6 },

  // Advisor entry
  advisorCard:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 8, gap: 12 },
  advisorIcon:  { fontSize: 28 },
  advisorText:  { flex: 1 },
  advisorTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  advisorSub:   { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  advisorArrow: { fontSize: 24, fontWeight: '300' },
});
