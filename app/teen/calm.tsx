import React from 'react';
import { CalmScreen } from '@screens/CalmScreen';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS } from '@constants/theme';

export default function TeenCalmRoute() {
  const { theme, mood, setMood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <CalmScreen
      t={t}
      mood={mood}
      setMood={setMood}
      setScreen={teenNavigateTo}
      BottomNav={null}
      selectedSekret={selectedSekret}
    />
  );
}
