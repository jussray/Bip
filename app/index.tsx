import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Analytics } from '../components/Analytics';
import { validateEnv } from '../utils/env';

// Run once at startup — logs warnings for missing vars, security error if
// OPENAI_API_KEY or service_role ever appear in the client bundle.
void validateEnv();

// ── Screens ────────────────────────────────────────────────────────────────
import { SplashScreen }         from '../screens/SplashScreen';
import { HomeScreen }           from '../screens/HomeScreen';
import { RoomScreen }           from '../screens/RoomScreen';
import { PagesScreen, type SavePageInput } from '../screens/PagesScreen';
import { ParentPagesScreen }    from '../screens/ParentPagesScreen';
import { CalmScreen }           from '../screens/CalmScreen';
import { SekretScreen }         from '../screens/SekretScreen';
import { CircleScreen }         from '../screens/CircleScreen';
import { ParentCircleScreen }   from '../screens/ParentCircleScreen';
import { Bippin2Screen }        from '../screens/Bippin2Screen';
import { GrowthScreen }         from '../screens/GrowthScreen';
import { WomanhoodScreen }      from '../screens/WomanhoodScreen';
import { ManhoodScreen }        from '../screens/ManhoodScreen';
import { HistoryScreen }        from '../screens/HistoryScreen';
import { ComfortStreaksScreen } from '../screens/ComfortStreaksScreen';
import { BipCrewScreen }        from '../screens/BipCrewScreen';
import { PointsScreen }         from '../screens/PointsScreen';
import { ComfortScreen }        from '../screens/ComfortScreen';
import { MindBodyResetScreen }  from '../screens/MindBodyResetScreen';
import { BridgeScreen }         from '../screens/BridgeScreen';
import { ParentBridgeScreen }   from '../screens/ParentBridgeScreen';
import { S2TellScreen }         from '../screens/S2TellScreen';
import { ParentRoomScreen, type ParentRoomStyle } from '../screens/ParentRoomScreen';
import { MoreScreen }           from '../screens/MoreScreen';
import { SettingsScreen }       from '../screens/SettingsScreen';
import { PeriodCalendarScreen } from '../screens/PeriodCalendarScreen';
import { VoiceBipScreen }       from '../screens/VoiceBipScreen';
import { CloudThoughtsScreen }  from '../screens/CloudThoughtsScreen';
import { THEME_PACKS, normalizeVibeKey } from '../constants/theme';
import {
  createOracleProfile,
  normalizeOracleProfile,
  normalizeOracleSessions,
  type OracleProfile,
  type OracleSessionSummary,
} from '../services/oracleDiscovery';

// ── Src: constants ─────────────────────────────────────────────────────────
import { SEKRET_PROFILES, getProfile } from '../src/constants/profiles';
import { HOME_MESSAGES } from '../src/constants/homeMessages';

// ── Src: types ─────────────────────────────────────────────────────────────
import { type RoomMemory, DEFAULT_ROOM_MEMORY } from '../src/types/roomMemory';

// ── Src: utils ─────────────────────────────────────────────────────────────
import { getActiveCharacter } from '../src/utils/characterUtils';
import { mergeById } from '../src/utils/mergeById';

// ── Components ─────────────────────────────────────────────────────────────
import { BottomNav } from '../components/BottomNav';

// ── Utils ──────────────────────────────────────────────────────────────────
import { loadState, saveState } from '../utils/storage';
import { isSupabaseConfigured } from '../utils/supabase';
import { useSekretCompanion } from '../hooks/useSekretCompanion';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useSleepGuard } from '../hooks/useSleepGuard';
import { SleepGate } from '../components/SleepGate';
import { AgeGate, type AgeGateStatus } from '../components/AgeGate';
import {
  ensureAnonymousSession, pullAll,
  syncMood, syncJournal, syncCirclePost, syncParentCirclePost,
  syncComfortSession, syncVoiceNote,
} from '../utils/sync';
import type { JournalEntry, CirclePost, ParentCirclePost, VoiceNote, MoodEntry, ComfortSession, CrewMember, CrewCheckIn } from '../types/index';
import type { OracleJournalEntry } from '../types/voiceIntelligence';
import { normalizeOracleJournalEntries } from '../services/voiceBipIntelligence';

// ── IMAGES ─────────────────────────────────────────────────────────────────
export { IMAGES, AVATARS, getRoomBg } from '../constants/theme';

// ── Backwards-compat re-exports ────────────────────────────────────────────
// Screens that previously imported RoomMemory / DEFAULT_ROOM_MEMORY from
// 'app/index' keep working without any changes on their end.
export type { RoomMemory };
export { DEFAULT_ROOM_MEMORY };

// ── Main App ───────────────────────────────────────────────────────────────

function AppContent() {
  // ─── Navigation ────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('splash');

  // ─── Theme & identity ──────────────────────────────────────────────────
  const [theme, setTheme]                   = useState('raylene');
  const [selectedSekret, setSelectedSekret] = useState('soft');
  const [sekretMode, setSekretMode]         = useState('soft');
  const [userSide, setUserSide]             = useState<'teen' | 'parent'>('teen');
  const [parentRoomStyle, setParentRoomStyle] = useState<ParentRoomStyle>('mom');
  const [parentMood,      setParentMood]      = useState('');
  const [parentMoodDate,  setParentMoodDate]  = useState('');

  // ─── Mood ──────────────────────────────────────────────────────────────
  const [mood, setMood]               = useState('Happy');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  // ─── Journal ───────────────────────────────────────────────────────────
  const [journalText, setJournalText]       = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [parentPagesDraft, setParentPagesDraft]       = useState('');
  const [parentPagesEntries, setParentPagesEntries]   = useState<JournalEntry[]>([]);
  const [oracleJournalEntries, setOracleJournalEntries] = useState<OracleJournalEntry[]>([]);
  const [oracleProfile, setOracleProfile]             = useState<OracleProfile>(() => createOracleProfile('teen'));
  const [parentOracleProfile, setParentOracleProfile] = useState<OracleProfile>(() => createOracleProfile('parent'));
  const [oracleSessions, setOracleSessions]           = useState<OracleSessionSummary[]>([]);
  const [parentOracleSessions, setParentOracleSessions] = useState<OracleSessionSummary[]>([]);

  // ─── Circle ────────────────────────────────────────────────────────────
  const [circlePosts, setCirclePosts]                   = useState<CirclePost[]>([]);
  const [circlePostText, setCirclePostText]             = useState('');
  const [parentCirclePosts, setParentCirclePosts]       = useState<ParentCirclePost[]>([]);
  const [parentCirclePostText, setParentCirclePostText] = useState('');

  // ─── Voice ─────────────────────────────────────────────────────────────
  const [voiceNotes, setVoiceNotes]           = useState<VoiceNote[]>([]);
  const [parentVoiceNotes, setParentVoiceNotes] = useState<VoiceNote[]>([]);

  // ─── Comfort ───────────────────────────────────────────────────────────
  const [comfortSessions, setComfortSessions] = useState<ComfortSession[]>([]);

  // ─── Crew ──────────────────────────────────────────────────────────────
  const [crewMembers,  setCrewMembers]  = useState<CrewMember[]>([]);
  const [crewCheckIns, setCrewCheckIns] = useState<CrewCheckIn[]>([]);

  // ─── Streaks ───────────────────────────────────────────────────────────
  const [streakDays, setStreakDays]           = useState(0);
  const [lastOpenDate, setLastOpenDate]       = useState('');
  const [streakJustReset, setStreakJustReset] = useState(false);

  // ─── Room Memory ───────────────────────────────────────────────────────
  const [roomMemory, setRoomMemory] = useState<RoomMemory>(DEFAULT_ROOM_MEMORY);

  // ─── UI ────────────────────────────────────────────────────────────────
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);
  const [isLoading, setIsLoading]               = useState(true);

  // ── Derived ────────────────────────────────────────────────────────────
  const vibeKey        = normalizeVibeKey(theme);
  const t              = THEME_PACKS[vibeKey];
  const currentSekret  = getProfile(selectedSekret);
  const companionInput = useMemo(() => ({
    selectedSekret,
    mood,
    journalEntries,
    moodHistory,
    voiceNotes,
    comfortSessions,
    circlePosts,
    streakDays,
    lastOpenDate,
    screen,
    isLateNight: new Date().getHours() >= 22 || new Date().getHours() < 5,
  }), [selectedSekret, mood, journalEntries, moodHistory, voiceNotes, comfortSessions, circlePosts, streakDays, lastOpenDate, screen]);
  const companion = useSekretCompanion(companionInput);
  const { syncStatus, withSyncWrap } = useSyncStatus();
  const { sleepActive, sleepWindow, setSleepWindow } = useSleepGuard();

  // ── AsyncStorage: load on mount ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const state = await loadState();
        if (state.theme)          setTheme(normalizeVibeKey(state.theme));
        if (state.mood)           setMood(state.mood);
        if (state.userSide)       setUserSide(state.userSide);
        if (state.selectedSekret) setSelectedSekret(state.selectedSekret);
        if (state.sekretMode)     setSekretMode(state.sekretMode);
        if (state.journalText)    setJournalText(state.journalText);
        if (state.entries)        setJournalEntries(Array.isArray(state.entries) ? state.entries : []);
        if (state.parentPagesDraft)    setParentPagesDraft(state.parentPagesDraft);
        if (state.parentPagesEntries)  setParentPagesEntries(Array.isArray(state.parentPagesEntries) ? state.parentPagesEntries : []);
        if (state.oracleJournalEntries) setOracleJournalEntries(normalizeOracleJournalEntries(state.oracleJournalEntries, 'teen'));
        if (state.oracleProfile)       setOracleProfile(normalizeOracleProfile(state.oracleProfile, 'teen'));
        if (state.parentOracleProfile) setParentOracleProfile(normalizeOracleProfile(state.parentOracleProfile, 'parent'));
        if (state.oracleSessions)      setOracleSessions(normalizeOracleSessions(state.oracleSessions, 'teen'));
        if (state.parentOracleSessions) setParentOracleSessions(normalizeOracleSessions(state.parentOracleSessions, 'parent'));
        if (state.moodHistory)         setMoodHistory(Array.isArray(state.moodHistory) ? state.moodHistory : []);
        if (state.circlePosts)         setCirclePosts(Array.isArray(state.circlePosts) ? state.circlePosts : []);
        if (state.parentCirclePosts)   setParentCirclePosts(Array.isArray(state.parentCirclePosts) ? state.parentCirclePosts : []);
        if (state.voiceNotes)          setVoiceNotes(Array.isArray(state.voiceNotes) ? state.voiceNotes : []);
        if (state.parentVoiceNotes)    setParentVoiceNotes(Array.isArray(state.parentVoiceNotes) ? state.parentVoiceNotes : []);
        if (state.comfortSessions)     setComfortSessions(Array.isArray(state.comfortSessions) ? state.comfortSessions : []);
        if (state.crewMembers)         setCrewMembers(Array.isArray(state.crewMembers) ? state.crewMembers : []);
        if (state.crewCheckIns)        setCrewCheckIns(Array.isArray(state.crewCheckIns) ? state.crewCheckIns : []);
        if (state.streakDays)          setStreakDays(Number(state.streakDays) || 0);
        if (state.lastOpenDate)        setLastOpenDate(state.lastOpenDate);
        if (state.roomMemory) {
          const rm = typeof state.roomMemory === 'string'
            ? JSON.parse(state.roomMemory)
            : state.roomMemory;
          setRoomMemory(rm);
        }
        if (state.parentRoomStyle === 'mom' || state.parentRoomStyle === 'dad') {
          setParentRoomStyle(state.parentRoomStyle as ParentRoomStyle);
        }
        if (state.parentMood)     setParentMood(state.parentMood);
        if (state.parentMoodDate) setParentMoodDate(state.parentMoodDate);
      } catch {
        // Storage read failure — continue with defaults
      }
      setIsLoading(false);
    })();
  }, []);

  // ── userSide change → splash then correct home screen ────────────────
  useEffect(() => {
    if (isLoading) return;
    setScreen('splash');
    const timer = setTimeout(() => setScreen('home'), 1200);
    return () => clearTimeout(timer);
  }, [userSide]);

  // ── Supabase: anon sign-in + pull & merge cloud state ────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (isLoading) return;
    let cancelled = false;

    (async () => {
      const uid = await ensureAnonymousSession();
      if (!uid || cancelled) return;

      const cloud = await pullAll();
      if (!cloud || cancelled) return;

      if (__DEV__) console.log('[sync] cloud counts', {
        mood: cloud.moodHistory.length,
        journal: cloud.journalEntries.length,
        circle: cloud.circlePosts.length,
        parentCircle: cloud.parentCirclePosts.length,
        voice: cloud.voiceNotes.length,
        comfort: cloud.comfortSessions.length,
        crew: cloud.crewMembers.length,
        checkIns: cloud.crewCheckIns.length,
        roomMemory: cloud.roomMemory ? 'present' : 'null',
      });

      setMoodHistory(prev      => mergeById(prev, cloud.moodHistory));
      setJournalEntries(prev   => mergeById(prev, cloud.journalEntries));
      setCirclePosts(prev      => mergeById(prev, cloud.circlePosts));
      setParentCirclePosts(prev => mergeById(prev, cloud.parentCirclePosts));
      setVoiceNotes(prev       => mergeById(prev, cloud.voiceNotes));
      setComfortSessions(prev  => mergeById(prev, cloud.comfortSessions));
      setCrewMembers(prev      => mergeById(prev, cloud.crewMembers));
      setCrewCheckIns(prev     => mergeById(prev, cloud.crewCheckIns));

      if (cloud.roomMemory) {
        setRoomMemory(prev => ({ ...prev, ...cloud.roomMemory! }));
      }
    })();

    return () => { cancelled = true; };
  }, [isLoading]);

  // ── AsyncStorage: save on change ──────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    saveState({
      theme, mood, userSide, selectedSekret, sekretMode,
      journalText,
      entries: journalEntries,
      oracleJournalEntries,
      parentPagesDraft,
      parentPagesEntries,
      oracleProfile,
      parentOracleProfile,
      oracleSessions,
      parentOracleSessions,
      moodHistory,
      circlePosts,
      parentCirclePosts,
      voiceNotes,
      parentVoiceNotes,
      comfortSessions,
      crewMembers,
      crewCheckIns,
      streakDays:   String(streakDays),
      lastOpenDate,
      roomMemory:   JSON.stringify(roomMemory),
      parentRoomStyle,
      parentMood,
      parentMoodDate,
    }).catch(() => {});
  }, [
    theme, mood, userSide, selectedSekret, sekretMode,
    journalText, journalEntries, oracleJournalEntries, parentPagesDraft, parentPagesEntries,
    oracleProfile, parentOracleProfile, oracleSessions, parentOracleSessions, moodHistory,
    circlePosts, parentCirclePosts, voiceNotes, parentVoiceNotes, comfortSessions,
    crewMembers, crewCheckIns, streakDays, lastOpenDate,
    roomMemory, parentRoomStyle, parentMood, parentMoodDate, isLoading,
  ]);

  // ── Streak tracking ───────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const today = new Date().toLocaleDateString();
    if (lastOpenDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastOpenDate === yesterday.toLocaleDateString();
      setStreakDays(prev => {
        if (wasYesterday) return prev + 1;
        setStreakJustReset(prev > 1);
        return 1;
      });
      setLastOpenDate(today);
    }
  }, [isLoading, lastOpenDate]);

  // ── Rotating home message ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(
      () => setHomeMessageIndex(p => (p + 1) % HOME_MESSAGES.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  // ── Room Memory ───────────────────────────────────────────────────────
  const updateRoomMemory = (patch: Partial<RoomMemory>) => {
    setRoomMemory(prev => ({ ...prev, ...patch, visitCount: prev.visitCount + 1 }));
  };

  // ── Activity tracker ─────────────────────────────────────────────────
  const trackActivity = (type: 'calm' | 'comfort' | 'voice' | 'journal' | 'growth' | 'mood') => {
    updateRoomMemory({ lastVisit: new Date().toISOString() });
    const now = new Date();
    const session: ComfortSession = {
      id:   Date.now(),
      type,
      mood,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setComfortSessions(prev => [session, ...prev].slice(0, 365));
    void withSyncWrap(async () => syncComfortSession(session));
  };

  // ── Mood ──────────────────────────────────────────────────────────────
  const selectMood = (m: string) => {
    setMood(m);
    const entry: MoodEntry = {
      id: Date.now(), mood: m,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };
    setMoodHistory(h => [entry, ...h]);
    void withSyncWrap(async () => syncMood(entry));
    trackActivity('mood');
  };

  // ── Journal ───────────────────────────────────────────────────────────
  const saveJournalEntry = (override?: SavePageInput & { id?: number }) => {
    const textToSave = override?.text ?? journalText;
    if (!textToSave.trim() && !override?.imageUri) return;
    const entry: JournalEntry = {
      id: override?.id ?? Date.now(),
      text: textToSave,
      mood,
      source:    override?.source    ?? 'me',
      activeTab: override?.source    ?? 'me',
      moodTag:   override?.moodTag   || mood,
      entryMode: override?.entryMode || 'typed',
      locked:    override?.locked    || false,
      imageUri:  override?.imageUri,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setJournalEntries(e => [entry, ...e]);
    if (!override) setJournalText('');
    void withSyncWrap(async () => syncJournal(entry));
    trackActivity('journal');
  };

  const patchJournalEntry = (entryId: number, reply: string) => {
    if (!reply) return;
    setJournalEntries(prev => {
      const next = prev.map(entry =>
        entry.id === entryId ? { ...entry, sekretReply: reply } : entry
      );
      const patched = next.find(entry => entry.id === entryId);
      if (patched) void withSyncWrap(async () => syncJournal(patched));
      return next;
    });
  };

  const saveParentPageEntry = (input: SavePageInput) => {
    if (!input.text.trim() && !input.imageUri) return;
    const entry: JournalEntry = {
      id: Date.now(),
      text: input.text,
      mood: parentMood || mood,
      source:    input.source,
      activeTab: input.source,
      moodTag:   input.moodTag   || parentMood || mood,
      entryMode: input.entryMode,
      locked:    input.locked,
      imageUri:  input.imageUri,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setParentPagesEntries(current => [entry, ...current]);
  };

  // ── Circle ────────────────────────────────────────────────────────────
  const saveCirclePost = (extra?: Partial<CirclePost>) => {
    const textToSave = extra?.text ?? circlePostText;
    if (!textToSave.trim()) return;
    const post: CirclePost = {
      id: Number(Date.now()),
      text: textToSave,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      bipType:   extra?.bipType,
      mediaKind: extra?.mediaKind,
      circleTag: extra?.circleTag,
      postMood:  extra?.postMood,
      reactions: { felt: 0, comfort: 0, proud: 0, stay: 0, sameHere: 0 },
    };
    setCirclePosts(p => [post, ...p]);
    void withSyncWrap(async () => syncCirclePost(post));
  };

  const reactToPost = (id: string | number, type: string) => {
    setCirclePosts(posts => posts.map(p =>
      String(p.id) === String(id)
        ? { ...p, reactions: { ...p.reactions, [type]: ((p.reactions as any)[type] || 0) + 1 } }
        : p
    ));
  };

  const saveParentCirclePost = () => {
    if (!parentCirclePostText.trim()) return;
    const post: ParentCirclePost = {
      id: Number(Date.now()),
      text: parentCirclePostText,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      reactions: { beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0 },
    };
    setParentCirclePosts(p => [post, ...p]);
    setParentCirclePostText('');
    void withSyncWrap(async () => syncParentCirclePost(post));
  };

  const reactToParentPost = (id: string | number, type: string) => {
    setParentCirclePosts(posts => posts.map(p =>
      String(p.id) === String(id)
        ? { ...p, reactions: { ...p.reactions, [type as keyof ParentCirclePost['reactions']]: (p.reactions[type as keyof ParentCirclePost['reactions']] || 0) + 1 } }
        : p
    ));
  };

  // ── Oracle ────────────────────────────────────────────────────────────
  const completeTeenOracleSession = (profile: OracleProfile, session: OracleSessionSummary) => {
    setOracleProfile(profile);
    setOracleSessions(prev => [session, ...prev]);
  };

  const completeParentOracleSession = (profile: OracleProfile, session: OracleSessionSummary) => {
    setParentOracleProfile(profile);
    setParentOracleSessions(prev => [session, ...prev]);
  };

  // ── Bottom Nav ────────────────────────────────────────────────────────
  const nav = <BottomNav screen={screen} setScreen={setScreen} userSide={userSide} />;

  if (screen === 'splash') return <SplashScreen setScreen={setScreen} userSide={userSide} />;
  if (isLoading) return null;

  const allowComfort = ['comfort', 'calm', 'mindReset', 'bodyReset'].includes(screen);

  const renderRoute = (): React.ReactNode => {
    if (screen === 'home') {
      if (userSide === 'parent') {
        const today = new Date().toLocaleDateString();
        const previousMood = (parentMoodDate && parentMoodDate !== today) ? parentMood : '';
        return (
          <ParentRoomScreen
            parentRoomStyle={parentRoomStyle}
            parentMood={parentMood}
            previousMood={previousMood}
            setParentMood={(m) => { setParentMood(m); setParentMoodDate(new Date().toLocaleDateString()); }}
            setScreen={setScreen}
            weatherMode={theme === 'rain' ? 'rain' : undefined}
            BottomNav={nav}
          />
        );
      }
      return (
        <RoomScreen
          mood={mood}
          selectedSekret={selectedSekret}
          setSelectedSekret={setSelectedSekret}
          setScreen={setScreen}
          t={t}
          updateRoomMemory={updateRoomMemory}
          vibe={vibeKey}
          companion={companion}
          sekretMode={selectedSekret}
          BottomNav={nav}
        />
      );
    }

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
        onMoodSelect={() => trackActivity('mood')}
        BottomNav={nav}
        streakDays={streakDays}
        streakJustReset={streakJustReset}
        companion={companion}
        syncStatus={syncStatus}
      />
    );

    if (screen === 'cloudThoughts') return (
      <CloudThoughtsScreen
        t={t}
        mood={mood}
        selectedSekret={selectedSekret}
        character={getActiveCharacter(selectedSekret)}
        setScreen={setScreen}
        BottomNav={nav}
        privateProfile={userSide === 'parent' ? parentOracleProfile : oracleProfile}
        profileSide={userSide}
      />
    );

    if (screen === 'periodCalendar') return (
      <PeriodCalendarScreen theme={t} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} mood={mood} />
    );

    if (screen === 'voiceBip') return (
      <VoiceBipScreen
        theme={t}
        setScreen={setScreen}
        selectedSekret={selectedSekret}
        onSelectAvatar={setSelectedSekret}
        weatherMode={theme === 'rain' ? 'rain' : undefined}
        voiceNotes={userSide === 'parent' ? parentVoiceNotes : voiceNotes}
        setVoiceNotes={userSide === 'parent' ? setParentVoiceNotes : setVoiceNotes}
        onSave={(note: VoiceNote) => {
          if (userSide === 'teen') void withSyncWrap(async () => syncVoiceNote(note));
          trackActivity('voice');
        }}
        mood={mood}
        companion={userSide === 'parent' ? undefined : companion}
        BottomNav={nav}
        privateProfile={userSide === 'parent' ? parentOracleProfile : oracleProfile}
        profileSide={userSide}
        syncStatus={userSide === 'teen' ? syncStatus : undefined}
        oracleJournalEntries={userSide === 'teen' ? oracleJournalEntries : []}
        onStoreOracleMemory={(entry: OracleJournalEntry) => {
          if (userSide === 'teen') setOracleJournalEntries(current => [entry, ...current].slice(0, 250));
        }}
      />
    );

    if (screen === 'pages') return userSide === 'parent' ? (
      <ParentPagesScreen
        entries={parentPagesEntries}
        draft={parentPagesDraft}
        setDraft={setParentPagesDraft}
        onSave={saveParentPageEntry}
        mood={parentMood || mood}
        setScreen={setScreen}
        BottomNav={nav}
        parentRoomStyle={parentRoomStyle}
        weatherMode={theme === 'rain' ? 'rain' : undefined}
        oracleProfile={parentOracleProfile}
        onCompleteOracleSession={completeParentOracleSession}
      />
    ) : (
      <PagesScreen
        journalText={journalText}
        setJournalText={setJournalText}
        journalEntries={journalEntries}
        saveJournalEntry={saveJournalEntry}
        oracleProfile={oracleProfile}
        onCompleteOracleSession={completeTeenOracleSession}
        onSekretReply={patchJournalEntry}
        mood={mood}
        t={t}
        setScreen={setScreen}
        BottomNav={nav}
        moodHistory={moodHistory}
        voiceNotes={voiceNotes}
        streakDays={streakDays}
        selectedSekret={selectedSekret}
        syncStatus={syncStatus}
      />
    );

    if (screen === 'calm') return (
      <CalmScreen t={t} mood={mood} setMood={setMood} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} />
    );

    if (screen === 'sekret') return (
      <SekretScreen
        t={t} mood={mood} currentSekret={currentSekret}
        selectedProfile={selectedSekret} setSelectedProfile={setSelectedSekret}
        userSide={userSide} setScreen={setScreen} BottomNav={nav}
        privateProfile={userSide === 'parent' ? parentOracleProfile : oracleProfile}
      />
    );

    if (screen === 'circle') {
      if (userSide === 'parent') return (
        <ParentCircleScreen
          parentCirclePosts={parentCirclePosts}
          parentCirclePostText={parentCirclePostText}
          setParentCirclePostText={setParentCirclePostText}
          saveParentCirclePost={saveParentCirclePost}
          reactToParentPost={reactToParentPost}
          setScreen={setScreen}
          BottomNav={nav}
        />
      );
      return (
        <CircleScreen
          t={t} circlePosts={circlePosts} circlePostText={circlePostText}
          setCirclePostText={setCirclePostText} saveCirclePost={saveCirclePost}
          reactToPost={reactToPost} setScreen={setScreen} BottomNav={nav}
          selectedSekret={selectedSekret} mood={mood} syncStatus={syncStatus}
        />
      );
    }

    if (screen === 'bridge')       return <BridgeScreen t={t} currentSekret={currentSekret} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} mood={mood} />;
    if (screen === 's2tell')       return <S2TellScreen t={t} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} mood={mood} privateProfile={oracleProfile} />;
    if (screen === 'parentBridge') return <ParentBridgeScreen t={t} setScreen={setScreen} BottomNav={nav} />;

    if (screen === 'bippin2') return (
      <Bippin2Screen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} onMilestone={() => trackActivity('growth')} streakDays={streakDays} BottomNav={nav} />
    );
    if (screen === 'growth') return (
      <GrowthScreen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} onMilestone={() => trackActivity('growth')} streakDays={streakDays} BottomNav={nav} />
    );
    if (screen === 'womanhood') return (
      <WomanhoodScreen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} BottomNav={nav} streakDays={streakDays} />
    );
    if (screen === 'manhood') return (
      <ManhoodScreen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} BottomNav={nav} streakDays={streakDays} />
    );

    if (screen === 'comfort') return (
      <ComfortScreen
        t={t} setScreen={setScreen} onComplete={() => trackActivity('comfort')} BottomNav={nav}
        selectedSekret={selectedSekret} character={getActiveCharacter(selectedSekret)}
        mood={mood} companion={companion} syncStatus={syncStatus}
      />
    );

    if (screen === 'mindReset' || screen === 'bodyReset') return (
      <MindBodyResetScreen
        screen={screen as 'mindReset' | 'bodyReset'} t={t} selectedSekret={selectedSekret}
        setScreen={setScreen} onComplete={() => trackActivity('calm')} BottomNav={nav} mood={mood}
      />
    );

    if (screen === 'points') return (
      <PointsScreen
        t={t} mood={mood} selectedSekret={selectedSekret} moodHistory={moodHistory}
        journalEntries={journalEntries} voiceNotes={voiceNotes} circlePosts={circlePosts}
        comfortSessions={comfortSessions} crewCheckIns={crewCheckIns}
        streakDays={streakDays} setScreen={setScreen} BottomNav={nav}
      />
    );

    if (screen === 'crew') return (
      <BipCrewScreen
        t={t} mood={mood} selectedSekret={selectedSekret}
        crewMembers={crewMembers} setCrewMembers={setCrewMembers}
        crewCheckIns={crewCheckIns} setCrewCheckIns={setCrewCheckIns}
        setScreen={setScreen} BottomNav={nav} syncStatus={syncStatus} withSyncWrap={withSyncWrap}
      />
    );

    if (screen === 'comfortStreaks') return (
      <ComfortStreaksScreen t={t} mood={mood} selectedSekret={selectedSekret} comfortSessions={comfortSessions} setScreen={setScreen} BottomNav={nav} />
    );

    if (screen === 'history') return (
      <HistoryScreen
        t={t} mood={mood} selectedSekret={selectedSekret} moodHistory={moodHistory}
        journalEntries={journalEntries} voiceNotes={voiceNotes} circlePosts={circlePosts}
        streakDays={streakDays} setScreen={setScreen} BottomNav={nav}
      />
    );

    if (screen === 'more') return (
      <MoreScreen
        t={t} userSide={userSide}
        setUserSide={(side: string) => setUserSide(side as 'teen' | 'parent')}
        onSideChanged={() => setScreen('splash')}
        setScreen={setScreen} BottomNav={nav} mood={mood} selectedSekret={selectedSekret}
      />
    );

    if (screen === 'settings') return (
      <SettingsScreen
        t={t} theme={theme} setTheme={setTheme}
        selectedSekret={selectedSekret} setSelectedSekret={setSelectedSekret}
        sekretMode={sekretMode} setSekretMode={setSekretMode}
        userSide={userSide} setUserSide={setUserSide}
        setScreen={setScreen} BottomNav={nav}
        sleepWindow={sleepWindow} setSleepWindow={setSleepWindow}
        parentRoomStyle={parentRoomStyle} setParentRoomStyle={setParentRoomStyle}
      />
    );

    // Fallback — should never reach here
    return (
      <RoomScreen
        mood={mood} selectedSekret={selectedSekret} setSelectedSekret={setSelectedSekret}
        setScreen={setScreen} t={t} updateRoomMemory={updateRoomMemory}
        vibe={vibeKey} companion={companion} sekretMode={selectedSekret} BottomNav={nav}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Analytics />
      {sleepActive && !allowComfort
        ? <SleepGate setScreen={setScreen} sleepWindow={sleepWindow} />
        : renderRoute()
      }
    </View>
  );
}

export default function App() {
  return <AppContent />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
