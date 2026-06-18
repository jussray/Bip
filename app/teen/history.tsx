import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS } from '@constants/theme';
import { HistoryScreen } from '@screens/HistoryScreen';

export default function TeenHistoryRoute() {
  const { theme, mood, selectedSekret, moodHistory, entries, circlePosts } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <HistoryScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      moodHistory={moodHistory}
      journalEntries={entries}
      voiceNotes={[]}
      circlePosts={circlePosts}
      streakDays={0}
      setScreen={teenNavigateTo}
      BottomNav={null}
    />
  );
}
