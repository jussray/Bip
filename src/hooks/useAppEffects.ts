import { useEffect } from 'react';
import { saveState } from '../utils/storage';
import { isSupabaseConfigured } from '../utils/supabase';
import {
  ensureAnonymousSession, pullAll,
} from '../utils/sync';
import type { useAppState } from './useAppState';

type AppStateSlice = ReturnType<typeof useAppState>;

/** Merge helper: cloud rows win on id collision; local-only rows are appended. */
function mergeById<T extends { id: number | string }>(local: T[], remote: T[]): T[] {
  const remoteIds = new Set(remote.map(r => r.id));
  return [...remote, ...local.filter(l => !remoteIds.has(l.id))];
}

export function useAppEffects(s: AppStateSlice, withSyncWrap: (fn: () => Promise<void>) => void) {
  // ── userSide change → splash → home ──────────────────────────────────────
  useEffect(() => {
    if (s.isLoading) return;
    s.setScreen('splash');
    const timer = setTimeout(() => s.setScreen('home'), 1200);
    return () => clearTimeout(timer);
  }, [s.userSide]);

  // ── Supabase pull on load ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || s.isLoading) return;
    let cancelled = false;
    (async () => {
      const uid = await ensureAnonymousSession();
      if (!uid || cancelled) return;
      const cloud = await pullAll();
      if (!cloud || cancelled) return;

      if (__DEV__) console.log('[sync] cloud counts', {
        mood: cloud.moodHistory.length, journal: cloud.journalEntries.length,
      });

      s.setMoodHistory(prev       => mergeById(prev, cloud.moodHistory));
      s.setJournalEntries(prev    => mergeById(prev, cloud.journalEntries));
      s.setCirclePosts(prev       => mergeById(prev, cloud.circlePosts));
      s.setParentCirclePosts(prev => mergeById(prev, cloud.parentCirclePosts));
      s.setVoiceNotes(prev        => mergeById(prev, cloud.voiceNotes));
      s.setComfortSessions(prev   => mergeById(prev, cloud.comfortSessions));
      s.setCrewMembers(prev       => mergeById(prev, cloud.crewMembers));
      s.setCrewCheckIns(prev      => mergeById(prev, cloud.crewCheckIns));
      if (cloud.roomMemory) {
        s.setRoomMemory(prev => ({ ...prev, ...cloud.roomMemory! }));
      }
    })();
    return () => { cancelled = true; };
  }, [s.isLoading]);

  // ── Persist to AsyncStorage on any state change ───────────────────────────
  useEffect(() => {
    if (s.isLoading) return;
    saveState({
      theme: s.theme, mood: s.mood, userSide: s.userSide,
      selectedSekret: s.selectedSekret, sekretMode: s.sekretMode,
      journalText: s.journalText,
      entries: s.journalEntries,
      oracleJournalEntries: s.oracleJournalEntries,
      parentPagesDraft: s.parentPagesDraft,
      parentPagesEntries: s.parentPagesEntries,
      oracleProfile: s.oracleProfile,
      parentOracleProfile: s.parentOracleProfile,
      oracleSessions: s.oracleSessions,
      parentOracleSessions: s.parentOracleSessions,
      moodHistory: s.moodHistory,
      circlePosts: s.circlePosts,
      parentCirclePosts: s.parentCirclePosts,
      voiceNotes: s.voiceNotes,
      parentVoiceNotes: s.parentVoiceNotes,
      comfortSessions: s.comfortSessions,
      crewMembers: s.crewMembers,
      crewCheckIns: s.crewCheckIns,
      streakDays: String(s.streakDays),
      lastOpenDate: s.lastOpenDate,
      roomMemory: JSON.stringify(s.roomMemory),
      parentRoomStyle: s.parentRoomStyle,
      parentMood: s.parentMood,
      parentMoodDate: s.parentMoodDate,
    }).catch(() => {});
  }, [
    s.theme, s.mood, s.userSide, s.selectedSekret, s.sekretMode,
    s.journalText, s.journalEntries, s.oracleJournalEntries,
    s.parentPagesDraft, s.parentPagesEntries, s.oracleProfile, s.parentOracleProfile,
    s.oracleSessions, s.parentOracleSessions, s.moodHistory,
    s.circlePosts, s.parentCirclePosts, s.voiceNotes, s.parentVoiceNotes,
    s.comfortSessions, s.crewMembers, s.crewCheckIns, s.streakDays,
    s.lastOpenDate, s.roomMemory, s.parentRoomStyle, s.parentMood, s.parentMoodDate,
    s.isLoading,
  ]);

  // ── Streak tracking (daily open) ──────────────────────────────────────────
  useEffect(() => {
    if (s.isLoading) return;
    const today = new Date().toLocaleDateString();
    if (s.lastOpenDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = s.lastOpenDate === yesterday.toLocaleDateString();
      s.setStreakDays(prev => {
        if (wasYesterday) return prev + 1;
        s.setStreakJustReset(prev > 1);
        return 1;
      });
      s.setLastOpenDate(today);
    }
  }, [s.isLoading, s.lastOpenDate]);

  // ── Rotating home message ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(
      () => s.setHomeMessageIndex(p => (p + 1) % 7),
      5000
    );
    return () => clearInterval(interval);
  }, []);
}
