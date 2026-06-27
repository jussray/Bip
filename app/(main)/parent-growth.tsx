import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { Bippin2Screen } from '@screens/Bippin2Screen';
import { parentNavigateTo } from '@/parent/navigation';

export default function ParentGrowthRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <Bippin2Screen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={parentNavigateTo}
      BottomNav={null}
      side="parent"
    />
  );
}
