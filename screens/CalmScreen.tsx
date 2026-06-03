// screens/CalmScreen.tsx
// Se'kret Bip — Se'kret Calm
//
// Fixes applied (2026-06-03):
//   A1 — breatheAnim / comfortIdx / setComfortIdx / art removed from props;
//         all moved to internal state/refs (index.tsx does not pass them)
//   A2 — mood + setMood added to interface (index.tsx passes these)
//   A3 — art.window replaced with local require() — no more undefined crash
//   B1 — breathe Animated.loop started in useEffect, cleaned up on unmount
//   B2 — Mood check-in row restored ("How are you feeling?") + calls setMood
//   B3 — Today's Calm Plan checklist restored (local useState)
//   B4 — Calm Picks media row restored (static cards, horizontal scroll)
//   B5 — "Se'kret says" section restored at bottom (uses COMFORT_MESSAGES)
//   C1 — "Breathe with me" is an in-screen toggle (no new route needed)
//   C2 — check-in button scrolls to mood row
//   C3 — Breathe Reminder stubbed with Alert
//   D1 — Header greeting personalized
//   D2 — "private" lock badge added to header

import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  Animated,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';

// ── Assets ─────────────────────────────────────────────────────────────────
// Fix A3: direct requires — no art prop needed
const CLOUD_HEADPHONES = require('../assets/images/cloud-headphones.png');
// Hero image shown at top of Calm screen (character at window, peaceful)
// Adjust path if your asset is named differently
const CALM_HERO = require('../assets/images/sekret-calm-hero.png');

// ── Constants ──────────────────────────────────────────────────────────────
const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Soft moment. Slow breath. Stay with me.' },
  { emoji: '💜', text: "Rest is productive, too. You don't have to earn peace. I'm proud of you for choosing you tonight." },
];

const MOOD_CHIPS = [
  { emoji: '😰', label: 'anxious' },
  { emoji: '⛈️', label: 'overwhelmed' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😤', label: 'stressed' },
  { emoji: '😴', label: 'tired' },
  { emoji: '😌', label: 'calm' },
];

const CALM_TOOLS = [
  { emoji: '💜', label: 'Breathe\nwith me', sub: '1–5 min',    action: 'breathe' },
  { emoji: '🌿', label: 'Ground\nYourself',  sub: '3–7 min',   action: 'mindReset' },
  { emoji: '📝', label: 'Release\nIt Out',   sub: 'write + let go', action: 'pages' },
  { emoji: '🌙', label: 'Sleep\nBetter',     sub: 'stories + sounds', action: null },
  { emoji: '🚨', label: 'SOS\nCalm Now',     sub: '30 sec reset', action: 'comfort' },
];

const CALM_PICKS = [
  { emoji: '🌧️', label: 'late night\nrain',        duration: '20 min' },
  { emoji: '🌊', label: 'deep sleep\nwaves',        duration: '30 min' },
  { emoji: '🎹', label: 'soft piano\n+ heart',      duration: '25 min' },
  { emoji: '📖', label: 'bedtime\nstory',            duration: '15 min' },
  { emoji: '✨', label: 'healing\nfrequency',        duration: '20 min' },
];

const DEFAULT_PLAN = [
  { id: 1, label: 'Breathe for 2 minutes',     time: '7:30 PM', done: false },
  { id: 2, label: "Write down what's heavy",   time: '7:40 PM', done: false },
  { id: 3, label: 'Listen to a comfort sound', time: '',        done: false },
  { id: 4, label: 'Affirm something kind',     time: '',        done: false },
];

const BOX_BREATHING_STEPS = [
  { label: 'breathe in', count: 4, direction: 'top' },
  { label: 'hold',       count: 4, direction: 'right' },
  { label: 'breathe out',count: 4, direction: 'bottom' },
  { label: 'hold',       count: 4, direction: 'left' },
];

const MORE_BREATHING = [
  { label: '4-7-8 Breathing',  sub: 'calm anxiety + help sleep', duration: '5 min' },
  { label: 'Calming Breath',   sub: 'quick reset for stress',     duration: '2 min' },
  { label: 'Deep Belly Breath',sub: 'release tension',            duration: '3 min' },
];

const CALM_PLAYLIST = [
  { emoji: '🔥', label: 'night rain',   sub: 'soothing rain sounds', duration: '20:00' },
  { emoji: '🎵', label: 'soft lo-fi',   sub: 'focus + unwind',       duration: '30:00' },
  { emoji: '🌊', label: 'ocean waves',  sub: 'reset your mind',      duration: '25:00' },
];

// ── Props ──────────────────────────────────────────────────────────────────
// Fix A1: breatheAnim / comfortIdx / setComfortIdx / art removed
// Fix A2: mood + setMood added
interface CalmScreenProps {
  t:         Record<string, any>;
  mood:      string;
  setMood:   (mood: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────
export function CalmScreen({ t, mood, setMood, setScreen, BottomNav }: CalmScreenProps) {

  // Fix A1: internal animated value
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // Fix A1: internal comfort index
  const [comfortIdx, setComfortIdx] = useState(0);

  // B3: today's plan
  const [plan, setPlan] = useState(DEFAULT_PLAN);

  // C1: breathe sub-screen toggle
  const [showBreathe, setShowBreathe] = useState(false);

  // Box breathing step tracking
  const [breatheStep, setBreatheStep] = useState(0);
  const [breatheRunning, setBreatheRunning] = useState(false);

  // Scroll ref for check-in button (C2)
  const scrollRef = useRef<ScrollView>(null);
  const moodRowY  = useRef(0);

  // Fix B1: start breathe animation on mount, clean up on unmount
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.18, duration: 4000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1.0,  duration: 4000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breatheAnim]);

  // Box breathing step ticker
  useEffect(() => {
    if (!breatheRunning) return;
    const timer = setInterval(() => {
      setBreatheStep(s => (s + 1) % BOX_BREATHING_STEPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [breatheRunning]);

  const togglePlanItem = (id: number) => {
    setPlan(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  // ── Breathe sub-screen ─────────────────────────────────────────────────
  if (showBreathe) return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.breatheHeader}>
          <TouchableOpacity onPress={() => setShowBreathe(false)}>
            <Text style={[styles.backArrow, { color: t.soft }]}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.breatheTitle, { color: '#fff' }]}>Breathe with me 💜</Text>
            <Text style={[styles.breatheSub, { color: t.soft }]}>slow down. just breathe.</Text>
          </View>
        </View>

        {/* Box breathing card */}
        <View style={[styles.boxCard, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={[styles.boxTitle, { color: '#fff' }]}>Box Breathing ✦</Text>
          <Text style={[styles.boxSub, { color: t.soft }]}>a simple way to calm your mind and body</Text>

          {/* Box diagram */}
          <View style={styles.boxDiagram}>
            <Text style={[styles.boxTop, { color: '#fff' }]}>breathe in{'\n'}4</Text>
            <View style={styles.boxMiddleRow}>
              <Text style={[styles.boxSide, { color: '#fff' }]}>hold{'\n'}4</Text>
              <Animated.View style={[
                styles.breatheCircleSm,
                { backgroundColor: t.accent, transform: [{ scale: breatheAnim }] },
              ]}>
                <Image source={CLOUD_HEADPHONES} style={styles.boxCloudImg} resizeMode="contain" />
              </Animated.View>
              <Text style={[styles.boxSide, { color: '#fff' }]}>hold{'\n'}4</Text>
            </View>
            <Text style={[styles.boxBottom, { color: '#fff' }]}>breathe out{'\n'}4</Text>
          </View>

          <TouchableOpacity
            style={[styles.pauseBtn, { backgroundColor: '#2d1b4e' }]}
            onPress={() => setBreatheRunning(r => !r)}
          >
            <Text style={[styles.pauseBtnText, { color: '#fff' }]}>
              {breatheRunning ? '⏸ pause' : '▶ start'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* More breathing exercises */}
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>More Breathing Exercises</Text>
        {MORE_BREATHING.map(item => (
          <View key={item.label} style={[styles.listRow, { backgroundColor: t.card, borderColor: t.accent }]}>
            <Image source={CLOUD_HEADPHONES} style={styles.listRowIcon} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.listRowTitle, { color: '#fff' }]}>{item.label}</Text>
              <Text style={[styles.listRowSub, { color: t.soft }]}>{item.sub}</Text>
            </View>
            <Text style={[styles.listRowDur, { color: t.soft }]}>{item.duration}</Text>
            <Text style={{ color: t.soft }}>›</Text>
          </View>
        ))}

        {/* Calm Playlist */}
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Calm Playlist ✦</Text>
        <Text style={[styles.sectionSub, { color: t.soft }]}>music + sounds to relax</Text>
        {CALM_PLAYLIST.map(item => (
          <View key={item.label} style={[styles.listRow, { backgroundColor: t.card, borderColor: t.accent }]}>
            <Text style={styles.playlistEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listRowTitle, { color: '#fff' }]}>{item.label}</Text>
              <Text style={[styles.listRowSub, { color: t.soft }]}>{item.sub}</Text>
            </View>
            <Text style={[styles.listRowDur, { color: t.soft }]}>{item.duration}</Text>
            <Text style={{ color: t.soft }}>›</Text>
          </View>
        ))}

        {/* Breathe reminder */}
        <View style={[styles.reminderCard, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={[styles.reminderTitle, { color: t.accent }]}>Breathe Reminder</Text>
          <Text style={[styles.reminderSub, { color: t.soft }]}>set a gentle reminder to breathe</Text>
          <TouchableOpacity
            style={[styles.addReminderBtn, { borderColor: t.accent }]}
            onPress={() => Alert.alert("Breathe Reminder", "Reminder set. You'll get a gentle nudge to breathe. 💜")}
          >
            <Text style={[styles.addReminderText, { color: t.soft }]}>+ Add Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Quote strip */}
        <View style={[styles.quoteStrip, { borderColor: t.accent }]}>
          <Text style={styles.quoteOpen}>"</Text>
          <Text style={[styles.quoteText, { color: '#fff' }]}>Your breath is your anchor.{'\n'}You can always come back to it. ✦</Text>
        </View>

      </ScrollView>
      {BottomNav}
    </View>
  );

  // ── Main calm screen ───────────────────────────────────────────────────
  const currentStep = BOX_BREATHING_STEPS[breatheStep];

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero header ── */}
        <View style={styles.heroWrap}>
          <Image source={CALM_HERO} style={styles.heroImage} resizeMode="cover" />
          {/* D2: private badge */}
          <View style={[styles.privateBadge, { backgroundColor: 'rgba(13,0,20,0.7)' }]}>
            <Text style={styles.privateBadgeText}>🔒 private</Text>
          </View>
          <View style={styles.heroOverlay} pointerEvents="none">
            <Text style={[styles.heroTitle, { color: '#fff' }]}>Se'kret Calm 💜</Text>
            <Text style={[styles.heroLines, { color: t.soft }]}>
              your calm.{'\n'}your reset.{'\n'}your safe place.
            </Text>
          </View>
        </View>

        {/* D1: personalized greeting + check-in button */}
        <View style={[styles.greetRow, { backgroundColor: t.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetTitle, { color: '#fff' }]}>Take a deep breath. 💜</Text>
            <Text style={[styles.greetSub, { color: t.soft }]}>you made it through today. that matters.</Text>
          </View>
          {/* C2: scroll to mood row */}
          <TouchableOpacity
            style={[styles.checkInBtn, { borderColor: t.accent }]}
            onPress={() => scrollRef.current?.scrollTo({ y: moodRowY.current, animated: true })}
          >
            <Text style={[styles.checkInText, { color: t.soft }]}>check-in ›</Text>
          </TouchableOpacity>
        </View>

        {/* B2: Mood check-in row */}
        <View
          onLayout={e => { moodRowY.current = e.nativeEvent.layout.y; }}
        >
          <Text style={[styles.sectionTitle, { color: t.accent }]}>How are you feeling right now?</Text>
          <View style={styles.moodRow}>
            {MOOD_CHIPS.map(chip => {
              const selected = mood.toLowerCase() === chip.label;
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[
                    styles.moodChip,
                    { backgroundColor: selected ? t.accent : t.card, borderColor: t.accent },
                  ]}
                  onPress={() => setMood(chip.label)}
                >
                  <Text style={styles.moodEmoji}>{chip.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: selected ? '#fff' : t.soft }]}>{chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Calm Tools grid ── */}
        <View style={styles.toolsHeader}>
          <Text style={[styles.sectionTitle, { color: t.accent }]}>Calm Tools ✦</Text>
          <TouchableOpacity onPress={() => setScreen('more')}>
            <Text style={[styles.seeAll, { color: t.soft }]}>see all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolsScroll}>
          {CALM_TOOLS.map(tool => (
            <TouchableOpacity
              key={tool.label}
              style={[styles.toolCard, { backgroundColor: t.card, borderColor: t.accent }]}
              onPress={() => {
                if (tool.action === 'breathe') { setShowBreathe(true); return; }
                if (tool.action) setScreen(tool.action);
              }}
            >
              <Text style={styles.toolEmoji}>{tool.emoji}</Text>
              <Text style={[styles.toolLabel, { color: '#fff' }]}>{tool.label}</Text>
              <Text style={[styles.toolSub, { color: t.soft }]}>{tool.sub}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* B3: Today's Calm Plan */}
        <View style={styles.toolsHeader}>
          <Text style={[styles.sectionTitle, { color: t.accent }]}>Today's Calm Plan 💜</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: t.soft }]}>edit plan ✏️</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSub, { color: t.soft }]}>small steps. big difference.</Text>
        <View style={[styles.planCard, { backgroundColor: t.card, borderColor: t.accent }]}>
          {plan.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.planRow}
              onPress={() => togglePlanItem(item.id)}
            >
              <View style={[styles.planCheck, { borderColor: t.accent, backgroundColor: item.done ? t.accent : 'transparent' }]}>
                {item.done && <Text style={styles.planCheckMark}>✓</Text>}
              </View>
              <Text style={[styles.planLabel, { color: item.done ? t.soft : '#fff', textDecorationLine: item.done ? 'line-through' : 'none' }]}>
                {item.label}
              </Text>
              {item.time ? (
                <Text style={[styles.planTime, { color: t.soft }]}>{item.time} ›</Text>
              ) : (
                <Text style={[styles.planTime, { color: '#4B5563' }]}>—</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Breathing circle teaser ── */}
        <TouchableOpacity style={styles.circleWrap} onPress={() => setShowBreathe(true)}>
          <Animated.View style={[
            styles.circle,
            {
              transform: [{ scale: breatheAnim }],
              backgroundColor: t.accent,
              shadowColor: t.accent,
              shadowOpacity: 0.6,
              shadowRadius: 25,
              elevation: 12,
            },
          ]}>
            <Image source={CLOUD_HEADPHONES} style={styles.circleImg} resizeMode="contain" />
            <Text style={styles.circleTextSmall}>Breathe</Text>
          </Animated.View>
          <Text style={[styles.circleHint, { color: t.soft }]}>tap to open breathing</Text>
        </TouchableOpacity>

        {/* B4: Calm Picks */}
        <View style={styles.toolsHeader}>
          <Text style={[styles.sectionTitle, { color: t.accent }]}>Calm Picks for You ✦</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: t.soft }]}>see all</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSub, { color: t.soft }]}>we picked these just for your vibe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picksScroll}>
          {CALM_PICKS.map(pick => (
            <View key={pick.label} style={[styles.pickCard, { backgroundColor: t.card, borderColor: t.accent }]}>
              <View style={styles.pickPlayCircle}>
                <Text style={styles.pickPlayIcon}>▶</Text>
              </View>
              <Text style={[styles.pickLabel, { color: '#fff' }]}>{pick.label}</Text>
              <Text style={[styles.pickDur, { color: t.soft }]}>{pick.duration}</Text>
            </View>
          ))}
        </ScrollView>

        {/* B5: Se'kret says */}
        <Text style={[styles.sectionTitle, { color: t.accent }]}>Se'kret says 💜</Text>
        <View style={[styles.sekretSaysCard, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={[styles.sekretSaysText, { color: '#E2E8F0' }]}>
            {COMFORT_MESSAGES[comfortIdx].text}
          </Text>
          <View style={styles.sekretSaysRow}>
            <TouchableOpacity onPress={() => setComfortIdx(i => (i + 1) % COMFORT_MESSAGES.length)}>
              <Text style={styles.sekretSaysHeart}>💜</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigate to calm tools */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: t.accent }]}
          onPress={() => setScreen('mindReset')}
        >
          <Text style={styles.btnText}>🌙 7-Min Mind Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: t.accent }]}
          onPress={() => setScreen('bodyReset')}
        >
          <Text style={styles.btnText}>🫧 7-Min Body Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: t.accent }]}
          onPress={() => setScreen('comfort')}
        >
          <Text style={styles.btnText}>🚨 Comfort Mode</Text>
        </TouchableOpacity>

      </ScrollView>
      {BottomNav}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:              { flex: 1 },
  scroll:            { paddingBottom: 100 },

  // Hero
  heroWrap:          { width: '100%', height: 240, position: 'relative', marginBottom: 0 },
  heroImage:         { width: '100%', height: '100%' },
  heroOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(13,0,20,0.45)' },
  heroTitle:         { fontSize: 26, fontWeight: '900', marginBottom: 2 },
  heroLines:         { fontSize: 13, lineHeight: 20 },
  privateBadge:      { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 36, right: 14, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  privateBadgeText:  { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },

  // Greeting
  greetRow:          { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 14, marginHorizontal: 16, borderRadius: 18 },
  greetTitle:        { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  greetSub:          { fontSize: 12 },
  checkInBtn:        { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  checkInText:       { fontSize: 12, fontWeight: '600' },

  // Mood row
  sectionTitle:      { fontSize: 18, fontWeight: '800', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  sectionSub:        { fontSize: 12, marginHorizontal: 16, marginTop: -6, marginBottom: 10 },
  moodRow:           { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  moodChip:          { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  moodEmoji:         { fontSize: 22, marginBottom: 3 },
  moodLabel:         { fontSize: 11, fontWeight: '600' },

  // Calm tools
  toolsHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 10 },
  seeAll:            { fontSize: 13, fontWeight: '600' },
  toolsScroll:       { paddingLeft: 16, marginBottom: 14 },
  toolCard:          { borderWidth: 1, borderRadius: 18, padding: 14, marginRight: 10, width: 110, alignItems: 'center' },
  toolEmoji:         { fontSize: 28, marginBottom: 6 },
  toolLabel:         { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 3 },
  toolSub:           { fontSize: 10, textAlign: 'center' },

  // Today's plan
  planCard:          { marginHorizontal: 16, borderRadius: 18, borderWidth: 1, padding: 12, marginBottom: 16 },
  planRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  planCheck:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  planCheckMark:     { color: '#fff', fontSize: 11, fontWeight: '900' },
  planLabel:         { flex: 1, fontSize: 13 },
  planTime:          { fontSize: 11 },

  // Breathing circle
  circleWrap:        { alignItems: 'center', marginVertical: 20 },
  circle:            { width: 170, height: 170, borderRadius: 85, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 0 } },
  circleImg:         { width: 90, height: 90 },
  circleTextSmall:   { color: '#fff', fontSize: 16, marginTop: 6, fontWeight: 'bold' },
  circleHint:        { fontSize: 12, marginTop: 10 },

  // Calm picks
  picksScroll:       { paddingLeft: 16, marginBottom: 16 },
  pickCard:          { borderWidth: 1, borderRadius: 18, padding: 12, marginRight: 10, width: 110, alignItems: 'center' },
  pickPlayCircle:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  pickPlayIcon:      { color: '#fff', fontSize: 16 },
  pickLabel:         { fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 3 },
  pickDur:           { fontSize: 10, textAlign: 'center' },

  // Se'kret says
  sekretSaysCard:    { marginHorizontal: 16, borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  sekretSaysText:    { fontSize: 15, lineHeight: 24, marginBottom: 14 },
  sekretSaysRow:     { flexDirection: 'row', justifyContent: 'flex-end' },
  sekretSaysHeart:   { fontSize: 22 },

  // Nav buttons
  btn:               { padding: 16, borderRadius: 18, marginHorizontal: 16, marginBottom: 12, alignItems: 'center' },
  btnText:           { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Breathe sub-screen
  breatheHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 36, paddingBottom: 12, gap: 12 },
  backArrow:         { fontSize: 22, fontWeight: '300', paddingRight: 4 },
  breatheTitle:      { fontSize: 22, fontWeight: '800' },
  breatheSub:        { fontSize: 13 },
  boxCard:           { margin: 16, borderRadius: 20, borderWidth: 1, padding: 20 },
  boxTitle:          { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  boxSub:            { fontSize: 12, marginBottom: 20 },
  boxDiagram:        { alignItems: 'center' },
  boxTop:            { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  boxMiddleRow:      { flexDirection: 'row', alignItems: 'center', gap: 20 },
  boxSide:           { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '700', width: 50 },
  breatheCircleSm:   { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  boxCloudImg:       { width: 70, height: 70 },
  boxBottom:         { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 12 },
  pauseBtn:          { borderRadius: 24, paddingVertical: 12, paddingHorizontal: 32, alignSelf: 'center', marginTop: 20 },
  pauseBtnText:      { fontSize: 16, fontWeight: '700' },
  listRow:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  listRowIcon:       { width: 36, height: 36, borderRadius: 18 },
  listRowTitle:      { fontSize: 14, fontWeight: '700' },
  listRowSub:        { fontSize: 11, marginTop: 2 },
  listRowDur:        { fontSize: 12, marginRight: 6 },
  playlistEmoji:     { fontSize: 32, width: 40, textAlign: 'center' },
  reminderCard:      { margin: 16, borderRadius: 18, borderWidth: 1, padding: 18 },
  reminderTitle:     { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  reminderSub:       { fontSize: 12, marginBottom: 14 },
  addReminderBtn:    { borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  addReminderText:   { fontSize: 14, fontWeight: '600' },
  quoteStrip:        { margin: 16, borderWidth: 1, borderRadius: 14, padding: 18 },
  quoteOpen:         { color: '#7c6899', fontSize: 32, lineHeight: 28, marginBottom: 4 },
  quoteText:         { color: '#fff', fontSize: 15, lineHeight: 24, textAlign: 'center' },
});
