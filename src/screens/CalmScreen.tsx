// src/screens/CalmScreen.tsx
// Se'kret Calm — landing home screen.
// Mood check-in → Calm Tools → Today's Plan → Calm Picks → Se'kret says.
// On-device only. No parent visibility.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Theme } from '@/types';
import { IMAGES, COMFORT_MESSAGES } from '@/constants/theme';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CalmScreenProps {
  t: Theme;
  mood: string | null;
  setMood: (mood: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ComponentType<any> | null;
  selectedSekret: string | null;
  onOpenBreathe: () => void;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const CALM_MOODS = [
  { id: 'anxious',     emoji: '😰', label: 'anxious' },
  { id: 'overwhelmed', emoji: '⛈️', label: 'overwhelmed' },
  { id: 'sad',         emoji: '😔', label: 'sad' },
  { id: 'stressed',    emoji: '😵‍💫', label: 'stressed' },
  { id: 'tired',       emoji: '😴', label: 'tired' },
  { id: 'calm',        emoji: '😊', label: 'calm' },
];

interface CalmTool {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  action: 'breathe' | 'screen';
  screen?: string;
}

const CALM_TOOLS: CalmTool[] = [
  { id: 'breathe', emoji: '💜', label: 'Breathe\nwith me', sub: '1–5 min',   action: 'breathe' },
  { id: 'ground',  emoji: '🌱', label: 'Ground\nYourself',  sub: '3–7 min',   action: 'screen', screen: 'comfort' },
  { id: 'release', emoji: '📝', label: 'Release\nIt Out',   sub: 'write + let go', action: 'screen', screen: 'pages' },
  { id: 'sleep',   emoji: '🌙', label: 'Sleep\nBetter',    sub: 'stories + sounds', action: 'screen', screen: 'cloud' },
  { id: 'sos',     emoji: '⚡', label: 'SOS\nCalm Now',    sub: '30 sec reset', action: 'breathe' },
];

const CALM_PICKS = [
  { id: 'rain',      emoji: '🌧️', label: 'late night rain',       dur: '20 min' },
  { id: 'waves',     emoji: '🌊', label: 'deep sleep waves',      dur: '30 min' },
  { id: 'piano',     emoji: '🎹', label: 'soft piano + heart',    dur: '25 min' },
  { id: 'story',     emoji: '🌙', label: 'bedtime story',         dur: '15 min' },
  { id: 'frequency', emoji: '✨', label: 'healing frequency',     dur: '20 min' },
];

const DEFAULT_PLAN = [
  { id: 'p1', label: 'Breathe for 2 minutes',   time: '7:30 PM', done: true },
  { id: 'p2', label: "Write down what's heavy",  time: '7:40 PM', done: true },
  { id: 'p3', label: 'Listen to a comfort sound', time: null,      done: false },
  { id: 'p4', label: 'Affirm something kind',    time: null,      done: false },
];

const SEKRET_SAYS = [
  "Rest is productive, too.\nYou don't have to earn peace.\nI'm proud of you for choosing you tonight.",
  "You made it through today.\nThat matters more than you know.",
  "You are allowed to take up space\nin your healing.",
  "Heavy days don't define you.\nYou're still here. That's everything.",
  "Slow down. You don't have to have\nit all figured out tonight.",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSekretAvatar(selectedSekret: string | null): number {
  switch (selectedSekret) {
    case 'sy': return IMAGES.rylaneNeutral;
    case 'cloud':  return IMAGES.cloud;
    case 'night':  return IMAGES.nightRelaxed ?? IMAGES.nightNeutral;
    default:       return IMAGES.rayleneNeutral;
  }
}

function getSekretName(selectedSekret: string | null): string {
  switch (selectedSekret) {
    case 'sy': return 'Sy';
    case 'cloud':  return "Cloud Se'kret";
    case 'night':  return "Night Se'kret";
    default:       return "Se'kret";
  }
}

function getTodayMessage(mood: string | null): string {
  if (!mood) return 'you made it through today. that matters.';
  switch (mood) {
    case 'anxious':
    case 'overwhelmed': return "take a breath. you don't have to carry it all.";
    case 'sad':         return "it's okay to feel this. i'm right here with you.";
    case 'stressed':    return "let's slow things down together.";
    case 'tired':       return "rest is allowed. you've done enough today.";
    case 'calm':        return "you're doing good. let's keep that energy going. 💜";
    default:            return 'you made it through today. that matters.';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CalmScreen({
  mood,
  setMood,
  setScreen,
  BottomNav,
  selectedSekret,
  onOpenBreathe,
}: CalmScreenProps) {
  const [planItems, setPlanItems] = useState(DEFAULT_PLAN);

  const todayMsg    = getTodayMessage(mood);
  const avatar      = getSekretAvatar(selectedSekret);
  const sekretName  = getSekretName(selectedSekret);
  const sekretSays  = useMemo(
    () => SEKRET_SAYS[Math.floor(Math.random() * SEKRET_SAYS.length)],
    [],
  );
  const comfortMsg  = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];

  function togglePlan(id: string) {
    setPlanItems(items => items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function handleTool(tool: CalmTool) {
    if (tool.action === 'breathe') { onOpenBreathe(); return; }
    if (tool.screen) setScreen(tool.screen);
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#0d0518', '#120825', '#0d0518']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >

          {/* ── Hero banner ─────────────────────────────────────── */}
          <View style={s.heroBanner}>
            <LinearGradient
              colors={['#1a0535', '#2a0a50', '#1a0535']}
              style={StyleSheet.absoluteFill}
            />
            <Image source={avatar} style={s.heroAvatar} resizeMode="contain" />
            <View style={s.heroText}>
              <Text style={s.heroKicker}>SE'KRET CALM  💜</Text>
              <Text style={s.heroTitle}>your calm.</Text>
              <Text style={s.heroTitle}>your reset.</Text>
              <Text style={s.heroTitle}>your safe place.</Text>
            </View>
            <View style={s.privateChip}>
              <Text style={s.privateText}>🔒 private</Text>
            </View>
          </View>

          {/* ── Greeting ────────────────────────────────────────── */}
          <View style={s.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greetName}>
                Take a deep breath. 💜
              </Text>
              <Text style={s.greetSub}>{todayMsg}</Text>
            </View>
            <TouchableOpacity style={s.checkInBtn} onPress={() => setScreen('history')}>
              <Text style={s.checkInBtnText}>check-in  ›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Mood picker ─────────────────────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>How are you feeling right now?</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={s.seeAll}>choose</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.moodRail}
          >
            {CALM_MOODS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[s.moodChip, mood === m.id && s.moodChipActive]}
                onPress={() => setMood(m.id)}
                activeOpacity={0.8}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, mood === m.id && s.moodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Calm Tools ──────────────────────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Calm Tools  ✦</Text>
            <TouchableOpacity onPress={() => setScreen('discover')}>
              <Text style={s.seeAll}>see all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.toolsRail}
          >
            {CALM_TOOLS.map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={s.toolCard}
                onPress={() => handleTool(tool)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(168,85,247,0.18)', 'rgba(109,40,217,0.08)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.toolEmoji}>{tool.emoji}</Text>
                <Text style={s.toolLabel}>{tool.label}</Text>
                <Text style={s.toolSub}>{tool.sub}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Today's Calm Plan ───────────────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Today's Calm Plan  💜</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={s.seeAll}>edit plan ✎</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.sectionSub}>small steps. big difference.</Text>

          <View style={s.planWrap}>
            <View style={s.planList}>
              {planItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={s.planRow}
                  onPress={() => togglePlan(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.checkbox, item.done && s.checkboxDone]}>
                    {item.done && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <Text style={[s.planLabel, item.done && s.planLabelDone]}>
                    {item.label}
                  </Text>
                  <Text style={s.planTime}>{item.time ?? '—'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.planNote}>
              <Text style={s.planNoteText}>
                you are{'\n'}allowed to{'\n'}take up space{'\n'}in your healing.
              </Text>
              <Text style={s.planNoteHeart}>💜</Text>
            </View>
          </View>

          {/* ── Calm Picks ──────────────────────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Calm Picks for You  ✦</Text>
            <TouchableOpacity onPress={onOpenBreathe}>
              <Text style={s.seeAll}>see all</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.sectionSub}>we picked these just for your vibe</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.picksRail}
          >
            {CALM_PICKS.map(pick => (
              <TouchableOpacity
                key={pick.id}
                style={s.pickCard}
                onPress={onOpenBreathe}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#1a0535', '#2d0a50']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.pickPlay}>
                  <Text style={s.pickPlayIcon}>▶</Text>
                </View>
                <Text style={s.pickEmoji}>{pick.emoji}</Text>
                <Text style={s.pickLabel}>{pick.label}</Text>
                <Text style={s.pickDur}>{pick.dur}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Se'kret says ────────────────────────────────────── */}
          <View style={s.sekretCard}>
            <LinearGradient
              colors={['rgba(168,85,247,0.14)', 'rgba(109,40,217,0.06)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.sekretHeader}>
              <Image source={avatar} style={s.sekretAvatar} resizeMode="contain" />
              <Text style={s.sekretName}>{sekretName} says  💜</Text>
            </View>
            <Text style={s.sekretMsg}>{sekretSays}</Text>
            <TouchableOpacity style={s.sekretHeart}>
              <Text style={s.sekretHeartText}>💜</Text>
            </TouchableOpacity>
          </View>

          {/* ── Comfort strip ───────────────────────────────────── */}
          <View style={s.comfortStrip}>
            <Text style={s.comfortEmoji}>{comfortMsg.emoji}</Text>
            <Text style={s.comfortText}>{comfortMsg.text}</Text>
          </View>

          <View style={{ height: BottomNav ? 80 : 40 }} />
        </ScrollView>
      </SafeAreaView>

      {BottomNav && <BottomNav active="calm" setScreen={setScreen} />}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#0d0518' },
  safe:  { flex: 1 },
  scroll: { paddingBottom: 24 },

  // Hero
  heroBanner: { height: 220, margin: 16, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', padding: 16 },
  heroAvatar: { width: 140, height: 200, marginRight: 12, marginBottom: -16 },
  heroText:   { flex: 1, justifyContent: 'center' },
  heroKicker: { color: '#c084fc', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle:  { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 26 },
  privateChip: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(168,85,247,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.35)' },
  privateText: { color: '#c4b5fd', fontSize: 11, fontWeight: '700' },

  // Greeting
  greetRow:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, gap: 12 },
  greetName:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  greetSub:      { color: '#7c5a9e', fontSize: 13, marginTop: 4 },
  checkInBtn:    { backgroundColor: 'rgba(168,85,247,0.18)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(168,85,247,0.35)' },
  checkInBtnText: { color: '#c4b5fd', fontSize: 13, fontWeight: '700' },

  // Section headers
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 4, marginTop: 8 },
  sectionTitle: { color: '#a855f7', fontSize: 16, fontWeight: '800' },
  sectionSub:   { color: '#5a3e72', fontSize: 12, marginHorizontal: 16, marginBottom: 10 },
  seeAll:       { color: '#7c5a9e', fontSize: 12, fontWeight: '700' },

  // Mood rail
  moodRail:  { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  moodChip:  { alignItems: 'center', width: 70, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(168,85,247,0.08)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.18)', gap: 6 },
  moodChipActive: { backgroundColor: 'rgba(168,85,247,0.22)', borderColor: '#a855f7' },
  moodEmoji: { fontSize: 28 },
  moodLabel: { color: '#5a3e72', fontSize: 11, fontWeight: '700' },
  moodLabelActive: { color: '#e9d5ff' },

  // Tools
  toolsRail: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  toolCard:  { width: 96, paddingVertical: 16, paddingHorizontal: 10, borderRadius: 18, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', gap: 6 },
  toolEmoji: { fontSize: 26 },
  toolLabel: { color: '#e9d5ff', fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 15 },
  toolSub:   { color: '#5a3e72', fontSize: 10, textAlign: 'center' },

  // Plan
  planWrap: { marginHorizontal: 16, marginBottom: 4, flexDirection: 'row', gap: 12 },
  planList: { flex: 1, gap: 10 },
  planRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(168,85,247,0.4)', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  planLabel: { flex: 1, color: '#c4b5fd', fontSize: 13, fontWeight: '600' },
  planLabelDone: { color: '#5a3e72', textDecorationLine: 'line-through' },
  planTime:  { color: '#5a3e72', fontSize: 11 },
  planNote:  { width: 110, backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.18)', justifyContent: 'space-between' },
  planNoteText: { color: '#c4b5fd', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  planNoteHeart: { fontSize: 16, alignSelf: 'flex-end', marginTop: 8 },

  // Picks
  picksRail: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  pickCard:  { width: 110, height: 130, borderRadius: 18, overflow: 'hidden', padding: 12, justifyContent: 'flex-end', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  pickPlay:  { position: 'absolute', top: 12, left: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(168,85,247,0.4)', alignItems: 'center', justifyContent: 'center' },
  pickPlayIcon: { color: '#fff', fontSize: 11 },
  pickEmoji: { fontSize: 22, marginBottom: 4 },
  pickLabel: { color: '#e9d5ff', fontSize: 11, fontWeight: '700', lineHeight: 15 },
  pickDur:   { color: '#7c5a9e', fontSize: 10, marginTop: 2 },

  // Se'kret says
  sekretCard:   { margin: 16, borderRadius: 20, overflow: 'hidden', padding: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  sekretHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sekretAvatar: { width: 36, height: 36, borderRadius: 18 },
  sekretName:   { color: '#a855f7', fontSize: 15, fontWeight: '900' },
  sekretMsg:    { color: '#e9d5ff', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  sekretHeart:  { alignSelf: 'flex-end', marginTop: 12 },
  sekretHeartText: { fontSize: 20 },

  // Comfort strip
  comfortStrip: { marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(168,85,247,0.06)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.15)' },
  comfortEmoji: { fontSize: 22 },
  comfortText:  { flex: 1, color: '#7c5a9e', fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
});
