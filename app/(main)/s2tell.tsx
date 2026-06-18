/**
 * app/(main)/s2tell.tsx
 * Route wrapper for S2TellScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { S2TellScreen } from '@/screens/S2TellScreen';

export default function S2TellRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <S2TellScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="sekret"
    />
  );
}
