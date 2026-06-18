/**
 * app/(main)/pages.tsx
 *
 * Pages tab — the notebook/scrapbook home for:
 *   Write · Voice Bips · Se'kret Replies · Memories
 *   Cloud Thoughts · S2Tell · Period Calendar · History
 *
 * PHASE 5 SAFETY:
 *   Se'kret companion interaction is NOT removed.
 *   It lives under the "Se'kret Replies" section of PagesScreen.
 *   router.push('/(main)/chat/[id]') fires when a companion is tapped.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import PagesScreen from '@/screens/PagesScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants/theme';
import type { OracleProfile, OracleSessionSummary } from '@/services/oracleDiscovery';
import type { PersonalityId } from '@/types';

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

  // Stub — Oracle session persistence wired in a later sprint.
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

  /**
   * Navigation helpers threaded into PagesScreen so sub-sections can
   * push to the correct route without importing router directly.
   */
  function handleOpenCompanion(personalityId: PersonalityId) {
    router.push(`/(main)/chat/${personalityId}`);
  }

  function handleOpenVoiceBip() {
    router.push('/(main)/voicebip');
  }

  function handleOpenCloudThoughts() {
    router.push('/(main)/cloud');
  }

  function handleOpenS2Tell() {
    router.push('/(main)/s2tell');
  }

  function handleOpenPeriodCalendar() {
    router.push('/(main)/period-calendar');
  }

  function handleOpenHistory() {
    router.push('/(main)/history');
  }

  function handleSetScreen(screen: string) {
    // Legacy setScreen bridge — map old screen names to router paths.
    const routeMap: Record<string, string> = {
      voiceBip: '/(main)/voicebip',
      cloud: '/(main)/cloud',
      s2tell: '/(main)/s2tell',
      periodCalendar: '/(main)/period-calendar',
      history: '/(main)/history',
      sekret: '/(main)/sekret',
    };
    const target = routeMap[screen];
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
        onOpenCompanion={handleOpenCompanion}
        onOpenVoiceBip={handleOpenVoiceBip}
        onOpenCloudThoughts={handleOpenCloudThoughts}
        onOpenS2Tell={handleOpenS2Tell}
        onOpenPeriodCalendar={handleOpenPeriodCalendar}
        onOpenHistory={handleOpenHistory}
      />
    </View>
  );
}
