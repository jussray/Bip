/**
 * app/(main)/home.tsx
 *
 * Home tab — renders the real HomeScreen component.
 * State is read from AppContext (no more prop drilling).
 * setScreen prop satisfied by navigateTo() from utils/navigation.
 */
import React from 'react';
import { HomeScreen } from '@screens/HomeScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';

export default function HomeTab() {
  const {
    theme,
    mood,
    selectMood,   // selectMood = setMood + append to moodHistory (same signature as setMood)
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
      setScreen={navigateTo}
      userSide={userSide}
      selectedSekret={selectedSekret}
      homeMessageIndex={homeMessageIndex}
      breatheAnim={breatheAnim}
    />
  );
}
