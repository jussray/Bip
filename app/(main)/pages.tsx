/**
 * app/(main)/pages.tsx
 *
 * Pages / Journal tab route — bridges Expo Router to PagesScreen.
 */
import React from 'react';
import { View } from 'react-native';
import PagesScreen from '@/screens/PagesScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { THEME_PACKS } from '@/constants/theme';
import type { OracleProfile, OracleSessionSummary } from '@/services/oracleDiscovery';

export default function PagesTab() {
  const {
    theme,
    mood,
    journalText,
    setJournalText,
    entries,
    saveEntry,
    moodHistory,
    selectedSekret,
    patchJournalEntry,
  } = useAppContext();

  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  // Stub — Oracle session persistence will be wired in a later sprint.
  function handleCompleteOracleSession(
    _profile: OracleProfile,
    _session: OracleSessionSummary,
  ) {}

  /**
   * Called by PagesWorkspace after the Worker reply arrives.
   * Patches the persisted JournalEntry so the reply survives app restarts.
   */
  function handleSekretReply(entryId: number, reply: string) {
    patchJournalEntry?.(entryId, { sekretReply: reply });
  }

  return (
    <View style={{ flex: 1 }}>
      <PagesScreen
        journalText={journalText}
        setJournalText={setJournalText}
        journalEntries={entries}
        saveJournalEntry={saveEntry}
        mood={mood}
        t={t}
        setScreen={navigateTo}
        BottomNav={null}
        moodHistory={moodHistory}
        selectedSekret={selectedSekret}
        onCompleteOracleSession={handleCompleteOracleSession}
        onSekretReply={handleSekretReply}
      />
    </View>
  );
}
