/**
 * app/(main)/period-calendar.tsx
 * Route wrapper for PeriodCalendarScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { PeriodCalendarScreen } from '@/screens/PeriodCalendarScreen';

export default function PeriodCalendarRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <PeriodCalendarScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="sekret"
    />
  );
}
