import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadState, saveState } from '@utils/storage';
import { getMoodEngine } from '@utils/moodEngine';
import { HomeScreen } from '../screens/HomeScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { CalmScreen } from '../screens/CalmScreen';
import { SekretScreen } from '../screens/SekretScreen';
import { CircleScreen } from '../screens/CircleScreen';
import { Bippin2Screen } from '../screens/Bippin2Screen';
import { ComfortScreen } from '../screens/ComfortScreen';
import { MindBodyResetScreen } from '../screens/MindBodyResetScreen';
import { BridgeScreen } from '../screens/BridgeScreen';
import { ParentBridgeScreen } from '../screens/ParentBridgeScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE ASSETS
// ─────────────────────────────────────────────────────────────────────────────
const IMAGES = {
  // Raylene
  rayleneNeutral:  require('../assets/images/raylene-neutral.png'),
  rayleneHappy:    require('../assets/images/raylene-happy.png'),
  rayleneThinking: require('../assets/images/raylene-thinking.png'),
  rayleneWriting:  require('../assets/images/raylene-writing.png'),
  rayleneWindow:   require('../assets/images/raylene-window.png'),
  rayleneFullbody: require('../assets/images/raylene-fullbody.png'),
  // Rylane
  rylaneNeutral:   require('../assets/images/rylane-neutral.png'),
  rylaneHappy:     require('../assets/images/rylane-happy.png'),
  rylaneThinking:  require('../assets/images/rylane-thinking.png'),
  rylaneWriting:   require('../assets/images/rylane-writing.png'),
  rylaneWindow:    require('../assets/images/rylane-window.png'),
  rylaneFullbody:  require('../assets/images/rylane-fullbody.png'),
  // Clouds
  cloud:           require('../assets/images/cloud.png'),
  cloudHeadphones: require('../assets/images/cloud-headphones.png'),
  cloudStormy:     require('../assets/images/cloud-stormy.png'),
  cloudSleepy:     require('../assets/images/cloud-sleepy.png'),
  cloudHappy:      require('../assets/images/cloud-happy.png'),
  // Backgrounds
  roomBg:          require('../assets/images/room-bg.png'),
  roomBgDark:      require('../assets/images/room-bg-dark.png'),
  journalBg:       require('../assets/images/journal-bg.png'),
  comfortBg:       require('../assets/images/comfort-bg.png'),
  voiceBipBg:      require('../assets/images/voice-bip-bg.png'),
  // Parent / Bridge
  parentHomeBg:    require('../assets/images/parent-home-bg.png'),
  bridgeBg:        require('../assets/images/bridge-bg.png'),
  parentDashBg:    require('../assets/images/parent-dashboard-bg.png'),
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const THEME_PACKS: Record<string, any> = {
  night:  { name: 'Golden Moon',  emoji: '🌙', background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '🌸', background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '🌧️', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '💜', background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '🌌', background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

const SEKRET_PROFILES: Record<string, any> = {
  soft:   { name: "Se'kret",       emoji: '🌸', title: 'Soft Big Sis',        vibe: 'Warm, expressive, protective, and real.',        greeting: "Hey love. I'm here. Tell me what's on your mind." },
  rylane: { name: 'Rylane',        emoji: '⚡', title: 'Loyal Bro',           vibe: 'Quiet loyalty. Keeps it real. Never talks down.', greeting: "Aight, I'm here. What's been heavy?" },
  cloud:  { name: "Cloud Se'kret", emoji: '☁️', title: 'Quiet Comfort',       vibe: 'Soft, calm, low-pressure presence.',             greeting: "No pressure. We can just sit here for a minute." },
  night:  { name: "Night Se'kret", emoji: '🌙', title: 'Late-Night Listener', vibe: 'Minimal words, calm energy, safe space.',        greeting: "I'm here. You don't gotta explain perfectly." },
};

const SEKRET_MODES: Record<string, any> = {
  soft:     { emoji: '🌙', label: 'Soft',        description: 'Gentle comfort & reassurance' },
  realTalk: { emoji: '🧠', label: 'Real Talk',   description: 'Honest, caring, keeps it real' },
  distract: { emoji: '😂', label: 'Distract Me', description: 'Light jokes, low-pressure vibes' },
  listen:   { emoji: '☁️', label: 'Just Listen', description: 'No fixing. Just presence.' },
  push:     { emoji: '🔥', label: 'Push Me',     description: 'Motivation & accountability' },
};

const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Soft moment. Slow breath. Stay with me.' },
];

const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

const MOODS = [
  { id: 'Happy', emoji: '😊' },
  { id: 'Sad',   emoji: '😔' },
  { id: 'Angry', emoji: '😡' },
  { id: 'Tired', emoji: '😴' },
];

const getDynamicTags = (selectedSekret: string) => {
  if (selectedSekret === 'rylane') return ['focused', 'mind heavy', 'protecting my peace', 'trying harder', 'locked in', 'building myself'];
  if (selectedSekret === 'soft')   return ['soft but strong', 'healing', 'trying my best', 'late night thoughts', 'emotional', 'peaceful'];
  if (selectedSekret === 'cloud')  return ['resting', 'breathing', 'quiet', 'healing', 'calm', 'soft day'];
  return ['good vibes', 'overthinking', 'protecting my peace', 'growing', 'learning myself', 'late night thoughts'];
};

const getHeroText = (mood: string) => {
  if (mood === 'Happy') return "I'm glad\nyou're smiling\ntonight 🌤️";
  if (mood === 'Sad')   return "I'm here with\nyou tonight ☁️";
  if (mood === 'Angry') return "Let it out,\nyou're safe here 🔥";
  if (mood === 'Tired') return "Rest your heart\ntonight 🌙";
  return 'Welcome back 🌙';
};

const shouldSekretStepIn = (text: string) =>
  ['alone', 'hurt', 'tired', 'done', 'empty', 'cry', 'sad', 'scared', 'anxious', 'panic']
    .some(w => text.toLowerCase().includes(w));

// ─────────────────────────────────────────────────────────────────────────────
// SE'KRET API
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function fetchSekretReply(text: string, context = 'journal', mood?: string): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/sekret/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context, mood }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json();
    return data.reply || "I hear you. You don't have to carry that alone 💜";
  } catch {
    return "I hear you. That makes sense. You don't have to carry that by yourself 💜";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen, userSide }: any) {
  const items = userSide === 'parent'
    ? [['home', '🏠', 'Home'], ['bridge', '🌉', 'Bridge'], ['sekret', '💜', "Se'kret"], ['pages', '📖', 'Pages'], ['more', '☰', 'More']]
    : [['home', '🏠', 'Home'], ['pages', '📖', 'Pages'], ['calm', '🌙', 'Calm'], ['circle', '🌐', 'Circle'], ['sekret', '💜', "Se'kret"], ['more', '☰', 'More']];

  return (
    <View style={styles.bottomNav}>
      {items.map(([id, icon, label]) => (
        <TouchableOpacity key={id} onPress={() => setScreen(id)} style={styles.navItem}>
          <Text style={styles.navIcon}>{icon}</Text>
          <Text style={[styles.navText, screen === id && styles.activeNavText]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERIOD CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
function PeriodCalendar({ theme, setScreen }: any) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());
  const [markedDays, setMarkedDays]     = useState<Record<string, string>>({});
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);

  useEffect(() => {
    // Load period data using the same keys as storage.ts
    loadState().then(state => {
      if (state.periodDays)      setMarkedDays(state.periodDays);
      if (state.lastPeriodStart) setLastPeriodStart(state.lastPeriodStart);
    });
  }, []);

  const save = async (days: Record<string, string>, start: string | null) => {
    await saveState({
      periodDays: days,
      ...(start ? { lastPeriodStart: start } : {}),
    });
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (m: number, y: number) => new Date(y, m, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const toggleDay = (day: number) => {
    const key = `${currentYear}-${currentMonth + 1}-${day}`;
    const next = { ...markedDays };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 'period';
      if (!lastPeriodStart) { setLastPeriodStart(key); save(next, key); return; }
    }
    setMarkedDays(next);
    save(next, lastPeriodStart);
  };

  const predictNext = () => {
    if (!lastPeriodStart) return null;
    const [y, m, d] = lastPeriodStart.split('-').map(Number);
    const next = new Date(y, m - 1, d + 28);
    return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const days     = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const cells    = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => setScreen('bippin2')} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>Cycle Calendar 🩸</Text>
      <Text style={styles.subtitle}>Track your cycle privately. Only you can see this.</Text>

      <Image source={IMAGES.rayleneThinking} style={styles.artworkMedium} resizeMode="contain" />

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => {
            if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
            else setCurrentMonth(m => m - 1);
          }}>
            <Text style={{ color: theme.accent, fontSize: 22 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{monthName}</Text>
          <TouchableOpacity onPress={() => {
            if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
            else setCurrentMonth(m => m + 1);
          }}>
            <Text style={{ color: theme.accent, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <Text key={d} style={{ flex: 1, textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 'bold' }}>{d}</Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((day, i) => {
            const key    = day ? `${currentYear}-${currentMonth + 1}-${day}` : null;
            const marked = key && markedDays[key];
            return (
              <TouchableOpacity
                key={i}
                style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}
                onPress={() => day && toggleDay(day)}
                disabled={!day}
              >
                <View style={[
                  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
                  marked && { backgroundColor: theme.accent },
                ]}>
                  <Text style={{ color: day ? (marked ? '#fff' : '#E2E8F0') : 'transparent', fontSize: 14 }}>{day || ''}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {predictNext() && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: theme.soft, fontSize: 13, marginBottom: 4 }}>Next predicted period</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>~{predictNext()}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Based on a 28-day average cycle</Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Comfort Tips 💜</Text>
        {[
          'Use a heating pad for cramps',
          'Stay hydrated — water helps a lot',
          'Rest when your body asks for it',
          "Be gentle with yourself, it's okay to slow down",
          'Dark chocolate and warm tea are your friends 🍫',
        ].map(tip => (
          <Text key={tip} style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 6 }}>• {tip}</Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: theme.soft, fontStyle: 'italic', fontSize: 14, textAlign: 'center' }}>
          Tap any day to mark it. Your data stays private on this device. 🔒
        </Text>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE BIP
// ─────────────────────────────────────────────────────────────────────────────
function VoiceBip({ theme, setScreen, selectedSekret, voiceNotes, setVoiceNotes }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded]       = useState(false);
  const [sekretReply, setSekretReply] = useState('');
  const [isThinking, setIsThinking]   = useState(false);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const pulseLoop  = useRef<any>(null);

  const heroArt = selectedSekret === 'rylane' ? IMAGES.rylaneFullbody : IMAGES.rayleneFullbody;

  const startRecording = () => {
    setIsRecording(true);
    setRecorded(false);
    setSekretReply('');
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecorded(true);
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);

    const note = {
      id: Date.now(),
      title: 'Voice Bip',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      duration: '~30s',
    };
    const next = [note, ...voiceNotes];
    setVoiceNotes(next);

    // Save via saveState so voiceNotes is consistent with all other storage
    await saveState({ voiceNotes: next });

    setIsThinking(true);
    const reply = await fetchSekretReply('I just recorded a voice bip. I had some feelings I needed to get out.', 'journal');
    setSekretReply(reply);
    setIsThinking(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => setScreen('pages')} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Pages</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>Voice Bip 🎙️</Text>
      <Text style={styles.subtitle}>Say it out loud. 30–60 seconds. Let it go.</Text>

      <Image source={heroArt} style={styles.artworkLarge} resizeMode="contain" />

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, alignItems: 'center', paddingVertical: 32 }]}>
        <Animated.View style={[{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: isRecording ? theme.accent : theme.card,
          borderWidth: 3, borderColor: theme.accent,
          alignItems: 'center', justifyContent: 'center',
          transform: [{ scale: pulseAnim }],
          shadowColor: theme.accent, shadowOpacity: isRecording ? 0.8 : 0.3, shadowRadius: 20, elevation: 10,
        }]}>
          <Text style={{ fontSize: 48 }}>{isRecording ? '🔴' : '🎙️'}</Text>
        </Animated.View>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
          {isRecording ? 'Recording...' : recorded ? 'Saved 💜' : 'Tap to Start'}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
          {isRecording ? 'Tap again to stop' : 'Say whatever you need to say'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isRecording ? '#EF4444' : theme.accent, marginTop: 20, width: 200 }]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.buttonText}>{isRecording ? '⏹ Stop Recording' : '▶ Start Voice Bip'}</Text>
        </TouchableOpacity>
      </View>

      {isThinking && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: theme.soft, fontSize: 14 }}>Se'kret is listening... ☁️</Text>
        </View>
      )}
      {sekretReply ? (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: theme.soft, fontSize: 13, marginBottom: 6 }}>Se'kret replied 💜</Text>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>{sekretReply}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Tips for Voice Bips 🌙</Text>
        {[
          "Find a private spot — car, room, bathroom, wherever",
          "You don't need perfect words. Just talk.",
          "It's okay to cry, pause, or start over",
          "Se'kret listens without judgment, always",
        ].map(tip => (
          <Text key={tip} style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 6 }}>• {tip}</Text>
        ))}
      </View>

      {voiceNotes.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Saved Voice Bips</Text>
          {voiceNotes.slice(0, 5).map((n: any) => (
            <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
              <Text style={{ fontSize: 28 }}>🎙️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{n.title}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{n.date} · {n.time} · {n.duration}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: '#334155', padding: 8, borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>▶ Play</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState('home');
  const [theme, setTheme]                 = useState('neon');
  const [mood, setMood]                   = useState('Happy');
  const [userSide, setUserSide]           = useState('teen');
  const [selectedSekret, setSelectedSekret] = useState('soft');
  const [sekretMode, setSekretMode]       = useState('soft');
  const [growthPath, setGrowthPath]       = useState('preferNotToSay');
  const [journalText, setJournalText]     = useState('');
  const [entries, setEntries]             = useState<any[]>([]);
  const [moodHistory, setMoodHistory]     = useState<any[]>([]);
  const [circlePosts, setCirclePosts]     = useState<any[]>([]);
  const [circlePostText, setCirclePostText] = useState('');
  const [voiceNotes, setVoiceNotes]       = useState<any[]>([]);
  const [sekretMessage, setSekretMessage] = useState('');
  const [sekretReply, setSekretReply]     = useState("I see you. You did your best with what you had today. Wanna tell me what the hardest part was?");
  const [isSekretTyping, setIsSekretTyping] = useState(false);
  const [comfortIdx, setComfortIdx]       = useState(0);
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const t             = THEME_PACKS[theme] || THEME_PACKS.neon;
  const currentSekret = SEKRET_PROFILES[selectedSekret];
  const isRylane      = selectedSekret === 'rylane';

  const art = {
    neutral:  isRylane ? IMAGES.rylaneNeutral  : IMAGES.rayleneNeutral,
    happy:    isRylane ? IMAGES.rylaneHappy    : IMAGES.rayleneHappy,
    thinking: isRylane ? IMAGES.rylaneThinking : IMAGES.rayleneThinking,
    writing:  isRylane ? IMAGES.rylaneWriting  : IMAGES.rayleneWriting,
    window:   isRylane ? IMAGES.rylaneWindow   : IMAGES.rayleneWindow,
    fullbody: isRylane ? IMAGES.rylaneFullbody : IMAGES.rayleneFullbody,
  };

  // ── LOAD STATE ─────────────────────────────────────────────────────────────
  // Uses loadState from utils/storage — same keys, same data, adds error handling
  useEffect(() => {
    (async () => {
      const state = await loadState();
      if (state.theme)          setTheme(state.theme);
      if (state.mood)           setMood(state.mood);
      if (state.userSide)       setUserSide(state.userSide);
      if (state.selectedSekret) setSelectedSekret(state.selectedSekret);
      if (state.sekretMode)     setSekretMode(state.sekretMode);
      if (state.growthPath)     setGrowthPath(state.growthPath);
      if (state.journalText)    setJournalText(state.journalText);
      if (state.entries)        setEntries(state.entries);
      if (state.moodHistory)    setMoodHistory(state.moodHistory);
      if (state.circlePosts)    setCirclePosts(state.circlePosts);
      if (state.voiceNotes)     setVoiceNotes(state.voiceNotes);
      setIsLoading(false);
    })();
  }, []);

  // ── SAVE STATE ─────────────────────────────────────────────────────────────
  // Uses saveState from utils/storage — same keys, adds error handling + JSON auto-handling
  // Guard on isLoading prevents saving defaults over real persisted data on first render
  useEffect(() => {
    if (isLoading) return;
    saveState({
      theme,
      mood,
      userSide,
      selectedSekret,
      sekretMode,
      growthPath,
      journalText,
      entries,
      moodHistory,
      circlePosts,
      voiceNotes,
    });
  }, [
    theme, mood, userSide, selectedSekret, sekretMode,
    growthPath, journalText, entries, moodHistory,
    circlePosts, voiceNotes, isLoading,
  ]);

  // ── ANIMATIONS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
      Animated.timing(breatheAnim, { toValue: 1,   duration: 2200, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setHomeMessageIndex(p => (p + 1) % HOME_MESSAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  // ── STYLE HELPERS ─────────────────────────────────────────────────────────
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const selectMood = (m: string) => {
    setMood(m);
    setMoodHistory(h => [{
      id: Date.now(), mood: m,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    }, ...h]);
  };

  const saveEntry = () => {
    if (!journalText.trim()) return;
    setEntries(e => [{
      id: Date.now(), text: journalText, mood,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    }, ...e]);
    setJournalText('');
  };

  const saveCirclePost = () => {
    if (!circlePostText.trim()) return;
    setCirclePosts(p => [{
      id: Date.now(), text: circlePostText,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 },
    }, ...p]);
    setCirclePostText('');
  };

  const reactToPost = (id: number, type: string) => {
    setCirclePosts(posts => posts.map(p =>
      p.id === id ? { ...p, reactions: { ...p.reactions, [type]: p.reactions[type] + 1 } } : p
    ));
  };

  const sendSekretMessage = async () => {
    if (!sekretMessage.trim()) return;
    const msg = sekretMessage;
    setSekretMessage('');
    setIsSekretTyping(true);
    const reply = await fetchSekretReply(msg, 'journal', mood);
    setSekretReply(`${currentSekret.name}: ${reply}`);
    setIsSekretTyping(false);
  };

  const nav = <BottomNav screen={screen} setScreen={setScreen} userSide={userSide} />;

  // Show nothing while loading so defaults don't flash before persisted state loads
  if (isLoading) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // PERIOD CALENDAR
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'periodCalendar') return <PeriodCalendar theme={t} setScreen={setScreen} />;

  // ─────────────────────────────────────────────────────────────────────────
  // VOICE BIP
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'voiceBip') return (
    <VoiceBip
      theme={t}
      setScreen={setScreen}
      selectedSekret={selectedSekret}
      voiceNotes={voiceNotes}
      setVoiceNotes={setVoiceNotes}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // HOME
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <HomeScreen
      mood={mood}
      selectMood={selectMood}
      t={t}
      currentSekret={currentSekret}
      homeMessageIndex={homeMessageIndex}
      breatheAnim={breatheAnim}
      userSide={userSide}
      screen={screen}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PAGES
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'pages') return (
    <JournalScreen
      journalText={journalText}
      setJournalText={setJournalText}
      entries={entries}
      saveEntry={saveEntry}
      mood={mood}
      t={t}
      currentSekret={currentSekret}
      selectedSekret={selectedSekret}
      art={art}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CALM
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'calm') return (
    <CalmScreen
      t={t}
      breatheAnim={breatheAnim}
      comfortIdx={comfortIdx}
      setComfortIdx={setComfortIdx}
      art={art}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SE'KRET CHAT
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'sekret') return (
    <SekretScreen
      t={t}
      currentSekret={currentSekret}
      art={art}
      selectedSekret={selectedSekret}
      setSelectedSekret={setSelectedSekret}
      sekretMessage={sekretMessage}
      setSekretMessage={setSekretMessage}
      sekretReply={sekretReply}
      isSekretTyping={isSekretTyping}
      sendSekretMessage={sendSekretMessage}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CIRCLE
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'circle') return (
    <CircleScreen
      t={t}
      circlePosts={circlePosts}
      circlePostText={circlePostText}
      setCirclePostText={setCirclePostText}
      saveCirclePost={saveCirclePost}
      reactToPost={reactToPost}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BRIDGE
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'bridge') return (
    <BridgeScreen t={t} currentSekret={currentSekret} setScreen={setScreen} BottomNav={nav} />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PARENT BRIDGE
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'parentBridge') return (
    <ParentBridgeScreen t={t} setScreen={setScreen} BottomNav={nav} />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BIPPIN2
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'bippin2') return (
    <Bippin2Screen
      t={t}
      mood={mood}
      growthPath={growthPath}
      setGrowthPath={setGrowthPath}
      art={art}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // COMFORT MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'comfort') return (
    <ComfortScreen t={t} BottomNav={nav} />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MIND / BODY RESET
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'mindReset' || screen === 'bodyReset') return (
    <MindBodyResetScreen
      screen={screen as 'mindReset' | 'bodyReset'}
      t={t}
      breatheAnim={breatheAnim}
      art={art}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MORE
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'more') return (
    <MoreScreen
      t={t}
      userSide={userSide}
      setUserSide={setUserSide}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS / VIBE LAB
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'settings') return (
    <SettingsScreen
      t={t}
      theme={theme}
      setTheme={setTheme}
      selectedSekret={selectedSekret}
      setSelectedSekret={setSelectedSekret}
      sekretMode={sekretMode}
      setSekretMode={setSekretMode}
      userSide={userSide}
      setUserSide={setUserSide}
      art={art}
      BottomNav={nav}
    />
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:             { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:         { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  heroText:         { fontSize: 24, color: '#fff', textAlign: 'center', fontWeight: 'bold', marginBottom: 10, lineHeight: 32 },
  sectionTitle:     { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },

  card:             { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:        { fontSize: 32, marginBottom: 8 },
  cardText:         { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  cardTitle:        { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  entryText:        { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  entryDate:        { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  journalSavedText: { color: '#fff', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  miniText:         { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },

  button:           { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  journalInput:     { color: '#fff', padding: 16, borderRadius: 18, minHeight: 130, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },

  row:              { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  smallAction:      { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  smallButton:      { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText:  { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  moodRow:          { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, gap: 8 },
  moodBubble:       { width: 66, height: 66, borderRadius: 33, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  moodEmoji:        { fontSize: 28 },
  tagBubble:        { padding: 9, borderRadius: 14, borderWidth: 1, marginBottom: 8, marginRight: 8 },

  cloudWrap:        { alignItems: 'center', marginVertical: 16 },
  cloudImg:         { width: 100, height: 100 },

  circle:           { width: 170, height: 170, borderRadius: 85, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  circleImg:        { width: 90, height: 90 },
  circleText:       { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  circleTextSmall:  { color: '#fff', fontSize: 16, marginTop: 6, fontWeight: 'bold' },

  choiceButton:     { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },

  reactionRow:      { flexDirection: 'row', marginTop: 12, justifyContent: 'space-around', flexWrap: 'wrap', gap: 6 },
  reactionButton:   { backgroundColor: '#1E293B', padding: 9, borderRadius: 12 },
  reactionText:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  bottomNav:        { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, backgroundColor: '#111827', borderRadius: 20, marginTop: 28, marginBottom: 20, flexWrap: 'wrap', gap: 8 },
  navItem:          { alignItems: 'center', minWidth: 48 },
  navIcon:          { fontSize: 20, marginBottom: 3 },
  navText:          { color: '#94A3B8', fontSize: 11 },
  activeNavText:    { color: '#fff', fontWeight: 'bold' },

  themeRow:         { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  themeBubble:      { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  themeEmoji:       { fontSize: 26 },

  duoRow:           { flexDirection: 'row', gap: 12, marginBottom: 14 },
  largeCard:        { flex: 1, borderRadius: 20, padding: 14 },
  bigEmoji:         { fontSize: 40, marginTop: 8 },
  bigNumber:        { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },

  featureGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  featureCard:      { width: '47%', borderRadius: 18, padding: 14, alignItems: 'center' },
  featureEmoji:     { fontSize: 28, marginBottom: 6 },
  featureText:      { color: '#fff', fontSize: 13, textAlign: 'center', fontWeight: '600' },

  sectionCard:      { backgroundColor: '#1E293B', borderRadius: 20, padding: 18, marginBottom: 15 },
  quoteBox:         { backgroundColor: '#1E293B', padding: 16, borderRadius: 18, marginBottom: 18 },
  quoteText:        { color: '#CBD5E1', fontSize: 14, textAlign: 'center' },

  parentBadge:      { backgroundColor: '#065F46', borderRadius: 10, padding: 6, alignSelf: 'center', marginBottom: 10 },
  choiceHero:       { alignItems: 'center', marginBottom: 30 },
  backBtn:          { marginBottom: 12 },
  backText:         { color: '#94A3B8', fontSize: 14 },

  artworkLarge:     { width: '100%', height: 280, marginBottom: 16, borderRadius: 20 },
  artworkMedium:    { width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
  artworkPortrait:  { width: 180, height: 220, alignSelf: 'center', marginBottom: 16 },
  artworkSmall:     { width: 80, height: 80, alignSelf: 'center', marginTop: 8 },
});
