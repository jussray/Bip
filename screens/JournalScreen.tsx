// screens/JournalScreen.tsx
// Se'kret Bip — Write It Out (Se'kret Pages)
// Vision: Late-night diary. Cozy desk, notebook, candle. Raylene appears here most.
// No pressure. No judgment. Private emotional dumping ground.
//
// Polish pass (2026-06-07):
//   - Time-of-day backdrop via getRoomBg() — morning / day / evening / night
//   - Real LinearGradient scrim (replaces flat overlay)
//   - Character-aware copy: Raylene soft, Rylane direct
//   - Mood-tinted glow on input border + greeting card (Happy/Neutral/Sad/Angry/Tired)
//   - Selected mood tag also tints the glow
//   - Staggered card fade-ins (140ms apart)
//   - Time-of-day hero copy: "morning pages" → "afternoon download" → "evening unload" → "late-night thoughts"
//   - Companion presence pill ("raylene's here · late night")
//   - Scrapbook-style sticky-note for the calendar hint
//   - Curly quotes throughout
//
// Previous fixes preserved:
//   A1/A2/A3, B1/B2/B3/B4/B7/B8, C1/C2/C3/C4, D2

import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES, getRoomBg, type TimeOfDay } from '../constants/theme';
import type { JournalEntry } from '../types/bridge';
import {
  Text, TouchableOpacity, ScrollView,
  TextInput, View, Image, StyleSheet, Alert, Animated, Easing,
} from 'react-native';

// ── DEBUG ──────────────────────────────────────────────────────────────────
const DEBUG_HOTSPOTS = false;

// ── HOTSPOTS ───────────────────────────────────────────────────────────────
const HOTSPOTS = {
  journal:  { bottom: '6%', left: '26%', width: '40%', height: '22%', label: 'Journal 📖' },
  calendar: { top: '6%', right: '2%', width: '44%', height: '40%', label: 'Calendar 📅' },
};

// ── MOOD GLOW (same palette as HomeScreen) ─────────────────────────────────
const MOOD_GLOW: Record<string, string> = {
  Happy:   '#fbbf24',
  Neutral: '#c4b5fd',
  Sad:     '#7dd3fc',
  Angry:   '#f472b6',
  Tired:   '#6d28d9',
};

// ── TIME OF DAY ────────────────────────────────────────────────────────────
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5  && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const TIME_HERO: Record<TimeOfDay, { sub: string; main: string; badge: string }> = {
  morning: { sub: 'morning pages',       main: 'soft start ☀️',          badge: '☀️ morning' },
  day:     { sub: 'afternoon download',  main: 'unload it here 💜',      badge: '🌤️ day' },
  evening: { sub: 'evening unload',      main: 'let the day out 🌙',     badge: '🌆 evening' },
  night:   { sub: 'late-night thoughts', main: 'Se’kret Pages 💜',  badge: '🌙 night' },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
const getDynamicTags = (selectedSekret: string) => {
  if (selectedSekret === 'rylane')  return ['focused', 'mind heavy', 'protecting my peace', 'trying harder', 'locked in', 'building myself'];
  if (selectedSekret === 'raylene') return ['soft but strong', 'healing', 'trying my best', 'late night thoughts', 'emotional', 'peaceful'];
  if (selectedSekret === 'soft')    return ['soft but strong', 'healing', 'trying my best', 'late night thoughts', 'emotional', 'peaceful'];
  if (selectedSekret === 'cloud')   return ['resting', 'breathing', 'quiet', 'healing', 'calm', 'soft day'];
  return ['good vibes', 'overthinking', 'protecting my peace', 'growing', 'learning myself', 'late night thoughts'];
};

const CHECK_IN_MOODS = ['worse', 'still heavy', 'a little better', 'better', 'okay'];

// ── Props ──────────────────────────────────────────────────────────────────
interface JournalScreenProps {
  journalText:       string;
  setJournalText:    (text: string) => void;
  journalEntries:    JournalEntry[];
  saveJournalEntry:  () => void;
  mood:              string;
  t:                 Record<string, any>;
  currentSekret?:    Record<string, any>;
  selectedSekret?:   string;
  setScreen:         (screen: string) => void;
  BottomNav:         React.ReactNode;
}

export function JournalScreen({
  journalText, setJournalText, journalEntries, saveJournalEntry,
  mood, t, currentSekret, selectedSekret = 'raylene',
  setScreen, BottomNav,
}: JournalScreenProps) {

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInMood, setCheckInMood] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const hour       = new Date().getHours();
  const timeOfDay  = getTimeOfDay(hour);
  const hero       = TIME_HERO[timeOfDay];
  const isRylane   = selectedSekret === 'rylane';
  const character  = isRylane ? 'rylane' : 'raylene';
  const charLabel  = isRylane ? 'rylane' : 'raylene';
  const roomArt    = getRoomBg(character, timeOfDay);
  const moodGlow   = MOOD_GLOW[mood] ?? MOOD_GLOW.Neutral;
  const tagGlow    = selectedTag ? '#a855f7' : moodGlow;

  // Staggered entrance ───────────────────────────────────────────────────────
  const cards = useRef([0, 0, 0, 0, 0].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(140, cards.map(v =>
      Animated.timing(v, {
        toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      })
    )).start();
  }, []);
  const cardAnim = (i: number) => ({
    opacity: cards[i],
    transform: [{ translateY: cards[i].interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  });

  // Companion breath loop ───────────────────────────────────────────────────
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const breathStyle = {
    opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
    transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
  };

  // Listening reply variants ────────────────────────────────────────────────
  const listeningCopy = isRylane
    ? 'Heavy day. You don’t gotta carry it solo — I see you putting it down. That’s real.'
    : 'That sounds heavy. You’ve been carrying a lot quietly. I’m glad you let some of it out.';

  const greetingCopy = isRylane
    ? { title: 'Lock in. Write it raw.', sub: 'No filter. No proof-reading. Just truth.' }
    : { title: 'Write freely.',           sub: 'No pressure. No perfect wording. Just honesty.' };

  const btn = () => [styles.btn, { backgroundColor: t.accent, shadowColor: moodGlow }] as any;

  const handleSave = () => {
    saveJournalEntry();
    setShowCheckIn(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: '#0d0914' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Room with hotspots ─────────────────────────────────────── */}
        <View style={styles.roomWrap} pointerEvents="box-none">
          <Image source={roomArt} style={styles.roomImage} resizeMode="cover" blurRadius={1.5} />

          {/* Mood-tinted scrim — top */}
          <View
            style={[styles.moodScrim, { backgroundColor: moodGlow + '14' }]}
            pointerEvents="none"
          />

          {/* Real gradient bottom fade */}
          <LinearGradient
            colors={['transparent', 'rgba(13,9,20,0.55)', 'rgba(13,9,20,0.95)']}
            style={styles.roomGradient}
            pointerEvents="none"
          />

          <View style={styles.timeBadge} pointerEvents="none">
            <Text style={styles.timeBadgeText}>{hero.badge}</Text>
          </View>

          {/* Companion presence pill */}
          <Animated.View style={[styles.presencePill, breathStyle]} pointerEvents="none">
            <Text style={styles.presenceText}>
              {charLabel}’s here · {timeOfDay === 'night' ? 'late night' : timeOfDay}
            </Text>
          </Animated.View>

          <View style={styles.roomTitle} pointerEvents="none">
            <Text style={styles.roomTitleSub}>{hero.sub}</Text>
            <Text style={[styles.roomTitleMain, { textShadowColor: moodGlow + '99' }]}>
              {hero.main}
            </Text>
          </View>

          {/* HOTSPOT — Journal (already here) */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { bottom: HOTSPOTS.journal.bottom, left: HOTSPOTS.journal.left, width: HOTSPOTS.journal.width, height: HOTSPOTS.journal.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => {/* already on journal */}}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.journal.label}</Text>}
          </TouchableOpacity>

          {/* HOTSPOT — Calendar */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { top: HOTSPOTS.calendar.top, right: HOTSPOTS.calendar.right, width: HOTSPOTS.calendar.width, height: HOTSPOTS.calendar.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => setScreen('bippin2')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.calendar.label}</Text>}
          </TouchableOpacity>

          {/* Scrapbook sticky-note hint */}
          {!DEBUG_HOTSPOTS && (
            <View style={[styles.stickyHint, { top: '6%', right: '4%' }]} pointerEvents="none">
              <Text style={styles.stickyHintText}>tap calendar → Bippin2 📅</Text>
            </View>
          )}
        </View>

        {/* ── Greeting card ─────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.floatCard,
            { borderColor: tagGlow, backgroundColor: 'rgba(13,9,20,0.88)', shadowColor: tagGlow },
            cardAnim(0),
          ]}
        >
          <Text style={styles.floatCardEmoji}>{currentSekret?.emoji ?? '💜'}</Text>
          <Text style={[styles.floatCardText, { color: '#fff' }]}>{greetingCopy.title}</Text>
          <Text style={[styles.floatCardSub, { color: t.soft }]}>{greetingCopy.sub}</Text>
        </Animated.View>

        {/* ── Journal input ─────────────────────────────────────────── */}
        <Animated.View style={cardAnim(1)}>
          <TextInput
            style={[
              styles.journalInput,
              {
                backgroundColor: 'rgba(13,9,20,0.88)',
                borderColor: tagGlow,
                color: '#fff',
                shadowColor: tagGlow,
              },
            ]}
            placeholder={isRylane ? 'Lock in. Type it out…' : 'Bip it out softly…'}
            placeholderTextColor="#4a3d6b"
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />
        </Animated.View>

        {/* ── Media bip options ─────────────────────────────────────── */}
        <Animated.View style={[styles.mediaRow, cardAnim(2)]}>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
            onPress={() => setScreen('voiceBip')}
          >
            <Text style={styles.mediaEmoji}>🎙️</Text>
            <Text style={[styles.mediaBtnLabel, { color: t.soft }]}>Voice Bip</Text>
            <Text style={styles.mediaBtnSub}>30–60 sec</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
            onPress={() => Alert.alert('Video Bip', 'Video Bip is coming soon. 💜')}
          >
            <Text style={styles.mediaEmoji}>📹</Text>
            <Text style={[styles.mediaBtnLabel, { color: t.soft }]}>Video Bip</Text>
            <Text style={styles.mediaBtnSub}>30–60 sec</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
            onPress={() => Alert.alert('Photo Scrap', 'Photo scraps are coming soon. 🖼️')}
          >
            <Text style={styles.mediaEmoji}>🖼️</Text>
            <Text style={[styles.mediaBtnLabel, { color: t.soft }]}>Photo</Text>
            <Text style={styles.mediaBtnSub}>optional</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Se'kret is listening ──────────────────────────────────── */}
        {journalText.trim() ? (
          <Animated.View
            style={[
              styles.floatCard,
              { borderColor: 'rgba(168,85,247,0.5)', backgroundColor: 'rgba(13,9,20,0.9)', shadowColor: '#a855f7' },
              cardAnim(3),
            ]}
          >
            <Text style={[styles.replyLabel, { color: '#a855f7' }]}>
              {charLabel} is listening… 💜
            </Text>
            <Text style={[styles.replyText, { color: t.soft }]}>{listeningCopy}</Text>
            <View style={styles.replyBtns}>
              <TouchableOpacity
                style={[styles.replyBtn, { borderColor: t.accent }]}
                onPress={() => setScreen('sekret')}
              >
                <Text style={[styles.replyBtnText, { color: t.soft }]}>💜 Talk more</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.replyBtn, { borderColor: t.accent }]}
                onPress={() => setScreen('sekret')}
              >
                <Text style={[styles.replyBtnText, { color: t.soft }]}>✨ Advice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.replyBtn, { borderColor: t.accent }]}
                onPress={() => setScreen('comfort')}
              >
                <Text style={[styles.replyBtnText, { color: t.soft }]}>🫶 Comfort</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : null}

        {/* ── Mood tags ─────────────────────────────────────────────── */}
        <Animated.View style={cardAnim(4)}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Mood Tags</Text>
          <View style={styles.tagRow}>
            {getDynamicTags(selectedSekret).map(tag => {
              const active = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: active ? t.accent : 'rgba(13,9,20,0.82)',
                      borderColor: active ? '#a855f7' : t.accent,
                    },
                  ]}
                  onPress={() => setSelectedTag(active ? '' : tag)}
                >
                  <Text style={[styles.tagText, { color: active ? '#fff' : t.soft }]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.savePrivateRow}>
            <Text style={styles.savePrivateText}>🔒 Save Privately — only you & {charLabel} can see this.</Text>
          </View>

          <TouchableOpacity style={btn()} onPress={handleSave}>
            <Text style={styles.btnText}>Save Page 💜</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Today's Check-In ──────────────────────────────────────── */}
        {showCheckIn && (
          <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.92)' }]}>
            <Text style={[styles.floatCardText, { color: '#fff' }]}>Today’s Check-In</Text>
            <Text style={[styles.floatCardSub, { color: t.soft }]}>How are you feeling now?</Text>
            <View style={styles.checkInRow}>
              {CHECK_IN_MOODS.map(m => {
                const active = checkInMood === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.checkInChip,
                      { backgroundColor: active ? t.accent : 'rgba(13,9,20,0.7)', borderColor: t.accent },
                    ]}
                    onPress={() => setCheckInMood(m)}
                  >
                    <Text style={[styles.checkInChipText, { color: active ? '#fff' : t.soft }]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {checkInMood ? (
              <View style={styles.insightsRow}>
                <View style={[styles.insightBadge, { borderColor: t.accent }]}>
                  <Text style={[styles.insightLabel, { color: '#7c6899' }]}>Key Theme</Text>
                  <Text style={[styles.insightVal, { color: t.soft }]}>{selectedTag || mood}</Text>
                </View>
                <View style={[styles.insightBadge, { borderColor: t.accent }]}>
                  <Text style={[styles.insightLabel, { color: '#7c6899' }]}>Energy Level</Text>
                  <Text style={[styles.insightVal, { color: t.soft }]}>
                    {['worse','still heavy'].includes(checkInMood) ? 'low' : ['better','okay'].includes(checkInMood) ? 'rising' : 'low'}
                  </Text>
                </View>
                <View style={[styles.insightBadge, { borderColor: t.accent }]}>
                  <Text style={[styles.insightLabel, { color: '#7c6899' }]}>{charLabel}’s Tip</Text>
                  <Text style={[styles.insightVal, { color: t.soft }]}>
                    {['worse','still heavy'].includes(checkInMood)
                      ? (isRylane ? 'rest. recharge.' : 'rest + breathe')
                      : (isRylane ? 'lock in 💪' : 'keep going 💜')}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Saved pages ───────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Saved Pages</Text>
        {journalEntries.length === 0 ? (
          <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}>
            <Text style={[styles.emptyText, { color: '#7c6899' }]}>No pages yet. Your truth has a place here.</Text>
          </View>
        ) : (
          journalEntries.map(e => (
            <View key={e.id} style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.85)' }]}>
              <Text style={[styles.entryDate, { color: '#7c6899' }]}>
                {e.date}{e.time ? ` · ${e.time}` : ''} · {e.mood}
              </Text>
              <Text style={[styles.entryText, { color: '#f5f0ff' }]}>“{e.text}”</Text>
            </View>
          ))
        )}

      </ScrollView>
      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { paddingBottom: 100 },
  roomWrap:       { position: 'relative', width: '100%', height: 240, marginBottom: 16, overflow: 'hidden' },
  roomImage:      { width: '100%', height: '100%' },
  moodScrim:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  roomGradient:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  timeBadge:      { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timeBadgeText:  { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  presencePill:   {
    position: 'absolute', top: 10, right: 12,
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderColor: 'rgba(168,85,247,0.45)', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  presenceText:   { color: '#e9d5ff', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  roomTitle:      { position: 'absolute', bottom: 16, left: 18, right: 18 },
  roomTitleSub:   { fontSize: 10, color: '#a855f7', letterSpacing: 1.4, marginBottom: 4, textTransform: 'uppercase' },
  roomTitleMain:  { fontSize: 24, color: '#f5f0ff', fontWeight: '900', fontStyle: 'italic', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 },
  hotspot:        { position: 'absolute' },
  hotspotDebug:   { borderWidth: 2, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.18)' },
  debugLabel:     { color: '#f472b6', fontSize: 9, fontWeight: '900', padding: 2 },
  stickyHint:     {
    position: 'absolute',
    backgroundColor: '#fff8e7',
    borderColor: '#a855f7', borderWidth: 1, borderStyle: 'dashed',
    borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5,
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 1, height: 2 },
  },
  stickyHintText: { color: '#3d2563', fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  sectionTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 14, marginHorizontal: 16 },
  floatCard:      {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 18, borderWidth: 1, padding: 16,
    shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  floatCardEmoji: { fontSize: 28, marginBottom: 6 },
  floatCardText:  { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  floatCardSub:   { fontSize: 13, lineHeight: 19 },
  journalInput:   {
    marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 18,
    minHeight: 130, textAlignVertical: 'top', borderWidth: 1, fontSize: 14, lineHeight: 22,
    shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  mediaRow:       { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 14 },
  mediaBtn:       { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  mediaEmoji:     { fontSize: 20, marginBottom: 4 },
  mediaBtnLabel:  { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  mediaBtnSub:    { fontSize: 10, color: '#7c6899', marginTop: 2 },
  replyLabel:     { fontSize: 10, marginBottom: 6, fontWeight: '700', letterSpacing: 0.5 },
  replyText:      { fontSize: 13, lineHeight: 20, marginBottom: 12, fontStyle: 'italic' },
  replyBtns:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  replyBtn:       { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  replyBtnText:   { fontSize: 11, fontWeight: '600' },
  tagRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  tag:            { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  tagText:        { fontSize: 12, fontWeight: '600' },
  savePrivateRow: { marginHorizontal: 16, marginBottom: 10 },
  savePrivateText:{ fontSize: 11, color: '#7c6899', textAlign: 'center', fontStyle: 'italic' },
  btn:            {
    marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 18, alignItems: 'center',
    shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkInRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  checkInChip:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  checkInChipText:{ fontSize: 11, fontWeight: '600' },
  insightsRow:    { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  insightBadge:   { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, minWidth: 90, alignItems: 'center' },
  insightLabel:   { fontSize: 10, marginBottom: 3 },
  insightVal:     { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  entryDate:      { fontSize: 11, marginBottom: 6 },
  entryText:      { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  emptyText:      { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
});
