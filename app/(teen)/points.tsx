import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { PointsScreen } from '@screens/PointsScreen';
import { navigateTo } from '@/utils/navigation';

export default function PointsRoute() {
  const {
    theme, mood, selectedSekret,
    moodHistory, entries, voiceNotes, circlePosts, crewCheckIns,
  } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <PointsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      moodHistory={moodHistory}
      journalEntries={entries}
      voiceNotes={voiceNotes}
      circlePosts={circlePosts}
      comfortSessions={[]}
      crewCheckIns={crewCheckIns}
      streakDays={0}
      setScreen={(screen: string) => navigateTo(screen, 'teen')}
      BottomNav={null}
    />
  );
}
