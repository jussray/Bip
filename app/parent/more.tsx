import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { parentNavigateTo } from '@/parent/navigation';
import { THEME_PACKS } from '@constants/theme';
import { MoreScreen } from '@screens/MoreScreen';

export default function ParentMoreRoute() {
  const { theme, mood, selectedSekret, userSide, setUserSide } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <MoreScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      userSide={userSide ?? 'parent'}
      setUserSide={(side: string) => setUserSide(side === 'parent' ? 'parent' : 'teen')}
      setScreen={parentNavigateTo}
      BottomNav={null}
    />
  );
}
