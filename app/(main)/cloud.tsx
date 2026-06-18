/**
 * app/(main)/cloud.tsx
 * Route wrapper for CloudThoughtsScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { CloudThoughtsScreen } from '@screens/CloudThoughtsScreen';

export default function CloudRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <CloudThoughtsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      BottomNav={null}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
