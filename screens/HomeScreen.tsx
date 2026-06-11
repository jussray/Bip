import React, { useRef, useEffect, useMemo } from 'react';
import { IMAGES } from '../constants/theme';
import { SekretCompanionCard } from '../components/SekretCompanionCard';
import type { CompanionCheckIn } from '../types/sekretCompanion';
import {
  Text, TouchableOpacity,
  View, Animated, Image, StyleSheet, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

// ─── Assets ───────────────────────────────────────────────────────────────────

const CLOUD_ASSETS: Record<string, any> = {
  raylene: IMAGES.cloud,
  rylane:  IMAGES.cloud,
};

const ART: Record<string, Record<string, any>> = {
  raylene: {
    neutral:  IMAGES.rayleneNeutral,
    thinking: IMAGES.rayleneThinking,
    window:   IMAGES.rayleneWindow,
  },
  rylane: {
    neutral:  IMAGES.rylaneNeutral,
    thinking: IMAGES.rylaneThinking,
    window:   IMAGES.rylaneWindow,
  },
};

// Time-of-day ambient room background per vision:
// morning → bright room · afternoon → sunny room · night → purple cozy room
// (late-night rainy city is owned by ComfortScreen — Home stays softer)
const AMBIENT_BG: Record<string, Record<TimeOfDay, any>> = {
  raylene: {
    morning: IMAGES.bgRayleneRoomDay,
    day:     IMAGES.bgRayleneRoomDay,
    evening: IMAGES.bgRayleneRoomEvening,
    night:   IMAGES.bgRayleneRoomNight,
  },
  rylane: {
    morning: IMAGES.bgRylaneRoomDay,
    day:     IMAGES.bgRylaneRoomDay,
    evening: IMAGES.bgRayleneRoomEvening,
    night:   IMAGES.bgRylaneRoomNight,
  },
};

// ─── Static data ──────────────────────────────────────────────────────────────

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
};

// Neutral added so teens have an out for "I don't really know"
const MOODS = [
  { id: 'Happy',   emoji: '😊' },
  { id: 'Neutral', emoji: '🙂' },
  { id: 'Sad',     emoji: '😔' },
  { id: 'Angry',   emoji: '😡' },
  { id: 'Tired',   emoji: '😴' },
];

// Mood-tinted ambient glow — the room reads your energy
const MOOD_GLOW: Record<string, string> = {
  Happy:   '#fbbf24',  // warm gold
  Neutral: '#c4b5fd',  // soft lavender
  Sad:     '#7dd3fc',  // soft blue
  Angry:   '#f472b6',  // warm pink
  Tired:   '#6d28d9',  // deep purple
};

const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

// Vision quick actions: Write It Out, Voice Bip, Calm Me, Circle, Comfort Mode.
// Bridge kept as a 6th since it's a real existing feature.
const QUICK_ACTIONS: { emoji: string; label: string; to: string }[] = [
  { emoji: '✍️',  label: 'Write It Out', to: 'pages'      },
  { emoji: '🎙️', label: 'Voice Bip',    to: 'voiceBip'   },
  { emoji: '🌙',  label: 'Calm Me',      to: 'calm'       },
  { emoji: '☁️',  label: 'Comfort',      to: 'comfort'    },
  { emoji: '🌐',  label: 'Circle',       to: 'circle'     },
  { emoji: '🌉',  label: 'Bridge',       to: '__bridge__' },
];

// Hero greeting — mood + time-of-day so morning doesn't read like night
const getHeroText = (mood: string, tod: TimeOfDay) => {
  const timeWord =
    tod === 'morning' ? 'this morning' :
    tod === 'day'     ? 'today'        :
    tod === 'evening' ? 'tonight'      :
                        'tonight';
  const timeEmoji =
    tod === 'morning' ? '☀️' :
    tod === 'day'     ? '🌤️' :
    tod === 'evening' ? '🌆' :
                        '🌙';

  if (mood === 'Happy')   return `I'm glad\nyou're smiling\n${timeWord} ${timeEmoji}`;
  if (mood === 'Sad')     return `I'm here with\nyou ${timeWord} ☁️`;
  if (mood === 'Angry')   return `Let it out,\nyou're safe here 🔥`;
  if (mood === 'Tired')   return `Rest your heart\n${timeWord} 🌙`;
  if (mood === 'Neutral') return `However you feel\n${timeWord} is okay ${timeEmoji}`;
  return `Welcome back ${timeEmoji}`;
};

const getMoodResponse = (mood: string, selectedSekret: string) => {
  if (selectedSekret === 'rylane') {
    if (mood === 'Sad')     return "nah. who got you feeling like this?";
    if (mood === 'Angry')   return "aight. who did what?";
    if (mood === 'Tired')   return "you look cooked. sit down somewhere 😭";
    if (mood === 'Neutral') return "low-key kinda mid? bet. we can just sit here a sec.";
    return "aight. what’s the story?";
  }
  if (selectedSekret === 'cloud') {
    if (mood === 'Sad')     return "Something feels heavier today.";
    if (mood === 'Angry')   return "There’s an edge to today.";
    if (mood === 'Tired')   return "The room can stay quiet.";
    return "Something feels different.";
  }
  if (selectedSekret === 'night') {
    if (mood === 'Sad')     return "yeah. i know.";
    if (mood === 'Angry')   return "stay here a minute.";
    if (mood === 'Tired')   return "rest if you can.";
    return "i’m here.";
  }
  if (mood === 'Sad')     return "Girl... who made today weird?";
  if (mood === 'Angry')   return "Nah because who irritated you 😭";
  if (mood === 'Tired')   return "You look DONE 😭 what happened?";
  if (mood === 'Neutral') return "Okay neutral... suspicious 😭 what’s up?";
  return "Okayyy, I see the energy. What happened?";
};

// Streak language per vision: "we see you" — never punishing
const getStreakCopy = (days: number, isRylane: boolean) => {
  if (days <= 0)  return isRylane ? "first day. let's lock in." : "first day. we got this.";
  if (days === 1) return isRylane ? "day 1 bip. you here. that counts." : "day 1 bip. you showed up.";
  if (days < 7)   return isRylane ? `${days} days bippin. keep going.` : `${days} days bippin. we see you.`;
  if (days < 30)  return isRylane ? `${days} day bip. that's consistent.` : `${days} day bip. that's real.`;
  if (days < 100) return isRylane ? `${days} day bip. you locked in.` : `${days} day bip. proud of you.`;
  return isRylane ? `${days} day bip. legend energy.` : `${days} day bip. we see every one.`;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  mood: string;
  selectMood: (mood: string) => void;
  t: Record<string, any>;
  currentSekret: Record<string, any>;
  selectedSekret: string;           // character identity key
  homeMessageIndex: number;
  userSide: string;
  setScreen: (screen: string) => void;
  onMoodSelect?: (mood: string) => void;  // Supabase/RoomMemory hook
  BottomNav: React.ReactNode;
  streakDays?: number;              // vision: streak lives on the dashboard
  companion?: {
    greeting: string;
    presenceMessage: string;
    memorySummary?: { commonTopics?: string[] };
    checkIn?: CompanionCheckIn | null;
    companionLevel?: any;
    personality: string;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeScreen({
  mood, selectMood, t, currentSekret, selectedSekret,
  homeMessageIndex, userSide, setScreen, onMoodSelect, BottomNav,
  streakDays = 0, companion,
}: HomeScreenProps) {

  const isRylane  = selectedSekret === 'rylane';
  const charKey   = isRylane ? 'rylane' : 'raylene';
  const art       = ART[charKey];
  const cloudImg  = CLOUD_ASSETS[charKey];
  const timeOfDay = useMemo<TimeOfDay>(() => getTimeOfDay(), []);
  const ambientBg = AMBIENT_BG[charKey]?.[timeOfDay];
  const moodGlow  = MOOD_GLOW[mood] ?? t.accent;

  // ─── Animations ─────────────────────────────────────────────────────────
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0.4)).current;

  // Staggered card entrance — scrapbook opening page by page
  const card1Anim = useRef(new Animated.Value(0)).current;  // streak
  const card2Anim = useRef(new Animated.Value(0)).current;  // hero
  const card3Anim = useRef(new Animated.Value(0)).current;  // reminder
  const card4Anim = useRef(new Animated.Value(0)).current;  // mood + sees-you
  const card5Anim = useRef(new Animated.Value(0)).current;  // quick actions

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    Animated.stagger(140, [
      Animated.timing(card1Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(card2Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(card3Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(card4Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(card5Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.12, duration: 3000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1,    duration: 3000, useNativeDriver: true }),
      ])
    );
    breathe.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2800, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => { breathe.stop(); glow.stop(); };
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.18, 0.42] });

  // Per-card animated style helper
  const cardAnim = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  });

  // ─── Style helpers ───────────────────────────────────────────────────────
  const card = (extra?: object) => [
    styles.card, { backgroundColor: t.card, borderColor: t.accent + '55' }, extra,
  ] as any;

  // ─── Mood select handler (also fires Supabase hook) ───────────────────────
  const handleMoodSelect = (m: string) => {
    selectMood(m);
    onMoodSelect?.(m);
  };

  // ─── Reminder message (bounds-guarded) ───────────────────────────────────
  const reminder = HOME_MESSAGES[homeMessageIndex] ?? HOME_MESSAGES[0];
  const memoryMessage = companion?.presenceMessage
    || 'You’ve been showing up for yourself. I’m noticing it.';

  const handleCompanionAction = (action: 'write' | 'voice' | 'comfort' | 'checkIn') => {
    if (action === 'write') setScreen('pages');
    else if (action === 'voice') setScreen('voiceBip');
    else if (action === 'comfort') setScreen('comfort');
    else setScreen('sekret');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <StatusBar style="light" />

      {/* ── Ambient room background — time-of-day aware per vision ───────── */}
      {ambientBg && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { opacity: fadeIn }]}
        >
          <Image
            source={ambientBg}
            style={styles.ambientImg}
            resizeMode="cover"
            blurRadius={6}
          />
          <View style={styles.ambientScrim} />
        </Animated.View>
      )}

      {/* ── Mood-tinted background glow ─────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bgGlow, { backgroundColor: moodGlow, opacity: glowOpacity }]}
      />

      <View pointerEvents="none" style={styles.environmentLayer}>
        <Image
          source={selectedSekret === 'night' ? IMAGES.rayleneWindow : (isRylane ? IMAGES.rylaneWindow : IMAGES.rayleneWindow)}
          style={styles.environmentArt}
          resizeMode="cover"
        />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━━ PARENT BADGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {userSide === 'parent' && (
          <View style={styles.parentBadge}>
            <Text style={styles.parentBadgeText}>🌿 PARENT SIDE</Text>
          </View>
        )}

        {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Text style={[styles.logo, { color: t.soft }]}>
          Se’kret Bip {currentSekret.emoji}
        </Text>
        <Text style={styles.subtitle}>your space. your voice. always you.</Text>

        {/* ━━━ STREAK PILL — "we see you" per vision ━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View style={[styles.streakPill, cardAnim(card1Anim), { borderColor: moodGlow + '88' }]}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakText}>{getStreakCopy(streakDays, isRylane)}</Text>
        </Animated.View>

        {/* ━━━ BREATHING CLOUD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View style={[styles.cloudWrap, { transform: [{ scale: breatheAnim }] }]}>
          <Image source={cloudImg} style={styles.cloudImg} resizeMode="contain" />
        </Animated.View>

        {/* ━━━ HERO MESSAGE CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View style={[card(), cardAnim(card2Anim)]}>
          <View style={styles.heroCardTop}>
            <View style={styles.heroArtGlow} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroCardBy, { color: t.soft }]}>
                {currentSekret.name} says…
              </Text>
              <Text style={[styles.heroText, { color: '#fff' }]}>
                {getHeroText(mood, timeOfDay)}
              </Text>
            </View>
          </View>
          <Text style={styles.entryText}>
            Your Se’kret is {currentSekret.name} energy.
          </Text>
        </Animated.View>

        {/* ━━━ GENTLE REMINDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View style={[card(), cardAnim(card3Anim)]}>
          <Text style={styles.cardText}>
            {timeOfDay === 'morning' ? 'Morning Reminder ✨'
              : timeOfDay === 'day'   ? 'A Note for Today ✨'
              : timeOfDay === 'evening' ? 'Evening Reminder ✨'
                                        : 'Tonight’s Reminder ✨'}
          </Text>
          <Text style={styles.entryText}>{reminder}</Text>
        </Animated.View>

        {/* ━━━ MOOD SELECTOR + SEES-YOU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View style={cardAnim(card4Anim)}>
          <Text style={[styles.sectionTitle, { color: t.soft }]}>
            How’s your heart right now? 💜
          </Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => {
              const active = mood === m.id;
              const tint   = MOOD_GLOW[m.id] ?? t.accent;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodBubble,
                    active && {
                      backgroundColor: tint,
                      shadowColor: tint,
                      shadowOpacity: 0.7,
                      shadowRadius: 12,
                      elevation: 8,
                    },
                  ]}
                  onPress={() => handleMoodSelect(m.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mood: ${m.id}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* SE'KRET SEES YOU — mood-aware, character-aware */}
          <View style={card()}>
            <Text style={styles.cardText}>
              {currentSekret.name} sees you {currentSekret.emoji}
            </Text>
            <Text style={styles.entryText}>
              {getMoodResponse(mood, selectedSekret)}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: moodGlow, shadowColor: moodGlow }]}
                onPress={() => setScreen('sekret')}
                accessibilityRole="button"
                accessibilityLabel="Talk more"
              >
                <Text style={styles.actionBtnText}>💬 Talk more</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: t.card, borderWidth: 1, borderColor: t.accent + '66' }]}
                onPress={() => setScreen('calm')}
                accessibilityRole="button"
                accessibilityLabel="Calm me"
              >
                <Text style={styles.actionBtnText}>🌙 Calm me</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {companion ? (
          <Animated.View style={cardAnim(card5Anim)}>
            <SekretCompanionCard
              personality={companion.personality}
              greeting={companion.greeting}
              memoryMessage={memoryMessage}
              level={companion.companionLevel || { level: 1, title: 'First hello', progress: 0, nextLevel: 8, unlockedGreetings: ['Hey'], unlockedDepth: ['check-in'], encouragements: ['You’re doing enough.'], personalityResponses: ['gentle comfort'] }}
              checkIn={companion.checkIn}
              onAction={handleCompanionAction}
            />
          </Animated.View>
        ) : null}

        {/* ━━━ QUICK ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Animated.View style={cardAnim(card5Anim)}>
          <Text style={[styles.sectionTitle, { color: t.soft }]}>Quick Actions ⚡</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => {
              const route = action.to === '__bridge__'
                ? (userSide === 'parent' ? 'parentBridge' : 'bridge')
                : action.to;
              return (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.quickCard, { backgroundColor: t.card, borderColor: t.accent + '55' }]}
                  onPress={() => setScreen(route)}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <Text style={styles.quickEmoji}>{action.emoji}</Text>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

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

  // Ambient time-of-day room background (blurred, dimmed) behind the dashboard
  ambientImg:     { width: '100%', height: '100%' },
  ambientScrim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,0,20,0.72)' },

  bgGlow:         {
    position: 'absolute', top: -80, alignSelf: 'center',
    width: 320, height: 320, borderRadius: 160,
  },
  environmentLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 80,
  },
  environmentArt: {
    width: '88%',
    height: '58%',
    opacity: 0.16,
    tintColor: '#fff',
  },
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  parentBadge:    { backgroundColor: '#065F46', borderRadius: 10, padding: 6, alignSelf: 'center', marginBottom: 10 },
  parentBadgeText:{ color: '#6EE7B7', fontSize: 12, fontWeight: '700' },

  logo:           { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 12 },

  // "X day Bip" streak pill — "we see you" energy per vision
  streakPill:     {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: 'rgba(13,0,20,0.72)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 14,
  },
  streakFlame:    { fontSize: 14 },
  streakText:     { color: '#f5f0ff', fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  cloudWrap:      { alignItems: 'center', marginVertical: 14 },
  cloudImg:       { width: 100, height: 100 },

  card:           {
    padding: 18, borderRadius: 22, marginBottom: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  heroCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  heroArtGlow:    {
    width: 14, height: 54, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginRight: 2,
  },
  heroCardBy:     { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  heroText:       { fontSize: 22, fontWeight: 'bold', lineHeight: 30 },
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },

  sectionTitle:   { fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },

  moodRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, gap: 6 },
  moodBubble:     {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center',
  },
  moodEmoji:      { fontSize: 26 },

  actionRow:      { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn:      {
    flex: 1, padding: 12, borderRadius: 16, alignItems: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  actionBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  quickCard:      {
    width: '30%', flexGrow: 1, padding: 14, borderRadius: 18,
    alignItems: 'center', borderWidth: 1, gap: 5,
  },
  quickEmoji:     { fontSize: 24 },
  quickLabel:     { color: '#CBD5E1', fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
