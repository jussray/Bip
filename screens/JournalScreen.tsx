// screens/JournalScreen.tsx
// Se'kret Bip — Se'kret Pages
//
// Fixes applied (2026-06-03):
//   A1 — prop names aligned with index.tsx: entries→journalEntries, saveEntry→saveJournalEntry
//         currentSekret + selectedSekret made optional; art removed (unused)
//   A2 — currentSekret?.emoji guard (null on first render)
//   A3 — art prop removed
//   B1 — entry time guarded: e.time ?? ''
//         NOTE: add time field to saveJournalEntry in index.tsx:
//           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//   B2 — "Se'kret replied" action buttons now navigate (setScreen)
//   B3 — "Today's Check-In" mood chips appear after save (useState showCheckIn)
//   B4 — "Entry Insights" strip added below check-in
//   B7 — Mood tag selection wired: selectedTag state, visual highlight
//   B8 — "Save Privately" lock note added above Save button
//   C1 — roomWrap gets pointerEvents="box-none"
//   C2 — hint View gets pointerEvents="none"
//   C3 — Video Bip + Photo Bip stubs with Alert
//   C4 — Se'kret listening reply buttons now navigate
//   D2 — getDynamicTags handles 'raylene' explicitly

import React, { useState } from 'react';
import { IMAGES } from '../constants/theme';
import type { JournalEntry } from '../types/bridge';
import {
  Text, TouchableOpacity, ScrollView,
  TextInput, View, Image, StyleSheet, Platform, Alert,
} from 'react-native';

// ── DEBUG ──────────────────────────────────────────────────────────────────
const DEBUG_HOTSPOTS = false;

// ── ROOM IMAGES ────────────────────────────────────────────────────────────
const ROOM_DAY   = IMAGES.raylene_Bippin2Day;
const ROOM_NIGHT = IMAGES.raylene_Bippin2Night;  // fallback until raylene-bippin2-night.png uploaded

// ── HOTSPOTS ───────────────────────────────────────────────────────────────
const HOTSPOTS = {
  journal:  { bottom: '6%', left: '26%', width: '40%', height: '22%', label: 'Journal 📖' },
  calendar: { top: '6%', right: '2%', width: '44%', height: '40%', label: 'Calendar 📅' },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
// Fix D2: 'raylene' case added explicitly
const getDynamicTags = (selectedSekret: string) => {
  if (selectedSekret === 'rylane') return ['focused', 'mind heavy', 'protecting my peace', 'trying harder', 'locked in', 'building myself'];
  if (selectedSekret === 'raylene') return ['soft but strong', 'healing', 'trying my best', 'late night thoughts', 'emotional', 'peaceful'];
  if (selectedSekret === 'soft')    return ['soft but strong', 'healing', 'trying my best', 'late night thoughts', 'emotional', 'peaceful'];
  if (selectedSekret === 'cloud')   return ['resting', 'breathing', 'quiet', 'healing', 'calm', 'soft day'];
  return ['good vibes', 'overthinking', 'protecting my peace', 'growing', 'learning myself', 'late night thoughts'];
};

const CHECK_IN_MOODS = ['worse', 'still heavy', 'a little better', 'better', 'okay'];

// JournalEntry imported from types/bridge.ts

// ── Props ──────────────────────────────────────────────────────────────────
// Fix A1: prop names match index.tsx exactly
// Fix A3: art removed
interface JournalScreenProps {
  journalText:       string;
  setJournalText:    (text: string) => void;
  journalEntries:    JournalEntry[];      // was: entries
  saveJournalEntry:  () => void;          // was: saveEntry
  mood:              string;
  t:                 Record<string, any>;
  currentSekret?:    Record<string, any>; // optional — null on first render
  selectedSekret?:   string;              // optional — defaults to 'raylene'
  setScreen:         (screen: string) => void;
  BottomNav:         React.ReactNode;
}

export function JournalScreen({
  journalText, setJournalText, journalEntries, saveJournalEntry,
  mood, t, currentSekret, selectedSekret = 'raylene',
  setScreen, BottomNav,
}: JournalScreenProps) {

  // B3: check-in panel after save
  const [showCheckIn,    setShowCheckIn]    = useState(false);
  const [checkInMood,    setCheckInMood]    = useState('');

  // B7: selected mood tag
  const [selectedTag,    setSelectedTag]    = useState('');

  const hour    = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  const roomArt = isNight ? ROOM_NIGHT : ROOM_DAY;

  const btn = () => [styles.btn, { backgroundColor: t.accent }] as any;

  const handleSave = () => {
    saveJournalEntry();
    setShowCheckIn(true);  // B3: reveal check-in after save
  };

  return (
    <View style={[styles.root, { backgroundColor: '#0d0914' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Room with hotspots ── */}
        {/* Fix C1: pointerEvents="box-none" so hotspots work on Android */}
        <View style={styles.roomWrap} pointerEvents="box-none">
          <Image source={roomArt} style={styles.roomImage} resizeMode="cover" />

          <View style={styles.roomGradient} pointerEvents="none" />

          <View style={styles.timeBadge} pointerEvents="none">
            <Text style={styles.timeBadgeText}>{isNight ? '🌙 night' : '☀️ day'}</Text>
          </View>

          <View style={styles.roomTitle} pointerEvents="none">
            <Text style={styles.roomTitleSub}>your thoughts deserve somewhere safe</Text>
            <Text style={styles.roomTitleMain}>Se'kret Pages 💜</Text>
          </View>

          {/* HOTSPOT — Journal (already here, no-op) */}
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

          {/* Fix C2: pointerEvents="none" so hint doesn't eat touches */}
          {!DEBUG_HOTSPOTS && (
            <View style={[styles.hint, { top: '4%', right: '48%' }]} pointerEvents="none">
              <Text style={styles.hintText}>tap calendar → Bippin2 📅</Text>
            </View>
          )}
        </View>

        {/* ── Se'kret greeting card ── */}
        <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.88)' }]}>
          {/* Fix A2: guard against null currentSekret */}
          <Text style={styles.floatCardEmoji}>{currentSekret?.emoji ?? '💜'}</Text>
          <Text style={[styles.floatCardText, { color: '#fff' }]}>Write freely.</Text>
          <Text style={[styles.floatCardSub, { color: t.soft }]}>No pressure. No perfect wording. Just honesty.</Text>
        </View>

        {/* ── Journal input ── */}
        <TextInput
          style={[styles.journalInput, { backgroundColor: 'rgba(13,9,20,0.88)', borderColor: t.accent, color: '#fff' }]}
          placeholder="Bip it out softly..."
          placeholderTextColor="#4a3d6b"
          multiline
          value={journalText}
          onChangeText={setJournalText}
        />

        {/* ── Media bip options ── */}
        <View style={styles.mediaRow}>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
            onPress={() => setScreen('voiceBip')}
          >
            <Text style={styles.mediaEmoji}>🎙️</Text>
            <Text style={[styles.mediaBtnLabel, { color: t.soft }]}>Voice Bip</Text>
            <Text style={styles.mediaBtnSub}>30–60 sec</Text>
          </TouchableOpacity>
          {/* Fix C3: Video Bip stub */}
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
            onPress={() => Alert.alert('Video Bip', 'Video Bip is coming soon. 💜')}
          >
            <Text style={styles.mediaEmoji}>📹</Text>
            <Text style={[styles.mediaBtnLabel, { color: t.soft }]}>Video Bip</Text>
            <Text style={styles.mediaBtnSub}>30–60 sec</Text>
          </TouchableOpacity>
          {/* Fix C3: Photo stub */}
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
            onPress={() => Alert.alert('Photo Scrap', 'Photo scraps are coming soon. 🖼️')}
          >
            <Text style={styles.mediaEmoji}>🖼️</Text>
            <Text style={[styles.mediaBtnLabel, { color: t.soft }]}>Photo</Text>
            <Text style={styles.mediaBtnSub}>optional</Text>
          </TouchableOpacity>
        </View>

        {/* ── Se'kret is listening — appears when there's text ── */}
        {journalText.trim() ? (
          <View style={[styles.floatCard, { borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(13,9,20,0.9)' }]}>
            <Text style={[styles.replyLabel, { color: '#a855f7' }]}>Se'kret is listening... 💜</Text>
            <Text style={[styles.replyText, { color: t.soft }]}>
              That sounds heavy. You've been carrying a lot quietly. I'm glad you let some of it out.
            </Text>
            {/* Fix C4: reply buttons now navigate */}
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
          </View>
        ) : null}

        {/* ── Mood tags ── */}
        {/* Fix B7: selectedTag state + visual highlight */}
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
                    borderColor: t.accent,
                  },
                ]}
                onPress={() => setSelectedTag(active ? '' : tag)}
              >
                <Text style={[styles.tagText, { color: active ? '#fff' : t.soft }]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fix B8: Save Privately note */}
        <View style={styles.savePrivateRow}>
          <Text style={styles.savePrivateText}>🔒 Save Privately — only you & Se'kret can see this.</Text>
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity style={btn()} onPress={handleSave}>
          <Text style={styles.btnText}>Save Page 💜</Text>
        </TouchableOpacity>

        {/* Fix B3: Today's Check-In — appears after save */}
        {showCheckIn && (
          <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.92)' }]}>
            <Text style={[styles.floatCardText, { color: '#fff' }]}>Today's Check-In</Text>
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

            {/* Fix B4: Entry Insights strip */}
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
                  <Text style={[styles.insightLabel, { color: '#7c6899' }]}>Se'kret Tip</Text>
                  <Text style={[styles.insightVal, { color: t.soft }]}>
                    {['worse','still heavy'].includes(checkInMood) ? 'rest + breathe' : 'keep going 💜'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Saved pages ── */}
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Saved Pages</Text>
        {journalEntries.length === 0 ? (
          <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}>
            <Text style={[styles.emptyText, { color: '#7c6899' }]}>No pages yet. Your truth has a place here.</Text>
          </View>
        ) : (
          journalEntries.map(e => (
            <View key={e.id} style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.85)' }]}>
              {/* Fix B1: guard e.time which may be missing from older entries */}
              <Text style={[styles.entryDate, { color: '#7c6899' }]}>
                {e.date}{e.time ? ` • ${e.time}` : ''} • {e.mood}
              </Text>
              <Text style={[styles.entryText, { color: '#f5f0ff' }]}>"{e.text}"</Text>
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
  roomWrap:       { position: 'relative', width: '100%', height: 220, marginBottom: 16, overflow: 'hidden' },
  roomImage:      { width: '100%', height: '100%' },
  roomGradient:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(13,9,20,0.6)' },
  timeBadge:      { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timeBadgeText:  { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  roomTitle:      { position: 'absolute', bottom: 14, left: 16 },
  roomTitleSub:   { fontSize: 10, color: '#a855f7', letterSpacing: 1, marginBottom: 2 },
  roomTitleMain:  { fontSize: 22, color: '#f472b6', fontWeight: '900', fontStyle: 'italic' },
  hotspot:        { position: 'absolute' },
  hotspotDebug:   { borderWidth: 2, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.18)' },
  debugLabel:     { color: '#f472b6', fontSize: 9, fontWeight: '900', padding: 2 },
  hint:           { position: 'absolute', backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  hintText:       { color: '#c4b5fd', fontSize: 10, fontWeight: '600' },
  sectionTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 14, marginHorizontal: 16 },
  floatCard:      { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
  floatCardEmoji: { fontSize: 28, marginBottom: 6 },
  floatCardText:  { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  floatCardSub:   { fontSize: 13, lineHeight: 19 },
  journalInput:   { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 18, minHeight: 130, textAlignVertical: 'top', borderWidth: 1, fontSize: 14, lineHeight: 22 },
  mediaRow:       { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 14 },
  mediaBtn:       { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  mediaEmoji:     { fontSize: 20, marginBottom: 4 },
  mediaBtnLabel:  { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  mediaBtnSub:    { fontSize: 10, color: '#7c6899', marginTop: 2 },
  replyLabel:     { fontSize: 10, marginBottom: 6, fontWeight: '700' },
  replyText:      { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  replyBtns:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  replyBtn:       { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  replyBtnText:   { fontSize: 11, fontWeight: '600' },
  tagRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  tag:            { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  tagText:        { fontSize: 12, fontWeight: '600' },
  savePrivateRow: { marginHorizontal: 16, marginBottom: 10 },
  savePrivateText:{ fontSize: 11, color: '#7c6899', textAlign: 'center' },
  btn:            { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 18, alignItems: 'center' },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Check-in
  checkInRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  checkInChip:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  checkInChipText:{ fontSize: 11, fontWeight: '600' },
  // Insights
  insightsRow:    { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  insightBadge:   { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, minWidth: 90, alignItems: 'center' },
  insightLabel:   { fontSize: 10, marginBottom: 3 },
  insightVal:     { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  // Saved entries
  entryDate:      { fontSize: 11, marginBottom: 6 },
  entryText:      { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  emptyText:      { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
});
