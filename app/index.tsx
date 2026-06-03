import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ── Screens ────────────────────────────────────────────────────────────────
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen }           from '../screens/HomeScreen';
import { JournalScreen }        from '../screens/JournalScreen';
import { CalmScreen }           from '../screens/CalmScreen';
import { SekretScreen }         from '../screens/SekretScreen';
import { CircleScreen }         from '../screens/CircleScreen';
import { Bippin2Screen }        from '../screens/Bippin2Screen';
import { ComfortScreen }        from '../screens/ComfortScreen';
import { MindBodyResetScreen }  from '../screens/MindBodyResetScreen';
import { BridgeScreen }         from '../screens/BridgeScreen';
import { ParentBridgeScreen }   from '../screens/ParentBridgeScreen';
import { MoreScreen }           from '../screens/MoreScreen';
import { SettingsScreen }       from '../screens/SettingsScreen';
import { PeriodCalendarScreen }  from '../screens/PeriodCalendarScreen';
import { VoiceBipScreen }        from '../screens/VoiceBipScreen';
import { CloudThoughtsScreen }   from '../screens/CloudThoughtsScreen';
import { RoomScreen } from '../screens/RoomScreen';

// ── Utils ──────────────────────────────────────────────────────────────────
import { loadState, saveState } from '../utils/storage';

// ── Constants ─────────────────────────────────────────────────────────────
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

const IMAGES = {
  rayleneNeutral:  require('../assets/images/raylene-neutral.png'),
  rayleneHappy:    require('../assets/images/raylene-happy.png'),
  rayleneThinking: require('../assets/images/raylene-thinking.png'),
  rayleneWriting:  require('../assets/images/raylene-writing.png'),
  rayleneWindow:   require('../assets/images/raylene-window.png'),
  rayleneFullbody: require('../assets/images/raylene-fullbody.png'),
  rylaneNeutral:   require('../assets/images/rylane-neutral.png'),
  rylaneHappy:     require('../assets/images/rylane-happy.png'),
  rylaneThinking:  require('../assets/images/rylane-thinking.png'),
  rylaneWriting:   require('../assets/images/rylane-writing.png'),
  rylaneWindow:    require('../assets/images/rylane-window.png'),
  rylaneFullbody:  require('../assets/images/rylane-fullbody.png'),
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

// ── Se'kret API ────────────────────────────────────────────────────────────
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

// ── Bottom Nav ─────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen, userSide }: any) {
  const items = userSide === 'parent'
    ? [['home','🏠','Home'],['bridge','🌉','Bridge'],['sekret','💜',"Se'kret"],['pages','📖','Pages'],['more','☰','More']]
    : [['home','🏠','Home'],['pages','📖','Pages'],['calm','🌙','Calm'],['circle','🌐','Circle'],['sekret','💜',"Se'kret"],['more','☰','More']];

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

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
const [screen, setScreen] = useState('splash');
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
      if (state.sekretReply)    setSekretReply(state.sekretReply);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    saveState({
      theme, mood, userSide, selectedSekret, sekretMode,
      growthPath, journalText, entries, moodHistory,
      circlePosts, voiceNotes, sekretReply,
    });
  }, [
    theme, mood, userSide, selectedSekret, sekretMode,
    growthPath, journalText, entries, moodHistory,
    circlePosts, voiceNotes, sekretReply, isLoading,
  ]);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
      Animated.timing(breatheAnim, { toValue: 1,   duration: 2200, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setHomeMessageIndex(p => (p + 1) % HOME_MESSAGES.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

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
      p.id === id
        ? { ...p, reactions: { ...p.reactions, [type]: (p.reactions[type] || 0) + 1 } }
        : p
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

  if (isLoading) return null;

  if (screen === 'cloudThoughts') return (
    <CloudThoughtsScreen
      t={t}
      mood={mood}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  if (screen === 'periodCalendar') return (
    <PeriodCalendarScreen theme={t} setScreen={setScreen} />
  );

  if (screen === 'voiceBip') return (
    <VoiceBipScreen
      theme={t}
      setScreen={setScreen}
      selectedSekret={selectedSekret}
      voiceNotes={voiceNotes}
      setVoiceNotes={setVoiceNotes}
    />
  );

if (screen === 'splash') return (
  <SplashScreen setScreen={setScreen} />
);

  if (screen === 'home') return (
  <RoomScreen
    t={t}
    selectedSekret={selectedSekret}
    setSelectedSekret={setSelectedSekret}
    setScreen={setScreen}
    BottomNav={nav}
  />
);

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

  if (screen === 'bridge') return (
    <BridgeScreen t={t} currentSekret={currentSekret} setScreen={setScreen} BottomNav={nav} />
  );

  if (screen === 'parentBridge') return (
    <ParentBridgeScreen t={t} setScreen={setScreen} BottomNav={nav} />
  );

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

  if (screen === 'comfort') return (
    <ComfortScreen t={t} BottomNav={nav} />
  );

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

  if (screen === 'more') return (
    <MoreScreen
      t={t}
      userSide={userSide}
      setUserSide={setUserSide}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

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

const styles = StyleSheet.create({
  bottomNav:     { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, backgroundColor: '#111827', borderRadius: 20, marginTop: 28, marginBottom: 20, flexWrap: 'wrap', gap: 8 },
  navItem:       { alignItems: 'center', minWidth: 48 },
  navIcon:       { fontSize: 20, marginBottom: 3 },
  navText:       { color: '#94A3B8', fontSize: 11 },
  activeNavText: { color: '#fff', fontWeight: 'bold' },
});
