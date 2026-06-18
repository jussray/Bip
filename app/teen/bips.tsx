import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { PagesScreen } from '@screens/PagesScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import type { OracleProfile, OracleSessionSummary } from '@/services/oracleDiscovery';
import type { PersonalityId } from '@/types';

export default function TeenBipsRoute() {
  const {
    theme, mood, journalText, setJournalText, entries, saveEntry,
    moodHistory, selectedSekret, patchJournalEntry,
  } = useAppContext();

  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  function handleCompleteOracleSession(_p: OracleProfile, _s: OracleSessionSummary) {}

  function handleSekretReply(entryId: number, reply: string) {
    patchJournalEntry?.(entryId, { sekretReply: reply });
  }

  function handleSetScreen(screen: string) {
    const map: Record<string, string> = {
      voiceBip:       '/teen/voicebip',
      cloud:          '/teen/cloud',
      s2tell:         '/teen/bridge?compose=true',
      periodCalendar: '/teen/period-calendar',
      history:        '/teen/history',
      sekret:         '/teen/sekret',
    };
    const target = map[screen];
    if (target) router.push(target as any);
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
        setScreen={handleSetScreen}
        BottomNav={null}
        moodHistory={moodHistory}
        selectedSekret={selectedSekret}
        onCompleteOracleSession={handleCompleteOracleSession}
        onSekretReply={handleSekretReply}
        onOpenCompanion={(id: PersonalityId) => router.push(`/teen/chat/${id}` as any)}
        onOpenVoiceBip={() => router.push('/teen/voicebip')}
        onOpenCloudThoughts={() => router.push('/teen/cloud')}
        onOpenS2Tell={() => router.push('/teen/bridge?compose=true' as any)}
        onOpenPeriodCalendar={() => router.push('/teen/period-calendar')}
        onOpenHistory={() => router.push('/teen/history')}
      />
    </View>
  );
}
