/**
 * app/(main)/pages.tsx
 *
 * Pages / Journal tab route — bridges Expo Router to PagesScreen.
 *
 * PagesScreen (PagesScreenProps) requires:
 *   journalText          — current draft string
 *   setJournalText       — draft setter
 *   journalEntries       — saved JournalEntry[]
 *   saveJournalEntry     — commit the current draft
 *   mood                 — current mood string
 *   t                    — full theme object
 *   setScreen            — legacy navigation shim
 *   BottomNav            — null (Expo Router owns tab bar)
 *   moodHistory?         — optional mood history array
 *   voiceNotes?          — optional voice notes array
 *   streakDays?          — optional streak count
 *   selectedSekret?      — optional personality key
 *   onCompleteOracleSession — required callback
 *   onSekretReply?       — optional sekret reply callback
 *   syncStatus?          — optional sync badge status
 *
 * Previously this route passed only entries/setEntries which are from
 * the old SharedPagesProps interface, not PagesScreenProps — the mismatch
 * caused a runtime crash on the Pages tab.
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
  } = useAppContext();

  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  // Stub — Oracle session persistence will be wired in a later sprint.
  function handleCompleteOracleSession(
    _profile: OracleProfile,
    _session: OracleSessionSummary,
  ) {}

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
      />
    </View>
  );
}
