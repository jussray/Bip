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
 *   router.push('/(teen)/chat/[personalityId]') fires when a companion is tapped.
 *
 * S2TELL → BRIDGE:
 *   S2Tell is the compose action for Bridge (teen → parent channel).
 *   Tapping S2Tell in Pages opens Bridge in compose mode (?compose=true)
 *   so the two feel like one continuous gesture.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { PagesScreen } from '@screens/PagesScreen';
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
    completeTeenOracleSession,
  } = useAppContext();

  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  function handleCompleteOracleSession(
    profile: OracleProfile,
    session: OracleSessionSummary,
  ) {
    completeTeenOracleSession(profile, session);
  }

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
   *
   * PHASE 5 SAFETY: onOpenCompanion MUST remain wired.
   * Removing it makes Se'kret Replies unreachable → Phase 5 fails.
   */
  function handleOpenCompanion(personalityId: PersonalityId) {
    router.push(`/(teen)/chat/${personalityId}` as any);
  }

  function handleOpenVoiceBip() {
    router.push('/(teen)/voicebip' as any);
  }

  function handleOpenCloudThoughts() {
    router.push('/(teen)/cloud' as any);
  }

  /**
   * S2Tell = the act of sending something to a parent via Bridge.
   * Opens Bridge in compose mode so the teen lands directly at
   * the write area — S2Tell and Bridge are one continuous gesture.
   */
  function handleOpenS2Tell() {
    router.push('/(teen)/bridge?compose=true' as any);
  }

  function handleOpenPeriodCalendar() {
    router.push('/(teen)/period-calendar' as any);
  }

  function handleOpenHistory() {
    router.push('/(teen)/history' as any);
  }

  function handleSetScreen(screen: string) {
    // Legacy setScreen bridge — map old screen names to router paths.
    const routeMap: Record<string, string> = {
      voiceBip:       '/(teen)/voicebip',
      cloud:          '/(teen)/cloud',
      // s2tell → bridge compose mode (S2Tell IS the bridge compose action)
      s2tell:         '/(teen)/bridge?compose=true',
      periodCalendar: '/(teen)/period-calendar',
      history:        '/(teen)/history',
      sekret:         '/(teen)/sekret',
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
