import React, { useState } from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Image, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { getMoodEngine } from '../utils/moodEngine';

// ── DEBUG — flip to true to see hotspot outlines while testing ────────────
const DEBUG_HOTSPOTS = false;

// ── ROOM IMAGES ────────────────────────────────────────────────────────────
const ROOM_DAY   = require('../assets/images/raylene-bippin2-day.png');
const ROOM_NIGHT = require('../assets/images/raylene-bippin2-night.png');

// ── HOTSPOTS — all coordinates in one place, easy to tweak ────────────────
// Values are percentage strings so they scale with screen width
const HOTSPOTS = {
  calendar:    { top: '6%',  right: '2%',  width: '44%', height: '40%', label: 'Calendar 📅' },
  journal:     { bottom: '6%', left: '26%', width: '40%', height: '22%', label: 'Journal 📖' },
  stickyNotes: { top: '6%',  left: '2%',  width: '28%', height: '26%', label: 'Tips ✨' },
  teddyBear:   { bottom: '4%', right: '2%', width: '20%', height: '24%', label: 'Comfort 🧸' },
  cloud:       { top: '28%', left: '2%',  width: '16%', height: '18%', label: 'Cloud ☁️' },
};

const TIPS = [
  { emoji: '🌱', title: "growth is beautiful", body: "Your body is changing. That's not something to fear or hide." },
  { emoji: '💜', title: "self love isn't selfish", body: 'Taking care of yourself is how you show up for everyone else.' },
  { emoji: '🌙', title: 'rest is productive', body: 'You do not have to earn softness. Rest is part of becoming.' },
  { emoji: '☁️', title: 'be kind to your mind', body: "The thoughts that feel loudest at night are not the truth of you." },
  { emoji: '💫', title: 'you got this', body: "Not because it's easy. Because you're still here and still trying." },
];

const COMFORT = [
  "You've survived every hard day so far. That matters. 💜",
  "Rest is productive too. You are allowed to pause. ☁️",
  "Someone is glad you're still here tonight. 💙",
  "Bad moments are real. So is your strength. 🌧️",
  "You don't need to be perfect to be loved. ✨",
  "Your feelings are allowed here. 🫶",
  "Soft moment. Slow breath. Stay with me. 🕯️",
];

interface Bippin2ScreenProps {
  t: Record<string, any>;
  mood: string;
  growthPath: string;
  setGrowthPath: (path: string) => void;
  art: Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function Bippin2Screen({ t, mood, growthPath, setGrowthPath, art, setScreen, BottomNav }: Bippin2ScreenProps) {
  const [overlay, setOverlay]       = useState<'tips' | 'comfort' | null>(null);
  const [tipIdx, setTipIdx]         = useState(0);
  const [comfortIdx, setComfortIdx] = useState(0);

  const hour    = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  const roomArt = isNight ? ROOM_NIGHT : ROOM_DAY;

  if (growthPath === 'preferNotToSay') return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.logo}>Bippin2 ✨</Text>
        <Text style={styles.subtitle}>Choose your growth space.</Text>
        <View style={styles.choiceHero}><Text style={styles.bigEmoji}>🌱</Text></View>
        <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: t.card }]}>
          <Text style={[styles.floatCardText, { color: '#fff' }]}>This space adapts to you.</Text>
          <Text style={[styles.floatCardSub, { color: t.soft }]}>Pick the version that feels right. You can change it later.</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: t.accent }]} onPress={() => setGrowthPath('girl')}>
          <Text style={styles.btnText}>🌙 Womanhood</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: t.accent }]} onPress={() => setGrowthPath('boy')}>
          <Text style={styles.btnText}>⚡ Manhood</Text>
        </TouchableOpacity>
      </ScrollView>
      {BottomNav}
    </View>
  );

  const isGirl     = growthPath === 'girl';
  const moodEngine = getMoodEngine(mood);

  const featureItems = isGirl ? [
    { e: '🩸', l: 'first period support', fn: () => {} },
    { e: '🌙', l: 'cycle wellness',        fn: () => setScreen('periodCalendar') },
    { e: '💗', l: 'mood + body check-in',  fn: () => {} },
    { e: '🪷', l: 'comfort mode',           fn: () => setScreen('comfort') },
    { e: '☁️', l: "ask Se'kret",            fn: () => setScreen('sekret') },
    { e: '🔒', l: 'private journal',        fn: () => setScreen('pages') },
  ] : [
    { e: '🧍🏾', l: 'puberty guide',       fn: () => {} },
    { e: '💪🏾', l: 'body changes',        fn: () => {} },
    { e: '⭐',   l: 'confidence boost',    fn: () => {} },
    { e: '🧴',   l: 'hygiene + self-care', fn: () => {} },
    { e: '🧠',   l: 'mind check-in',       fn: () => {} },
    { e: '🔒',   l: 'private journal',     fn: () => setScreen('pages') },
  ];

  return (
    <View style={[styles.root, { backgroundColor: '#0d0914' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          style={[styles.changeBtn, { borderColor: t.accent }]}
          onPress={() => setGrowthPath('preferNotToSay')}
        >
          <Text style={[styles.changeBtnText, { color: t.soft }]}>↩️ Change Growth Space</Text>
        </TouchableOpacity>

        {/* ── Interactive Room ── */}
        <View style={styles.roomWrap}>
          <Image source={roomArt} style={styles.roomImage} resizeMode="cover" />

          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{isNight ? '🌙 night room' : '☀️ day room'}</Text>
          </View>

          {/* Calendar hotspot */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { top: HOTSPOTS.calendar.top, right: HOTSPOTS.calendar.right, width: HOTSPOTS.calendar.width, height: HOTSPOTS.calendar.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => setScreen('periodCalendar')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.calendar.label}</Text>}
          </TouchableOpacity>

          {/* Journal hotspot */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { bottom: HOTSPOTS.journal.bottom, left: HOTSPOTS.journal.left, width: HOTSPOTS.journal.width, height: HOTSPOTS.journal.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => setScreen('pages')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.journal.label}</Text>}
          </TouchableOpacity>

          {/* Sticky notes hotspot */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { top: HOTSPOTS.stickyNotes.top, left: HOTSPOTS.stickyNotes.left, width: HOTSPOTS.stickyNotes.width, height: HOTSPOTS.stickyNotes.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => setOverlay('tips')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.stickyNotes.label}</Text>}
          </TouchableOpacity>

          {/* Teddy bear hotspot */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { bottom: HOTSPOTS.teddyBear.bottom, right: HOTSPOTS.teddyBear.right, width: HOTSPOTS.teddyBear.width, height: HOTSPOTS.teddyBear.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => setOverlay('comfort')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.teddyBear.label}</Text>}
          </TouchableOpacity>

          {/* Cloud hotspot */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hotspot, { top: HOTSPOTS.cloud.top, left: HOTSPOTS.cloud.left, width: HOTSPOTS.cloud.width, height: HOTSPOTS.cloud.height }, DEBUG_HOTSPOTS && styles.hotspotDebug]}
            onPress={() => setScreen('cloudThoughts')}
          >
            {DEBUG_HOTSPOTS && <Text style={styles.debugLabel}>{HOTSPOTS.cloud.label}</Text>}
          </TouchableOpacity>

          {/* Floating hint labels — only visible when not in debug mode */}
          {!DEBUG_HOTSPOTS && (
            <>
              <View style={[styles.hint, { top: '4%', right: '48%' }]}>
                <Text style={styles.hintText}>tap calendar 📅</Text>
              </View>
              <View style={[styles.hint, { bottom: '26%', left: '28%' }]}>
                <Text style={styles.hintText}>tap journal 📖</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Mood engine card ── */}
        <View style={[styles.floatCard, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.88)' }]}>
          <Text style={[styles.floatCardSub, { color: t.soft }]}>{moodEngine.room} {moodEngine.emoji}</Text>
          <Text style={[styles.floatCardText, { color: '#fff' }]}>{moodEngine.title}</Text>
          <Text style={[styles.floatCardBody, { color: '#E2E8F0' }]}>{moodEngine.message}</Text>
          <Text style={[styles.floatCardBody, { color: t.soft, fontStyle: 'italic' }]}>→ {moodEngine.action}</Text>
        </View>

        {/* ── Feature sticky grid ── */}
        <View style={styles.stickyGrid}>
          {featureItems.map(item => (
            <TouchableOpacity
              key={item.l}
              style={[styles.stickyNote, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.82)' }]}
              onPress={item.fn}
            >
              <Text style={styles.stickyEmoji}>{item.e}</Text>
              <Text style={[styles.stickyLabel, { color: '#fff' }]}>{item.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Streak + Se'kret duo ── */}
        <View style={styles.duoRow}>
          <View style={[styles.polaroid, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.85)' }]}>
            <Text style={[styles.polaroidTitle, { color: '#fff' }]}>{isGirl ? 'connection streak' : 'focus streak'}</Text>
            <Text style={[styles.polaroidBig, { color: t.accent }]}>{isGirl ? '7 days' : '9 days'}</Text>
            <Text style={[styles.polaroidSub, { color: t.soft }]}>{isGirl ? "you're showing up for you." : 'consistency builds confidence.'}</Text>
          </View>
          <View style={[styles.polaroid, { borderColor: t.accent, backgroundColor: 'rgba(13,9,20,0.85)' }]}>
            <Text style={[styles.polaroidTitle, { color: t.soft }]}>Se'kret says ☁️</Text>
            <Text style={[styles.polaroidBody, { color: '#E2E8F0' }]}>
              {isGirl ? "Your body isn't something to hate. It's becoming YOU." : "Confidence isn't loud. It's built quietly every day."}
            </Text>
            <TouchableOpacity style={[styles.smallBtn, { borderColor: t.accent }]} onPress={() => setScreen('sekret')}>
              <Text style={[styles.smallBtnText, { color: t.soft }]}>talk to Se'kret</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.quoteStrip, { borderColor: 'rgba(168,85,247,0.2)' }]}>
          <Text style={styles.quoteText}>
            This space is private unless you choose to share it with a trusted adult. 🔒
          </Text>
        </View>

      </ScrollView>

      {/* ── Tips overlay ── */}
      {overlay === 'tips' && (
        <View style={styles.overlayWrap}>
          <TouchableOpacity style={styles.overlayBackdrop} onPress={() => setOverlay(null)} />
          <View style={[styles.overlayCard, { backgroundColor: 'rgba(13,9,20,0.96)', borderColor: t.accent }]}>
            <Text style={[styles.overlayTitle, { color: t.soft }]}>{TIPS[tipIdx].emoji} {TIPS[tipIdx].title}</Text>
            <Text style={[styles.overlayBody, { color: '#E2E8F0' }]}>{TIPS[tipIdx].body}</Text>
            <View style={styles.overlayRow}>
              <TouchableOpacity style={[styles.overlayBtn, { borderColor: t.accent }]} onPress={() => setTipIdx(i => (i + 1) % TIPS.length)}>
                <Text style={[styles.overlayBtnText, { color: t.soft }]}>another ✨</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOverlay(null)}>
                <Text style={[styles.overlayClose, { color: t.soft }]}>close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Comfort overlay ── */}
      {overlay === 'comfort' && (
        <View style={styles.overlayWrap}>
          <TouchableOpacity style={styles.overlayBackdrop} onPress={() => setOverlay(null)} />
          <View style={[styles.overlayCard, { backgroundColor: 'rgba(13,9,20,0.96)', borderColor: t.accent }]}>
            <Text style={[styles.overlayTitle, { color: t.soft }]}>🧸 from Raylene</Text>
            <Text style={[styles.overlayBody, { color: '#E2E8F0' }]}>{COMFORT[comfortIdx]}</Text>
            <View style={styles.overlayRow}>
              <TouchableOpacity style={[styles.overlayBtn, { borderColor: t.accent }]} onPress={() => setComfortIdx(i => (i + 1) % COMFORT.length)}>
                <Text style={[styles.overlayBtnText, { color: t.soft }]}>another 💜</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOverlay(null)}>
                <Text style={[styles.overlayClose, { color: t.soft }]}>close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {BottomNav}
    </View>
  );
}

const { width: SW } = Dimensions.get('window');

const styles = StyleSheet.create({
  root:            { flex: 1 },
  scroll:          { paddingBottom: 100 },
  logo:            { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8, marginTop: Platform.OS === 'ios' ? 60 : 40 },
  subtitle:        { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  choiceHero:      { alignItems: 'center', marginBottom: 24 },
  bigEmoji:        { fontSize: 48 },
  btn:             { padding: 16, borderRadius: 18, marginHorizontal: 20, marginBottom: 12, alignItems: 'center' },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  changeBtn:       { alignSelf: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, marginTop: Platform.OS === 'ios' ? 56 : 36, marginBottom: 10 },
  changeBtnText:   { fontSize: 12, fontWeight: '600' },
  roomWrap:        { position: 'relative', width: '100%', height: 320, marginBottom: 16, overflow: 'hidden' },
  roomImage:       { width: '100%', height: '100%' },
  timeBadge:       { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timeBadgeText:   { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  hotspot:         { position: 'absolute' },
  hotspotDebug:    { borderWidth: 2, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.18)' },
  debugLabel:      { color: '#f472b6', fontSize: 9, fontWeight: '900', padding: 2 },
  hint:            { position: 'absolute', backgroundColor: 'rgba(13,9,20,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  hintText:        { color: '#c4b5fd', fontSize: 10, fontWeight: '600' },
  floatCard:       { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
  floatCardText:   { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  floatCardSub:    { fontSize: 11, marginBottom: 6 },
  floatCardBody:   { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  stickyGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 14 },
  stickyNote:      { width: (SW - 54) / 3, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  stickyEmoji:     { fontSize: 24, marginBottom: 6 },
  stickyLabel:     { fontSize: 11, textAlign: 'center', fontWeight: '600' },
  duoRow:          { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 14 },
  polaroid:        { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14 },
  polaroidTitle:   { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  polaroidBig:     { fontSize: 26, fontWeight: '900', marginBottom: 4 },
  polaroidSub:     { fontSize: 11, lineHeight: 16 },
  polaroidBody:    { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  smallBtn:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  smallBtnText:    { fontSize: 11, fontWeight: '600' },
  quoteStrip:      { marginHorizontal: 16, marginBottom: 20, borderWidth: 1, borderRadius: 14, padding: 14 },
  quoteText:       { color: '#7c6899', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  overlayWrap:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  overlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayCard:     { margin: 16, borderRadius: 24, borderWidth: 1, padding: 24, zIndex: 10 },
  overlayTitle:    { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  overlayBody:     { fontSize: 15, lineHeight: 24, marginBottom: 20 },
  overlayRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlayBtn:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  overlayBtnText:  { fontSize: 13, fontWeight: '700' },
  overlayClose:    { fontSize: 13, opacity: 0.6 },
});
