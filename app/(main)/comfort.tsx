/**
 * app/(main)/comfort.tsx
 * Route wrapper for ComfortScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { ComfortScreen } from '@screens/ComfortScreen';

export default function ComfortRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <ComfortScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      BottomNav={null}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
