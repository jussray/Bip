import React, { useState, useRef, useEffect } from 'react';
import {
  Text, TouchableOpacity, ScrollView, View,
  Image, Animated, StyleSheet, Platform,
} from 'react-native';

// ─── Artwork system ───────────────────────────────────────────────────────────
// Swap hero images here when dedicated Bippin2 artwork arrives.
// Currently uses fullbody as hero fallback per spec.
const ART: Record<string, Record<string, any>> = {
  raylene: {
    hero:     require('../assets/images/raylene-fullbody.png'),   // swap for bippin2-raylene-hero.png when available
    neutral:  require('../assets/images/raylene-neutral.png'),
    window:   require('../assets/images/raylene-window.png'),
    thinking: require('../assets/images/raylene-thinking.png'),
  },
  rylane: {
    hero:     require('../assets/images/rylane-fullbody.png'),    // swap for bippin2-rylane-hero.png when available
    neutral:  require('../assets/images/rylane-neutral.png'),
    window:   require('../assets/images/rylane-window.png'),
    thinking: require('../assets/images/rylane-thinking.png'),
  },
};

// ─── Static data — Womanhood ──────────────────────────────────────────────────

const W_CHIPS = [
  { key: 'period',   emoji: '🩸', label: 'First Period\nSupport' },
  { key: 'cycle',    emoji: '🌙', label: 'Cycle\nWellness' },
  { key: 'mood',     emoji: '💜', label: 'Mood + Body\nCheck-in' },
  { key: 'comfort',  emoji: '🕯️', label: 'Comfort\nMode' },
  { key: 'sekret',   emoji: '☁️', label: "Ask\nSe'kret" },
  { key: 'journal',  emoji: '📓', label: 'Private\nJournal' },
];

const W_MOOD_CHIPS = [
  { label: 'happy',     emoji: '😊' },
  { label: 'calm',      emoji: '🌿' },
  { label: 'tired',     emoji: '😴' },
  { label: 'scared',    emoji: '😨' },
  { label: 'emotional', emoji: '💜' },
  { label: 'okay',      emoji: '☁️' },
];

const W_BIP_FLOW = [
  { icon: '☁️', step: 'notice',   sub: 'how you feel' },
  { icon: '📓', step: 'name it',  sub: 'be real' },
  { icon: '💜', step: 'nourish',  sub: 'yourself' },
  { icon: '🎧', step: 'release',  sub: 'let it out' },
  { icon: '⭐', step: 'grow',     sub: 'keep bippin' },
];

// ─── Static data — Manhood ────────────────────────────────────────────────────

const M_CHIPS = [
  { key: 'puberty',     emoji: '⚡', label: 'Puberty\nGuide' },
  { key: 'body',        emoji: '🧍🏾', label: 'Body\nChanges' },
  { key: 'confidence',  emoji: '⭐', label: 'Confidence\nBoost' },
  { key: 'hygiene',     emoji: '🧴', label: 'Hygiene +\nSelf-Care' },
  { key: 'mind',        emoji: '🧠', label: 'Mind\nCheck-in' },
  { key: 'journal',     emoji: '📓', label: 'Private\nJournal' },
];

const M_MOOD_CHIPS = [
  { label: 'happy',    emoji: '😊' },
  { label: 'calm',     emoji: '🌿' },
  { label: 'stressed', emoji: '⚡' },
  { label: 'angry',    emoji: '😤' },
  { label: 'tired',    emoji: '😴' },
  { label: 'okay',     emoji: '☁️' },
];

const M_BIP_FLOW = [
  { icon: '☁️', step: 'notice',  sub: "what's up" },
  { icon: '📓', step: 'name it', sub: 'be honest' },
  { icon: '⚡', step: 'reset',   sub: 'refocus' },
  { icon: '🎧', step: 'release', sub: 'clear it out' },
  { icon: '🏆', step: 'grow',    sub: 'level up' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Bippin2ScreenProps {
  t: Record<string, any>;
  mood: string;
  selectedSekret: string;      // 'soft' | 'rylane' | 'cloud' | 'night'
  setScreen: (screen: string) => void;
  onMilestone?: () => void;
  BottomNav: React.ReactNode;
  streakDays?: number;
}

export function Bippin2Screen({
  t, mood, selectedSekret, setScreen, onMilestone, BottomNav, streakDays = 0,
}: Bippin2ScreenProps) {

  // ─── Identity ─────────────────────────────────────────────────────────────
  const isRylane   = selectedSekret === 'rylane';
  const charName   = isRylane ? 'Rylane' : 'Raylene';
  const charEmoji  = isRylane ? '⚡' : '💜';
  const art        = ART[isRylane ? 'rylane' : 'raylene'];

  // Rylane gets a cooler blue-electric tint, Raylene keeps the warm neon-pink.
  // Both read from t (theme) but we overlay an identity accent for unique feel.
  const idAccent   = isRylane ? '#4DA3FF' : t.accent;   // blue for Rylane, theme accent for Raylene
  const idSoft     = isRylane ? '#B6DCFF' : t.soft;

  // ─── Animation ────────────────────────────────────────────────────────────
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2600, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.18, 0.42] });

  // ─── Local state ──────────────────────────────────────────────────────────
  const [selectedMood, setSelectedMood]   = useState<string | null>(null);
  const [energyLevel]                     = useState(72);   // future: AsyncStorage / Supabase mood_checkins
  const [sleepHours]                      = useState('6h 42m'); // future: Supabase sleep_tracker

  // ─── Feature chip navigation ──────────────────────────────────────────────
  const handleChip = (key: string) => {
    const routes: Record<string, string> = {
      period:     'periodCalendar',
      cycle:      'periodCalendar',
      mood:       'calm',
      comfort:    'comfort',
      sekret:     'sekret',
      journal:    'pages',
      puberty:    'sekret',        // stub — future: dedicated puberty guide screen
      body:       'sekret',        // stub
      confidence: 'bippin2',       // stub — future: confidence boost section
      hygiene:    'sekret',        // stub
      mind:       'calm',
    };
    const route = routes[key];
    if (route) setScreen(route);
  };

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const scrapCard = (extra?: object) => [
    styles.scrapCard,
    { backgroundColor: t.card, borderColor: idAccent + '44' },
    extra,
  ] as any;

  const accentBtn = (extra?: object) => [
    styles.accentBtn,
    { backgroundColor: idAccent, shadowColor: idAccent },
    extra,
  ] as any;

  // ─── Greeting copy ────────────────────────────────────────────────────────
  const greeting = isRylane
    ? { title: `Good night, ${charName} ⚡`, body: "Keep building the best version of you.\nYou've got this." }
    : { title: `Good night, ${charName} 💜`, body: "Your body is changing.\nThat's not something to fear or hide." };

  const streakLabel = isRylane ? 'focus streak'      : 'connection streak';
  const streakSub   = isRylane ? 'consistency builds confidence.' : "you're showing up for you.";
  const streakNote  = isRylane ? 'proud of you, seriously.' : "you're doing great. ✨";

  const chips      = isRylane ? M_CHIPS      : W_CHIPS;
  const moodChips  = isRylane ? M_MOOD_CHIPS : W_MOOD_CHIPS;
  const bipFlow    = isRylane ? M_BIP_FLOW   : W_BIP_FLOW;

  // ─── Cloud mascot speech ──────────────────────────────────────────────────
  const cloudSpeech = isRylane
    ? "yo. i'm here. what's on your mind rn? 🤝"
    : "hey. whatever you're feeling right now — it's valid 💜";

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>

      {/* ── Ambient background glow ────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bgGlow, { backgroundColor: idAccent, opacity: glowOpacity }]}
      />

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backChip} onPress={() => setScreen('home')}>
            <Text style={styles.backChipText}>← Room</Text>
          </TouchableOpacity>
          <View style={[styles.privateBadge, { backgroundColor: t.card, borderColor: idAccent + '66' }]}>
            <Text style={styles.privateBadgeText}>🔒 private</Text>
          </View>
        </View>

        <Text style={[styles.screenTitle, { color: idAccent }]}>
          {isRylane ? 'Bippin 2\nManhood ⚡' : 'Bippin 2\nWomanhood 💜'}
        </Text>
        <Text style={[styles.screenSub, { color: idSoft }]}>
          {isRylane ? 'growing into yourself. 💙' : 'growing at your own pace. 💜'}
        </Text>

        {/* ━━━ HERO — character presence ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.heroSection}>
          {/* Character portrait */}
          <Image source={art.hero} style={styles.heroArt} resizeMode="contain" />

          {/* Greeting + streak card */}
          <View style={styles.heroRight}>
            <View style={scrapCard(styles.greetCard)}>
              <Text style={[styles.greetTitle, { color: idSoft }]}>{greeting.title}</Text>
              <Text style={styles.greetBody}>{greeting.body}</Text>
            </View>
            <View style={[styles.streakCard, { backgroundColor: t.card, borderColor: idAccent + '55' }]}>
              <Text style={[styles.streakLabel, { color: idAccent }]}>{streakLabel}</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFlame}>{isRylane ? '🔵' : '🔥'}</Text>
                <Text style={[styles.streakDays, { color: '#fff' }]}>{streakDays} days</Text>
              </View>
              <Text style={styles.streakSub}>{streakSub}</Text>
              <Text style={[styles.streakNote, { color: idSoft }]}>{streakNote}</Text>
            </View>
          </View>
        </View>

        {/* ━━━ CLOUD MASCOT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={styles.cloudRow}>
          <Text style={styles.cloudMascot}>{isRylane ? '💙' : '💜'}☁️</Text>
          <View style={[styles.cloudBubble, { backgroundColor: t.card, borderColor: idAccent + '55' }]}>
            <Text style={styles.cloudText}>{cloudSpeech}</Text>
          </View>
        </View>

        {/* ━━━ FEATURE CHIPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {chips.map(chip => (
            <TouchableOpacity
              key={chip.key}
              style={[styles.featureChip, { backgroundColor: t.card, borderColor: idAccent + '66' }]}
              onPress={() => handleChip(chip.key)}
            >
              <Text style={styles.chipEmoji}>{chip.emoji}</Text>
              <Text style={[styles.chipLabel, { color: idSoft }]}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ━━━ WOMANHOOD CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {!isRylane && (
          <>
            {/* First Period Support */}
            <View style={scrapCard()}>
              <Text style={[styles.cardLabel, { color: idAccent }]}>first period support 🩸</Text>
              <View style={styles.periodCardInner}>
                <View style={styles.periodCardText}>
                  <Text style={styles.cardBodyText}>It's okay to feel scared.</Text>
                  <Text style={styles.cardBodyText}>You're not alone.</Text>
                  <TouchableOpacity
                    style={[styles.learnBtn, { borderColor: idAccent }]}
                    onPress={() => setScreen('periodCalendar')}
                  >
                    <Text style={[styles.learnBtnText, { color: idAccent }]}>learn more</Text>
                  </TouchableOpacity>
                </View>
                <Image source={art.thinking} style={styles.periodArt} resizeMode="contain" />
              </View>
            </View>

            {/* Comfort Tip + Cycle Calendar — side by side */}
            <View style={styles.twoColRow}>
              <View style={[scrapCard(), styles.halfCard]}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>comfort tip 🕯️</Text>
                <Text style={styles.cardBodyText}>
                  Use warmth for cramps, drink water, rest, and be gentle with yourself.
                </Text>
                <TouchableOpacity onPress={() => setScreen('comfort')}>
                  <Text style={[styles.linkText, { color: idAccent }]}>more tips →</Text>
                </TouchableOpacity>
              </View>
              <View style={[scrapCard(), styles.halfCard]}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>cycle calendar 📅</Text>
                <Text style={styles.cardBodyText}>
                  Track your cycle with ease and privacy.
                </Text>
                <TouchableOpacity
                  style={accentBtn({ marginTop: 10 })}
                  onPress={() => setScreen('periodCalendar')}
                >
                  <Text style={styles.accentBtnText}>view calendar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ━━━ MANHOOD CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isRylane && (
          <>
            {/* Energy + Sleep + Quick Tip — top row */}
            <View style={styles.threeColRow}>
              {/* Energy Check-In */}
              <View style={[scrapCard(), styles.thirdCard]}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>energy check-in ⚡</Text>
                <Text style={styles.cardBodySmall}>How are you feeling right now?</Text>
                {/* Battery bar */}
                <View style={styles.batteryOuter}>
                  <View style={[styles.batteryInner, { width: `${energyLevel}%` as any, backgroundColor: idAccent }]} />
                </View>
                <Text style={[styles.batteryLabel, { color: idSoft }]}>{energyLevel}% energy</Text>
                <TouchableOpacity
                  style={[styles.learnBtn, { borderColor: idAccent, marginTop: 8 }]}
                  onPress={() => setScreen('calm')}
                >
                  <Text style={[styles.learnBtnText, { color: idAccent }]}>check in</Text>
                </TouchableOpacity>
              </View>

              {/* Sleep Tracker */}
              <View style={[scrapCard(), styles.thirdCard]}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>sleep tracker 🌙</Text>
                <Text style={styles.cardBodySmall}>How'd you sleep?</Text>
                <Text style={styles.sleepBig}>🌙</Text>
                <Text style={[styles.sleepTime, { color: '#fff' }]}>{sleepHours}</Text>
                <Text style={styles.cardBodySmall}>sleep</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={[styles.linkText, { color: idAccent }]}>track sleep →</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Tip */}
              <View style={[scrapCard(), styles.thirdCard]}>
                <Text style={[styles.cardLabel, { color: idAccent }]}>quick tip 💡</Text>
                <Text style={styles.cardBodySmall}>
                  Small habits. Big future. Stay focused, stay you.
                </Text>
                <TouchableOpacity onPress={() => setScreen('calm')}>
                  <Text style={[styles.linkText, { color: idAccent }]}>more tips →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Goal Tracker */}
            <View style={scrapCard()}>
              <View style={styles.goalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, { color: idAccent }]}>goal tracker 🎯</Text>
                  <Text style={styles.cardBodyText}>
                    Track your goals and level up. Every day.
                  </Text>
                  <TouchableOpacity
                    style={accentBtn({ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 18 })}
                    onPress={() => { onMilestone?.(); }}
                  >
                    <Text style={styles.accentBtnText}>view goals</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.goalTrophy}>🏆</Text>
              </View>
            </View>
          </>
        )}

        {/* ━━━ MOOD CHECK-IN (both sides) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={scrapCard()}>
          <Text style={[styles.cardLabel, { color: idAccent }]}>mood check-in {charEmoji}</Text>
          <Text style={styles.cardBodyText}>How are you feeling right now?</Text>
          <View style={styles.moodRow}>
            {moodChips.map(chip => {
              const active = selectedMood === chip.label;
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[
                    styles.moodChip,
                    {
                      backgroundColor: active ? idAccent : t.background,
                      borderColor: active ? idAccent : idAccent + '44',
                    },
                  ]}
                  onPress={() => setSelectedMood(active ? null : chip.label)}
                >
                  <Text style={styles.moodEmoji}>{chip.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: active ? '#fff' : idSoft }]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedMood && (
            <Text style={[styles.moodAck, { color: idSoft }]}>
              {charEmoji} {charName} sees you. That's valid.
            </Text>
          )}
        </View>

        {/* ━━━ BIP FLOW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={scrapCard()}>
          <Text style={[styles.cardLabel, { color: idAccent }]}>
            BIP FLOW {isRylane ? '⚡' : '💜'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flowScroll}
          >
            {bipFlow.map((item, i) => (
              <React.Fragment key={item.step}>
                <View style={styles.flowStep}>
                  <View style={[styles.flowIconWrap, { backgroundColor: idAccent + '22', borderColor: idAccent + '55' }]}>
                    <Text style={styles.flowIcon}>{item.icon}</Text>
                  </View>
                  <Text style={[styles.flowStepLabel, { color: '#fff' }]}>{item.step}</Text>
                  <Text style={[styles.flowStepSub, { color: idSoft }]}>{item.sub}</Text>
                </View>
                {i < bipFlow.length - 1 && (
                  <Text style={[styles.flowArrow, { color: idAccent }]}>→</Text>
                )}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>

        {/* ━━━ CHARACTER QUOTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={[scrapCard(), styles.quoteCard]}>
          <Image source={art.neutral} style={styles.quoteArt} resizeMode="contain" />
          <Text style={[styles.quoteText, { color: idSoft }]}>
            {isRylane
              ? '"You don\'t gotta have it all figured out. Just keep going. That\'s enough."'
              : '"You are allowed to be both a work in progress and a whole person right now."'}
          </Text>
          <Text style={[styles.quoteSig, { color: idAccent }]}>— {charName}</Text>
        </View>

        {/* ━━━ NAV ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TouchableOpacity
          style={accentBtn()}
          onPress={() => { onMilestone?.(); setScreen('sekret'); }}
        >
          <Text style={styles.accentBtnText}>
            {isRylane ? `Talk to ${charName} ⚡` : `Talk to ${charName} 💜`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => setScreen('pages')}
        >
          <Text style={styles.ghostBtnText}>📓 Open Private Journal</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </Animated.ScrollView>

      {/* BottomNav always pinned outside ScrollView */}
      {BottomNav}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:           { flex: 1 },
  bgGlow:         {
    position: 'absolute', top: -100, alignSelf: 'center',
    width: 360, height: 360, borderRadius: 180,
  },
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 58 : 38 },

  // Header
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backChip:       { backgroundColor: '#1E1035', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  backChipText:   { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  privateBadge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  privateBadgeText:{ color: '#CBD5E1', fontSize: 12, fontWeight: '600' },

  screenTitle:    { fontSize: 32, fontWeight: 'bold', letterSpacing: 0.3, marginBottom: 4 },
  screenSub:      { fontSize: 14, marginBottom: 22, fontStyle: 'italic' },

  // Hero
  heroSection:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, gap: 12 },
  heroArt:        { width: 120, height: 180, borderRadius: 18 },
  heroRight:      { flex: 1, gap: 10 },
  greetCard:      { marginBottom: 0 },
  greetTitle:     { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  greetBody:      { color: '#E2E8F0', fontSize: 13, lineHeight: 20 },
  streakCard:     { padding: 12, borderRadius: 18, borderWidth: 1 },
  streakLabel:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  streakRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  streakFlame:    { fontSize: 20 },
  streakDays:     { fontSize: 22, fontWeight: 'bold' },
  streakSub:      { color: '#CBD5E1', fontSize: 11, marginBottom: 2 },
  streakNote:     { fontSize: 11, fontStyle: 'italic' },

  // Cloud
  cloudRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  cloudMascot:    { fontSize: 30 },
  cloudBubble:    { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, borderBottomLeftRadius: 4 },
  cloudText:      { color: '#E2E8F0', fontSize: 13, lineHeight: 19 },

  // Feature chips row
  chipsScroll:    { paddingBottom: 4, gap: 10, marginBottom: 18 },
  featureChip:    {
    width: 80, padding: 10, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  chipEmoji:      { fontSize: 22 },
  chipLabel:      { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Cards
  scrapCard:      {
    padding: 16, borderRadius: 22, marginBottom: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  cardLabel:      { fontSize: 15, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
  cardBodyText:   { color: '#E2E8F0', fontSize: 14, lineHeight: 21, marginBottom: 4 },
  cardBodySmall:  { color: '#CBD5E1', fontSize: 12, lineHeight: 18, marginBottom: 4 },
  linkText:       { fontSize: 13, fontWeight: '600', marginTop: 6 },
  learnBtn:       { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  learnBtnText:   { fontSize: 13, fontWeight: '600' },

  // Two/three column layouts
  twoColRow:      { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfCard:       { flex: 1, marginBottom: 0 },
  threeColRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  thirdCard:      { flex: 1, marginBottom: 0, padding: 12 },

  // Period art
  periodCardInner:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodCardText: { flex: 1 },
  periodArt:      { width: 70, height: 80 },

  // Battery
  batteryOuter:   { height: 10, backgroundColor: '#1E293B', borderRadius: 6, marginVertical: 6, overflow: 'hidden' },
  batteryInner:   { height: '100%', borderRadius: 6 },
  batteryLabel:   { fontSize: 12, fontWeight: '700' },

  // Sleep
  sleepBig:       { fontSize: 28, textAlign: 'center', marginVertical: 4 },
  sleepTime:      { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },

  // Goal
  goalRow:        { flexDirection: 'row', alignItems: 'center' },
  goalTrophy:     { fontSize: 52, marginLeft: 8 },

  // Mood
  moodRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  moodChip:       {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  moodEmoji:      { fontSize: 16 },
  moodLabel:      { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  moodAck:        { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },

  // Bip Flow
  flowScroll:     { alignItems: 'center', gap: 6, paddingVertical: 8 },
  flowStep:       { alignItems: 'center', width: 70 },
  flowIconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  flowIcon:       { fontSize: 22 },
  flowStepLabel:  { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  flowStepSub:    { fontSize: 10, textAlign: 'center', marginTop: 2 },
  flowArrow:      { fontSize: 18, marginTop: -6, paddingHorizontal: 2 },

  // Quote
  quoteCard:      { alignItems: 'center', paddingVertical: 20 },
  quoteArt:       { width: 80, height: 80, marginBottom: 12 },
  quoteText:      { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  quoteSig:       { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  // Buttons
  accentBtn:      {
    padding: 15, borderRadius: 18, alignItems: 'center', marginBottom: 12,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  accentBtnText:  { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  ghostBtn:       { backgroundColor: '#1E1035', padding: 13, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  ghostBtnText:   { color: '#CBD5E1', fontWeight: '600', fontSize: 14 },
});
