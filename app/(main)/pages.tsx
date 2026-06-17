/**
 * app/(main)/pages.tsx
 *
 * Pages / Journal tab.
 */
import React from 'react';
import { JournalScreen } from '@screens/JournalScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';

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
      setScreen={navigateTo}
      userSide={userSide}
      saveEntry={saveEntry}
    />
  );
}
