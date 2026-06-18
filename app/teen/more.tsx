import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { MoreScreen } from '@screens/MoreScreen';

export default function TeenMoreRoute() {
  const { theme, mood, selectedSekret, userSide, setUserSide } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <MoreScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      userSide={userSide ?? 'teen'}
      setUserSide={(side: string) => setUserSide(side === 'parent' ? 'parent' : 'teen')}
      setScreen={(screen: string) => router.push(`/teen/${screen}` as any)}
      BottomNav={null}
    />
  );
}
