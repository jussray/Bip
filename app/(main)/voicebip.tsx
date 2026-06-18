/**
 * app/(main)/voicebip.tsx
 * Route wrapper for VoiceBipScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { VoiceBipScreen } from '@/screens/VoiceBipScreen';

export default function VoiceBipRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <VoiceBipScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
