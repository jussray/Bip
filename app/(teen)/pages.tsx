import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { PagesScreen } from '@screens/PagesScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';
import type { OracleProfile, OracleSessionSummary } from '@/services/oracleDiscovery';
import type { PersonalityId } from '@/types';

export default function TeenPagesRoute() {
  const { theme, mood, journalText, setJournalText, entries, saveEntry, moodHistory, selectedSekret, patchJournalEntry } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  function handleCompleteOracleSession(_profile: OracleProfile, _session: OracleSessionSummary) {}
  function handleSekretReply(entryId: number, reply: string) {
    patchJournalEntry?.(entryId, { sekretReply: reply });
  }
  function push(screen: string) {
    router.push(routeForSide('teen', screen) as any);
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
        setScreen={push}
        BottomNav={null}
        moodHistory={moodHistory}
        selectedSekret={selectedSekret}
        onCompleteOracleSession={handleCompleteOracleSession}
        onSekretReply={handleSekretReply}
        onOpenCompanion={(personalityId: PersonalityId) => router.push(`/(teen)/chat/${personalityId}` as any)}
        onOpenVoiceBip={() => push('voiceBip')}
        onOpenCloudThoughts={() => push('cloudThoughts')}
        onOpenS2Tell={() => push('s2tell')}
        onOpenPeriodCalendar={() => push('periodCalendar')}
        onOpenHistory={() => push('history')}
      />
    </View>
  );
}
