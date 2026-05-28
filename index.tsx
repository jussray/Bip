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
  if (screen === 'home') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <StatusBar style="light" />
      {userSide === 'parent' && <View style={s.parentBadge}><Text style={{ color: '#6EE7B7', fontSize: 12 }}>🌿 PARENT SIDE</Text></View>}
      <Text style={s.logo}>Se'kret Bip {currentSekret.emoji}</Text>
      <Text style={s.subtitle}>your space. your voice. always you.</Text>

      <Animated.View style={[s.cloudWrap, { transform: [{ scale: breatheAnim }] }]}>
        <Text style={{ fontSize: 64 }}>☁️</Text>
      </Animated.View>

      <View style={card()}>
        <Text style={{ color: t.soft, fontSize: 13, marginBottom: 4 }}>{currentSekret.name} says...</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 8 }}>{HOME_MESSAGES[homeMessageIndex]}</Text>
        <Text style={{ color: '#CBD5E1', fontSize: 14 }}>I'm here. Always.</Text>
      </View>

      <Text style={s.sectionTitle}>How's your heart right now? 💜</Text>
      <View style={s.moodRow}>
        {MOODS.map(m => (
          <TouchableOpacity key={m.id} style={[s.moodBubble, mood === m.id && { backgroundColor: t.accent, shadowColor: t.accent, shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 }]} onPress={() => selectMood(m.id)}>
            <Text style={s.moodEmoji}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={card()}>
        <Text style={s.cardText}>Se'kret sees you 💜</Text>
        <Text style={s.entryText}>
          {mood === 'Sad' ? "Heavy nights don't last forever. I'm right here with you." :
           mood === 'Angry' ? "Your feelings make sense. You're safe to let it out here." :
           mood === 'Tired' ? "Rest is an act of self-love. You've done enough today." :
           "I read your energy tonight. You're doing better than you think."}
        </Text>
        <View style={s.row}>
          <TouchableOpacity style={s.smallButton} onPress={() => setScreen('sekret')}><Text style={s.smallButtonText}>💬 Talk more</Text></TouchableOpacity>
          <TouchableOpacity style={s.smallButton} onPress={() => setScreen('calm')}><Text style={s.smallButtonText}>🌙 Calm me</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={s.sectionTitle}>Quick Actions ⚡</Text>
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        {[['✍️','Write It Out','pages'],['🎙️','Voice Bip','voiceBip'],['🌙','Calm','calm'],['🌐','Circle','circle'],['🌉','Bridge', userSide === 'parent' ? 'parentBridge' : 'bridge']].map(([e,l,to]) => (
          <TouchableOpacity key={l} style={[s.smallAction, { backgroundColor: t.card, borderColor: t.accent }]} onPress={() => setScreen(to)}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{e}</Text>
            <Text style={s.smallButtonText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {nav}
    </ScrollView>
  );

  // ── PAGES ─────────────────────────────────────────────────────────────────
  if (screen === 'pages') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Se'kret Pages 💜</Text>
      <Text style={s.subtitle}>Your thoughts deserve somewhere safe.</Text>

      <View style={card()}>
        <Text style={s.cardEmoji}>{currentSekret.emoji}</Text>
        <Text style={s.cardText}>Write freely.</Text>
        <Text style={s.entryText}>No pressure. No perfect wording. Just honesty.</Text>
      </View>

      <TextInput
        style={[s.journalInput, { backgroundColor: t.card, borderColor: t.accent }]}
        placeholder="Bip it out softly..."
        placeholderTextColor="#94A3B8"
        multiline
        value={journalText}
        onChangeText={setJournalText}
      />

      <View style={s.row}>
        <TouchableOpacity style={[s.smallAction, { backgroundColor: t.card, borderColor: t.accent }]} onPress={() => setScreen('voiceBip')}>
          <Text style={s.smallButtonText}>🎙️ Voice Bip</Text>
          <Text style={s.miniText}>30–60 sec</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.smallAction, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={s.smallButtonText}>📹 Video Bip</Text>
          <Text style={s.miniText}>30–60 sec</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.smallAction, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={s.smallButtonText}>🖼️ Photo</Text>
          <Text style={s.miniText}>optional</Text>
        </TouchableOpacity>
      </View>

      {journalText.trim() ? (
        <View style={card()}>
          <Text style={{ color: t.soft, fontSize: 13, marginBottom: 6 }}>Se'kret is listening... 💜</Text>
          <Text style={s.entryText}>That sounds heavy. You carry so much and still try to hold it together. You're not alone here.</Text>
          <View style={s.row}>
            {['💜 that means a lot','🥺 thank you','💬 talk more'].map(l => (
              <TouchableOpacity key={l} style={s.smallButton}><Text style={s.smallButtonText}>{l}</Text></TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={s.sectionTitle}>Mood Tags</Text>
      <View style={[s.moodRow, { flexWrap: 'wrap' }]}>
        {getDynamicTags().map(tag => (
          <TouchableOpacity key={tag} style={[s.tagBubble, { backgroundColor: t.card, borderColor: t.accent }]}>
            <Text style={{ color: '#fff', fontSize: 13 }}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={btn()} onPress={saveEntry}><Text style={s.buttonText}>Save Page 💜</Text></TouchableOpacity>

      <Text style={s.sectionTitle}>Saved Pages</Text>
      {entries.length === 0
        ? <View style={card()}><Text style={s.entryText}>No pages yet. Your truth has a place here.</Text></View>
        : entries.map(e => (
            <View key={e.id} style={card()}>
              <Text style={s.entryDate}>{e.date} • {e.time} • {e.mood}</Text>
              <Text style={s.journalSavedText}>"{e.text}"</Text>
            </View>
          ))
      }
      {nav}
    </ScrollView>
  );

  // ── CALM ──────────────────────────────────────────────────────────────────
  if (screen === 'calm') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Se'kret Calm 🌙</Text>
      <Text style={s.subtitle}>Breathe. Reset. Come back to yourself.</Text>

      <View style={card()}>
        <Text style={s.cardEmoji}>🌙</Text>
        <Text style={s.cardText}>Your nervous system deserves softness too.</Text>
        <Text style={s.entryText}>No pressure. Just one small calm moment at a time.</Text>
      </View>

      <Animated.View style={[s.circle, { transform: [{ scale: breatheAnim }], backgroundColor: t.accent, shadowColor: t.accent, shadowOpacity: 0.6, shadowRadius: 25, elevation: 12 }]}>
        <Text style={s.circleText}>☁️</Text>
        <Text style={s.circleTextSmall}>Breathe</Text>
      </Animated.View>

      <View style={card()}>
        <Text style={s.cardEmoji}>{COMFORT_MESSAGES[comfortIdx].emoji}</Text>
        <Text style={s.cardText}>{COMFORT_MESSAGES[comfortIdx].text}</Text>
        <TouchableOpacity style={s.smallButton} onPress={() => setComfortIdx(i => (i + 1) % COMFORT_MESSAGES.length)}>
          <Text style={s.smallButtonText}>Another Calm Thought ✨</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Calm Tools</Text>
      <TouchableOpacity style={btn()} onPress={() => setScreen('mindReset')}><Text style={s.buttonText}>🌙 7-Min Mind Reset</Text></TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('bodyReset')}><Text style={s.buttonText}>🫧 7-Min Body Reset</Text></TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('comfort')}><Text style={s.buttonText}>🚨 Comfort Mode</Text></TouchableOpacity>
      {nav}
    </ScrollView>
  );

  // ── SEKRET ────────────────────────────────────────────────────────────────
  if (screen === 'sekret') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Talk with Se'kret 💜</Text>
      <Text style={s.subtitle}>Your safe space. No pressure. Just real.</Text>

      <View style={card()}>
        <Text style={s.cardEmoji}>{currentSekret.emoji}</Text>
        <Text style={s.cardText}>{currentSekret.name}</Text>
        <Text style={s.entryText}>{currentSekret.title}</Text>
        <Text style={s.entryText}>{currentSekret.vibe}</Text>
      </View>

      <View style={card()}>
        <Text style={s.entryText}>You: today was a lot. i tried to hold it together...</Text>
        <Text style={[s.entryText, { color: t.soft }]}>{isSekretTyping ? `${currentSekret.name} is typing... ☁️` : sekretReply}</Text>
      </View>

      <TextInput
        style={[s.journalInput, { backgroundColor: t.card, borderColor: t.accent }]}
        placeholder="Talk to Se'kret..."
        placeholderTextColor="#94A3B8"
        multiline
        value={sekretMessage}
        onChangeText={setSekretMessage}
      />
      <TouchableOpacity style={btn()} onPress={sendSekretMessage}><Text style={s.buttonText}>Send 💜</Text></TouchableOpacity>
      {nav}
    </ScrollView>
  );

  // ── CIRCLE ────────────────────────────────────────────────────────────────
  if (screen === 'circle') {
    const shouldStepIn = (text: string) => ['alone','hurt','tired','done','empty','cry','sad','scared','anxious','panic'].some(w => text.toLowerCase().includes(w));
    return (
      <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
        <Text style={s.logo}>Se'kret Circle 🌐</Text>
        <Text style={s.subtitle}>Community first. Se'kret only steps in when it feels heavy.</Text>

        <View style={card()}>
          <Text style={s.cardEmoji}>🌐</Text>
          <Text style={s.cardText}>You're not alone here.</Text>
        </View>

        <TextInput
          style={[s.journalInput, { backgroundColor: t.card, borderColor: t.accent }]}
          placeholder="Post a soft anonymous Bip..."
          placeholderTextColor="#94A3B8"
          multiline
          value={circlePostText}
          onChangeText={setCirclePostText}
        />
        <TouchableOpacity style={btn()} onPress={saveCirclePost}><Text style={s.buttonText}>+ Post to Circle</Text></TouchableOpacity>

        <Text style={s.sectionTitle}>Circle Bips</Text>
        {circlePosts.length === 0
          ? <View style={card()}><Text style={s.entryText}>No Circle Bips yet. Start the vibe softly.</Text></View>
          : circlePosts.map(post => (
              <View key={post.id} style={card()}>
                <Text style={s.entryDate}>Anonymous Bip • {post.date} • {post.time}</Text>
                <Text style={s.cardText}>{post.text}</Text>
                <View style={s.reactionRow}>
                  {[['💜','felt'],['☁️','comfort'],['⭐','proud'],['🌙','stay']].map(([e, type]) => (
                    <TouchableOpacity key={type} onPress={() => reactToPost(post.id, type)} style={s.reactionButton}>
                      <Text style={s.reactionText}>{e} {post.reactions[type]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {shouldStepIn(post.text) && (
                  <View style={[s.card, { marginTop: 10, backgroundColor: '#111827', borderColor: t.accent }]}>
                    <Text style={s.entryText}>☁️ Se'kret noticed this might be heavy.</Text>
                    <Text style={s.miniText}>"You don't have to hold everything by yourself tonight."</Text>
                    <TouchableOpacity style={[s.smallButton, { marginTop: 10 }]} onPress={() => setScreen('comfort')}>
                      <Text style={s.smallButtonText}>Open Comfort Mode 💙</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
        }
        {nav}
      </ScrollView>
    );
  }

  // ── BRIDGE ────────────────────────────────────────────────────────────────
  if (screen === 'bridge') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Bridge 🌉</Text>
      <Text style={s.subtitle}>Real conversations. Softer connection.</Text>
      <View style={card()}>
        <Text style={s.cardEmoji}>{currentSekret.emoji}</Text>
        <Text style={s.cardText}>You don't gotta explain it perfectly.</Text>
        <Text style={s.entryText}>Se'kret helps you say hard things gently.</Text>
      </View>
      <View style={card()}>
        <Text style={s.sectionTitle}>What's sitting heavy?</Text>
        <TextInput style={[s.journalInput, { backgroundColor: t.card, borderColor: t.accent, minHeight: 90 }]} placeholder="Write it how it feels..." placeholderTextColor="#94A3B8" multiline />
      </View>
      <View style={card()}>
        <Text style={s.sectionTitle}>Se'kret Suggestions ✨</Text>
        {[['🌙','Soft Start','"Hey… can we talk later tonight?"'],['💜','Honest Version','"I\'ve been overwhelmed and I miss feeling close."'],['🛡️','Calm Boundary','"I care about this, but I need calmer communication."'],['☁️','Don\'t Know How','"I don\'t fully know how to explain this yet."']].map(([e,l,q]) => (
          <TouchableOpacity key={l} style={s.choiceButton}>
            <Text style={s.entryText}>{e} {l}</Text>
            <Text style={s.miniText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={card()}>
        <Text style={s.cardText}>Se'kret says 💬</Text>
        <Text style={s.entryText}>Hard conversations don't make you difficult. Wanting understanding is human.</Text>
      </View>
      <TouchableOpacity style={btn()}><Text style={s.buttonText}>I'm Ready to Send 💌</Text></TouchableOpacity>
      {nav}
    </ScrollView>
  );

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

  // ── MORE ──────────────────────────────────────────────────────────────────
  if (screen === 'more') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>More ✨</Text>
      <Text style={s.subtitle}>Settings, growth tools, and extra Bip spaces.</Text>
      <View style={card()}>
        <Text style={s.cardEmoji}>{userSide === 'parent' ? '🌿' : '💜'}</Text>
        <Text style={s.cardText}>Current Side: {userSide === 'parent' ? 'Parent Side' : 'Teen Side'}</Text>
        <TouchableOpacity style={btn()} onPress={() => setUserSide(s => s === 'parent' ? 'teen' : 'parent')}>
          <Text style={s.buttonText}>Switch to {userSide === 'parent' ? 'Teen Side' : 'Parent Side'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={btn()} onPress={() => setScreen('settings')}><Text style={s.buttonText}>⚙️ Vibe Lab</Text></TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('bippin2')}><Text style={s.buttonText}>✨ Bippin2 / Insights</Text></TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen(userSide === 'parent' ? 'parentBridge' : 'bridge')}>
        <Text style={s.buttonText}>{userSide === 'parent' ? '🌉 Parent Bridge' : '🌉 Bridge'}</Text>
      </TouchableOpacity>
      {nav}
    </ScrollView>
  );

  // ── SETTINGS / VIBE LAB ───────────────────────────────────────────────────
  if (screen === 'settings') return (
    <ScrollView contentContainerStyle={[s.container, { backgroundColor: t.background }]}>
      <Text style={s.logo}>Vibe Lab 💜</Text>
      <Text style={s.subtitle}>Make Se'kret feel like yours.</Text>

      <Text style={s.sectionTitle}>Theme Packs</Text>
      <View style={s.themeRow}>
        {Object.keys(THEME_PACKS).map(key => (
          <TouchableOpacity key={key} style={[s.themeBubble, { backgroundColor: THEME_PACKS[key].card, borderColor: theme === key ? THEME_PACKS[key].accent : '#334155', borderWidth: theme === key ? 3 : 1 }]} onPress={() => setTheme(key)}>
            <Text style={s.themeEmoji}>{THEME_PACKS[key].emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Choose Your Se'kret</Text>
      <View style={card()}>
        {Object.keys(SEKRET_PROFILES).map(key => (
          <TouchableOpacity key={key} style={[s.choiceButton, selectedSekret === key && { borderColor: t.accent, borderWidth: 2 }]} onPress={() => setSelectedSekret(key)}>
            <Text style={s.entryText}>{SEKRET_PROFILES[key].emoji} {SEKRET_PROFILES[key].name}</Text>
            <Text style={s.miniText}>{SEKRET_PROFILES[key].title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Account Side</Text>
      <View style={card()}>
        <TouchableOpacity style={btn()} onPress={() => setUserSide('teen')}><Text style={s.buttonText}>🧑 Teen Side</Text></TouchableOpacity>
        <TouchableOpacity style={[btn(), { marginTop: 10 }]} onPress={() => setUserSide('parent')}><Text style={s.buttonText}>👨‍👩‍👧 Parent Side</Text></TouchableOpacity>
        <Text style={[s.entryText, { marginTop: 10 }]}>Current: {userSide === 'parent' ? 'Parent 🌿' : 'Teen 💜'}</Text>
      </View>
      {nav}
    </ScrollView>
  );

  // fallback home
  return null;
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
