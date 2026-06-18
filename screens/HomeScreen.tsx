// screens/HomeScreen.tsx
//
// The room IS the experience. No cards. No grid. No dashboard.
//
// Room art fills the screen. Character breathes inside it.
// Objects in the artwork are tappable — navigation lives in the room, not over it.
// A compact mood strip sits at the bottom. Nothing demands attention.

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { IMAGES, getRoomBg } from '../constants/theme';
import { MOOD_GLOW } from '../constants/moodGlow';
import { SyncBadge, type SyncStatus } from '../components/SyncBadge';
import type { CompanionCheckIn } from '../types/sekretCompanion';
import {
  Text, TouchableOpacity, View, Animated, Image,
  ImageBackground, ScrollView, StyleSheet, Platform,
  Dimensions, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: W, height: H } = Dimensions.get('window');
const NAV_H = Platform.OS === 'ios' ? 84 : 64;
const TOP   = Platform.OS === 'ios' ? 56 : 36;

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';
type MoodCat = 'heavy' | 'steady' | 'winning' | 'fun';

const DEBUG_HOTSPOTS = false;

// ─── Room hotspots — placed over where the objects live in the artwork ────────
// xf/yf are fractions of screen W×H — tune these to match the actual room art.
const TEEN_HOTSPOTS = [
  { icon: '📓', label: 'write',    route: 'bips',           xf: 0.30, yf: 0.62, delay: 0   },
  { icon: '☁️',  label: 'cloud',    route: 'cloud',          xf: 0.12, yf: 0.40, delay: 280 },
  { icon: '📱', label: 'circle',   route: 'circle',         xf: 0.75, yf: 0.50, delay: 500 },
  { icon: '🪞', label: 'memories', route: 'history',        xf: 0.84, yf: 0.34, delay: 700 },
  { icon: '📅', label: 'calendar', route: 'periodCalendar', xf: 0.60, yf: 0.72, delay: 900 },
];

const TIME_BADGE: Record<TimeOfDay, string> = {
  morning: '☀️ morning',
  day:     '🌤️ afternoon',
  evening: '🌆 evening',
  night:   '🌙 night',
};

// ─── Mood data ────────────────────────────────────────────────────────────────

const MOOD_CATS: { id: MoodCat; emoji: string; label: string; glow: string }[] = [
  { id: 'heavy',   emoji: '🌧️', label: 'Heavy',   glow: '#7dd3fc' },
  { id: 'steady',  emoji: '☁️',  label: 'Steady',  glow: '#c4b5fd' },
  { id: 'winning', emoji: '🌟', label: 'Winning', glow: '#fbbf24' },
  { id: 'fun',     emoji: '✨',  label: 'Fun',     glow: '#fb7185' },
];

const MOODS_BY_CAT: Record<MoodCat, { id: string; emoji: string; label: string }[]> = {
  heavy: [
    { id: 'sad',          emoji: '😔', label: 'sad' },
    { id: 'anxious',      emoji: '😰', label: 'anxious' },
    { id: 'frustrated',   emoji: '😤', label: 'frustrated' },
    { id: 'angry',        emoji: '😡', label: 'angry' },
    { id: 'lonely',       emoji: '🥺', label: 'lonely' },
    { id: 'overwhelmed',  emoji: '🌪️', label: 'overwhelmed' },
    { id: 'hurt',         emoji: '💔', label: 'hurt' },
    { id: 'disappointed', emoji: '😞', label: 'disappointed' },
  ],
  steady: [
    { id: 'calm',        emoji: '😌', label: 'calm' },
    { id: 'reflective',  emoji: '☁️', label: 'reflective' },
    { id: 'tired',       emoji: '😴', label: 'tired' },
    { id: 'okay',        emoji: '🙂', label: 'okay' },
    { id: 'content',     emoji: '🌱', label: 'content' },
    { id: 'thoughtful',  emoji: '💭', label: 'thoughtful' },
    { id: 'hopeful',     emoji: '🌈', label: 'hopeful' },
    { id: 'grateful',    emoji: '🙏', label: 'grateful' },
  ],
  winning: [
    { id: 'proud',        emoji: '🌟', label: 'proud' },
    { id: 'motivated',    emoji: '🔥', label: 'motivated' },
    { id: 'confident',    emoji: '😎', label: 'confident' },
    { id: 'excited',      emoji: '🥳', label: 'excited' },
    { id: 'accomplished', emoji: '✨', label: 'accomplished' },
    { id: 'loved',        emoji: '💜', label: 'loved' },
    { id: 'connected',    emoji: '🤝', label: 'connected' },
    { id: 'celebrating',  emoji: '🎉', label: 'celebrating' },
  ],
  fun: [
    { id: 'crushing',     emoji: '😭',   label: 'crushing' },
    { id: 'unbothered',   emoji: '💅',   label: 'unbothered' },
    { id: 'curious',      emoji: '👀',   label: 'curious' },
    { id: 'relieved',     emoji: '😮‍💨', label: 'relieved' },
    { id: 'feeling-seen', emoji: '🫶',   label: 'feeling seen' },
    { id: 'glow-up',      emoji: '📈',   label: 'glow up' },
  ],
};

const PRESENCE_LINES = [
  "How you bippin today?",
  'You showed up. That already counts.',
  'Heavy days do not define you.',
  'Wins and hard days both belong here.',
  "You're building something real.",
  'The room remembers how far you have come.',
  'Good days deserve celebrating too.',
  'Still here. Still Bippin.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
};

const getHeroText = (mood: string, tod: TimeOfDay): string => {
  const timeWord = tod === 'morning' ? 'this morning' : tod === 'day' ? 'today' : 'tonight';
  const m = mood.toLowerCase();
  if (m === 'sad' || m === 'hurt')                return `I'm here with\nyou ${timeWord} ☁️`;
  if (m === 'angry' || m === 'frustrated')        return `Let it out,\nyou're safe here 🔥`;
  if (m === 'anxious' || m === 'overwhelmed')     return `One thing\nat a time ${timeWord} 💙`;
  if (m === 'lonely')                             return `You reached out.\nThat took something 💜`;
  if (m === 'disappointed')                       return `I see you.\nIt's okay to feel this ☁️`;
  if (m === 'tired')                              return `Rest your heart\n${timeWord} 🌙`;
  if (m === 'calm')                               return `Calm and grounded\n${timeWord}`;
  if (m === 'content')                            return `Peace found\n${timeWord} 🌱`;
  if (m === 'hopeful')                            return `Eyes on tomorrow\n${timeWord} 🌈`;
  if (m === 'grateful')                           return `Counting the good\n${timeWord} 🙏`;
  if (m === 'okay')                               return `Present and okay\n${timeWord}`;
  if (m === 'proud')                              return `AS YOU SHOULD\nBE 🌟`;
  if (m === 'motivated')                          return `Let's not waste\nthis momentum 🔥`;
  if (m === 'excited')                            return `That excitement\nis REAL`;
  if (m === 'accomplished')                       return `You actually\ndid that. Look. ✨`;
  if (m === 'confident')                          return `Walk in that.\nAll day`;
  if (m === 'celebrating')                        return `We celebrating\ntoday 🎉`;
  if (m === 'loved')                              return `Feeling loved.\nSit in it 💜`;
  if (m === 'crushing')                           return `Oh we're\nbippin today 😭`;
  if (m === 'glow-up')                            return `I see it.\nKeep going 📈`;
  if (m === 'unbothered')                         return `Protective\npeace. Respect 💅`;
  if (tod === 'morning') return 'Good morning.\nYou ready?';
  if (tod === 'night')   return "You made it\nthrough today 🌙";
  return 'Welcome back\nto the room.';
};

const getMoodResponse = (mood: string, selectedSekret: string): string => {
  const m = mood.toLowerCase();
  if (selectedSekret === 'rylane') {
    if (m === 'sad' || m === 'hurt')             return "nah, you not carrying this alone. i'm right here.";
    if (m === 'angry' || m === 'frustrated')     return "your feelings make sense. let it out. i got you.";
    if (m === 'tired')                           return "you gave everything today. rest is part of the work.";
    if (m === 'anxious' || m === 'overwhelmed')  return "let's shrink it. not everything needs solving tonight.";
    if (m === 'proud')                           return "real talk? that's you. you built that. own it.";
    if (m === 'motivated')                       return "bet. let's not waste the momentum.";
    if (m === 'excited')                         return "BRO 😭 say it. what's happening??";
    if (m === 'accomplished')                    return "nah don't act like it's normal. you worked for that.";
    if (m === 'celebrating')                     return "we celebrating. say it out loud.";
    if (m === 'grateful')                        return "look at you noticing the good. that's growth.";
    if (m === 'unbothered')                      return "protective peace energy. not everyone deserves your attention.";
    if (m === 'glow-up')                         return "bro I see the shift. what changed?";
    return "i see you. you doing better than you think.";
  }
  if (selectedSekret === 'cloud') {
    if (m === 'sad' || m === 'hurt')     return "That sounds heavy. We can just sit with it for a minute.";
    if (m === 'tired')                   return "Long day? You can rest here.";
    if (m === 'overwhelmed')             return "Everything feels loud right now. Let's shrink the problem.";
    if (m === 'grateful')                return "I like this version of today. Let's remember it.";
    if (m === 'proud')                   return "That growth landed somewhere real, didn't it.";
    if (m === 'content')                 return "This is peace. It's quieter than people expect.";
    if (m === 'hopeful')                 return "Hope is soft but it's strong. Hold it.";
    if (m === 'feeling-seen')            return "Being fully seen is rare. Today it happened.";
    return "You can be quiet here. No pressure.";
  }
  if (selectedSekret === 'night') {
    if (m === 'sad' || m === 'hurt')     return "Still awake with it? You don't have to sit with this alone.";
    if (m === 'tired')                   return "You don't have to explain it perfectly. Just be here.";
    if (m === 'proud')                   return "Go to sleep proud. You earned it.";
    if (m === 'hopeful')                 return "Tomorrow gets to be something new. You already believe it.";
    if (m === 'relieved')                return "That weight finally lifted. Rest now.";
    return "It's okay to be quiet tonight.";
  }
  // Raylene (default)
  if (m === 'sad' || m === 'hurt')       return "Aight, come here. Tell me what happened.";
  if (m === 'angry' || m === 'frustrated') return "That would've hurt my feelings too. You okay?";
  if (m === 'tired')                     return "Be nice to yourself today, okay?";
  if (m === 'lonely')                    return "You came here. That took something. I see you.";
  if (m === 'overwhelmed')               return "Put something down, baby. You cannot carry all of this.";
  if (m === 'proud')                     return "AS YOU SHOULD BE. 😭💜 Tell me what happened.";
  if (m === 'motivated')                 return "Yes. Channel this somewhere real, love.";
  if (m === 'excited')                   return "TELL ME EVERYTHING 😭💜";
  if (m === 'accomplished')              return "LOOK AT YOU. Baby, look at what you built.";
  if (m === 'grateful')                  return "I love this version of today too. Hold onto it.";
  if (m === 'celebrating')               return "🎉 YES BABY YES. Tell me everything.";
  if (m === 'glow-up')                   return "Okay I SEE YOU. What's shifting?";
  if (m === 'content')                   return "Calm is a whole skill. Enjoy it.";
  return "I read your energy. You're doing better than you think.";
};

const getStreakCopy = (days: number, isRylane: boolean, justReset?: boolean): string => {
  if (days === 1 && justReset) return isRylane ? "missed a few. you're back." : "missed a few? you picked it back up.";
  if (days <= 0)  return isRylane ? "first day. let's lock in." : "first day. we got this.";
  if (days === 1) return isRylane ? "day 1 bip." : "day 1 bip.";
  if (days < 7)   return isRylane ? `${days}d bippin.` : `${days}d bippin.`;
  if (days < 30)  return isRylane ? `${days}d bip. consistent.` : `${days}d bip. real.`;
  if (days < 100) return isRylane ? `${days}d bip. locked in.` : `${days}d bip. proud of you.`;
  return `${days}d bip. 🔥`;
};

// ─── Hotspot component ───────────────────────────────────────────────────────

interface HotspotProps {
  icon: string; label: string; route: string;
  xf: number; yf: number; delay: number;
  accent: string; visible: boolean; onPress: () => void;
}

function RoomHotspot({ icon, label, xf, yf, delay, accent, visible, onPress }: HotspotProps) {
  const appear = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(appear, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
    if (!DEBUG_HOTSPOTS) return;
    const timer = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }, delay + 200);
    return () => clearTimeout(timer);
  }, [visible]);

  const scale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.0] });

  return (
    <Animated.View style={[s.hotspot, { left: W * xf - 30, top: H * yf - 30, opacity: appear }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.hotspotHit}>
        {DEBUG_HOTSPOTS && (
          <Animated.View style={[
            s.hotspotRing,
            { borderColor: accent + 'cc', shadowColor: accent, transform: [{ scale }], opacity },
          ]}>
            <Text style={s.hotspotIcon}>{icon}</Text>
          </Animated.View>
        )}
        {DEBUG_HOTSPOTS && <Text style={s.hotspotLabel}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  mood:             string;
  selectMood:       (mood: string) => void;
  t:                Record<string, any>;
  currentSekret:    Record<string, any>;
  selectedSekret:   string;
  homeMessageIndex: number;
  userSide:         string;
  setScreen:        (screen: string) => void;
  onMoodSelect?:    (mood: string) => void;
  BottomNav:        React.ReactNode;
  streakDays?:      number;
  streakJustReset?: boolean;
  companion?: {
    greeting: string;
    presenceMessage: string;
    memorySummary?: { commonTopics?: string[] };
    checkIn?: CompanionCheckIn | null;
    companionLevel?: any;
    personality: string;
  };
  syncStatus?: SyncStatus;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeScreen({
  mood, selectMood, t, currentSekret, selectedSekret,
  homeMessageIndex, setScreen, onMoodSelect, BottomNav,
  streakDays = 0, streakJustReset, companion, syncStatus,
}: HomeScreenProps) {

  const isRylane  = selectedSekret === 'rylane';
  const charKey   = (selectedSekret === 'rylane' ? 'rylane' : selectedSekret === 'night' ? 'night' : selectedSekret === 'cloud' ? 'cloud' : 'raylene') as any;
  const timeOfDay = useMemo<TimeOfDay>(() => getTimeOfDay(), []);
  const ambientBg = useMemo(() => getRoomBg(charKey, timeOfDay), [charKey, timeOfDay]);
  const moodGlow  = MOOD_GLOW[mood.toLowerCase()] ?? MOOD_GLOW[mood] ?? t.accent;

  const defaultCat = useMemo<MoodCat>(() => {
    const m = mood.toLowerCase();
    if (MOODS_BY_CAT.heavy.some(x => x.id === m))   return 'heavy';
    if (MOODS_BY_CAT.winning.some(x => x.id === m)) return 'winning';
    return 'steady';
  }, []);
  const [moodCat, setMoodCat] = useState<MoodCat>(defaultCat);
  const [hotspotsReady, setHotspotsReady] = useState(false);

  // Presence lines — companion memory leads, then cycling ambient
  const [presenceLines] = useState<string[]>(() => {
    const lines: string[] = [];
    if (companion?.presenceMessage) lines.push(companion.presenceMessage);
    lines.push(...PRESENCE_LINES);
    return lines;
  });
  const [presenceIdx, setPresenceIdx] = useState<number>(0);

  // ─── Animations ───────────────────────────────────────────────────────────
  const roomFade    = useRef(new Animated.Value(0)).current;
  const textFade    = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowAnim    = useRef(new Animated.Value(0.4)).current;
  const moodPop     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(roomFade, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(textFade, { toValue: 1, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setHotspotsReady(true));

    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(breatheAnim, { toValue: 1.08, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breatheAnim, { toValue: 1,    duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    breathe.start();

    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1,   duration: 2800, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 2800, useNativeDriver: true }),
    ]));
    glow.start();

    return () => { breathe.stop(); glow.stop(); };
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.12, 0.35] });

  // Se'kret reacts on mood selection
  const handleMoodSelect = (m: string) => {
    selectMood(m);
    onMoodSelect?.(m);
    Animated.sequence([
      Animated.timing(moodPop, { toValue: 1.28, duration: 130, useNativeDriver: true }),
      Animated.timing(moodPop, { toValue: 1.00, duration: 200, useNativeDriver: true }),
    ]).start();
    // Bump presence to mood-specific response
    const response = getMoodResponse(m, selectedSekret);
    if (response) {
      const idx = presenceLines.indexOf(response);
      if (idx >= 0) setPresenceIdx(idx);
    }
  };

  const presenceLine = getMoodResponse(mood, selectedSekret) || presenceLines[presenceIdx % presenceLines.length];

  // Character art (neutral pose — reacts to mood via pop, not pose change here)
  const charImages: Record<string, any> = {
    raylene: IMAGES.rayleneNeutral,
    rylane:  IMAGES.rylaneNeutral,
    cloud:   IMAGES.cloudAvatarNeutral,
    night:   IMAGES.rayleneNeutral,
  };
  const charArt = charImages[charKey] ?? charImages.raylene;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── ROOM ART — full screen, lightly vignetted so objects stay visible ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: roomFade }]}>
        <ImageBackground source={ambientBg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>

      {/* Vignette: dark top (text readability), clear middle (room visible), dark bottom */}
      <LinearGradient
        colors={['rgba(13,0,30,0.72)', 'rgba(13,0,20,0.08)', 'rgba(13,0,20,0.05)', 'rgba(10,0,25,0.88)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.25, 0.65, 1.0]}
      />

      {/* Mood tint — very subtle, just a color breath */}
      <Animated.View
        pointerEvents="none"
        style={[s.bgGlow, { backgroundColor: moodGlow, opacity: glowOpacity }]}
      />

      {/* ── TIME BADGE — top-right, minimal ─────────────────────────────────── */}
      <Animated.View style={[s.timeBadge, { opacity: textFade }]}>
        <Text style={[s.timeBadgeText, { color: t.soft ?? '#e9d5ff' }]}>{TIME_BADGE[timeOfDay]}</Text>
      </Animated.View>

      {/* ── STREAK — top-left, ambient glow only ────────────────────────────── */}
      {streakDays > 0 && (
        <Animated.View style={[s.streakPill, { borderColor: moodGlow + '88', opacity: textFade }]}>
          <Text style={s.streakText}>🔥 {getStreakCopy(streakDays, isRylane, streakJustReset)}</Text>
        </Animated.View>
      )}

      {/* ── SYNC BADGE — barely visible, top-center ─────────────────────────── */}
      <Animated.View style={[s.syncWrap, { opacity: textFade }]}>
        <SyncBadge status={syncStatus ?? 'idle'} />
      </Animated.View>

      {/* ── GREETING + PRESENCE — floating text at top ───────────────────────── */}
      <Animated.View style={[s.topText, { opacity: textFade }]}>
        <Text style={s.heroText}>{getHeroText(mood, timeOfDay)}</Text>
        <TouchableOpacity
          onPress={() => setPresenceIdx(i => (i + 1) % presenceLines.length)}
          activeOpacity={0.8}
        >
          <Text style={[s.presence, { color: t.soft ?? '#e9d5ff' }]}>
            "{presenceLine}"
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── CHARACTER IN ROOM — tapping opens Se'kret conversation ──────────── */}
      <Animated.View style={[
        s.charWrap,
        { transform: [{ scale: Animated.multiply(breatheAnim, moodPop) }], opacity: textFade },
      ]}>
        <TouchableOpacity onPress={() => setScreen('sekret')} activeOpacity={0.82}>
          <Image source={charArt} style={s.charArt} resizeMode="contain" />
          <Text style={[s.charName, { color: t.accent ?? '#c4b5fd' }]}>
            {currentSekret.name} {currentSekret.emoji}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── ROOM HOTSPOTS — positioned over actual room objects ──────────────── */}
      {TEEN_HOTSPOTS.map(h => (
        <RoomHotspot
          key={h.label}
          {...h}
          accent={t.accent ?? '#c4b5fd'}
          visible={hotspotsReady}
          onPress={() => setScreen(h.route)}
        />
      ))}

      {/* ── BOTTOM MOOD STRIP — compact, no cards ────────────────────────────── */}
      <Animated.View style={[s.bottomStrip, { opacity: textFade }]}>
        <Text style={[s.moodAsk, { color: t.soft ?? '#e9d5ff' }]}>how you bippin today?</Text>

        {/* 4 category chips */}
        <View style={s.moodCatRow}>
          {MOOD_CATS.map(cat => {
            const active = moodCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.moodCatChip,
                  { borderColor: active ? cat.glow : 'rgba(150,120,200,0.28)' },
                  active && { backgroundColor: cat.glow + '28' },
                ]}
                onPress={() => setMoodCat(cat.id)}
              >
                <Text style={s.moodCatEmoji}>{cat.emoji}</Text>
                <Text style={[s.moodCatLabel, { color: active ? cat.glow : '#9b8ec4' }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Horizontal mood scroll for selected category */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.moodScroll}
          contentContainerStyle={s.moodScrollContent}
        >
          {MOODS_BY_CAT[moodCat].map(m => {
            const active = mood.toLowerCase() === m.id;
            const tint   = MOOD_GLOW[m.id] ?? t.accent;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  s.moodChip,
                  active && { borderColor: tint, backgroundColor: tint + '28' },
                ]}
                onPress={() => handleMoodSelect(m.id)}
                accessibilityRole="button"
                accessibilityLabel={`Mood: ${m.label}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={s.moodEmoji}>{m.emoji}</Text>
                <Text style={[s.moodLabel, { color: active ? tint : '#9b8ec4' }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {BottomNav}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0820' },

  bgGlow: {
    position: 'absolute', top: -60, alignSelf: 'center',
    width: 280, height: 280, borderRadius: 140,
  },

  // Time badge — top-right
  timeBadge: {
    position: 'absolute', top: TOP, right: 18,
    backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  timeBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },

  // Streak — top-left
  streakPill: {
    position: 'absolute', top: TOP, left: 18,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  streakText: { color: '#f5f0ff', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Sync badge — top-center, barely visible
  syncWrap: { position: 'absolute', top: TOP + 2, alignSelf: 'center', left: W / 2 - 30 },

  // Floating greeting
  topText: {
    position: 'absolute', top: TOP + 44, left: 20, right: 90,
  },
  heroText: {
    fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 30, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.90)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10,
  },
  presence: {
    fontSize: 13, fontStyle: 'italic', lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.90)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },

  // Character in room
  charWrap: {
    position: 'absolute',
    // center-right area where character typically stands in artwork
    right: W * 0.05,
    bottom: NAV_H + 180,
    alignItems: 'center',
  },
  charArt:  { width: 90, height: 130, opacity: 0.88 },
  charName: {
    fontSize: 9, fontWeight: '700', textAlign: 'center',
    letterSpacing: 0.6, marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5,
  },

  // Hotspots
  hotspot:    { position: 'absolute', alignItems: 'center' },
  hotspotHit: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  hotspotRing: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    shadowOpacity: 0.65, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  hotspotIcon:  { fontSize: 18 },
  hotspotLabel: {
    fontSize: 9, fontWeight: '700', color: '#fff', textAlign: 'center',
    marginTop: 4, letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.90)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5,
  },

  // Bottom mood strip
  bottomStrip: {
    position: 'absolute',
    bottom: NAV_H + 10,
    left: 0, right: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  moodAsk: {
    fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.80)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5,
  },
  moodCatRow:       { flexDirection: 'row', gap: 6, marginBottom: 8 },
  moodCatChip:      {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, gap: 2,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  moodCatEmoji:  { fontSize: 14 },
  moodCatLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  moodScroll:    { width: '100%' },
  moodScrollContent: { gap: 6, paddingHorizontal: 4 },
  moodChip:      {
    alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(150,120,200,0.25)',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  moodEmoji:  { fontSize: 16, marginBottom: 2 },
  moodLabel:  { fontSize: 9, fontWeight: '600' },
});
