/**
 * app/(main)/crew.tsx
 * Route wrapper for BipCrewScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { BipCrewScreen } from '@/screens/BipCrewScreen';

export default function CrewRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <BipCrewScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="home"
    />
  );
}
