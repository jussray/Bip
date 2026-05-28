import React, { useState, useEffect, useRef } from 'react';
import {
  Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, View, Animated, SafeAreaView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// ── THEME PACKS ───────────────────────────────────────────────────────────────
const THEME_PACKS: Record<string, any> = {
  night:  { name: 'Golden Moon',  emoji: '🌙', background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '🌸', background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '🌧️', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '💜', background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '🌌', background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

// ── SE'KRET PROFILES ─────────────────────────────────────────────────────────
const SEKRET_PROFILES: Record<string, any> = {
  soft:   { name: "Se'kret",        emoji: '🌸', title: 'Soft Big Sis',        vibe: 'Warm, expressive, protective, and real.',      greeting: "Hey love. I'm here. Tell me what's on your mind." },
  rylane: { name: 'Rylane',         emoji: '⚡', title: 'Loyal Bro',           vibe: 'Quiet loyalty. Keeps it real. Never talks down.', greeting: "Aight, I'm here. What's been heavy?" },
  cloud:  { name: "Cloud Se'kret",  emoji: '☁️', title: 'Quiet Comfort',       vibe: 'Soft, calm, low-pressure presence.',             greeting: "No pressure. We can just sit here for a minute." },
  night:  { name: "Night Se'kret",  emoji: '🌙', title: 'Late-Night Listener', vibe: 'Minimal words, calm energy, safe space.',        greeting: "I'm here. You don't gotta explain perfectly." },
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

// ── SEKRET API REPLY ─────────────────────────────────────────────────────────
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

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen, userSide }: any) {
  const items = userSide === 'parent'
    ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret','💜',"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
    : [['home','🏠','Home'],['pages','📖','Pages'],['calm','🌙','Calm'],['circle','🌐','Circle'],['sekret','💜',"Se'kret"],['more','☰','More']];
  return (
    <View style={s.bottomNav}>
      {items.map(([id, icon, label]) => (
        <TouchableOpacity key={id} onPress={() => setScreen(id)} style={s.navItem}>
          <Text style={s.navIcon}>{icon}</Text>
          <Text style={[s.navText, screen === id && s.activeNavText]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── PERIOD CALENDAR ───────────────────────────────────────────────────────────
function PeriodCalendar({ theme, setScreen }: any) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [markedDays, setMarkedDays] = useState<Record<string, string>>({});
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('periodDays').then(v => { if (v) setMarkedDays(JSON.parse(v)); });
    AsyncStorage.getItem('lastPeriodStart').then(v => { if (v) setLastPeriodStart(v); });
  }, []);

  const save = async (days: Record<string, string>, start: string | null) => {
    await AsyncStorage.setItem('periodDays', JSON.stringify(days));
    if (start) await AsyncStorage.setItem('lastPeriodStart', start);
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const toggleDay = (day: number) => {
    const key = `${currentYear}-${currentMonth + 1}-${day}`;
    const next = { ...markedDays };
    if (next[key]) { delete next[key]; }
    else {
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

  const days = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => setScreen('bippin2')} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.logo}>Cycle Calendar 🩸</Text>
      <Text style={s.subtitle}>Track your cycle privately. Only you can see this.</Text>

      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}>
            <Text style={{ color: theme.accent, fontSize: 22 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{monthName}</Text>
          <TouchableOpacity onPress={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}>
            <Text style={{ color: theme.accent, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <Text key={d} style={{ flex: 1, textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 'bold' }}>{d}</Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((day, i) => {
            const key = day ? `${currentYear}-${currentMonth + 1}-${day}` : null;
            const marked = key && markedDays[key];
            return (
              <TouchableOpacity
                key={i}
                style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}
                onPress={() => day && toggleDay(day)}
                disabled={!day}
              >
                <View style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
                  marked && { backgroundColor: theme.accent }]}>
                  <Text style={{ color: day ? (marked ? '#fff' : '#E2E8F0') : 'transparent', fontSize: 14 }}>{day || ''}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {predictNext() && (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: theme.soft, fontSize: 13, marginBottom: 4 }}>Next predicted period</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>~{predictNext()}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Based on a 28-day average cycle</Text>
        </View>
      )}

      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Comfort Tips 💜</Text>
        {['Use a heating pad for cramps','Stay hydrated — water helps a lot','Rest when your body asks for it',"Be gentle with yourself, it's okay to slow down",'Dark chocolate and warm tea are your friends 🍫'].map(tip => (
          <Text key={tip} style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 6 }}>• {tip}</Text>
        ))}
      </View>

      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: theme.soft, fontStyle: 'italic', fontSize: 14, textAlign: 'center' }}>
          Tap any day to mark it. Your data stays private on this device. 🔒
        </Text>
      </View>
    </ScrollView>
  );
}

// ── VOICE BIP SCREEN ─────────────────────────────────────────────────────────
function VoiceBip({ theme, setScreen }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [sekretReply, setSekretReply] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('voiceNotes').then(v => { if (v) setVoiceNotes(JSON.parse(v)); });
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setRecorded(false);
    setSekretReply('');
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
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
    await AsyncStorage.setItem('voiceNotes', JSON.stringify(next));

    // Get Se'kret reply
    setIsThinking(true);
    const reply = await fetchSekretReply('I just recorded a voice bip. I had some feelings I needed to get out.', 'journal');
    setSekretReply(reply);
    setIsThinking(false);
  };

  return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => setScreen('pages')} style={s.backBtn}>
        <Text style={s.backText}>← Back to Pages</Text>
      </TouchableOpacity>
      <Text style={s.logo}>Voice Bip 🎙️</Text>
      <Text style={s.subtitle}>Say it out loud. 30–60 seconds. Let it go.</Text>

      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent, alignItems: 'center', paddingVertical: 32 }]}>
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
          style={[s.button, { backgroundColor: isRecording ? '#EF4444' : theme.accent, marginTop: 20, width: 200 }]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={s.buttonText}>{isRecording ? '⏹ Stop Recording' : '▶ Start Voice Bip'}</Text>
        </TouchableOpacity>
      </View>

      {isThinking && (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: theme.soft, fontSize: 14 }}>Se'kret is listening... ☁️</Text>
        </View>
      )}

      {sekretReply ? (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: theme.soft, fontSize: 13, marginBottom: 6 }}>Se'kret replied 💜</Text>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>{sekretReply}</Text>
        </View>
      ) : null}

      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Tips for Voice Bips 🌙</Text>
        {["Find a private spot — car, room, bathroom, wherever","You don't need perfect words. Just talk.","It's okay to cry, pause, or start over","Se'kret listens without judgment, always"].map(tip => (
          <Text key={tip} style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 6 }}>• {tip}</Text>
        ))}
      </View>

      {voiceNotes.length > 0 && (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Saved Voice Bips</Text>
          {voiceNotes.slice(0, 5).map(n => (
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

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home');
  const [theme, setTheme] = useState('neon');
  const [mood, setMood] = useState('Happy');
  const [userSide, setUserSide] = useState('teen');
  const [selectedSekret, setSelectedSekret] = useState('soft');
  const [sekretMode, setSekretMode] = useState('soft');
  const [growthPath, setGrowthPath] = useState('preferNotToSay');
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [circlePostText, setCirclePostText] = useState('');
  const [circlePosts, setCirclePosts] = useState<any[]>([]);
  const [sekretMessage, setSekretMessage] = useState('');
  const [sekretReply, setSekretReply] = useState("I see you. You did your best with what you had today. Wanna tell me what the hardest part was?");
  const [isSekretTyping, setIsSekretTyping] = useState(false);
  const [comfortIdx, setComfortIdx] = useState(0);
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const t = THEME_PACKS[theme] || THEME_PACKS.neon;
  const currentSekret = SEKRET_PROFILES[selectedSekret];

  // Load persisted data
  useEffect(() => {
    (async () => {
      const keys = ['theme','mood','userSide','selectedSekret','sekretMode','growthPath','journalText','entries','moodHistory','circlePosts'];
      const vals = await AsyncStorage.multiGet(keys);
      vals.forEach(([k, v]) => {
        if (!v) return;
        if (k === 'theme') setTheme(v);
        if (k === 'mood') setMood(v);
        if (k === 'userSide') setUserSide(v);
        if (k === 'selectedSekret') setSelectedSekret(v);
        if (k === 'sekretMode') setSekretMode(v);
        if (k === 'growthPath') setGrowthPath(v);
        if (k === 'journalText') setJournalText(v);
        if (k === 'entries') setEntries(JSON.parse(v));
        if (k === 'moodHistory') setMoodHistory(JSON.parse(v));
        if (k === 'circlePosts') setCirclePosts(JSON.parse(v));
      });
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    AsyncStorage.multiSet([
      ['theme', theme], ['mood', mood], ['userSide', userSide],
      ['selectedSekret', selectedSekret], ['sekretMode', sekretMode],
      ['growthPath', growthPath], ['journalText', journalText],
      ['entries', JSON.stringify(entries)],
      ['moodHistory', JSON.stringify(moodHistory)],
      ['circlePosts', JSON.stringify(circlePosts)],
    ]);
  }, [theme, mood, userSide, selectedSekret, sekretMode, growthPath, journalText, entries, moodHistory, circlePosts]);

  // Breathe animation
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
      Animated.timing(breatheAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
    ])).start();
  }, []);

  // Rotate home messages
  useEffect(() => {
    const i = setInterval(() => setHomeMessageIndex(p => (p + 1) % HOME_MESSAGES.length), 5000);
    return () => clearInterval(i);
  }, []);

  const card = () => [s.card, { backgroundColor: t.card, borderColor: t.accent }];
  const btn = () => [s.button, { backgroundColor: t.accent, shadowColor: t.accent }];

  const selectMood = (m: string) => {
    setMood(m);
    setMoodHistory(h => [{ id: Date.now(), mood: m, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() }, ...h]);
  };

  const saveEntry = () => {
    if (!journalText.trim()) return;
    setEntries(e => [{ id: Date.now(), text: journalText, mood, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() }, ...e]);
    setJournalText('');
  };

  const saveCirclePost = () => {
    if (!circlePostText.trim()) return;
    setCirclePosts(p => [{ id: Date.now(), text: circlePostText, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 } }, ...p]);
    setCirclePostText('');
  };

  const reactToPost = (id: number, type: string) => {
    setCirclePosts(posts => posts.map(p => p.id === id ? { ...p, reactions: { ...p.reactions, [type]: p.reactions[type] + 1 } } : p));
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

  const getDynamicTags = () => {
    if (selectedSekret === 'rylane') return ['focused','mind heavy','protecting my peace','trying harder','locked in','building myself'];
    if (selectedSekret === 'soft')   return ['soft but strong','healing','trying my best','late night thoughts','emotional','peaceful'];
    if (selectedSekret === 'cloud')  return ['resting','breathing','quiet','healing','calm','soft day'];
    return ['good vibes','overthinking','protecting my peace','growing','learning myself','late night thoughts'];
  };

  const nav = <BottomNav screen={screen} setScreen={setScreen} userSide={userSide} />;

  // ── PERIOD CALENDAR ──
  if (screen === 'periodCalendar') return <PeriodCalendar theme={t} setScreen={setScreen} />;
  // ── VOICE BIP ──
  if (screen === 'voiceBip') return <VoiceBip theme={t} setScreen={setScreen} />;

  // ── HOME ─────────────────────────────────────────────────────────────────
 // ─────────────────────────────────────────────────────────────────────────────
// PASTE THIS AT THE TOP OF index.tsx — replaces your existing imports
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, View, Animated, Platform, Image,
  ImageBackground, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// ASSETS — make sure these files exist in assets/images/
// ─────────────────────────────────────────────────────────────────────────────
const IMAGES = {
  raylene: {
    thinking: require('./assets/images/raylene-thinking.png'),
    writing:  require('./assets/images/raylene-writing.png'),
    neutral:  require('./assets/images/raylene-neutral.png'),
    happy:    require('./assets/images/raylene-happy.png'),
    window:   require('./assets/images/raylene-window.png'),
  },
  rylane: {
    thinking: require('./assets/images/rylane-writing.png'),
    writing:  require('./assets/images/rylane-writing.png'),
    neutral:  require('./assets/images/rylane-neutral.png'),
    happy:    require('./assets/images/rylane-neutral.png'),
    window:   require('./assets/images/rylane-standing.png'),
  },
  cloud:          require('./assets/images/cloud.png'),
  cloudHeadphones:require('./assets/images/cloud-headphones.png'),
  cloudStormy:    require('./assets/images/cloud-stormy.png'),
  roomBg:         require('./assets/images/room-bg.png'),
  roomBgDark:     require('./assets/images/room-bg-dark.png'),
  mom:            require('./assets/images/mom.png'),
};

// ─────────────────────────────────────────────────────────────────────────────
// KEEP ALL YOUR EXISTING CONSTANTS BELOW THIS LINE (THEME_PACKS, SEKRET_PROFILES, etc.)
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// REPLACE your existing HOME screen block with this
// Find:  if (screen === 'home') return (
// Replace the entire block up to the next   if (screen === 'pages')
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'home') {
    const voiceKey = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
    const charImg = mood === 'Happy'
      ? IMAGES[voiceKey].happy
      : mood === 'Sad' || mood === 'Tired'
        ? IMAGES[voiceKey].thinking
        : IMAGES[voiceKey].neutral;

    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HERO ── */}
          <View style={{ marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
            <ImageBackground
              source={IMAGES.roomBg}
              style={{ width: '100%', minHeight: 220 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(13,9,20,0.1)', 'rgba(13,9,20,0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 }}>
                      {new Date().getHours() < 12 ? 'good morning,' : new Date().getHours() < 17 ? 'good afternoon,' : 'good night,'}
                    </Text>
                    <Text style={{ fontSize: 26, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>
                      {selectedSekret === 'rylane' ? 'Rylane 🌙' : 'Raylene 🌙'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#a78cc0', marginTop: 6, lineHeight: 18 }}>
                      You made it through today.{'\n'}I'm proud of you. 💜
                    </Text>
                  </View>
                  <Image
                    source={charImg}
                    style={{ width: 110, height: 110, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(168,85,247,0.35)' }}
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  style={{ marginTop: 14, alignSelf: 'flex-start', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)', paddingHorizontal: 18, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(124,58,237,0.2)' }}
                  onPress={() => setScreen('sekret')}
                >
                  <Text style={{ fontSize: 15 }}>💬</Text>
                  <Text style={{ fontSize: 13, color: '#c4b5fd', fontWeight: '600' }}>talk to Se'kret</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>

          {/* ── EMOTIONAL WEATHER ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>
              {mood === 'Happy' ? '☀️' : mood === 'Sad' ? '🌧️' : mood === 'Angry' ? '⛈️' : '🌩️'}
            </Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 10, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>emotional weather ✦</Text>
              <Text style={{ fontSize: 20, color: '#f5f0ff', fontWeight: '700' }}>
                {mood === 'Happy' ? 'Feeling Good' : mood === 'Sad' ? 'Heavy Heart' : mood === 'Angry' ? 'Worked Up' : 'Overwhelmed'}
              </Text>
              <Text style={{ fontSize: 12, color: '#7c6899' }}>
                {mood === 'Happy' ? 'Light and warm.' : mood === 'Sad' ? 'It is okay to feel this.' : mood === 'Angry' ? 'Your feelings are valid.' : 'Heavy mind, tired soul.'}
              </Text>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: '#f472b6', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, color: '#f5f0ff', fontWeight: '700' }}>6/10</Text>
              <Text style={{ fontSize: 8, color: '#7c6899' }}>energy</Text>
            </View>
          </View>

          {/* ── MOOD CHECK-IN ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(244,114,182,0.25)', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', flex: 1 }}>how's your heart right now? 💜</Text>
              <View style={{ backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 10, color: '#c4b5fd', fontWeight: '700' }}>quick check-in</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { id: 'Awful', emoji: '😟' },
                { id: 'Sad',   emoji: '😢' },
                { id: 'Tired', emoji: '😐' },
                { id: 'Happy', emoji: '🙂' },
                { id: 'Good',  emoji: '😊' },
                { id: 'Amazing', emoji: '😄' },
              ].map(m => (
                <TouchableOpacity key={m.id} onPress={() => selectMood(m.id)} style={{ alignItems: 'center', gap: 4 }}>
                  <View style={[
                    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
                    mood === m.id && { backgroundColor: 'rgba(168,85,247,0.3)', borderColor: '#a855f7' }
                  ]}>
                    <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: mood === m.id ? '#c4b5fd' : '#7c6899' }}>{m.id.toLowerCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── STREAK + REMINDER ── */}
          <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 14 }}>
              <Text style={{ fontSize: 10, color: '#a855f7', marginBottom: 4 }}>connection streak</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
                <Text style={{ fontSize: 28, color: '#f5f0ff', fontWeight: '800', lineHeight: 32 }}>12</Text>
                <Text style={{ fontSize: 12, color: '#7c6899', marginBottom: 4 }}>days</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#7c6899', marginTop: 4, lineHeight: 15 }}>consistent self-care.{'\n'}you got this.</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', padding: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(13,9,20,0.8)']} style={StyleSheet.absoluteFill} />
              <Text style={{ fontSize: 9, color: '#f472b6', letterSpacing: 1, marginBottom: 6 }}>late night reminder</Text>
              <Text style={{ fontSize: 12, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 17 }}>
                "it's okay to not have it all figured out tonight. 💜"
              </Text>
              <Text style={{ position: 'absolute', top: 10, right: 12, fontSize: 16 }}>⭐</Text>
            </View>
          </View>

          {/* ── SE'KRET MESSAGE ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.5)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Image source={IMAGES.cloud} style={{ width: 56, height: 56 }} resizeMode="contain" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: '#f472b6', fontWeight: '700' }}>Se'kret sees you 💜</Text>
                  <View style={{ backgroundColor: 'rgba(236,72,153,0.2)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, color: '#f472b6', fontWeight: '700' }}>NEW</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 20 }}>
                  {mood === 'Sad'
                    ? `I read your energy tonight, ${selectedSekret === 'rylane' ? 'Rylane' : 'Raylene'}. Heavy nights don't last forever. I'm right here.`
                    : mood === 'Angry'
                      ? `I see you, ${selectedSekret === 'rylane' ? 'Rylane' : 'Raylene'}. Your feelings make sense. You're safe to let it out here.`
                      : `I read your entry from tonight. That sounds really heavy, ${selectedSekret === 'rylane' ? 'Rylane' : 'Raylene'}. You carry so much and still try to hold it together. I'm proud of you. 💜`}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {['💬 talk more', '✨ give advice'].map(b => (
                <TouchableOpacity key={b} onPress={() => setScreen('sekret')} style={{ backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}>
                  <Text style={{ fontSize: 12, color: '#c4b5fd', fontWeight: '600' }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── CONTINUE ENTRY ── */}
          <TouchableOpacity onPress={() => setScreen('pages')} style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={selectedSekret === 'rylane' ? IMAGES.rylane.window : IMAGES.raylene.window}
              style={{ width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 10, color: '#a855f7', marginBottom: 5 }}>continue where you left off</Text>
              <Text style={{ fontSize: 12, color: '#a78cc0', fontStyle: 'italic', lineHeight: 17 }} numberOfLines={2}>
                {journalText.trim() ? `"${journalText.slice(0, 80)}..."` : '"tap to start your first entry tonight..."'}
              </Text>
            </View>
            <Text style={{ color: '#7c6899', fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          {/* ── QUICK ACTIONS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 10 }}>quick actions ✦</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { icon: '✏️', label: 'Write\nIt Out', to: 'pages' },
                { icon: '🎙️', label: 'Voice\nBip',   to: 'voiceBip' },
                { icon: '📹', label: 'Video\nBip',   to: 'pages' },
                { icon: '🌉', label: "Se'krets\n2Tell", to: 'bridge' },
              ].map(a => (
                <TouchableOpacity key={a.label} onPress={() => setScreen(a.to)} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)' }}>
                  <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(13,9,20,0.8)']} style={{ padding: 12, alignItems: 'center', minHeight: 72, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</Text>
                    <Text style={{ fontSize: 10, color: '#7c6899', textAlign: 'center', lineHeight: 14 }}>{a.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── TINY BIP ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' }}>
            <LinearGradient colors={['rgba(76,29,149,0.2)', 'rgba(13,9,20,0.6)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
              <Image source={IMAGES.cloudHeadphones} style={{ width: 44, height: 44 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#f472b6', marginBottom: 3 }}>tiny Bip for your heart 💜</Text>
                <Text style={{ fontSize: 12, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 17 }}>
                  Breathe, {selectedSekret === 'rylane' ? 'Rylane' : 'Raylene'}. You're doing better than you think. ✨
                </Text>
              </View>
              <TouchableOpacity onPress={() => setScreen('calm')} style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient colors={['#7c3aed', '#ec4899']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#fff' }}>▶</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ── PARENT BADGE ── */}
          {userSide === 'parent' && (
            <View style={{ backgroundColor: '#065F46', borderRadius: 10, padding: 6, alignSelf: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#6EE7B7', fontSize: 12 }}>🌿 PARENT SIDE</Text>
            </View>
          )}

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    );
  }

 // ─────────────────────────────────────────────────────────────────────────────
// PAGES SCREEN — replace your existing:
// if (screen === 'pages') return (
// ...all the way down to just before...
// if (screen === 'calm') return (
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'pages') {
    const voiceKey = selectedSekret === 'rylane' ? 'rylane' : 'raylene';

    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER ── */}
          <View style={{ marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
            <ImageBackground
              source={IMAGES.roomBgDark}
              style={{ width: '100%', minHeight: 160 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.9)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 160 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 }}>your journal. your space.</Text>
                  <Text style={{ fontSize: 26, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>Se'kret Pages 🔒</Text>
                  <Text style={{ fontSize: 12, color: '#a78cc0', marginTop: 4 }}>write it out. get it off your chest.</Text>
                </View>
                <Image
                  source={IMAGES[voiceKey].writing}
                  style={{ width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(168,85,247,0.35)' }}
                  resizeMode="cover"
                />
              </View>
            </ImageBackground>
          </View>

          {/* ── NEW ENTRY BUTTON ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#7c3aed', '#ec4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ padding: 14, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 15, color: '#fff', fontWeight: '700' }}>New Entry +</Text>
            </LinearGradient>
          </View>

          {/* ── ENTRY TYPE TABS ── */}
          <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 50, padding: 4, gap: 2 }}>
            {['journal', 'voice', 'video', 'scrap'].map((tab, i) => (
              <View key={tab} style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 50, backgroundColor: i === 0 ? '#7c3aed' : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: i === 0 ? '#fff' : '#7c6899' }}>{tab}</Text>
              </View>
            ))}
          </View>

          {/* ── WRITE IT OUT ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.35)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '700' }}>✏️ Write It Out</Text>
              <Text style={{ fontSize: 10, color: '#7c6899' }}>private journal entry</Text>
            </View>
            <TextInput
              style={{
                color: '#f5f0ff',
                fontSize: 14,
                lineHeight: 22,
                minHeight: 130,
                textAlignVertical: 'top',
                fontStyle: journalText.trim() ? 'normal' : 'italic',
              }}
              placeholder="today was a lot. i tried to stay strong but..."
              placeholderTextColor="#4a3d6b"
              multiline
              value={journalText}
              onChangeText={setJournalText}
            />
            <Text style={{ fontSize: 10, color: '#4a3d6b', marginTop: 6 }}>{journalText.length}/1000</Text>

            {/* Media buttons */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {[
                { icon: '🎙️', label: 'Voice Bip', sub: '30–60 sec', to: 'voiceBip' },
                { icon: '📹', label: 'Video Bip', sub: '30–60 sec', to: 'pages' },
                { icon: '📷', label: 'Add Photo', sub: 'optional',  to: 'pages' },
              ].map(b => (
                <TouchableOpacity
                  key={b.label}
                  onPress={() => setScreen(b.to)}
                  style={{ flex: 1, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 3 }}>{b.icon}</Text>
                  <Text style={{ fontSize: 10, color: '#c4b5fd', fontWeight: '600' }}>{b.label}</Text>
                  <Text style={{ fontSize: 9, color: '#7c6899' }}>{b.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── SE'KRET LISTENING ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image source={IMAGES.cloudHeadphones} style={{ width: 44, height: 44 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#a855f7', marginBottom: 4 }}>Se'kret is listening... ✦</Text>
              {/* Waveform */}
              <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                {[4,8,14,10,18,12,20,8,16,10,14,8,18,12,6,16,10,14].map((h, i) => (
                  <View key={i} style={{ width: 3, height: h, backgroundColor: i < 9 ? '#f472b6' : 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                ))}
              </View>
            </View>
          </View>

          {/* ── SE'KRET REPLIED ── */}
          {journalText.trim().length > 0 && (
            <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', padding: 16, overflow: 'hidden' }}>
              <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#a855f7', marginBottom: 4 }}>Se'kret replied · just now</Text>
                  <Text style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 20 }}>
                    That sounds really heavy, {selectedSekret === 'rylane' ? 'Rylane' : 'Raylene'}. 💜 You carry so much and still try to hold it together. You're not alone here. I see you.
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {['💜 that means a lot', '🥺 thank you', '💬 talk more'].map(b => (
                  <TouchableOpacity key={b} onPress={() => setScreen('sekret')} style={{ backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}>
                    <Text style={{ fontSize: 11, color: '#c4b5fd', fontWeight: '600' }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── MOOD TAGS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#a78cc0', marginBottom: 10 }}>Mood Tags · choose how this felt</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {getDynamicTags().map(tag => (
                <TouchableOpacity key={tag} style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}>
                  <Text style={{ fontSize: 11, color: '#c4b5fd', fontWeight: '600' }}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── SAVE BUTTON ── */}
          <TouchableOpacity onPress={saveEntry} style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#7c3aed', '#ec4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ padding: 15, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 15, color: '#fff', fontWeight: '700' }}>Save Page 💜</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── SAVED ENTRIES ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>This Week</Text>
            <Text style={{ fontSize: 11, color: '#a855f7' }}>see all</Text>
          </View>

          {entries.length === 0 ? (
            <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 20, alignItems: 'center' }}>
              <Image source={IMAGES.cloud} style={{ width: 48, height: 48, marginBottom: 10 }} resizeMode="contain" />
              <Text style={{ fontSize: 13, color: '#7c6899', textAlign: 'center', fontStyle: 'italic' }}>No pages yet. Your truth has a place here.</Text>
            </View>
          ) : (
            entries.map(e => (
              <View key={e.id} style={{ marginHorizontal: 16, marginBottom: 10, backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Image source={IMAGES.cloud} style={{ width: 32, height: 32 }} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}>
                      <Text style={{ fontSize: 10, color: '#c4b5fd', fontWeight: '600' }}>{e.mood} 💜</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#7c6899' }}>{e.date} · {e.time}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#a78cc0', fontStyle: 'italic', lineHeight: 18 }} numberOfLines={3}>"{e.text}"</Text>
                </View>
              </View>
            ))
          )}

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    );
  }

 // ─────────────────────────────────────────────────────────────────────────────
// CALM SCREEN — replace your existing:
// if (screen === 'calm') return (
// ...all the way down to just before...
// if (screen === 'sekret') return (
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'calm') {
    const voiceKey = selectedSekret === 'rylane' ? 'rylane' : 'raylene';

    const tools = [
      { icon: '💜', label: 'Breathe with me', sub: '1–5 min',       to: 'mindReset' },
      { icon: '🌿', label: 'Ground Yourself',  sub: '3–7 min',       to: 'bodyReset' },
      { icon: '📓', label: 'Release It Out',   sub: 'write + let go', to: 'pages' },
      { icon: '🌙', label: 'Sleep Better',     sub: 'stories + sounds', to: 'calm' },
      { icon: '⚡', label: 'SOS Calm Now',     sub: '30 sec reset',  to: 'comfort' },
    ];

    const sounds = [
      { icon: '🌧️', label: 'night rain',    sub: 'soothing rain sounds', time: '20:00' },
      { icon: '🎵', label: 'soft lo-fi',    sub: 'focus + unwind',       time: '30:00', playing: true },
      { icon: '🌊', label: 'ocean waves',   sub: 'reset your mind',      time: '25:00' },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER ── */}
          <View style={{ marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
            <ImageBackground
              source={IMAGES.roomBgDark}
              style={{ width: '100%', minHeight: 170 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(13,9,20,0.15)', 'rgba(13,9,20,0.92)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 18, minHeight: 170, justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 }}>your calm. your reset.</Text>
                <Text style={{ fontSize: 26, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>Se'kret Calm 💜</Text>
                <Text style={{ fontSize: 12, color: '#a78cc0', marginTop: 4 }}>your safe place.</Text>
              </View>
            </ImageBackground>
          </View>

          {/* ── CHECK IN BANNER ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.4)', 'rgba(13,9,20,0.8)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#f5f0ff', fontWeight: '600' }}>
                  Take a deep breath, {selectedSekret === 'rylane' ? 'Rylane' : 'Raylene'}. 💜
                </Text>
                <Text style={{ fontSize: 12, color: '#7c6899', marginTop: 4 }}>you made it through today. that matters.</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}>
                <Text style={{ fontSize: 11, color: '#c4b5fd', fontWeight: '600' }}>check-in ›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── MOOD SELECTION ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>How are you feeling right now?</Text>
              <TouchableOpacity style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 10, color: '#c4b5fd', fontWeight: '600' }}>choose</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { e: '😰', l: 'anxious' },
                  { e: '😩', l: 'overwhelmed' },
                  { e: '😢', l: 'sad' },
                  { e: '😤', l: 'stressed' },
                  { e: '😴', l: 'tired' },
                  { e: '😌', l: 'calm' },
                ].map(m => (
                  <TouchableOpacity key={m.l} style={{ alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)' }}>
                      <Text style={{ fontSize: 26 }}>{m.e}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#7c6899' }}>{m.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── BOX BREATHING ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.2)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <Text style={{ fontSize: 14, color: '#f5f0ff', fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>Box Breathing ✦</Text>
            <Text style={{ fontSize: 11, color: '#7c6899', textAlign: 'center', marginBottom: 16 }}>a simple way to calm your mind and body</Text>

            {/* Box diagram */}
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 160, position: 'relative' }}>
              {/* Box outline */}
              <View style={{ width: 110, height: 110, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 20, position: 'absolute' }} />

              {/* Animated cloud */}
              <Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
                <Image source={IMAGES.cloud} style={{ width: 70, height: 70 }} resizeMode="contain" />
              </Animated.View>

              {/* Labels */}
              <Text style={{ position: 'absolute', top: 4, fontSize: 11, color: '#c4b5fd', fontWeight: '700' }}>breathe in 4</Text>
              <Text style={{ position: 'absolute', bottom: 4, fontSize: 11, color: '#f472b6', fontWeight: '700' }}>breathe out 4</Text>
              <Text style={{ position: 'absolute', left: 0, fontSize: 11, color: '#7c6899' }}>hold 4</Text>
              <Text style={{ position: 'absolute', right: 0, fontSize: 11, color: '#7c6899' }}>hold 4</Text>
            </View>

            <TouchableOpacity onPress={() => setScreen('mindReset')} style={{ marginTop: 14, borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>⏸ Start Breathing</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── CALM TOOLS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>Calm Tools ✦</Text>
              <Text style={{ fontSize: 11, color: '#a855f7' }}>see all</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {tools.map(t => (
                  <TouchableOpacity
                    key={t.label}
                    onPress={() => setScreen(t.to)}
                    style={{ width: 82, backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</Text>
                    <Text style={{ fontSize: 10, color: '#c4b5fd', textAlign: 'center', lineHeight: 14, fontWeight: '600' }}>{t.label}</Text>
                    <Text style={{ fontSize: 9, color: '#7c6899', marginTop: 3 }}>{t.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── TODAY'S CALM PLAN ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>Today's Calm Plan 💜</Text>
              <Text style={{ fontSize: 10, color: '#a855f7' }}>small steps. big difference.</Text>
            </View>
            {[
              { done: true,  label: 'Breathe for 2 minutes',    time: '7:30 PM' },
              { done: true,  label: "Write down what's heavy",   time: '7:40 PM' },
              { done: false, label: 'Listen to a comfort sound', time: '—' },
              { done: false, label: 'Affirm something kind',     time: '—' },
            ].map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: 'rgba(167,114,192,0.1)' }}>
                <View style={[
                  { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
                  step.done
                    ? { backgroundColor: '#7c3aed', borderColor: '#7c3aed' }
                    : { borderColor: 'rgba(167,114,192,0.3)', backgroundColor: 'transparent' }
                ]}>
                  {step.done && <Text style={{ fontSize: 11, color: '#fff' }}>✓</Text>}
                </View>
                <Text style={{ flex: 1, fontSize: 12, color: step.done ? '#7c6899' : '#f5f0ff', textDecorationLine: step.done ? 'line-through' : 'none' }}>{step.label}</Text>
                <Text style={{ fontSize: 10, color: '#7c6899' }}>{step.time}</Text>
              </View>
            ))}
          </View>

          {/* ── CALM PLAYLIST ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>Calm Playlist ✦</Text>
              <Text style={{ fontSize: 11, color: '#a855f7' }}>see all</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#7c6899', marginBottom: 14 }}>music + sounds to relax</Text>
            {sounds.map((s, i) => (
              <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < sounds.length - 1 ? 1 : 0, borderBottomColor: 'rgba(167,114,192,0.1)' }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: s.playing ? '#f472b6' : '#f5f0ff', fontWeight: s.playing ? '700' : '400' }}>{s.label}</Text>
                  <Text style={{ fontSize: 11, color: '#7c6899' }}>{s.sub}</Text>
                </View>
                {s.playing && (
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#fff' }}>▶</Text>
                  </View>
                )}
                <Text style={{ fontSize: 11, color: '#7c6899' }}>{s.time}</Text>
              </View>
            ))}
          </View>

          {/* ── SE'KRET SAYS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.35)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Image source={IMAGES[voiceKey].thinking} style={{ width: 80, height: 80, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: '#f472b6', fontWeight: '700', marginBottom: 8 }}>💜 Se'kret says</Text>
                <Text style={{ fontSize: 13, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 20 }}>
                  {COMFORT_MESSAGES[comfortIdx].emoji} {COMFORT_MESSAGES[comfortIdx].text}
                </Text>
                <TouchableOpacity
                  onPress={() => setComfortIdx(i => (i + 1) % COMFORT_MESSAGES.length)}
                  style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}
                >
                  <Text style={{ fontSize: 11, color: '#c4b5fd', fontWeight: '600' }}>another one ✨</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── COMFORT MODE BUTTON ── */}
          <TouchableOpacity onPress={() => setScreen('comfort')} style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(124,58,237,0.4)', 'rgba(236,72,153,0.4)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 18 }}
            >
              <Text style={{ fontSize: 14, color: '#f5f0ff', fontWeight: '700' }}>🚨 Open Comfort Mode</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    );
  }
 // ─────────────────────────────────────────────────────────────────────────────
// SE'KRET CHAT SCREEN — replace your existing:
// if (screen === 'sekret') return (
// ...all the way down to just before...
// if (screen === 'circle') return (
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'sekret') {
    const voiceKey = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
    const name = selectedSekret === 'rylane' ? 'Rylane' : 'Raylene';

    const quickReplies = [
      '💜 What should I do?',
      '👂 Just listen',
      '☁️ Cheer me up',
    ];

    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />

        {/* ── HEADER ── */}
        <View style={{ marginTop: 52, marginHorizontal: 16, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
          <ImageBackground
            source={IMAGES.roomBgDark}
            style={{ width: '100%', minHeight: 180 }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(13,9,20,0.1)', 'rgba(13,9,20,0.88)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: 18, minHeight: 180, justifyContent: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                <Image
                  source={IMAGES[voiceKey].neutral}
                  style={{ width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(168,85,247,0.4)' }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 }}>your safe space</Text>
                  <Text style={{ fontSize: 22, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>
                    Chat with Se'kret 💜
                  </Text>
                  <Text style={{ fontSize: 12, color: '#a78cc0', marginTop: 4 }}>
                    {currentSekret.vibe}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ── SE'KRET GREETING CARD ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', padding: 16, overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(76,29,149,0.4)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Image source={IMAGES.cloudHeadphones} style={{ width: 52, height: 52 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#a855f7', marginBottom: 6 }}>{currentSekret.name} · {currentSekret.title}</Text>
              <Text style={{ fontSize: 14, color: '#f5f0ff', lineHeight: 22, fontStyle: 'italic' }}>
                "{currentSekret.greeting}"
              </Text>
            </View>
          </View>
        </View>

        {/* ── CHAT AREA ── */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 20 }}>

          {/* User message bubble */}
          <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
            <View style={{ maxWidth: '80%', backgroundColor: 'rgba(124,58,237,0.3)', borderRadius: 18, borderBottomRightRadius: 4, padding: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', lineHeight: 20 }}>
                today was a lot. i tried to stay strong but i just felt alone. nobody even noticed.
              </Text>
              <Text style={{ fontSize: 10, color: '#7c6899', marginTop: 6, textAlign: 'right' }}>11:42 PM ✓✓</Text>
            </View>
          </View>

          {/* Se'kret reply bubble */}
          <View style={{ alignItems: 'flex-start', marginBottom: 12, flexDirection: 'row', gap: 10 }}>
            <Image source={IMAGES.cloud} style={{ width: 32, height: 32, marginTop: 4 }} resizeMode="contain" />
            <View style={{ maxWidth: '80%' }}>
              <View style={{ backgroundColor: '#1a1030', borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: 'rgba(167,114,192,0.2)' }}>
                <Text style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 20 }}>
                  {isSekretTyping
                    ? `${currentSekret.name} is typing... ☁️`
                    : sekretReply}
                </Text>
                {!isSekretTyping && (
                  <Text style={{ fontSize: 10, color: '#7c6899', marginTop: 6 }}>11:45 PM</Text>
                )}
              </View>

              {/* Quick reaction buttons */}
              {!isSekretTyping && (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {quickReplies.map(q => (
                    <TouchableOpacity
                      key={q}
                      onPress={() => {
                        setSekretMessage(q);
                        sendSekretMessage();
                      }}
                      style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}
                    >
                      <Text style={{ fontSize: 11, color: '#c4b5fd', fontWeight: '600' }}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Se'kret follow up */}
          {!isSekretTyping && (
            <View style={{ alignItems: 'flex-start', marginBottom: 12, flexDirection: 'row', gap: 10 }}>
              <Image source={IMAGES.cloud} style={{ width: 32, height: 32, marginTop: 4 }} resizeMode="contain" />
              <View style={{ maxWidth: '80%', backgroundColor: '#1a1030', borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: 'rgba(167,114,192,0.2)' }}>
                <Text style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 20, marginBottom: 10 }}>
                  What would help you most right now?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { icon: '☁️', label: 'Comfort\nme' },
                    { icon: '✨', label: 'Give\nadvice' },
                    { icon: '👂', label: 'Just\nlisten' },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => setScreen('sekret')}
                      style={{ flex: 1, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</Text>
                      <Text style={{ fontSize: 10, color: '#c4b5fd', textAlign: 'center', lineHeight: 13 }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Today's check-in */}
          <View style={{ backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#f5f0ff', fontWeight: '600' }}>Today's Check-In</Text>
              <Text style={{ fontSize: 10, color: '#7c6899' }}>How are you feeling now?</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { e: '😞', l: 'worse' },
                { e: '😔', l: 'still\nheavy' },
                { e: '🙂', l: 'a little\nbetter' },
                { e: '😊', l: 'better' },
                { e: '😌', l: 'okay' },
              ].map(m => (
                <TouchableOpacity key={m.l} style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 26 }}>{m.e}</Text>
                  <Text style={{ fontSize: 9, color: '#7c6899', textAlign: 'center', lineHeight: 12 }}>{m.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Se'kret profile selector */}
          <View style={{ backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 14, marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#a78cc0', marginBottom: 12 }}>Choose Your Se'kret</Text>
            {Object.keys(SEKRET_PROFILES).map(key => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedSekret(key)}
                style={[
                  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1 },
                  selectedSekret === key
                    ? { backgroundColor: 'rgba(124,58,237,0.3)', borderColor: '#a855f7' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,114,192,0.15)' }
                ]}
              >
                <Text style={{ fontSize: 24 }}>{SEKRET_PROFILES[key].emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>{SEKRET_PROFILES[key].name}</Text>
                  <Text style={{ fontSize: 11, color: '#7c6899' }}>{SEKRET_PROFILES[key].title}</Text>
                </View>
                {selectedSekret === key && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#fff' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>

        {/* ── MESSAGE INPUT ── */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.1)', backgroundColor: '#0d0914' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#130d1f',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(168,85,247,0.25)',
                color: '#f5f0ff',
                fontSize: 13,
                paddingHorizontal: 16,
                paddingVertical: 10,
                maxHeight: 100,
              }}
              placeholder="Type to Se'kret..."
              placeholderTextColor="#4a3d6b"
              multiline
              value={sekretMessage}
              onChangeText={setSekretMessage}
            />
            <TouchableOpacity
              onPress={sendSekretMessage}
              style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={['#7c3aed', '#ec4899']}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 18, color: '#fff' }}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {/* Mic + image quick actions */}
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 10, justifyContent: 'center' }}>
            {['🎙️ Voice', '📷 Photo', '🌙 Calm me', '⭐ Affirmation'].map(a => (
              <TouchableOpacity key={a}>
                <Text style={{ fontSize: 11, color: '#7c6899' }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── BOTTOM NAV ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    );
  }

 // ─────────────────────────────────────────────────────────────────────────────
// CIRCLE SCREEN — replace your existing:
// if (screen === 'circle') return (
// ...all the way down to just before...
// if (screen === 'bridge') return (
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'circle') {
    const shouldStepIn = (text: string) =>
      ['alone','hurt','tired','done','empty','cry','sad','scared','anxious','panic'].some(w =>
        text.toLowerCase().includes(w)
      );

    const samplePosts = [
      {
        id: 999,
        user: selectedSekret === 'rylane' ? 'Rylane' : 'Raylene',
        time: 'May 20 · 11:42 PM',
        mood: 'alone 💜',
        text: 'some nights the thoughts are louder than everything else.',
        hasVoice: true,
        reactions: { felt: 46, comfort: 31, proud: 12, stay: 8 },
      },
      {
        id: 998,
        user: 'MoonBip ✨',
        time: '2h ago',
        mood: 'heavy',
        text: 'Some days I just feel like nobody really gets it.',
        hasVoice: false,
        reactions: { felt: 37, comfort: 28, proud: 10, stay: 6 },
      },
      {
        id: 997,
        user: 'soft soul 🌙',
        time: '4h ago',
        mood: 'grateful',
        text: 'It\'s okay to outgrow places, people, and versions of yourself.',
        hasVoice: false,
        reactions: { felt: 45, comfort: 52, proud: 18, stay: 9 },
      },
    ];

    const allPosts = [...samplePosts, ...circlePosts];

    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER ── */}
          <View style={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 24, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>Se'kret Circle 💜</Text>
              <Text style={{ fontSize: 20, color: '#7c6899' }}>···</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#7c6899', marginBottom: 12 }}>you're not alone. we show up.</Text>

            {/* Se'kret watching banner */}
            <View style={{ backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', marginBottom: 12 }}>
              <Image source={IMAGES.cloudHeadphones} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <Text style={{ fontSize: 12, color: '#c4b5fd', fontStyle: 'italic' }}>Se'kret is here. watching over this space.</Text>
            </View>
          </View>

          {/* ── FILTER TABS ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
              {['For You', 'New', 'Following', 'Anonymous'].map((tab, i) => (
                <View key={tab} style={{
                  borderRadius: 50,
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  backgroundColor: i === 0 ? 'rgba(236,72,153,0.2)' : 'rgba(124,58,237,0.15)',
                  borderWidth: 1,
                  borderColor: i === 0 ? 'rgba(244,114,182,0.4)' : 'rgba(168,85,247,0.2)',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: i === 0 ? '#f472b6' : '#c4b5fd' }}>{tab}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* ── POSTS ── */}
          {allPosts.map((post, idx) => (
            <View key={post.id} style={{
              marginHorizontal: 16,
              marginBottom: 12,
              backgroundColor: '#130d1f',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: idx === 0 ? 'rgba(244,114,182,0.25)' : 'rgba(167,114,192,0.15)',
              padding: 16,
              overflow: 'hidden',
            }}>
              {idx === 0 && (
                <LinearGradient
                  colors={['rgba(76,29,149,0.2)', 'rgba(13,9,20,0)']}
                  style={StyleSheet.absoluteFill}
                />
              )}

              {/* Post header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 21,
                  background: 'rgba(124,58,237,0.3)',
                  backgroundColor: 'rgba(124,58,237,0.3)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
                  overflow: 'hidden',
                }}>
                  {idx === 0 ? (
                    <Image
                      source={selectedSekret === 'rylane' ? IMAGES.rylane.neutral : IMAGES.raylene.neutral}
                      style={{ width: 42, height: 42 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 18 }}>{idx === 1 ? '⭐' : '🌙'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '700' }}>{post.user} 💜</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <View style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, color: '#c4b5fd', fontWeight: '600' }}>anonymous 👤</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#7c6899' }}>{post.time}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(236,72,153,0.15)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(244,114,182,0.2)' }}>
                  <Text style={{ fontSize: 10, color: '#f472b6', fontWeight: '600' }}>Mood: {post.mood}</Text>
                </View>
              </View>

              {/* Post text */}
              <Text style={{ fontSize: 16, color: '#f5f0ff', fontStyle: 'italic', lineHeight: 24, marginBottom: 12, fontWeight: '500' }}>
                {post.text}
              </Text>

              {/* Voice waveform */}
              {post.hasVoice && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(167,114,192,0.1)' }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#fff' }}>▶</Text>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    {[4,8,14,10,18,12,20,8,16,10,14,8,18,12,6,16,10,14,8,12].map((h, i) => (
                      <View key={i} style={{ width: 3, height: h, backgroundColor: i < 10 ? '#f472b6' : 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
                    ))}
                  </View>
                  <Text style={{ fontSize: 10, color: '#7c6899' }}>0:42</Text>
                </View>
              )}

              {/* Reactions */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[
                  { icon: '💜', key: 'felt',    label: 'felt this too' },
                  { icon: '🫂', key: 'comfort', label: 'sending comfort' },
                  { icon: '⭐', key: 'proud',   label: 'proud of you' },
                  { icon: '🌙', key: 'stay',    label: 'stayed with this' },
                ].map(r => (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => reactToPost(post.id, r.key)}
                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,114,192,0.1)' }}
                  >
                    <Text style={{ fontSize: 16 }}>{r.icon}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#f5f0ff', marginTop: 2 }}>{post.reactions[r.key as keyof typeof post.reactions]}</Text>
                    <Text style={{ fontSize: 8, color: '#7c6899', textAlign: 'center', lineHeight: 11, marginTop: 1 }}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Se'kret says for first post */}
              {idx === 0 && (
                <View style={{ backgroundColor: 'rgba(76,29,149,0.25)', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' }}>
                  <Image source={IMAGES.cloud} style={{ width: 32, height: 32 }} resizeSize="contain" />
                  <Text style={{ fontSize: 13, color: '#c4b5fd', fontStyle: 'italic', flex: 1 }}>
                    You don't have to carry this alone. 💜
                  </Text>
                </View>
              )}

              {/* Se'kret step-in for heavy posts */}
              {shouldStepIn(post.text) && idx !== 0 && (
                <View style={{ backgroundColor: 'rgba(13,9,20,0.8)', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' }}>
                  <Text style={{ fontSize: 12, color: '#a78cc0', marginBottom: 4 }}>☁️ Se'kret noticed this might be heavy.</Text>
                  <Text style={{ fontSize: 11, color: '#7c6899', fontStyle: 'italic', marginBottom: 8 }}>"You don't have to hold everything by yourself tonight."</Text>
                  <TouchableOpacity onPress={() => setScreen('comfort')} style={{ backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 10, padding: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#c4b5fd', fontWeight: '600' }}>Open Comfort Mode 💙</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reply bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 50, padding: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(167,114,192,0.1)' }}>
                <Text style={{ flex: 1, fontSize: 12, color: '#4a3d6b', fontStyle: 'italic' }}>respond gently...</Text>
                <Text style={{ fontSize: 18 }}>🎙️</Text>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#fff' }}>›</Text>
                </View>
              </View>
            </View>
          ))}

          {/* ── NEW POST INPUT ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#a78cc0', marginBottom: 10 }}>Share something with the Circle...</Text>
            <TextInput
              style={{
                color: '#f5f0ff',
                fontSize: 13,
                lineHeight: 20,
                minHeight: 80,
                textAlignVertical: 'top',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(167,114,192,0.1)',
                marginBottom: 12,
              }}
              placeholder="post a soft anonymous Bip..."
              placeholderTextColor="#4a3d6b"
              multiline
              value={circlePostText}
              onChangeText={setCirclePostText}
            />
            <TouchableOpacity onPress={saveCirclePost} style={{ borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#7c3aed', '#ec4899']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ padding: 13, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '700' }}>+ Post to Circle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── SAFE ENERGY CONTROLS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>✦ Safe Energy Controls</Text>
              <Text style={{ fontSize: 10, color: '#7c6899' }}>help keep this space soft.</Text>
            </View>
            {[
              { label: 'Hide harsh advice',     on: true },
              { label: 'Comfort-only replies',  on: true },
              { label: 'Voice replies only',    on: false },
              { label: 'Anonymous support mode',on: true },
            ].map(ctrl => (
              <View key={ctrl.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(167,114,192,0.08)' }}>
                <Text style={{ fontSize: 13, color: '#a78cc0' }}>{ctrl.label}</Text>
                <View style={[
                  { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
                  ctrl.on ? { backgroundColor: '#7c3aed' } : { backgroundColor: 'rgba(255,255,255,0.1)' }
                ]}>
                  <View style={[
                    { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
                    ctrl.on ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                  ]} />
                </View>
              </View>
            ))}
          </View>

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    );
  }

 // ─────────────────────────────────────────────────────────────────────────────
// BRIDGE SCREEN — replace your existing:
// if (screen === 'bridge') return (
// ...all the way down to just before...
// if (screen === 'parentBridge') return (
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'bridge') {
    const [bridgeText, setBridgeText] = useState('');
    const [selectedTone, setSelectedTone] = useState('softStart');

    const tones = [
      { id: 'softStart',    icon: '🌙', label: 'Soft Start',           desc: 'Ease into the conversation.',     quote: '"Hey… can we talk later tonight?"' },
      { id: 'honest',       icon: '💜', label: 'Honest Version',       desc: 'Be real, but still respectful.',  quote: '"I\'ve been overwhelmed and I miss feeling close."' },
      { id: 'boundary',     icon: '🛡️', label: 'Calm Boundary',        desc: 'Set a boundary with kindness.',   quote: '"I care about this, but I need calmer communication."' },
      { id: 'dontKnow',     icon: '☁️', label: "Don't Know How",       desc: "I'll help you figure it out.",    quote: '"I don\'t fully know how to say this yet."' },
    ];

    const tips = [
      { icon: '👂', label: 'Listen more than you talk.',      sub: 'Give them space to fully express themselves.' },
      { icon: '💜', label: 'Validate their feelings.',        sub: "Their feelings are real, even if you don't fully understand yet." },
      { icon: '👥', label: "Try not to fix it right away.",   sub: 'Comfort first. Solutions can come later.' },
      { icon: '⭐', label: 'Stay calm and connected.',        sub: 'Your calm helps them feel safe.' },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER HERO ── */}
          <View style={{ marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
            <ImageBackground
              source={IMAGES.roomBgDark}
              style={{ width: '100%', minHeight: 190 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(13,9,20,0.1)', 'rgba(13,9,20,0.9)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 18, minHeight: 190, justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 20 }}>🌉</Text>
                      <Text style={{ fontSize: 24, color: '#f5f0ff', fontStyle: 'italic', fontWeight: '800' }}>Bridge 💜</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#a78cc0', marginBottom: 8 }}>Real conversations. Stronger connection.</Text>
                    <View style={{ backgroundColor: 'rgba(124,58,237,0.25)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}>
                      <Text style={{ fontSize: 11, color: '#c4b5fd' }}>Your child reached out to you 💜</Text>
                    </View>
                  </View>
                  <Image
                    source={IMAGES.mom}
                    style={{ width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(168,85,247,0.35)' }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* ── WHAT THEY SHARED ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 12 }}>What they wanted you to understand 💜</Text>
            <View style={{ backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 22 }}>
                "I've been feeling overwhelmed lately and I miss talking comfortably again."
              </Text>
              <Text style={{ fontSize: 10, color: '#7c6899', marginTop: 8 }}>🕐 Sent today at 7:42 PM</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={IMAGES.cloud} style={{ width: 30, height: 30 }} resizeMode="contain" />
              <Text style={{ fontSize: 12, color: '#a78cc0', flex: 1, fontStyle: 'italic' }}>
                <Text style={{ color: '#f472b6', fontWeight: '700' }}>Se'kret Tip:</Text> This message took courage to send. 💜
              </Text>
            </View>
          </View>

          {/* ── TRUST FIRST ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Text style={{ fontSize: 22 }}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '700', marginBottom: 4 }}>Trust First, Always</Text>
              <Text style={{ fontSize: 12, color: '#7c6899', lineHeight: 18 }}>
                You're only seeing what your child chose to share. This is a bridge, not a window. 💜
              </Text>
            </View>
          </View>

          {/* ── TRANSLATE ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '700', marginBottom: 4 }}>Help understand what they might mean</Text>
            <Text style={{ fontSize: 11, color: '#7c6899', marginBottom: 14 }}>Se'kret translates so you can connect deeper.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(167,114,192,0.1)' }}>
                <Text style={{ fontSize: 10, color: '#7c6899', marginBottom: 6 }}>What they said</Text>
                <Text style={{ fontSize: 13, color: '#f5f0ff', fontStyle: 'italic' }}>"You never listen."</Text>
              </View>
              <Text style={{ color: '#a855f7', fontSize: 20 }}>→</Text>
              <View style={{ flex: 1, backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' }}>
                <Text style={{ fontSize: 10, color: '#7c6899', marginBottom: 6 }}>What they might mean</Text>
                <Text style={{ fontSize: 12, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 18 }}>
                  "I don't feel understood lately and it's making me feel alone."
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <View>
                <Text style={{ fontSize: 12, color: '#f5f0ff', fontWeight: '600' }}>Think feeling, not just words.</Text>
                <Text style={{ fontSize: 11, color: '#7c6899' }}>Focus on the emotion behind the message.</Text>
              </View>
            </View>
          </View>

          {/* ── WRITE YOUR OWN ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.25)', 'rgba(13,9,20,0)']} style={StyleSheet.absoluteFill} />
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 4 }}>What's sitting heavy?</Text>
            <Text style={{ fontSize: 11, color: '#7c6899', marginBottom: 12 }}>Write it how it feels. We'll help you say it.</Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(167,114,192,0.15)',
                color: '#f5f0ff',
                fontSize: 13,
                padding: 14,
                minHeight: 90,
                textAlignVertical: 'top',
                marginBottom: 12,
              }}
              placeholder="Write it how it feels..."
              placeholderTextColor="#4a3d6b"
              multiline
              value={bridgeText}
              onChangeText={setBridgeText}
            />
          </View>

          {/* ── HOW TO RESPOND ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 4 }}>How do you want to respond?</Text>
            <Text style={{ fontSize: 11, color: '#7c6899', marginBottom: 14 }}>Choose a tone that helps them feel safe. 💜</Text>
            {tones.map(tone => (
              <TouchableOpacity
                key={tone.id}
                onPress={() => setSelectedTone(tone.id)}
                style={[
                  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
                  selectedTone === tone.id
                    ? { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#a855f7' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,114,192,0.1)' }
                ]}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text style={{ fontSize: 20 }}>{tone.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>{tone.label}</Text>
                  <Text style={{ fontSize: 11, color: '#7c6899', fontStyle: 'italic' }}>{tone.quote}</Text>
                </View>
                <View style={[
                  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
                  selectedTone === tone.id
                    ? { backgroundColor: '#7c3aed', borderColor: '#7c3aed' }
                    : { borderColor: 'rgba(167,114,192,0.2)', backgroundColor: 'transparent' }
                ]}>
                  {selectedTone === tone.id && <Text style={{ fontSize: 13, color: '#fff' }}>✓</Text>}
                  {selectedTone !== tone.id && <Text style={{ fontSize: 11, color: '#7c6899' }}>Use</Text>}
                </View>
              </TouchableOpacity>
            ))}

            {/* Write own response */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(167,114,192,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <Text style={{ fontSize: 16 }}>✏️</Text>
              <Text style={{ flex: 1, fontSize: 13, color: '#a78cc0' }}>Write your own response</Text>
              <Text style={{ color: '#7c6899', fontSize: 16 }}>›</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <Image source={IMAGES.cloud} style={{ width: 28, height: 28 }} resizeMode="contain" />
              <Text style={{ fontSize: 11, color: '#a78cc0', fontStyle: 'italic', flex: 1 }}>
                <Text style={{ color: '#f472b6', fontWeight: '700' }}>Se'kret Tip:</Text> Sometimes they need to feel heard before they're ready for advice. 💜
              </Text>
            </View>
          </View>

          {/* ── TIPS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 14 }}>Tips for this conversation 💜</Text>
            {tips.map((tip, i) => (
              <View key={tip.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: i < tips.length - 1 ? 1 : 0, borderBottomColor: 'rgba(167,114,192,0.08)' }}>
                <Text style={{ fontSize: 20, marginTop: 2 }}>{tip.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 3 }}>{tip.label}</Text>
                  <Text style={{ fontSize: 11, color: '#7c6899', lineHeight: 16 }}>{tip.sub}</Text>
                </View>
                <Text style={{ color: '#7c6899', fontSize: 16, marginTop: 2 }}>›</Text>
              </View>
            ))}
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, color: '#c4b5fd', fontStyle: 'italic', flex: 1, lineHeight: 20 }}>
                You don't have to be perfect.{'\n'}You just have to stay present.
              </Text>
              <Text style={{ fontSize: 20 }}>💜</Text>
            </View>
          </View>

          {/* ── MESSAGES HISTORY ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>Messages they've shared with you</Text>
              <Text style={{ fontSize: 11, color: '#a855f7' }}>View All</Text>
            </View>
            {[
              { text: "I've been feeling overwhelmed...", time: 'Today, 7:42 PM' },
              { text: 'I need to talk about something...', time: '2 days ago, 9:15 PM' },
              { text: 'Can you help me understand...', time: '5 days ago, 6:09 PM' },
            ].map((msg, i) => (
              <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: 'rgba(167,114,192,0.08)' }}>
                <Text style={{ fontSize: 18 }}>💬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#a78cc0' }}>{msg.text}</Text>
                  <Text style={{ fontSize: 10, color: '#7c6899', marginTop: 2 }}>{msg.time}</Text>
                </View>
                <Text style={{ color: '#7c6899', fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            ))}
            <Text style={{ fontSize: 12, color: '#7c6899', fontStyle: 'italic', marginTop: 10, textAlign: 'center' }}>
              They're opening up. That's a big step. 💜
            </Text>
          </View>

          {/* ── CONNECTION ENERGY ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 14 }}>Your Connection Energy</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Arc */}
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 80, height: 50, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: 'rgba(255,255,255,0.07)', position: 'absolute', bottom: 0, overflow: 'hidden' }} />
                  <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderTopColor: '#a855f7', borderRightColor: '#f472b6', borderBottomColor: 'transparent', borderLeftColor: 'transparent', position: 'absolute', bottom: 0, transform: [{ rotate: '-45deg' }] }} />
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>💜</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '700', marginTop: 6 }}>Strong</Text>
              </View>
              {/* Dots */}
              <View style={{ flex: 1 }}>
                {[
                  { label: 'Honesty',           val: 8 },
                  { label: 'Check-ins',          val: 6 },
                  { label: 'Support Moments',    val: 5 },
                  { label: 'Conversation Wins',  val: 5 },
                ].map(m => (
                  <View key={m.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: '#7c6899', width: 110 }}>{m.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < m.val ? '#f472b6' : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#7c6899', textAlign: 'center', marginTop: 10 }}>Small moments. Big impact. 💜</Text>
          </View>

          {/* ── SEND BUTTON ── */}
          <TouchableOpacity style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 18, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#7c3aed', '#ec4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
            >
              <Text style={{ fontSize: 15, color: '#fff', fontWeight: '700' }}>I'm Ready to Send 💌</Text>
              <Text style={{ fontSize: 16 }}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    );
  }
  // ── PARENT BRIDGE ─────────────────────────────────────────────────────────
  if (screen === 'parentBridge') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Parent Bridge 🌿</Text>
      <Text style={s.subtitle}>Support without spying. Guidance without control.</Text>
      <View style={card()}>
        <Text style={s.cardEmoji}>🌉</Text>
        <Text style={s.cardText}>Connection over control.</Text>
        <Text style={s.entryText}>Parent Side gives gentle insight without exposing private teen pages.</Text>
      </View>
      <Text style={s.sectionTitle}>Try Saying This</Text>
      <View style={card()}>
        {['"Thank you for trusting me with this."','"Do you want advice, comfort, or listening?"','"You don\'t have to explain it perfectly."','"I\'m here when you\'re ready."'].map(line => (
          <View key={line} style={s.choiceButton}><Text style={s.entryText}>{line}</Text></View>
        ))}
      </View>
      <TouchableOpacity style={btn()} onPress={() => setScreen('bridge')}><Text style={s.buttonText}>View Teen Bridge Side 🌉</Text></TouchableOpacity>
      {nav}
    </ScrollView>
  );

  // ── BIPPIN2 ───────────────────────────────────────────────────────────────
  if (screen === 'bippin2') {
    if (growthPath === 'preferNotToSay') return (
      <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
        <Text style={s.logo}>Bippin2 ✨</Text>
        <Text style={s.subtitle}>Choose your growth space.</Text>
        <View style={card()}>
          <Text style={s.cardEmoji}>🌱</Text>
          <Text style={s.cardText}>This space adapts to you.</Text>
          <Text style={s.entryText}>Pick the version that feels right. You can change it later.</Text>
        </View>
        <TouchableOpacity style={btn()} onPress={() => setGrowthPath('girl')}><Text style={s.buttonText}>🌙 Womanhood</Text></TouchableOpacity>
        <TouchableOpacity style={btn()} onPress={() => setGrowthPath('boy')}><Text style={s.buttonText}>⚡ Manhood</Text></TouchableOpacity>
        {nav}
      </ScrollView>
    );

    const isGirl = growthPath === 'girl';
    return (
      <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
        <TouchableOpacity style={s.smallButton} onPress={() => setGrowthPath('preferNotToSay')}>
          <Text style={s.smallButtonText}>↩️ Change Growth Space</Text>
        </TouchableOpacity>
        <Text style={s.logo}>{isGirl ? 'Bippin 2 Womanhood 🌙' : 'Bippin 2 Manhood ⚡'}</Text>
        <Text style={s.subtitle}>{isGirl ? 'growing at your own pace. 💜' : 'growing into yourself. 💙'}</Text>

        <View style={s.duoRow}>
          <View style={[s.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
            <Text style={s.cardTitle}>{isGirl ? 'Good night 💜' : 'Good night ⚡'}</Text>
            <Text style={s.cardText}>{isGirl ? "Your body is changing. That's not something to fear or hide." : "Keep building the best version of you. You've got this."}</Text>
            <Text style={s.bigEmoji}>{isGirl ? '☁️' : '🧑🏾'}</Text>
          </View>
          <View style={[s.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
            <Text style={s.cardTitle}>{isGirl ? 'connection streak' : 'focus streak'}</Text>
            <Text style={s.bigNumber}>{isGirl ? '7 days' : '9 days'}</Text>
            <Text style={s.cardText}>{isGirl ? "you're showing up for you." : 'consistency builds confidence.'}</Text>
          </View>
        </View>

        <View style={s.featureGrid}>
          {isGirl ? [
            ['🩸','first period support', () => {}],
            ['🌙','cycle wellness', () => setScreen('periodCalendar')],
            ['💗','mood + body check-in', () => {}],
            ['🪷','comfort mode', () => setScreen('comfort')],
            ['☁️',"ask Se'kret", () => setScreen('sekret')],
            ['🔒','private journal', () => setScreen('pages')],
          ] : [
            ['🧍🏾','puberty guide', () => {}],
            ['💪🏾','body changes', () => {}],
            ['⭐','confidence boost', () => {}],
            ['🧴','hygiene + self-care', () => {}],
            ['🧠','mind check-in', () => {}],
            ['🔒','private journal', () => setScreen('pages')],
          ].map(([e, l, fn]) => (
            <TouchableOpacity key={l as string} style={[s.featureCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]} onPress={fn as any}>
              <Text style={s.featureEmoji}>{e as string}</Text>
              <Text style={s.featureText}>{l as string}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isGirl && (
          <View style={s.duoRow}>
            <View style={[s.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
              <Text style={s.cardTitle}>cycle calendar 🩸</Text>
              <Text style={s.cardText}>Track your cycle with ease and privacy.</Text>
              <TouchableOpacity style={s.smallButton} onPress={() => setScreen('periodCalendar')}>
                <Text style={s.smallButtonText}>view calendar</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.largeCard, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1 }]}>
              <Text style={s.cardTitle}>Se'kret says ☁️</Text>
              <Text style={s.cardText}>"Your body isn't something to hate. It's becoming YOU."</Text>
              <TouchableOpacity style={s.smallButton} onPress={() => setScreen('sekret')}>
                <Text style={s.smallButtonText}>talk to Se'kret</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={s.quoteBox}>
          <Text style={s.quoteText}>This space is private unless you choose to share it with a trusted adult.</Text>
        </View>
        {nav}
      </ScrollView>
    );
  }

  // ── COMFORT ───────────────────────────────────────────────────────────────
  if (screen === 'comfort') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Comfort Mode 🚨</Text>
      <Text style={s.subtitle}>When it feels heavy, Bip stays with you.</Text>
      <View style={card()}><Text style={s.cardEmoji}>💙</Text><Text style={s.cardText}>You are not alone in this moment.</Text></View>
      <View style={card()}>
        {['1. Put both feet on the floor.','2. Name 3 things you can see.','3. Take one slow breath.','4. Tap Calm if you need to breathe.'].map(step => (
          <Text key={step} style={s.entryText}>{step}</Text>
        ))}
      </View>
      {nav}
    </ScrollView>
  );

  // ── MIND/BODY RESET ───────────────────────────────────────────────────────
  if (screen === 'mindReset' || screen === 'bodyReset') {
    const isMind = screen === 'mindReset';
    const steps = isMind
      ? ['☁️ Unclench your jaw.','🌙 Relax your shoulders.','🫧 Take one slow breath in.','💭 Let one thought pass without chasing it.','🕯️ Your mind does not need to solve everything tonight.']
      : ['🫧 Roll your shoulders slowly.','🌿 Stretch your neck gently.','💧 Drink a little water.','🧍🏾 Unclench your hands.','🌙 Let your body soften for a second.'];
    return (
      <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
        <Text style={s.logo}>{isMind ? '7-Min Mind Reset 🌙' : '7-Min Body Reset 🫧'}</Text>
        <Text style={s.subtitle}>{isMind ? 'Quiet the noise for a minute.' : 'Let your body breathe too.'}</Text>
        <Animated.View style={[s.circle, { transform: [{ scale: breatheAnim }], backgroundColor: t.accent, shadowColor: t.accent, shadowOpacity: 0.6, shadowRadius: 25, elevation: 12, marginBottom: 30 }]}>
          <Text style={s.circleText}>{isMind ? '☁️' : '🫧'}</Text>
          <Text style={s.circleTextSmall}>inhale • exhale</Text>
        </Animated.View>
        <View style={card()}>{steps.map(step => <Text key={step} style={s.entryText}>{step}</Text>)}</View>
        <TouchableOpacity style={btn()} onPress={() => setScreen('comfort')}><Text style={s.buttonText}>Open Comfort Mode 💙</Text></TouchableOpacity>
        <TouchableOpacity style={s.smallButton} onPress={() => setScreen('calm')}><Text style={s.smallButtonText}>Back to Calm 🌙</Text></TouchableOpacity>
        {nav}
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
// MORE SCREEN — replace your existing:
// if (screen === 'more') return (
// ...all the way down to just before...
// if (screen === 'settings') return (
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'more') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER ── */}
          <View style={{ marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
            <ImageBackground
              source={IMAGES.roomBgDark}
              style={{ width: '100%', minHeight: 150 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.92)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 18, minHeight: 150, justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 }}>settings, tools, and more</Text>
                <Text style={{ fontSize: 26, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>More ✨</Text>
              </View>
            </ImageBackground>
          </View>

          {/* ── CURRENT SIDE ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <Image
                source={selectedSekret === 'rylane' ? IMAGES.rylane.neutral : IMAGES.raylene.neutral}
                style={{ width: 60, height: 60, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(168,85,247,0.4)' }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#a855f7', marginBottom: 3 }}>current side</Text>
                <Text style={{ fontSize: 16, color: '#f5f0ff', fontWeight: '700' }}>
                  {userSide === 'parent' ? '🌿 Parent Side' : '💜 Teen Side'}
                </Text>
                <Text style={{ fontSize: 11, color: '#7c6899', marginTop: 2 }}>
                  {userSide === 'parent' ? 'Supporting with love.' : 'Your space. Always you.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setUserSide((s: string) => s === 'parent' ? 'teen' : 'parent')}
              style={{ borderRadius: 14, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={['#7c3aed', '#ec4899']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ padding: 12, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>
                  Switch to {userSide === 'parent' ? 'Teen Side 💜' : 'Parent Side 🌿'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── QUICK LINKS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 10 }}>quick links ✦</Text>
            <View style={{ gap: 8 }}>
              {[
                { icon: '⚙️', label: 'Vibe Lab',          sub: 'themes, se\'kret, and more', to: 'settings' },
                { icon: '✨', label: 'Bippin2 / Insights', sub: 'growth tools and cycle tracker', to: 'bippin2' },
                { icon: '🌉', label: userSide === 'parent' ? 'Parent Bridge' : 'Bridge', sub: 'connect through se\'kret', to: userSide === 'parent' ? 'parentBridge' : 'bridge' },
                { icon: '🚨', label: 'Comfort Mode',       sub: 'when things feel heavy', to: 'comfort' },
                { icon: '🎙️', label: 'Voice Bip',          sub: 'say it out loud', to: 'voiceBip' },
              ].map(item => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => setScreen(item.to)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#130d1f', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 14 }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>{item.label}</Text>
                    <Text style={{ fontSize: 11, color: '#7c6899' }}>{item.sub}</Text>
                  </View>
                  <Text style={{ color: '#7c6899', fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── SE'KRET SAYS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', padding: 16, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(76,29,149,0.3)', 'rgba(13,9,20,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={IMAGES.cloud} style={{ width: 44, height: 44 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#f472b6', fontWeight: '700', marginBottom: 4 }}>Se'kret says 💜</Text>
                <Text style={{ fontSize: 13, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 20 }}>
                  {COMFORT_MESSAGES[comfortIdx].emoji} {COMFORT_MESSAGES[comfortIdx].text}
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS / VIBE LAB — replace your existing:
// if (screen === 'settings') return (
// ...all the way down to the end of that block
// ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'settings') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0914' }}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER ── */}
          <View style={{ marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderRadius: 24, overflow: 'hidden' }}>
            <ImageBackground
              source={IMAGES.roomBg}
              style={{ width: '100%', minHeight: 150 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(13,9,20,0.2)', 'rgba(13,9,20,0.9)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 18, minHeight: 150, justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#a855f7', letterSpacing: 1, marginBottom: 4 }}>make se'kret feel like yours</Text>
                <Text style={{ fontSize: 26, color: '#f472b6', fontStyle: 'italic', fontWeight: '800' }}>Vibe Lab 💜</Text>
              </View>
            </ImageBackground>
          </View>

          {/* ── THEME PACKS ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 4 }}>Theme Packs</Text>
            <Text style={{ fontSize: 11, color: '#7c6899', marginBottom: 14 }}>Themes, vibes, and more.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {Object.keys(THEME_PACKS).map(key => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTheme(key)}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View style={[
                    { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
                    { backgroundColor: THEME_PACKS[key].card },
                    theme === key
                      ? { borderColor: '#f472b6', shadowColor: '#f472b6', shadowOpacity: 0.5, shadowRadius: 8 }
                      : { borderColor: 'rgba(167,114,192,0.2)' }
                  ]}>
                    <Text style={{ fontSize: 24 }}>{THEME_PACKS[key].emoji}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: theme === key ? '#f472b6' : '#7c6899', fontWeight: theme === key ? '700' : '400', textAlign: 'center' }}>
                    {THEME_PACKS[key].name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── CHOOSE YOUR SE'KRET ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 4 }}>Choose Your Se'kret</Text>
            <Text style={{ fontSize: 11, color: '#7c6899', marginBottom: 14 }}>Pick the voice that feels most like you.</Text>

            {/* Voice cards */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {['soft', 'rylane'].map(key => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedSekret(key)}
                  style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: selectedSekret === key ? '#a855f7' : 'rgba(167,114,192,0.2)' }}
                >
                  <Image
                    source={key === 'rylane' ? IMAGES.rylane.neutral : IMAGES.raylene.happy}
                    style={{ width: '100%', height: 110 }}
                    resizeMode="cover"
                  />
                  <View style={{ backgroundColor: '#130d1f', padding: 10 }}>
                    <Text style={{ fontSize: 12, color: '#f5f0ff', fontWeight: '700' }}>{SEKRET_PROFILES[key].name} {SEKRET_PROFILES[key].emoji}</Text>
                    <Text style={{ fontSize: 10, color: '#7c6899', marginTop: 2 }}>{SEKRET_PROFILES[key].title}</Text>
                  </View>
                  {selectedSekret === key && (
                    <View style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: '#fff' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* All profiles list */}
            {Object.keys(SEKRET_PROFILES).map(key => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedSekret(key)}
                style={[
                  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1 },
                  selectedSekret === key
                    ? { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#a855f7' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,114,192,0.12)' }
                ]}
              >
                <Text style={{ fontSize: 24 }}>{SEKRET_PROFILES[key].emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600' }}>{SEKRET_PROFILES[key].name}</Text>
                  <Text style={{ fontSize: 11, color: '#7c6899' }}>{SEKRET_PROFILES[key].vibe}</Text>
                </View>
                {selectedSekret === key && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#fff' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* ── LANGUAGE ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 14 }}>Language</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { flag: '🇺🇸', label: 'English' },
                { flag: '🇪🇸', label: 'Español' },
                { flag: '🇫🇷', label: 'Français' },
                { flag: '🇭🇹', label: 'Kreyòl' },
              ].map((lang, i) => (
                <TouchableOpacity
                  key={lang.label}
                  style={[
                    { flex: 1, alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1 },
                    i === 0
                      ? { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#a855f7' }
                      : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,114,192,0.12)' }
                  ]}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{lang.flag}</Text>
                  <Text style={{ fontSize: 9, color: i === 0 ? '#c4b5fd' : '#7c6899', fontWeight: i === 0 ? '700' : '400' }}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── ACCOUNT SIDE ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#130d1f', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,114,192,0.15)', padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#f5f0ff', fontWeight: '600', marginBottom: 14 }}>Account Side</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setUserSide('teen')}
                style={[
                  { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
                  userSide === 'teen'
                    ? { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#a855f7' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,114,192,0.12)' }
                ]}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>🧑</Text>
                <Text style={{ fontSize: 12, color: userSide === 'teen' ? '#c4b5fd' : '#7c6899', fontWeight: '600' }}>Teen Side</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUserSide('parent')}
                style={[
                  { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
                  userSide === 'parent'
                    ? { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#a855f7' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,114,192,0.12)' }
                ]}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>👩‍👧</Text>
                <Text style={{ fontSize: 12, color: userSide === 'parent' ? '#c4b5fd' : '#7c6899', fontWeight: '600' }}>Parent Side</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#7c6899', textAlign: 'center', marginTop: 12 }}>
              Current: {userSide === 'parent' ? 'Parent 🌿' : 'Teen 💜'}
            </Text>
          </View>

          {/* ── NOTE TO SELF ── */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#c4b5fd', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 }}>
              Note to self:{'\n'}Progress, not perfection. 💜
            </Text>
          </View>

        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(167,114,192,0.15)', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(13,9,20,0)', 'rgba(13,9,20,0.98)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 10 }}>
            {(userSide === 'parent'
              ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret',null,"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
              : [['home','🏠','Home'],['pages','📖','Pages'],['calm',null,'Calm'],['circle','🌐','Circle'],['more','☰','More']]
            ).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setScreen(id as string)} style={{ alignItems: 'center', gap: 3, minWidth: 50 }}>
                {icon === null ? (
                  <View style={[
                    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: -20, borderWidth: 2, borderColor: 'rgba(167,114,192,0.15)' },
                    screen === id && { backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#f472b6' }
                  ]}>
                    <Image source={IMAGES.cloud} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, opacity: screen === id ? 1 : 0.4 }}>{icon}</Text>
                    <Text style={{ fontSize: 10, color: screen === id ? '#f472b6' : '#7c6899', fontWeight: screen === id ? '700' : '400' }}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  heroText: { fontSize: 24, color: '#fff', textAlign: 'center', fontWeight: 'bold', marginBottom: 10 },

  card: { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardText: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  entryText: { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  entryDate: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  journalSavedText: { color: '#fff', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  miniText: { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },

  button: { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  journalInput: { color: '#fff', padding: 16, borderRadius: 18, minHeight: 130, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },

  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  smallAction: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  smallButton: { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  moodRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, gap: 8 },
  moodBubble: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  moodEmoji: { fontSize: 28 },
  tagBubble: { padding: 9, borderRadius: 14, borderWidth: 1, marginBottom: 8, marginRight: 8 },

  cloudWrap: { alignItems: 'center', marginVertical: 16 },
  circle: { width: 170, height: 170, borderRadius: 85, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  circleText: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  circleTextSmall: { color: '#fff', fontSize: 16, marginTop: 6, fontWeight: 'bold' },

  choiceButton: { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },

  reactionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-around', flexWrap: 'wrap', gap: 6 },
  reactionButton: { backgroundColor: '#1E293B', padding: 9, borderRadius: 12 },
  reactionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, backgroundColor: '#111827', borderRadius: 20, marginTop: 28, marginBottom: 20, flexWrap: 'wrap', gap: 8 },
  navItem: { alignItems: 'center', minWidth: 48 },
  navIcon: { fontSize: 20, marginBottom: 3 },
  navText: { color: '#94A3B8', fontSize: 11 },
  activeNavText: { color: '#fff', fontWeight: 'bold' },

  themeRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  themeBubble: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  themeEmoji: { fontSize: 26 },

  duoRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  largeCard: { flex: 1, borderRadius: 20, padding: 14 },
  bigEmoji: { fontSize: 40, marginTop: 8 },
  bigNumber: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  featureCard: { width: '47%', borderRadius: 18, padding: 14, alignItems: 'center' },
  featureEmoji: { fontSize: 28, marginBottom: 6 },
  featureText: { color: '#fff', fontSize: 13, textAlign: 'center', fontWeight: '600' },

  quoteBox: { backgroundColor: '#1E293B', padding: 16, borderRadius: 18, marginBottom: 18 },
  quoteText: { color: '#CBD5E1', fontSize: 14, textAlign: 'center' },

  parentBadge: { backgroundColor: '#065F46', borderRadius: 10, padding: 6, alignSelf: 'center', marginBottom: 10 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#94A3B8', fontSize: 14 },
});
