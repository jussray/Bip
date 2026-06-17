/**
 * app/(main)/home.tsx
 *
 * Home tab — renders the real HomeScreen component.
 * State is read from AppContext (no more prop drilling).
 * setScreen prop satisfied by a router.push() shim for backward compat
 * until screens/ physical files are moved in Step 3.
 */
import React from 'react';
import { router } from 'expo-router';
import { HomeScreen } from '@screens/HomeScreen';
import { useAppContext } from '@/context/AppContext';

// Mapping from legacy setScreen() string keys → Expo Router paths
const SCREEN_MAP: Record<string, string> = {
  home:         '/(main)/home',
  pages:        '/(main)/pages',
  calm:         '/(main)/calm',
  circle:       '/(main)/circle',
  sekret:       '/(main)/sekret',
  voiceBip:     '/(main)/discover',
  bridge:       '/(main)/bridge',
  parentBridge: '/(main)/bridge',
  cloudThoughts:'/(main)/discover',
  settings:     '/(main)/settings',
};

function setScreen(screen: string) {
  const path = SCREEN_MAP[screen] ?? '/(main)/home';
  router.push(path as any);
}

export default function HomeTab() {
  const {
    theme,
    mood,
    setMood,
    selectMood,
    userSide,
    selectedSekret,
    homeMessageIndex,
    breatheAnim,
  } = useAppContext();

  return (
    <HomeScreen
      theme={theme}
      mood={mood}
      setMood={selectMood}
      setScreen={setScreen}
      userSide={userSide}
      selectedSekret={selectedSekret}
      homeMessageIndex={homeMessageIndex}
      breatheAnim={breatheAnim}
    />
  );
}
