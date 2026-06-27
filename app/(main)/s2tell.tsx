/**
 * app/(main)/s2tell.tsx
 */
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { S2TellScreen } from '@screens/S2TellScreen';
import { navigateTo } from '@/utils/navigation';

export default function S2TellRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <S2TellScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => navigateTo(screen, 'teen')}
      BottomNav={null}
    />
  );
}
