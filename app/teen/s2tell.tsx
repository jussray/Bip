import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS } from '@constants/theme';
import { S2TellScreen } from '@screens/S2TellScreen';

export default function TeenS2TellRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <S2TellScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={teenNavigateTo}
      BottomNav={null}
    />
  );
}
