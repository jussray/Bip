import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { validateEnv } from '../utils/env';

import { Analytics } from '../components/Analytics';
import { SleepGate }  from '../components/SleepGate';
import { SplashScreen } from '../screens/SplashScreen';

import { useAppState }        from './hooks/useAppState';
import { useAppActions }      from './hooks/useAppActions';
import { useSekretCompanion } from '../hooks/useSekretCompanion';
import { useSyncStatus }      from '../hooks/useSyncStatus';
import { useSleepGuard }      from '../hooks/useSleepGuard';

import { THEME_PACKS, normalizeVibeKey } from '../constants/theme';
import { SEKRET_PROFILES } from './constants/profiles';
import { getActiveCharacter } from './utils/characterUtils';
import { BottomNav } from '../components/BottomNav';
import { RouteRenderer } from './RouteRenderer';

// Fire env validation after all imports
void validateEnv();

// Re-export for screens that previously imported from app/index.tsx
export { IMAGES, AVATARS, getRoomBg } from '../constants/theme';
export type { RoomMemory } from './types/roomMemory';
export { DEFAULT_ROOM_MEMORY } from './types/roomMemory';

export function AppContent() {
  const s = useAppState();
  const { syncStatus, withSyncWrap } = useSyncStatus();
  const { sleepActive, sleepWindow, setSleepWindow } = useSleepGuard();
  const actions = useAppActions(s, withSyncWrap);

  const vibeKey       = normalizeVibeKey(s.theme);
  const t             = THEME_PACKS[vibeKey];
  const currentSekret = SEKRET_PROFILES[s.selectedSekret] || SEKRET_PROFILES.soft;

  const companionInput = useMemo(() => ({
    selectedSekret: s.selectedSekret,
    mood: s.mood,
    journalEntries: s.journalEntries,
    moodHistory: s.moodHistory,
    voiceNotes: s.voiceNotes,
    comfortSessions: s.comfortSessions,
    circlePosts: s.circlePosts,
    streakDays: s.streakDays,
    lastOpenDate: s.lastOpenDate,
    screen: s.screen,
    isLateNight: new Date().getHours() >= 22 || new Date().getHours() < 5,
  }), [
    s.selectedSekret, s.mood, s.journalEntries, s.moodHistory,
    s.voiceNotes, s.comfortSessions, s.circlePosts,
    s.streakDays, s.lastOpenDate, s.screen,
  ]);

  const companion = useSekretCompanion(companionInput);

  if (s.screen === 'splash') {
    return <SplashScreen setScreen={s.setScreen} userSide={s.userSide} />;
  }
  if (s.isLoading) return null;

  const allowComfort = ['comfort', 'calm', 'mindReset', 'bodyReset'].includes(s.screen);
  const nav = <BottomNav screen={s.screen} setScreen={s.setScreen} userSide={s.userSide} />;

  return (
    <View style={styles.container}>
      <Analytics />
      <SleepGate sleepActive={sleepActive && !allowComfort} onComfort={() => s.setScreen('comfort')}>
        <RouteRenderer
          s={s}
          t={t}
          vibeKey={vibeKey}
          currentSekret={currentSekret}
          companion={companion}
          syncStatus={syncStatus}
          withSyncWrap={withSyncWrap}
          sleepWindow={sleepWindow}
          setSleepWindow={setSleepWindow}
          actions={actions}
          nav={nav}
          getActiveCharacter={getActiveCharacter}
        />
      </SleepGate>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
