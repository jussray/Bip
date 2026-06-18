import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS } from '@constants/theme';
import { CloudThoughtsScreen } from '@screens/CloudThoughtsScreen';

export default function TeenCloudRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <CloudThoughtsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      BottomNav={null}
      setScreen={teenNavigateTo}
    />
  );
}
