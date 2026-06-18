/**
 * app/(main)/period-calendar.tsx
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { PeriodCalendarScreen } from '@screens/PeriodCalendarScreen';

export default function PeriodCalendarRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <PeriodCalendarScreen
      theme={currentTheme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      BottomNav={null}
      backTarget="sekret"
    />
  );
}
