/**
 * app/(main)/history.tsx
 * Route wrapper for HistoryScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { HistoryScreen } from '@/screens/HistoryScreen';

export default function HistoryRoute() {
  const { theme, mood, moodHistory, entries } = useAppContext();
  return (
    <HistoryScreen
      theme={theme}
      mood={mood}
      moodHistory={moodHistory}
      entries={entries}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="home"
    />
  );
}
