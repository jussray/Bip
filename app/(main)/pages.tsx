/**
 * app/(main)/pages.tsx
 *
 * Pages / Journal tab.
 */
import React from 'react';
import { router } from 'expo-router';
import { JournalScreen } from '@screens/JournalScreen';
import { useAppContext } from '@/context/AppContext';

const SCREEN_MAP: Record<string, string> = {
  home:   '/(main)/home',
  pages:  '/(main)/pages',
  calm:   '/(main)/calm',
  sekret: '/(main)/sekret',
  circle: '/(main)/circle',
};

function setScreen(screen: string) {
  router.push((SCREEN_MAP[screen] ?? '/(main)/home') as any);
}

export default function PagesTab() {
  const {
    theme,
    selectedSekret,
    journalText,
    setJournalText,
    entries,
    mood,
    userSide,
    saveEntry,
  } = useAppContext();

  return (
    <JournalScreen
      theme={theme}
      selectedSekret={selectedSekret}
      journalText={journalText}
      setJournalText={setJournalText}
      entries={entries}
      mood={mood}
      setScreen={setScreen}
      userSide={userSide}
      saveEntry={saveEntry}
    />
  );
}
