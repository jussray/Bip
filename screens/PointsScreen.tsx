// screens/PointsScreen.tsx
// Se'kret Bip — Bip Points
//
// Phase 2 build. NOT a gamified leaderboard. NOT a streak-to-beat. This is a
// soft receipts page: "here's what you earned just by showing up for
// yourself." Points are derived from the existing activity logs (mood,
// journal, voice, calm, comfort, circle, crew check-ins). No backend needed.
//
// Voice:
//   • Rylane: "the reps stack. respect."
//   • Raylene: "soft points 💜 you earned every single one."
//
// Tiers are emotional, not competitive:
//   • cloud just forming   (0–49)
//   • cloud is here        (50–149)
//   • soft sky             (150–349)
//   • full moon energy     (350–749)
//   • whole night sky      (750+)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { snapshotPoints, fetchPointsHistory, syncTeenActivitySummary, type PointsHistoryEntry } from '@/utils/sync';
import {
  Text, TouchableOpacity, ScrollView, View,
  ImageBackground, Animated, Easing, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRoomBg, TimeOfDay } from '../constants/theme';
import { glowForMood as glowFor } from '../constants/moodGlow';
import type {
  MoodEntry, JournalEntry, VoiceNote, CirclePost,
  ComfortSession, CrewCheckIn,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// ── Point values (small, soft, not addictive) ────────────────────────────────
const PT_MOOD     = 2;
const PT_JOURNAL  = 5;
const PT_VOICE    = 5;
const PT_CIRCLE   = 4;
const PT_COMFORT  = 3;  // per session log
const PT_CREW     = 6;  // crew check-in = bigger, accountability is hard
const PT_STREAK   = 3;  // per day of current streak

interface Tier {
  key: string;
  label: string;
  min: number;
  max: number; // exclusive
  emoji: string;
  color: string;
}
const TIERS: Tier[] = [
  { key: 't0', label: 'cloud just forming', min: 0,    max: 50,   emoji: '\u{1F32B}\uFE0F', color: '#c4b5fd' },
  { key: 't1', label: 'cloud is here',      min: 50,   max: 150,  emoji: '☁\uFE0F',     color: '#7dd3fc' },
  { key: 't2', label: 'soft sky',           min: 150,  max: 350,  emoji: '\u{1F324}\uFE0F', color: '#f5b8cf' },
  { key: 't3', label: 'full moon energy',   min: 350,  max: 750,  emoji: '\u{1F319}',        color: '#fbbf24' },
  { key: 't4', label: 'whole night sky',    min: 750,  max: 9999999, emoji: '\u{2728}',     color: '#e879a3' },
];

function tierFor(pts: number): Tier {
  for (const t of TIERS) if (pts >= t.min && pts < t.max) return t;
  return TIERS[0];
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  t: Record<string, any>;
  mood: string;
  selectedSekret: 'rylane' | 'raylene' | string;
  moodHistory: MoodEntry[];
  journalEntries: JournalEntry[];
  voiceNotes: VoiceNote[];
  circlePosts: CirclePost[];
  comfortSessions: ComfortSession[];
  crewCheckIns: CrewCheckIn[];
  streakDays: number;
  setScreen: (s: string) => void;
  BottomNav: React.ReactNode;
}

export function PointsScreen({
  t, mood, selectedSekret,
  moodHistory, journalEntries, voiceNotes, circlePosts,
  comfortSessions, crewCheckIns, streakDays,
  setScreen, BottomNav,
}: Props) {
  const isRylane = selectedSekret === 'rylane';
  const tod = timeOfDay();
  const bg = getRoomBg(isRylane ? 'rylane' : 'raylene', tod);
  const glow = glowFor(mood);
  const accent = isRylane ? '#4DA3FF' : '#e879a3';
  const softAccent = isRylane ? '#b6dcff' : '#f5b8cf';
  const cardBg = isRylane ? 'rgba(10,20,40,0.82)' : 'rgba(40,15,40,0.82)';

  // ── Compute points ─────────────────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const moodPts    = (moodHistory?.length    || 0) * PT_MOOD;
    const journalPts = (journalEntries?.length || 0) * PT_JOURNAL;
    const voicePts   = (voiceNotes?.length     || 0) * PT_VOICE;
    const circlePts  = (circlePosts?.length    || 0) * PT_CIRCLE;
    const comfortPts = (comfortSessions?.length|| 0) * PT_COMFORT;
    const crewPts    = (crewCheckIns?.length   || 0) * PT_CREW;
    const streakPts  = Math.max(0, streakDays) * PT_STREAK;
    const total = moodPts + journalPts + voicePts + circlePts + comfortPts + crewPts + streakPts;
    return {
      total,
      rows: [
        { key: 'mood',    label: 'mood logs',        each: PT_MOOD,    count: moodHistory?.length    || 0, pts: moodPts,    emoji: '\u{1F4AD}' },
        { key: 'journal', label: 'journal entries',  each: PT_JOURNAL, count: journalEntries?.length || 0, pts: journalPts, emoji: '\u{1F4D3}' },
        { key: 'voice',   label: 'voice bips',       each: PT_VOICE,   count: voiceNotes?.length     || 0, pts: voicePts,   emoji: '\u{1F3A4}' },
        { key: 'circle',  label: 'circle drops',     each: PT_CIRCLE,  count: circlePosts?.length    || 0, pts: circlePts,  emoji: '\u{1F32B}\uFE0F' },
        { key: 'comfort', label: 'comfort sessions', each: PT_COMFORT, count: comfortSessions?.length|| 0, pts: comfortPts, emoji: '\u{1F90D}' },
        { key: 'crew',    label: 'crew check-ins',   each: PT_CREW,    count: crewCheckIns?.length   || 0, pts: crewPts,    emoji: '\u{1F91D}' },
        { key: 'streak',  label: 'streak days',      each: PT_STREAK,  count: Math.max(0, streakDays),       pts: streakPts,  emoji: '\u{1F319}' },
      ],
    };
  }, [moodHistory, journalEntries, voiceNotes, circlePosts, comfortSessions, crewCheckIns, streakDays]);

  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);

  // Snapshot current points total to Supabase for cross-device history
  useEffect(() => {
    if (breakdown.total > 0) void snapshotPoints(breakdown.total);
  }, [breakdown.total]);

  // Load 30-day history for chart
  useEffect(() => {
    fetchPointsHistory(30).then(setPointsHistory).catch(() => {});
  }, []);

  // Sync wellbeing summary for parent dashboard (privacy-safe aggregates only)
  useEffect(() => {
    if (breakdown.total === 0) return;
    const tierKey = tierFor(breakdown.total).key;
    void syncTeenActivitySummary({
      streakDays,
      sessionCount: comfortSessions?.length ?? 0,
      pointsTier: tierKey,
    });
  }, [breakdown.total, streakDays, comfortSessions]);

  const tier = tierFor(breakdown.total);
  const tierIdx = TIERS.findIndex(t2 => t2.key === tier.key);
  const nextTier = TIERS[tierIdx + 1];
  const progress = nextTier
    ? Math.min(1, Math.max(0, (breakdown.total - tier.min) / (nextTier.min - tier.min)))
    : 1;
  const pointsToNext = nextTier ? Math.max(0, nextTier.min - breakdown.total) : 0;

  // recent earning log = chronological merge of last 6 events
  const recentLog = useMemo(() => {
    type Ev = { id: string; ts: number; label: string; pts: number; emoji: string; meta: string };
    const evs: Ev[] = [];
    for (const m of (moodHistory || []).slice(0, 8)) {
      const ts = new Date(`${m.date} ${m.time}`).getTime();
      evs.push({ id: `m${m.id}`, ts, label: 'mood logged', pts: PT_MOOD, emoji: '\u{1F4AD}', meta: m.mood });
    }
    for (const j of (journalEntries || []).slice(0, 6)) {
      const ts = new Date(`${j.date} ${j.time}`).getTime();
      evs.push({ id: `j${j.id}`, ts, label: 'journal entry', pts: PT_JOURNAL, emoji: '\u{1F4D3}', meta: j.text?.slice(0, 30) || '' });
    }
    for (const v of (voiceNotes || []).slice(0, 6)) {
      const ts = new Date(`${v.date} ${v.time}`).getTime();
      evs.push({ id: `v${v.id}`, ts, label: 'voice bip', pts: PT_VOICE, emoji: '\u{1F3A4}', meta: v.title || '' });
    }
    for (const c of (circlePosts || []).slice(0, 6)) {
      const ts = new Date(`${c.date} ${c.time}`).getTime();
      evs.push({ id: `c${c.id}`, ts, label: 'circle drop', pts: PT_CIRCLE, emoji: '\u{1F32B}\uFE0F', meta: c.text?.slice(0, 30) || '' });
    }
    for (const s of (comfortSessions || []).slice(0, 8)) {
      const ts = new Date(`${s.date} ${s.time}`).getTime();
      evs.push({ id: `s${s.id}`, ts, label: `${s.type} session`, pts: PT_COMFORT, emoji: '\u{1F90D}', meta: '' });
    }
    for (const k of (crewCheckIns || []).slice(0, 6)) {
      const ts = new Date(`${k.date} ${k.time}`).getTime();
      evs.push({ id: `k${k.id}`, ts, label: 'crew check-in', pts: PT_CREW, emoji: '\u{1F91D}', meta: k.note?.slice(0, 30) || '' });
    }
    return evs
      .filter(e => !isNaN(e.ts))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8);
  }, [moodHistory, journalEntries, voiceNotes, circlePosts, comfortSessions, crewCheckIns]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const heroAnim  = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const card4Anim = useRef(new Animated.Value(0)).current;
  const histAnim  = useRef(new Animated.Value(0)).current;
  const noteAnim  = useRef(new Animated.Value(0)).current;
  const breath    = useRef(new Animated.Value(0)).current;
  const progAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(heroAnim,  { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(card1Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(card2Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(card3Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(card4Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(histAnim,  { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(noteAnim,  { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    Animated.timing(progAnim, { toValue: progress, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [breath, heroAnim, card1Anim, card2Anim, card3Anim, card4Anim, histAnim, noteAnim, progAnim, progress]);

  const enter = (a: Animated.Value) => ({
    opacity: a,
    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });
  const breathScale   = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });

  // ── Copy ───────────────────────────────────────────────────────────────────
  const heroTitle = isRylane ? 'bip points' : 'bip points \u{1F49C}';
  const heroSub = isRylane
    ? 'soft receipts. not a score. every rep counts.'
    : 'soft points \u{1F49C} not a score, just proof you showed up.';

  const tierCopy = isRylane
    ? `tier: ${tier.label}`
    : `tier: ${tier.label} \u{1F49C}`;

  const nextCopy = nextTier
    ? (isRylane
        ? `${pointsToNext} more pts → ${nextTier.label}`
        : `${pointsToNext} more pts → ${nextTier.label} \u{1F49C}`)
    : (isRylane
        ? 'top tier reached. respect.'
        : 'top tier reached \u{1F49C} you are the whole night sky');

  const stickyAffirmation = isRylane
    ? '“the points are receipts, not a leaderboard.”'
    : '"these aren\'t scores. they\'re soft proof you\'re you-ing well."';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <LinearGradient
        colors={['rgba(20,10,40,0.55)', 'rgba(40,20,70,0.72)', 'rgba(15,8,30,0.92)']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <Animated.View style={[styles.hero, enter(heroAnim)]}>
          <Animated.View
            style={[
              styles.pill,
              { borderColor: softAccent, backgroundColor: 'rgba(20,12,40,0.55)' },
              { opacity: breathOpacity, transform: [{ scale: breathScale }] },
            ]}
          >
            <Text style={[styles.pillText, { color: softAccent }]}>
              {isRylane ? '\u{1F9CD} rylane is here' : '☁\uFE0F raylene is here'}
            </Text>
          </Animated.View>

          <Text style={[styles.heroTitle, { textShadowColor: glow }]}>{heroTitle}</Text>
          <Text style={styles.heroSub}>{heroSub}</Text>
        </Animated.View>

        {/* Big total + tier */}
        <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: softAccent }, enter(card1Anim)]}>
          <Text style={[styles.cardKicker, { color: softAccent }]}>your total</Text>
          <Text style={styles.bigNum}>{breakdown.total}</Text>
          <Text style={styles.tierLabel}>
            <Text>{tier.emoji}  </Text>
            <Text style={{ color: tier.color }}>{tierCopy}</Text>
          </Text>

          {/* progress bar to next tier */}
          <View style={styles.progTrack}>
            <Animated.View
              style={[
                styles.progFill,
                {
                  backgroundColor: tier.color,
                  width: progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
          <Text style={styles.nextLine}>{nextCopy}</Text>
        </Animated.View>

        {/* Breakdown */}
        <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: softAccent }, enter(card2Anim)]}>
          <Text style={[styles.cardKicker, { color: softAccent }]}>where it came from</Text>
          <View style={{ marginTop: 6, gap: 10 }}>
            {breakdown.rows.map(r => (
              <View key={r.key} style={styles.brRow}>
                <Text style={styles.brEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.brLabel}>{r.label}</Text>
                  <Text style={styles.brMeta}>{r.count} \u00d7 {r.each} pts</Text>
                </View>
                <Text style={[styles.brPts, { color: accent }]}>+{r.pts}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Tier ladder */}
        <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: softAccent }, enter(card3Anim)]}>
          <Text style={[styles.cardKicker, { color: softAccent }]}>tiers · emotional, not competitive</Text>
          {TIERS.map(t2 => {
            const reached = breakdown.total >= t2.min;
            const current = t2.key === tier.key;
            return (
              <View
                key={t2.key}
                style={[
                  styles.tierRow,
                  current && { backgroundColor: 'rgba(255,255,255,0.06)' },
                ]}
              >
                <Text style={styles.tierEmoji}>{t2.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, !reached && { opacity: 0.5 }, { color: reached ? t2.color : '#cfc6e8' }]}>
                    {t2.label}
                  </Text>
                  <Text style={styles.tierRange}>
                    {t2.min}{t2.max < 9000000 ? `–${t2.max - 1}` : '+'} pts
                  </Text>
                </View>
                {current && (
                  <Text style={[styles.tierBadge, { color: t2.color }]}>you're here</Text>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* Recent earning log */}
        <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: softAccent }, enter(card4Anim)]}>
          <Text style={[styles.cardKicker, { color: softAccent }]}>recently earned</Text>
          {recentLog.length === 0 ? (
            <Text style={styles.empty}>
              {isRylane ? 'no points yet. show up once and they start.' : 'no points yet. just show up once \u{1F49C}'}
            </Text>
          ) : (
            <View style={{ marginTop: 6, gap: 8 }}>
              {recentLog.map(e => (
                <View key={e.id} style={styles.logRow}>
                  <Text style={styles.logEmoji}>{e.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logLine}>{e.label}</Text>
                    {!!e.meta && <Text style={styles.logMeta} numberOfLines={1}>{e.meta}</Text>}
                  </View>
                  <Text style={[styles.logPts, { color: accent }]}>+{e.pts}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: accent, flex: 1 }]}
              onPress={() => setScreen('history')}
            >
              <Text style={styles.ctaText}>{isRylane ? 'see history →' : 'see history \u{1F49C}'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: 'rgba(255,255,255,0.12)', flex: 1, borderWidth: 1, borderColor: softAccent }]}
              onPress={() => setScreen('home')}
            >
              <Text style={styles.ctaText}>{isRylane ? 'back to room →' : 'back to room \u{1F49C}'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 30-day points history */}
        <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: softAccent }, enter(histAnim)]}>
          <Text style={[styles.cardKicker, { color: softAccent }]}>30-day history</Text>
          {pointsHistory.length === 0 ? (
            <Text style={styles.empty}>
              {isRylane ? 'no history yet. start and it tracks.' : 'no history yet. every day you show up it grows \u{1F49C}'}
            </Text>
          ) : (
            <>
              <View style={styles.histChart}>
                {(() => {
                  const maxVal = Math.max(...pointsHistory.map(e => e.total), 1);
                  return pointsHistory.map((e, i) => (
                    <View key={i} style={styles.histBarWrap}>
                      <View
                        style={[
                          styles.histBar,
                          {
                            height: Math.max(4, Math.round((e.total / maxVal) * 56)),
                            backgroundColor: i === pointsHistory.length - 1 ? tier.color : softAccent + '88',
                          },
                        ]}
                      />
                    </View>
                  ));
                })()}
              </View>
              <View style={styles.histLabels}>
                <Text style={styles.histLabel}>
                  {new Date(pointsHistory[0].captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.histLabel}>
                  {new Date(pointsHistory[pointsHistory.length - 1].captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Text style={[styles.histSub, { color: softAccent }]}>
                {breakdown.total} total · {pointsHistory.length} snapshots
              </Text>
            </>
          )}
        </Animated.View>

        {/* Scrapbook sticky note */}
        <Animated.View style={[styles.sticky, enter(noteAnim)]}>
          <Text style={styles.stickyText}>{stickyAffirmation}</Text>
          <Text style={styles.stickySig}>{isRylane ? '— rylane' : '— raylene'}</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
      {BottomNav}
    </ImageBackground>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bg:     { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}) },

  hero:      { alignItems: 'center', marginBottom: 22 },
  pill:      {
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12,
  },
  pillText:  { fontSize: 12, letterSpacing: 0.4 },
  heroTitle: {
    color: '#fff', fontSize: 28, fontWeight: '700',
    textAlign: 'center', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 },
    marginBottom: 8,
    ...(Platform.OS === 'web' ? ({ textShadow: '0 0 14px rgba(196,181,253,0.6)' } as any) : null),
  },
  heroSub:   { color: '#e9e4ff', fontSize: 14, textAlign: 'center', opacity: 0.9 },

  card: {
    borderRadius: 18, borderWidth: 1,
    padding: 18, marginBottom: 16,
  },
  cardKicker: { fontSize: 12, letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' },
  empty:      { color: '#cfc6e8', fontSize: 13, marginTop: 12, fontStyle: 'italic' },

  bigNum:    { color: '#fff', fontSize: 64, fontWeight: '700', textAlign: 'center', marginVertical: 4 },
  tierLabel: { textAlign: 'center', fontSize: 15, marginBottom: 14, color: '#e9e4ff' },

  progTrack: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progFill:  { height: '100%', borderRadius: 999 },
  nextLine:  { color: '#cfc6e8', fontSize: 13, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

  brRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brEmoji:   { fontSize: 18, width: 28, textAlign: 'center' },
  brLabel:   { color: '#fff', fontSize: 14, fontWeight: '600' },
  brMeta:    { color: '#9ea0c0', fontSize: 11, marginTop: 2 },
  brPts:     { fontSize: 16, fontWeight: '700' },

  tierRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10 },
  tierEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  tierName:  { fontSize: 14, fontWeight: '600' },
  tierRange: { color: '#9ea0c0', fontSize: 11, marginTop: 2 },
  tierBadge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  logRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logEmoji:  { fontSize: 18, width: 28, textAlign: 'center' },
  logLine:   { color: '#fff', fontSize: 14, fontWeight: '600' },
  logMeta:   { color: '#cfc6e8', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  logPts:    { fontSize: 14, fontWeight: '700' },

  ctaRow:    { flexDirection: 'row', gap: 10, marginTop: 16 },
  cta:       { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  ctaText:   { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },

  histChart:  { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 2, marginTop: 10, marginBottom: 4 },
  histBarWrap:{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  histBar:    { width: '100%', borderRadius: 2 },
  histLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  histLabel:  { color: '#9ea0c0', fontSize: 10 },
  histSub:    { fontSize: 11, fontStyle: 'italic', textAlign: 'center' },

  sticky: {
    backgroundColor: '#fff8e7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
    transform: [{ rotate: '-2deg' }],
    marginTop: 4,
    marginHorizontal: 8,
  },
  stickyText: { color: '#3b2a1a', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  stickySig:  { color: '#7a5a2a', fontSize: 12, marginTop: 6, textAlign: 'right' },
});
