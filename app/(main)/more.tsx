/**
 * app/(main)/more.tsx
 * Route wrapper for MoreScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { MoreScreen } from '@/screens/MoreScreen';

export default function MoreRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <MoreScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
