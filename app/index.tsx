import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ── Screens ────────────────────────────────────────────────────────────────
// NOTE: HomeScreen is imported for the 'dashboard' route (MoreScreen → Dashboard).
// The primary 'home' route renders RoomScreen — the Room IS the home.
import { SplashScreen }         from '../screens/SplashScreen';
import { HomeScreen }           from '../screens/HomeScreen';
import { RoomScreen }           from '../screens/RoomScreen';
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
import { PeriodCalendarScreen } from '../screens/PeriodCalendarScreen';
import { VoiceBipScreen }       from '../screens/VoiceBipScreen';
import { CloudThoughtsScreen }  from '../screens/CloudThoughtsScreen';

// ── Utils ──────────────────────────────────────────────────────────────────
// IMPORTANT: loadState() takes NO args — returns full state object.
// saveState() takes ONE object arg — all keys to update.
// Do NOT call loadState('key') or saveState('key', value).
import { loadState, saveState } from '../utils/storage';
import type { JournalEntry, CirclePost, VoiceNote, MoodEntry } from '../types/index';

// ── IMAGES ─────────────────────────────────────────────────────────────────
// One clean place to see every image Se'kret Bip uses.
//
// The actual `require()` paths + safe fallbacks live in constants/theme.ts.
// This map is re-exported here so the top of the root file documents — at a
// glance — what art is wired into the app and to which character / screen.
//
// Do NOT add new require() calls here. Edit constants/theme.ts instead so
// fallbacks stay centralized and no screen can drift out of sync.
import { IMAGES, AVATARS, getRoomBg } from '../constants/theme';
export { IMAGES, AVATARS, getRoomBg };

// ── Types ──────────────────────────────────────────────────────────────────
// RoomMemory: tracks room interactions for future Supabase room_memory table
export interface RoomMemory {
  character: string;
  lastVisit: string;
  lastHotspot: string;
  lastSummon: string;
  visitCount: number;
}

export const DEFAULT_ROOM_MEMORY: RoomMemory = {
  character:   'raylene',
  lastVisit:   '',
  lastHotspot: '',
  lastSummon:  '',
  visitCount:  0,
};

// ── Constants ─────────────────────────────────────────────────────────────

const THEME_PACKS: Record<string, any> = {
  night:  { name: 'Golden Moon',  emoji: '\uD83C\uDF19', background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '\uD83C\uDF38', background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '\uD83C\uDF27\uFE0F', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '\uD83D\uDC9C', background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '\uD83C\uDF0C', background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

const SEKRET_PROFILES: Record<string, any> = {
  soft:   { name: "Se\u2019kret",       emoji: '\uD83C\uDF38', title: 'Soft Big Sis',        vibe: 'Warm, expressive, protective, and real.',        greeting: "Hey love. I\u2019m here. Tell me what\u2019s on your mind." },
  rylane: { name: 'Rylane',             emoji: '\u26A1',       title: 'Loyal Bro',            vibe: 'Quiet loyalty. Keeps it real. Never talks down.', greeting: "Aight, I\u2019m here. What\u2019s been heavy?" },
  cloud:  { name: "Cloud Se\u2019kret", emoji: '\u2601\uFE0F', title: 'Quiet Comfort',        vibe: 'Soft, calm, low-pressure presence.',             greeting: "No pressure. We can just sit here for a minute." },
  night:  { name: "Night Se\u2019kret", emoji: '\uD83C\uDF19', title: 'Late-Night Listener',  vibe: 'Minimal words, calm energy, safe space.',        greeting: "I\u2019m here. You don\u2019t gotta explain perfectly." },
};

const HOME_MESSAGES = [
  "Don\u2019t stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

// ── Bottom Nav ─────────────────────────────────────────────────────────────

function BottomNav({ screen, setScreen, userSide }: { screen: string; setScreen: (s: string) => void; userSide: string }) {
  const items: [string, string, string][] = userSide === 'parent'
    ? [['home','\uD83C\uDFE0','Home'],['bridge','\uD83C\uDF09','Bridge'],['sekret','\uD83D\uDC9C',"Se\u2019kret"],['pages','\uD83D\uDCD6','Pages'],['more','\u2630','More']]
    : [['home','\uD83C\uDFE0','Home'],['pages','\uD83D\uDCD6','Pages'],['calm','\uD83C\uDF19','Calm'],['circle','\uD83C\uDF10','Circle'],['sekret','\uD83D\uDC9C',"Se\u2019kret"],['more','\u2630','More']];

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
  // ─── Navigation ────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('splash');

  // ─── Theme & identity ──────────────────────────────────────────────────
  const [theme, setTheme]                   = useState('neon');
  const [selectedSekret, setSelectedSekret] = useState('soft');
  const [sekretMode, setSekretMode]         = useState('soft');
  const [userSide, setUserSide]             = useState('teen');

  // ─── Mood ──────────────────────────────────────────────────────────────
  const [mood, setMood]             = useState('Happy');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  // ─── Journal (route: 'pages') ──────────────────────────────────────────
  // RENAMED: entries → journalEntries, saveEntry → saveJournalEntry
  // to match fixed JournalScreen prop interface
  const [journalText, setJournalText]       = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // ─── Circle ────────────────────────────────────────────────────────────
  const [circlePosts, setCirclePosts]       = useState<CirclePost[]>([]);
  const [circlePostText, setCirclePostText] = useState('');

  // ─── Voice Bip ─────────────────────────────────────────────────────────
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);

  // ─── Streak tracking ───────────────────────────────────────────────────
  const [streakDays, setStreakDays]     = useState(0);
  const [lastOpenDate, setLastOpenDate] = useState('');

  // ─── Room Memory (Supabase-ready) ──────────────────────────────────────
  const [roomMemory, setRoomMemory] = useState<RoomMemory>(DEFAULT_ROOM_MEMORY);

  // ─── UI ────────────────────────────────────────────────────────────────
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);
  const [isLoading, setIsLoading]               = useState(true);

  // ── Derived ──────────────────────────────────────────────────────────────
  const t             = THEME_PACKS[theme] || THEME_PACKS.neon;
  const currentSekret = SEKRET_PROFILES[selectedSekret] || SEKRET_PROFILES.soft;

  // ── AsyncStorage: load on mount ───────────────────────────────────────────
  // loadState() returns the full state object — no args needed.
  // Keys returned match STORAGE_KEYS in utils/storage.ts:
  //   theme, mood, userSide, selectedSekret, sekretMode, journalText,
  //   entries (journalEntries), moodHistory, circlePosts, voiceNotes,
  //   streakDays, lastOpenDate  (streakDays/lastOpenDate are custom — added below)
  // NOTE: storage.ts auto-parses arrays: entries, moodHistory, circlePosts, voiceNotes
  useEffect(() => {
    (async () => {
      try {
        const state = await loadState();

        if (state.theme)          setTheme(state.theme);
        if (state.mood)           setMood(state.mood);
        if (state.userSide)       setUserSide(state.userSide);
        if (state.selectedSekret) setSelectedSekret(state.selectedSekret);
        if (state.sekretMode)     setSekretMode(state.sekretMode);
        if (state.journalText)    setJournalText(state.journalText);
        // 'entries' is the storage key (matches STORAGE_KEYS in storage.ts)
        // but we keep it as journalEntries in state
        if (state.entries)        setJournalEntries(Array.isArray(state.entries) ? state.entries : []);
        if (state.moodHistory)    setMoodHistory(Array.isArray(state.moodHistory) ? state.moodHistory : []);
        if (state.circlePosts)    setCirclePosts(Array.isArray(state.circlePosts) ? state.circlePosts : []);
        if (state.voiceNotes)     setVoiceNotes(Array.isArray(state.voiceNotes) ? state.voiceNotes : []);
        // streakDays / lastOpenDate / roomMemory not in STORAGE_KEYS yet —
        // stored as custom keys via saveState; loaded as plain strings here
        if (state.streakDays)     setStreakDays(Number(state.streakDays) || 0);
        if (state.lastOpenDate)   setLastOpenDate(state.lastOpenDate);
        if (state.roomMemory) {
          const rm = typeof state.roomMemory === 'string'
            ? JSON.parse(state.roomMemory)
            : state.roomMemory;
          setRoomMemory(rm);
        }
      } catch (e) {
        // Storage read failure — continue with defaults
      }
      setIsLoading(false);
    })();
  }, []);

  // ── AsyncStorage: save on change ──────────────────────────────────────────
  // saveState() takes a single object — all key/value pairs to persist.
  // Arrays must be passed as-is (storage.ts handles JSON.stringify internally
  // for non-string values via the multiSet pairs mapping).
  // Note: storage.ts STORAGE_KEYS uses 'entries' not 'journalEntries'
  useEffect(() => {
    if (isLoading) return;
    try {
      saveState({
        theme,
        mood,
        userSide,
        selectedSekret,
        sekretMode,
        journalText,
        entries:       journalEntries,   // storage key is 'entries'
        moodHistory,
        circlePosts,
        voiceNotes,
        streakDays:    String(streakDays),
        lastOpenDate,
        roomMemory:    JSON.stringify(roomMemory),
      });
    } catch (e) {
      // Storage write failure — silent
    }
  }, [
    theme, mood, userSide, selectedSekret, sekretMode,
    journalText, journalEntries, moodHistory,
    circlePosts, voiceNotes, streakDays, lastOpenDate,
    roomMemory, isLoading,
  ]);

  // ── Streak tracking (daily open) ──────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const today = new Date().toLocaleDateString();
    if (lastOpenDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastOpenDate === yesterday.toLocaleDateString();
      setStreakDays(wasYesterday ? streakDays + 1 : 1);
      setLastOpenDate(today);
    }
  }, [isLoading]);

  // ── Rotating home message ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(
      () => setHomeMessageIndex(p => (p + 1) % HOME_MESSAGES.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  // ── Room Memory updater (Supabase-ready) ──────────────────────────────────
  const updateRoomMemory = (patch: Partial<RoomMemory>) => {
    setRoomMemory(prev => ({ ...prev, ...patch, visitCount: prev.visitCount + 1 }));
  };

  // ── Activity tracker (RoomMemory + future Supabase hooks) ─────────────────
  const trackActivity = (type: 'calm' | 'comfort' | 'voice' | 'journal' | 'growth' | 'mood') => {
    updateRoomMemory({ lastVisit: new Date().toISOString() });
    // Future: Supabase insert to bip_energy / comfort_sessions / growth_milestones
  };

  // ── Mood ──────────────────────────────────────────────────────────────────
  const selectMood = (m: string) => {
    setMood(m);
    setMoodHistory(h => [{
      id: Date.now(), mood: m,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    }, ...h]);
    trackActivity('mood');
  };

  // ── Journal ───────────────────────────────────────────────────────────────
  // RENAMED to match JournalScreen fixed interface
  const saveJournalEntry = () => {
    if (!journalText.trim()) return;
    setJournalEntries(e => [{
      id: Date.now(), text: journalText, mood,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }, ...e]);
    setJournalText('');
    trackActivity('journal');
  };

  // ── Circle ────────────────────────────────────────────────────────────────
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

  // ── Nav ───────────────────────────────────────────────────────────────────
  const nav = <BottomNav screen={screen} setScreen={setScreen} userSide={userSide} />;

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (isLoading) return null;

  // ━━━ RENDER SWITCH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Route map:
  //   splash · home · pages · calm · sekret · circle · bippin2 · comfort
  //   mindReset · bodyReset · bridge · parentBridge · more · settings
  //   periodCalendar · voiceBip · cloudThoughts · dashboard

  if (screen === 'splash') return (
    <SplashScreen setScreen={setScreen} />
  );

  // ── Se'kret's Room (THE home — Room is the heart of Bip) ──────────────────
  if (screen === 'home') return (
    <RoomScreen
      mood={mood}
      selectedSekret={selectedSekret as 'raylene' | 'rylane'}
      setSelectedSekret={val => setSelectedSekret(val)}
      setScreen={setScreen}
      t={t}
      updateRoomMemory={updateRoomMemory}
    />
  );

  // ── Dashboard (HomeScreen) — secondary entry, available from MoreScreen ───
  if (screen === 'dashboard') return (
    <HomeScreen
      mood={mood}
      selectMood={selectMood}
      t={t}
      currentSekret={currentSekret}
      selectedSekret={selectedSekret}
      homeMessageIndex={homeMessageIndex}
      userSide={userSide}
      setScreen={setScreen}
      onMoodSelect={(m) => trackActivity('mood')}
      BottomNav={nav}
      streakDays={streakDays}
    />
  );

  if (screen === 'cloudThoughts') return (
    <CloudThoughtsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
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
      onSave={() => trackActivity('voice')}
    />
  );

  if (screen === 'pages') return (
    <JournalScreen
      journalText={journalText}
      setJournalText={setJournalText}
      journalEntries={journalEntries}
      saveJournalEntry={saveJournalEntry}
      mood={mood}
      t={t}
      currentSekret={currentSekret}
      selectedSekret={selectedSekret}
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  if (screen === 'calm') return (
    <CalmScreen
      t={t}
      mood={mood}
      setMood={setMood}
      setScreen={setScreen}
      BottomNav={nav}
      selectedSekret={selectedSekret}
    />
  );

  if (screen === 'sekret') return (
    <SekretScreen
      t={t}
      currentSekret={currentSekret}
      mood={mood}
      selectedSekret={selectedSekret}
      selectedProfile={selectedSekret}
      setSelectedProfile={setSelectedSekret}
      userSide={userSide}
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
      selectedSekret={selectedSekret}
      setScreen={setScreen}
      onMilestone={() => trackActivity('growth')}
      streakDays={streakDays}
      BottomNav={nav}
    />
  );

  if (screen === 'comfort') return (
    <ComfortScreen
      t={t}
      setScreen={setScreen}
      onComplete={() => trackActivity('comfort')}
      BottomNav={nav}
    />
  );

  if (screen === 'mindReset' || screen === 'bodyReset') return (
    <MindBodyResetScreen
      screen={screen as 'mindReset' | 'bodyReset'}
      t={t}
      selectedSekret={selectedSekret}
      setScreen={setScreen}
      onComplete={() => trackActivity('calm')}
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
      setScreen={setScreen}
      BottomNav={nav}
    />
  );

  return null;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bottomNav:     {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 14, backgroundColor: '#111827',
    borderRadius: 20, marginTop: 28, marginBottom: 20,
    flexWrap: 'wrap', gap: 8,
  },
  navItem:       { alignItems: 'center', minWidth: 48 },
  navIcon:       { fontSize: 20, marginBottom: 3 },
  navText:       { color: '#94A3B8', fontSize: 11 },
  activeNavText: { color: '#fff', fontWeight: 'bold' },
});
