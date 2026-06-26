/**
 * useAppEffects
 * -------------
 * Houses every useEffect that previously lived in AppContent:
 *   1. Load persisted state from AsyncStorage on mount
 *   2. userSide change → splash gate (CTA-only advance — no auto-timer)
 *   3. Supabase anon sign-in + cloud pull & merge
 *   4. Save state to AsyncStorage on change
 *   5. Streak tracking
 *   6. Rotating home message
 */
import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppState } from '../store/useAppStore';
import { loadState, saveState } from '@/utils/storage';
import { isSupabaseConfigured } from '@/utils/supabase';
import {
  ensureAnonymousSession,
  pullAll,
  loadPeriodDays,
  loadOracleSession,
  initTeenActivitySync,
} from '@/utils/sync';
import { mergeById } from '../utils/mergeById';
import { normalizeVibeKey } from '../../constants/theme';
import {
  normalizeOracleProfile,
  normalizeOracleSessions,
} from '../../services/oracleDiscovery';
import { normalizeOracleJournalEntries } from '../../services/voiceBipIntelligence';
import { HOME_MESSAGES } from '../constants/homeMessages';

type SetState = Dispatch<SetStateAction<AppState>>;

export function useAppEffects(state: AppState, setState: SetState) {
  const { isLoading, userSide, lastOpenDate } = state;

  // 1. Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const s = await loadState();
        setState(prev => ({
          ...prev,
          theme:           s.theme ? normalizeVibeKey(s.theme) : prev.theme,
          mood:            s.mood            ?? prev.mood,
          userSide:        s.userSide        ?? prev.userSide,
          selectedSekret:  s.selectedSekret  ?? prev.selectedSekret,
          sekretMode:      s.sekretMode      ?? prev.sekretMode,
          journalText:     s.journalText     ?? prev.journalText,
          journalEntries:  Array.isArray(s.entries)              ? s.entries              : prev.journalEntries,
          parentPagesDraft:   s.parentPagesDraft   ?? prev.parentPagesDraft,
          parentPagesEntries: Array.isArray(s.parentPagesEntries) ? s.parentPagesEntries : prev.parentPagesEntries,
          oracleJournalEntries: s.oracleJournalEntries
            ? normalizeOracleJournalEntries(s.oracleJournalEntries, 'teen')
            : prev.oracleJournalEntries,
          oracleProfile:         s.oracleProfile       ? normalizeOracleProfile(s.oracleProfile, 'teen')     : prev.oracleProfile,
          parentOracleProfile:   s.parentOracleProfile ? normalizeOracleProfile(s.parentOracleProfile, 'parent') : prev.parentOracleProfile,
          oracleSessions:        s.oracleSessions       ? normalizeOracleSessions(s.oracleSessions, 'teen')       : prev.oracleSessions,
          parentOracleSessions:  s.parentOracleSessions ? normalizeOracleSessions(s.parentOracleSessions, 'parent') : prev.parentOracleSessions,
          moodHistory:      Array.isArray(s.moodHistory)       ? s.moodHistory       : prev.moodHistory,
          circlePosts:      Array.isArray(s.circlePosts)       ? s.circlePosts       : prev.circlePosts,
          parentCirclePosts:Array.isArray(s.parentCirclePosts) ? s.parentCirclePosts : prev.parentCirclePosts,
          voiceNotes:       Array.isArray(s.voiceNotes)        ? s.voiceNotes        : prev.voiceNotes,
          parentVoiceNotes: Array.isArray(s.parentVoiceNotes)  ? s.parentVoiceNotes  : prev.parentVoiceNotes,
          comfortSessions:  Array.isArray(s.comfortSessions)   ? s.comfortSessions   : prev.comfortSessions,
          crewMembers:      Array.isArray(s.crewMembers)       ? s.crewMembers       : prev.crewMembers,
          crewCheckIns:     Array.isArray(s.crewCheckIns)      ? s.crewCheckIns      : prev.crewCheckIns,
          periodDays:       Array.isArray(s.periodDays)        ? s.periodDays        : prev.periodDays,
          streakDays:   Number(s.streakDays) || 0,
          lastOpenDate: s.lastOpenDate ?? prev.lastOpenDate,
          roomMemory: s.roomMemory
            ? (typeof s.roomMemory === 'string' ? JSON.parse(s.roomMemory) : s.roomMemory)
            : prev.roomMemory,
          parentRoomStyle:
            s.parentRoomStyle === 'mom' || s.parentRoomStyle === 'dad'
              ? s.parentRoomStyle
              : prev.parentRoomStyle,
          parentMood:     s.parentMood     ?? prev.parentMood,
          parentMoodDate: s.parentMoodDate ?? prev.parentMoodDate,
        }));
      } catch {
        // Storage read failure — continue with defaults
      }
      setState(prev => ({ ...prev, isLoading: false }));
    })();
  }, []);

  // 2. userSide change → show splash gate
  // No auto-advance timer. The SplashScreen CTA (setScreen('home')) is the
  // only way to enter either side. Both teen and parent splashes stay until
  // the user taps.
  useEffect(() => {
    if (isLoading) return;
    setState(prev => ({ ...prev, screen: 'splash' }));
  }, [userSide]); // intentional: only re-run when side changes

  // 3. Supabase: anon sign-in + cloud pull & merge
  useEffect(() => {
    if (!isSupabaseConfigured || isLoading) return;
    let cancelled = false;
    (async () => {
      const uid = await ensureAnonymousSession();
      if (!uid || cancelled) return;

      // Bulk pull (mood, journal, circle, voice, comfort, crew, room)
      const cloud = await pullAll();
      if (!cloud || cancelled) return;
      if (__DEV__)
        console.log('[sync] cloud counts', {
          mood:         cloud.moodHistory.length,
          journal:      cloud.journalEntries.length,
          circle:       cloud.circlePosts.length,
          parentCircle: cloud.parentCirclePosts.length,
          voice:        cloud.voiceNotes.length,
          comfort:      cloud.comfortSessions.length,
          crew:         cloud.crewMembers.length,
          checkIns:     cloud.crewCheckIns.length,
          roomMemory:   cloud.roomMemory ? 'present' : 'null',
        });
      setState(prev => ({
        ...prev,
        moodHistory:       mergeById(prev.moodHistory,       cloud.moodHistory),
        journalEntries:    mergeById(prev.journalEntries,    cloud.journalEntries),
        circlePosts:       mergeById(prev.circlePosts,       cloud.circlePosts),
        parentCirclePosts: mergeById(prev.parentCirclePosts, cloud.parentCirclePosts),
        voiceNotes:        mergeById(prev.voiceNotes,        cloud.voiceNotes),
        comfortSessions:   mergeById(prev.comfortSessions,   cloud.comfortSessions),
        crewMembers:       mergeById(prev.crewMembers,       cloud.crewMembers),
        crewCheckIns:      mergeById(prev.crewCheckIns,      cloud.crewCheckIns),
        roomMemory: cloud.roomMemory
          ? { ...prev.roomMemory, ...cloud.roomMemory }
          : prev.roomMemory,
      }));

      // Period days — additive merge (union of local + cloud sets)
      if (!cancelled) {
        const cloudDays = await loadPeriodDays();
        if (cloudDays.length > 0) {
          setState(prev => ({
            ...prev,
            periodDays: Array.from(new Set([...prev.periodDays, ...cloudDays])).sort(),
          }));
        }
      }

      // Oracle sessions — cloud wins for the memory snapshot (richer context)
      if (!cancelled) {
        const [teenOracle, parentOracle] = await Promise.all([
          loadOracleSession('teen'),
          loadOracleSession('parent'),
        ]);
        if (teenOracle || parentOracle) {
          setState(prev => ({
            ...prev,
            ...(teenOracle   ? { oracleProfile:       { ...prev.oracleProfile,       ...teenOracle.memory   } } : {}),
            ...(parentOracle ? { parentOracleProfile: { ...prev.parentOracleProfile, ...parentOracle.memory } } : {}),
          }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isLoading]); // intentional: only re-run when loading state changes

  // 3b. Teen activity summary: keep parent-facing snapshot fresh.
  // Runs only for teen-side users and writes only aggregated streak/session/tier data.
  useEffect(() => {
    if (!isSupabaseConfigured || isLoading || userSide !== 'teen') return;
    return initTeenActivitySync();
  }, [isLoading, userSide]);

  // 4. Persist state on change
  useEffect(() => {
    if (isLoading) return;
    saveState({
      theme:              state.theme,
      mood:               state.mood,
      userSide:           state.userSide,
      selectedSekret:     state.selectedSekret,
      sekretMode:         state.sekretMode,
      journalText:        state.journalText,
      entries:            state.journalEntries,
      oracleJournalEntries: state.oracleJournalEntries,
      parentPagesDraft:   state.parentPagesDraft,
      parentPagesEntries: state.parentPagesEntries,
      oracleProfile:      state.oracleProfile,
      parentOracleProfile: state.parentOracleProfile,
      oracleSessions:     state.oracleSessions,
      parentOracleSessions: state.parentOracleSessions,
      moodHistory:        state.moodHistory,
      circlePosts:        state.circlePosts,
      parentCirclePosts:  state.parentCirclePosts,
      voiceNotes:         state.voiceNotes,
      parentVoiceNotes:   state.parentVoiceNotes,
      comfortSessions:    state.comfortSessions,
      crewMembers:        state.crewMembers,
      crewCheckIns:       state.crewCheckIns,
      periodDays:         state.periodDays,
      streakDays:         String(state.streakDays),
      lastOpenDate:       state.lastOpenDate,
      roomMemory:         JSON.stringify(state.roomMemory),
      parentRoomStyle:    state.parentRoomStyle,
      parentMood:         state.parentMood,
      parentMoodDate:     state.parentMoodDate,
    }).catch(() => {});
  }, [
    state.theme, state.mood, state.userSide, state.selectedSekret, state.sekretMode,
    state.journalText, state.journalEntries, state.oracleJournalEntries,
    state.parentPagesDraft, state.parentPagesEntries,
    state.oracleProfile, state.parentOracleProfile,
    state.oracleSessions, state.parentOracleSessions,
    state.moodHistory, state.circlePosts, state.parentCirclePosts,
    state.voiceNotes, state.parentVoiceNotes, state.comfortSessions,
    state.crewMembers, state.crewCheckIns,
    state.periodDays,
    state.streakDays, state.lastOpenDate,
    state.roomMemory, state.parentRoomStyle,
    state.parentMood, state.parentMoodDate, isLoading,
  ]);

  // 5. Streak tracking
  useEffect(() => {
    if (isLoading) return;
    const today = new Date().toLocaleDateString();
    if (lastOpenDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastOpenDate === yesterday.toLocaleDateString();
      setState(prev => {
        const nextDays = wasYesterday ? prev.streakDays + 1 : 1;
        return {
          ...prev,
          streakDays:      nextDays,
          streakJustReset: !wasYesterday && prev.streakDays > 1,
          lastOpenDate:    today,
        };
      });
    }
  }, [isLoading, lastOpenDate]); // intentional: streak depends only on these two values

  // 6. Rotating home message
  useEffect(() => {
    const id = setInterval(
      () => setState(prev => ({ ...prev, homeMessageIndex: (prev.homeMessageIndex + 1) % HOME_MESSAGES.length })),
      5000
    );
    return () => clearInterval(id);
  }, []);
}
