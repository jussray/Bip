import { useState, useEffect } from 'react';
import { loadState, saveState } from '@utils/storage';

export function useSekretState() {
  const [theme, setTheme] = useState('neon');
  const [mood, setMood] = useState('Happy');
  const [userSide, setUserSide] = useState<'teen' | 'parent'>('teen');
  const [selectedSekret, setSelectedSekret] = useState('soft');
  const [growthPath, setGrowthPath] = useState('preferNotToSay');
  const [entries, setEntries] = useState<any[]>([]);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [circlePosts, setCirclePosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted data
  useEffect(() => {
    (async () => {
      const state = await loadState();
      if (state.theme) setTheme(state.theme);
      if (state.mood) setMood(state.mood);
      if (state.userSide) setUserSide(state.userSide);
      if (state.selectedSekret) setSelectedSekret(state.selectedSekret);
      if (state.growthPath) setGrowthPath(state.growthPath);
      if (state.entries) setEntries(state.entries);
      if (state.moodHistory) setMoodHistory(state.moodHistory);
      if (state.circlePosts) setCirclePosts(state.circlePosts);
      setIsLoading(false);
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!isLoading) {
      saveState({
        theme,
        mood,
        userSide,
        selectedSekret,
        growthPath,
        entries,
        moodHistory,
        circlePosts,
      });
    }
  }, [theme, mood, userSide, selectedSekret, growthPath, entries, moodHistory, circlePosts, isLoading]);

  return {
    theme,
    setTheme,
    mood,
    setMood,
    userSide,
    setUserSide,
    selectedSekret,
    setSelectedSekret,
    growthPath,
    setGrowthPath,
    entries,
    setEntries,
    moodHistory,
    setMoodHistory,
    circlePosts,
    setCirclePosts,
    isLoading,
  };
}
