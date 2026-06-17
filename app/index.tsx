/**
 * app/index.tsx  — THIN ENTRY POINT
 * -----------------------------------
 * Previously 47 KB. All logic has been extracted:
 *
 *   State shape   →  src/store/useAppStore.ts
 *   Side effects  →  src/hooks/useAppEffects.ts
 *   Mutations     →  src/handlers/actionHandlers.ts
 *
 * This file is now a minimal shell that:
 *   1. Mounts state + effects
 *   2. Wires handlers
 *   3. Delegates routing to renderRoute()
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

// ── State & effects ────────────────────────────────────────────────────────
import { useAppStore }   from '../src/store/useAppStore';
import { useAppEffects } from '../src/hooks/useAppEffects';
import {
  makeUpdateRoomMemory,
  makeTrackActivity,
  makeSelectMood,
  makeSaveJournalEntry,
  makePatchJournalEntry,
  makeSaveParentPageEntry,
  makeSaveCirclePost,
  makeReactToPost,
  makeSaveParentCirclePost,
  makeReactToParentPost,
  makeCompleteOracleSession,
} from '../src/handlers/actionHandlers';

// ── Hooks ─────────────────────────────────────────────────────────────────
import { useSekretCompanion } from '../hooks/useSekretCompanion';
import { useSyncStatus }      from '../hooks/useSyncStatus';
import { useSleepGuard }      from '../hooks/useSleepGuard';

// ── Components ────────────────────────────────────────────────────────────
import { BottomNav }  from '../components/BottomNav';
import { SleepGate }  from '../components/SleepGate';
import { AgeGate, type AgeGateStatus } from '../components/AgeGate';

// ── Screens ───────────────────────────────────────────────────────────────
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
import { ComfortStreaksScreen }  from '../screens/ComfortStreaksScreen';
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

// ── Constants / services ──────────────────────────────────────────────────
import { THEME_PACKS, normalizeVibeKey, IMAGES, AVATARS, getRoomBg } from '../constants/theme';
import { SEKRET_PROFILES, getProfile } from '../src/constants/profiles';
import { getActiveCharacter } from '../src/utils/characterUtils';
import type { VoiceNote } from '../types/index';
import type { OracleJournalEntry } from '../types/voiceIntelligence';

// ── Backwards-compat re-exports (imported by screens) ─────────────────────
export { IMAGES, AVATARS, getRoomBg };
export type { RoomMemory } from '../src/types/roomMemory';
export { DEFAULT_ROOM_MEMORY } from '../src/types/roomMemory';

// ─────────────────────────────────────────────────────────────────────────

function AppContent() {
  const [state, setState] = useAppStore();

  // Wire all side effects
  useAppEffects(state, setState);

  // Sync & sleep guards
  const { syncStatus, withSyncWrap } = useSyncStatus();
  const { sleepActive, sleepWindow, setSleepWindow } = useSleepGuard();

  // Derived / memoised
  const vibeKey       = normalizeVibeKey(state.theme);
  const t             = THEME_PACKS[vibeKey];
  const currentSekret = getProfile(state.selectedSekret);

  const companionInput = useMemo(() => ({
    selectedSekret:  state.selectedSekret,
    mood:            state.mood,
    journalEntries:  state.journalEntries,
    moodHistory:     state.moodHistory,
    voiceNotes:      state.voiceNotes,
    comfortSessions: state.comfortSessions,
    circlePosts:     state.circlePosts,
    streakDays:      state.streakDays,
    lastOpenDate:    state.lastOpenDate,
    screen:          state.screen,
    isLateNight: (() => { const h = new Date().getHours(); return h >= 22 || h < 5; })(),
  }), [
    state.selectedSekret, state.mood, state.journalEntries, state.moodHistory,
    state.voiceNotes, state.comfortSessions, state.circlePosts,
    state.streakDays, state.lastOpenDate, state.screen,
  ]);
  const companion = useSekretCompanion(companionInput);

  // Handlers
  const updateRoomMemory   = makeUpdateRoomMemory(setState);
  const trackActivity      = makeTrackActivity(setState, withSyncWrap, () => state.mood);
  const selectMood         = makeSelectMood(setState, withSyncWrap, trackActivity);
  const saveJournalEntry   = makeSaveJournalEntry(setState, withSyncWrap, trackActivity, () => state.mood, () => state.journalText);
  const patchJournalEntry  = makePatchJournalEntry(setState, withSyncWrap);
  const saveParentPageEntry = makeSaveParentPageEntry(setState, () => state.mood, () => state.parentMood);
  const saveCirclePost     = makeSaveCirclePost(setState, withSyncWrap, () => state.circlePostText);
  const reactToPost        = makeReactToPost(setState);
  const saveParentCirclePost = makeSaveParentCirclePost(setState, withSyncWrap);
  const reactToParentPost  = makeReactToParentPost(setState);
  const completeTeenOracleSession   = makeCompleteOracleSession(setState, 'teen');
  const completeParentOracleSession = makeCompleteOracleSession(setState, 'parent');

  const setScreen = (s: string) => setState(prev => ({ ...prev, screen: s }));

  // Bottom nav shared element
  const nav = (
    <BottomNav
      screen={state.screen}
      setScreen={setScreen}
      userSide={state.userSide}
    />
  );

  // ── Guards ──────────────────────────────────────────────────────────────
  if (state.screen === 'splash')
    return <SplashScreen setScreen={setScreen} userSide={state.userSide} />;
  if (state.isLoading) return null;

  // ── Router ──────────────────────────────────────────────────────────────
  const s = state;

  if (s.screen === 'home') {
    if (s.userSide === 'parent') {
      const today = new Date().toLocaleDateString();
      const previousMood = (s.parentMoodDate && s.parentMoodDate !== today) ? s.parentMood : '';
      return (
        <ParentRoomScreen
          parentRoomStyle={s.parentRoomStyle}
          parentMood={s.parentMood}
          previousMood={previousMood}
          setParentMood={(m) => setState(prev => ({ ...prev, parentMood: m, parentMoodDate: new Date().toLocaleDateString() }))}
          setScreen={setScreen}
          weatherMode={s.theme === 'rain' ? 'rain' : undefined}
          BottomNav={nav}
        />
      );
    }
    return (
      <RoomScreen
        mood={s.mood} selectedSekret={s.selectedSekret}
        setSelectedSekret={(v) => setState(prev => ({ ...prev, selectedSekret: v }))}
        setScreen={setScreen} t={t} updateRoomMemory={updateRoomMemory}
        vibe={vibeKey} companion={companion} sekretMode={s.selectedSekret} BottomNav={nav}
      />
    );
  }

  if (s.screen === 'dashboard') return (
    <HomeScreen
      mood={s.mood} selectMood={selectMood} t={t} currentSekret={currentSekret}
      selectedSekret={s.selectedSekret} homeMessageIndex={s.homeMessageIndex}
      userSide={s.userSide} setScreen={setScreen} onMoodSelect={() => trackActivity('mood')}
      BottomNav={nav} streakDays={s.streakDays} streakJustReset={s.streakJustReset}
      companion={companion} syncStatus={syncStatus}
    />
  );

  if (s.screen === 'cloudThoughts') return (
    <CloudThoughtsScreen
      t={t} mood={s.mood} selectedSekret={s.selectedSekret}
      character={getActiveCharacter(s.selectedSekret)} setScreen={setScreen} BottomNav={nav}
      privateProfile={s.userSide === 'parent' ? s.parentOracleProfile : s.oracleProfile}
      profileSide={s.userSide}
    />
  );

  if (s.screen === 'periodCalendar') return (
    <PeriodCalendarScreen theme={t} setScreen={setScreen} BottomNav={nav} selectedSekret={s.selectedSekret} mood={s.mood} />
  );

  if (s.screen === 'voiceBip') return (
    <VoiceBipScreen
      theme={t} setScreen={setScreen} selectedSekret={s.selectedSekret}
      onSelectAvatar={(v) => setState(prev => ({ ...prev, selectedSekret: v }))}
      weatherMode={s.theme === 'rain' ? 'rain' : undefined}
      voiceNotes={s.userSide === 'parent' ? s.parentVoiceNotes : s.voiceNotes}
      setVoiceNotes={(fn) => setState(prev => ({
        ...prev,
        ...(s.userSide === 'parent'
          ? { parentVoiceNotes: typeof fn === 'function' ? fn(prev.parentVoiceNotes) : fn }
          : { voiceNotes:       typeof fn === 'function' ? fn(prev.voiceNotes)       : fn }),
      }))}
      onSave={(note: VoiceNote) => {
        if (s.userSide === 'teen') void withSyncWrap(async () => { const { syncVoiceNote } = await import('../utils/sync'); syncVoiceNote(note); });
        trackActivity('voice');
      }}
      mood={s.mood} companion={s.userSide === 'parent' ? undefined : companion}
      BottomNav={nav}
      privateProfile={s.userSide === 'parent' ? s.parentOracleProfile : s.oracleProfile}
      profileSide={s.userSide}
      syncStatus={s.userSide === 'teen' ? syncStatus : undefined}
      oracleJournalEntries={s.userSide === 'teen' ? s.oracleJournalEntries : []}
      onStoreOracleMemory={(entry: OracleJournalEntry) => {
        if (s.userSide === 'teen')
          setState(prev => ({ ...prev, oracleJournalEntries: [entry, ...prev.oracleJournalEntries].slice(0, 250) }));
      }}
    />
  );

  if (s.screen === 'pages') return s.userSide === 'parent' ? (
    <ParentPagesScreen
      entries={s.parentPagesEntries} draft={s.parentPagesDraft}
      setDraft={(v) => setState(prev => ({ ...prev, parentPagesDraft: v }))}
      onSave={saveParentPageEntry} mood={s.parentMood || s.mood}
      setScreen={setScreen} BottomNav={nav} parentRoomStyle={s.parentRoomStyle}
      weatherMode={s.theme === 'rain' ? 'rain' : undefined}
      oracleProfile={s.parentOracleProfile} onCompleteOracleSession={completeParentOracleSession}
    />
  ) : (
    <PagesScreen
      journalText={s.journalText}
      setJournalText={(v) => setState(prev => ({ ...prev, journalText: v }))}
      journalEntries={s.journalEntries} saveJournalEntry={saveJournalEntry}
      oracleProfile={s.oracleProfile} onCompleteOracleSession={completeTeenOracleSession}
      onSekretReply={patchJournalEntry} mood={s.mood} t={t} setScreen={setScreen}
      BottomNav={nav} moodHistory={s.moodHistory} voiceNotes={s.voiceNotes}
      streakDays={s.streakDays} selectedSekret={s.selectedSekret} syncStatus={syncStatus}
    />
  );

  if (s.screen === 'calm')   return <CalmScreen t={t} mood={s.mood} setMood={(m) => setState(prev => ({ ...prev, mood: m }))} setScreen={setScreen} BottomNav={nav} selectedSekret={s.selectedSekret} />;
  if (s.screen === 'sekret') return <SekretScreen t={t} mood={s.mood} currentSekret={currentSekret} selectedProfile={s.selectedSekret} setSelectedProfile={(v) => setState(prev => ({ ...prev, selectedSekret: v }))} userSide={s.userSide} setScreen={setScreen} BottomNav={nav} privateProfile={s.userSide === 'parent' ? s.parentOracleProfile : s.oracleProfile} />;

  if (s.screen === 'circle') {
    if (s.userSide === 'parent') return (
      <ParentCircleScreen
        parentCirclePosts={s.parentCirclePosts}
        parentCirclePostText={s.parentCirclePostText}
        setParentCirclePostText={(v) => setState(prev => ({ ...prev, parentCirclePostText: v }))}
        saveParentCirclePost={saveParentCirclePost}
        reactToParentPost={reactToParentPost}
        setScreen={setScreen} BottomNav={nav}
      />
    );
    return (
      <CircleScreen
        t={t} circlePosts={s.circlePosts} circlePostText={s.circlePostText}
        setCirclePostText={(v) => setState(prev => ({ ...prev, circlePostText: v }))}
        saveCirclePost={saveCirclePost} reactToPost={reactToPost}
        setScreen={setScreen} BottomNav={nav} selectedSekret={s.selectedSekret}
        mood={s.mood} syncStatus={syncStatus}
      />
    );
  }

  if (s.screen === 'bridge')       return <BridgeScreen t={t} currentSekret={currentSekret} setScreen={setScreen} BottomNav={nav} selectedSekret={s.selectedSekret} mood={s.mood} />;
  if (s.screen === 's2tell')       return <S2TellScreen t={t} setScreen={setScreen} BottomNav={nav} selectedSekret={s.selectedSekret} mood={s.mood} privateProfile={s.oracleProfile} />;
  if (s.screen === 'parentBridge') return <ParentBridgeScreen t={t} setScreen={setScreen} BottomNav={nav} />;

  if (s.screen === 'bippin2')   return <Bippin2Screen t={t} mood={s.mood} selectedSekret={s.selectedSekret} setScreen={setScreen} onMilestone={() => trackActivity('growth')} streakDays={s.streakDays} BottomNav={nav} />;
  if (s.screen === 'growth')    return <GrowthScreen t={t} mood={s.mood} selectedSekret={s.selectedSekret} setScreen={setScreen} onMilestone={() => trackActivity('growth')} streakDays={s.streakDays} BottomNav={nav} />;
  if (s.screen === 'womanhood') return <WomanhoodScreen t={t} mood={s.mood} selectedSekret={s.selectedSekret} setScreen={setScreen} BottomNav={nav} streakDays={s.streakDays} />;
  if (s.screen === 'manhood')   return <ManhoodScreen t={t} mood={s.mood} selectedSekret={s.selectedSekret} setScreen={setScreen} BottomNav={nav} streakDays={s.streakDays} />;

  if (s.screen === 'comfort') return (
    <ComfortScreen
      t={t} setScreen={setScreen} onComplete={() => trackActivity('comfort')} BottomNav={nav}
      selectedSekret={s.selectedSekret} character={getActiveCharacter(s.selectedSekret)}
      mood={s.mood} companion={companion} syncStatus={syncStatus}
    />
  );

  if (s.screen === 'mindReset' || s.screen === 'bodyReset') return (
    <MindBodyResetScreen
      screen={s.screen as 'mindReset' | 'bodyReset'} t={t} selectedSekret={s.selectedSekret}
      setScreen={setScreen} onComplete={() => trackActivity('calm')} BottomNav={nav} mood={s.mood}
    />
  );

  if (s.screen === 'points') return (
    <PointsScreen
      t={t} mood={s.mood} selectedSekret={s.selectedSekret} moodHistory={s.moodHistory}
      journalEntries={s.journalEntries} voiceNotes={s.voiceNotes} circlePosts={s.circlePosts}
      comfortSessions={s.comfortSessions} crewCheckIns={s.crewCheckIns}
      streakDays={s.streakDays} setScreen={setScreen} BottomNav={nav}
    />
  );

  if (s.screen === 'crew') return (
    <BipCrewScreen
      t={t} mood={s.mood} selectedSekret={s.selectedSekret}
      crewMembers={s.crewMembers}
      setCrewMembers={(fn) => setState(prev => ({ ...prev, crewMembers: typeof fn === 'function' ? fn(prev.crewMembers) : fn }))}
      crewCheckIns={s.crewCheckIns}
      setCrewCheckIns={(fn) => setState(prev => ({ ...prev, crewCheckIns: typeof fn === 'function' ? fn(prev.crewCheckIns) : fn }))}
      setScreen={setScreen} BottomNav={nav} syncStatus={syncStatus} withSyncWrap={withSyncWrap}
    />
  );

  if (s.screen === 'comfortStreaks') return (
    <ComfortStreaksScreen t={t} mood={s.mood} selectedSekret={s.selectedSekret} comfortSessions={s.comfortSessions} setScreen={setScreen} BottomNav={nav} />
  );

  if (s.screen === 'history') return (
    <HistoryScreen
      t={t} mood={s.mood} selectedSekret={s.selectedSekret} moodHistory={s.moodHistory}
      journalEntries={s.journalEntries} voiceNotes={s.voiceNotes} circlePosts={s.circlePosts}
      streakDays={s.streakDays} setScreen={setScreen} BottomNav={nav}
    />
  );

  if (s.screen === 'more')     return <MoreScreen t={t} setScreen={setScreen} BottomNav={nav} userSide={s.userSide} setUserSide={(v) => setState(prev => ({ ...prev, userSide: v }))} />;
  if (s.screen === 'settings') return <SettingsScreen t={t} setScreen={setScreen} BottomNav={nav} sleepWindow={sleepWindow} setSleepWindow={setSleepWindow} />;

  return null;
}

export default function Index() {
  return <AppContent />;
}
