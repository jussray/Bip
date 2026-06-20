/**
 * src/utils/storage.ts
 *
 * Canonical location (moved from utils/storage.ts in Step 3).
 * AsyncStorage persistence layer for all app state.
 *
 * Import via: import { loadState, saveState } from '@/utils';
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  // ── Plain strings ──────────────────────────────────────────────────────────
  theme: 'theme', mood: 'mood', userSide: 'userSide',
  selectedSekret: 'selectedSekret', sekretMode: 'sekretMode',
  growthPath: 'growthPath', journalText: 'journalText',
  parentPagesDraft: 'parentPagesDraft', lastOpenDate: 'lastOpenDate',
  parentMood: 'parentMood', parentMoodDate: 'parentMoodDate',
  parentRoomStyle: 'parentRoomStyle', streakDays: 'streakDays',
  periodDays: 'periodDays', lastPeriodStart: 'lastPeriodStart',
  // ── JSON-serialised objects / arrays ──────────────────────────────────────
  entries: 'entries', moodHistory: 'moodHistory',
  circlePosts: 'circlePosts', parentCirclePosts: 'parentCirclePosts',
  voiceNotes: 'voiceNotes', parentVoiceNotes: 'parentVoiceNotes',
  parentPagesEntries: 'parentPagesEntries',
  oracleJournalEntries: 'oracleJournalEntries',
  oracleProfile: 'oracleProfile', parentOracleProfile: 'parentOracleProfile',
  oracleSessions: 'oracleSessions', parentOracleSessions: 'parentOracleSessions',
  comfortSessions: 'comfortSessions',
  crewMembers: 'crewMembers', crewCheckIns: 'crewCheckIns',
  parentCrewMembers: 'parentCrewMembers', parentCrewCheckIns: 'parentCrewCheckIns',
  roomMemory: 'roomMemory',
};

const JSON_KEYS = new Set([
  'entries', 'moodHistory', 'circlePosts', 'parentCirclePosts',
  'voiceNotes', 'parentVoiceNotes', 'parentPagesEntries',
  'oracleJournalEntries', 'oracleProfile', 'parentOracleProfile',
  'oracleSessions', 'parentOracleSessions',
  'comfortSessions', 'crewMembers', 'crewCheckIns',
  'parentCrewMembers', 'parentCrewCheckIns',
  'roomMemory', 'periodDays',
]);

export const loadState = async (): Promise<Record<string, any>> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const vals = await AsyncStorage.multiGet(keys);
    const state: Record<string, any> = {};
    vals.forEach(([k, v]) => {
      if (v) {
        try {
          state[k] = JSON_KEYS.has(k) ? JSON.parse(v) : v;
        } catch {
          state[k] = v;
        }
      }
    });
    return state;
  } catch (error) {
    console.error('loadState error:', error);
    return {};
  }
};

export const saveState = async (stateUpdates: Record<string, any>): Promise<void> => {
  try {
    const pairs: [string, string][] = Object.entries(stateUpdates).map(([k, v]) => [
      k,
      typeof v === 'string' ? v : JSON.stringify(v),
    ]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('saveState error:', error);
  }
};
