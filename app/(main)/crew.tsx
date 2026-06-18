/**
 * app/(main)/crew.tsx
 * Route wrapper for BipCrewScreen.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { BipCrewScreen } from '@screens/BipCrewScreen';
import { THEME_PACKS } from '@constants/theme';
import type { CrewMember, CrewCheckIn } from '@/types';

export default function CrewRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [crewCheckIns, setCrewCheckIns] = useState<CrewCheckIn[]>([]);
  return (
    <BipCrewScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      crewMembers={crewMembers}
      setCrewMembers={setCrewMembers}
      crewCheckIns={crewCheckIns}
      setCrewCheckIns={setCrewCheckIns}
      BottomNav={null}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
