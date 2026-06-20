import React from 'react';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { MindBodyResetScreen } from '@screens/MindBodyResetScreen';
import { routeForSide } from '@/shared/routes';

export default function MindBodyResetRoute() {
  const { mode } = useLocalSearchParams<{ mode: 'mindReset' | 'bodyReset' }>();
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <MindBodyResetScreen
      screen={mode ?? 'mindReset'}
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(routeForSide('teen', screen) as any)}
      BottomNav={null}
    />
  );
}
