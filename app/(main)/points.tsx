/**
 * app/(main)/points.tsx
 */
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { PointsScreen } from '@screens/PointsScreen';
import { navigateTo } from '@/utils/navigation';

export default function PointsRoute() {
  const { theme, mood, selectedSekret, moodHistory, entries, circlePosts } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <PointsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      moodHistory={moodHistory}
      journalEntries={entries}
      voiceNotes={[]}
      circlePosts={circlePosts}
      comfortSessions={[]}
      crewCheckIns={[]}
      streakDays={0}
      setScreen={(screen: string) => navigateTo(screen, 'teen')}
      BottomNav={null}
    />
  );
}
