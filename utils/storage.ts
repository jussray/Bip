import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  theme: 'theme',
  mood: 'mood',
  userSide: 'userSide',
  selectedSekret: 'selectedSekret',
  sekretMode: 'sekretMode',
  growthPath: 'growthPath',
  journalText: 'journalText',
  entries: 'entries',
  moodHistory: 'moodHistory',
  circlePosts: 'circlePosts',
  voiceNotes: 'voiceNotes',
  periodDays: 'periodDays',
  lastPeriodStart: 'lastPeriodStart',
};

export const loadState = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const vals = await AsyncStorage.multiGet(keys);
    const state: Record<string, any> = {};
    vals.forEach(([k, v]) => {
      if (v) {
        state[k] = ['entries', 'moodHistory', 'circlePosts', 'voiceNotes', 'periodDays'].includes(k)
          ? JSON.parse(v)
          : v;
      }
    });
    return state;
  } catch (error) {
    console.error('Error loading state:', error);
    return {};
  }
};

export const saveState = async (stateUpdates: Record<string, any>) => {
  try {
    const pairs: [string, string][] = Object.entries(stateUpdates).map(([k, v]) => [
      k,
      typeof v === 'string' ? v : JSON.stringify(v),
    ]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Error saving state:', error);
  }
};
