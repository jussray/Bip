/**
 * app/(main)/comfort.tsx
 * Route wrapper for ComfortScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ComfortScreen } from '@/screens/ComfortScreen';

export default function ComfortRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <ComfortScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="home"
    />
  );
}
