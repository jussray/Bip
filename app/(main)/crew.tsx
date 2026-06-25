/**
 * app/(main)/crew.tsx
 * Route wrapper for BipCrewScreen — wires crew data to Supabase.
 *
 * Mount flow:
 *   1. Screen renders immediately with empty local state.
 *   2. loadCrewMembers() + loadCrewCheckIns() run in parallel.
 *   3. State is populated from Supabase; screen re-renders with real data.
 *
 * Write path (add/remove member, log check-in) is handled inside
 * BipCrewScreen itself via syncCrewMember / deleteCrewMember / syncCrewCheckIn.
 */
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { BipCrewScreen } from '@screens/BipCrewScreen';
import { THEME_PACKS } from '@constants/theme';
import { loadCrewMembers, loadCrewCheckIns } from '@/utils/sync';
import type { CrewMember, CrewCheckIn } from '@/types';

export default function CrewRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  const [crewMembers,  setCrewMembers]  = useState<CrewMember[]>([]);
  const [crewCheckIns, setCrewCheckIns] = useState<CrewCheckIn[]>([]);

  useEffect(() => {
    void Promise.all([loadCrewMembers(), loadCrewCheckIns()]).then(([members, checkIns]) => {
      if (members.length)   setCrewMembers(members);
      if (checkIns.length)  setCrewCheckIns(checkIns);
    });
  }, []);

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
