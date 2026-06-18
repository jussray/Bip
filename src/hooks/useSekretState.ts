/**
 * src/hooks/useSekretState.ts
 *
 * PHASE 5 FIX: Added all parent state fields + persistence.
 * setUserSide is now exposed so app/index.tsx can call it on splash.
 */
import { useState, useEffect } from 'react';
import { loadState, saveState } from '@/utils';

export function useSekretState() {
  const [theme, setTheme]                   = useState('neon');
  const [mood, setMood]                     = useState('Happy');
  const [userSide, setUserSide]             = useState<'teen' | 'parent' | null>(null);
  const [selectedSekret, setSelectedSekret] = useState('soft');
  const [growthPath, setGrowthPath]         = useState('preferNotToSay');
  const [entries, setEntries]               = useState<any[]>([]);
  const [moodHistory, setMoodHistory]       = useState<any[]>([]);
  const [circlePosts, setCirclePosts]       = useState<any[]>([]);
  const [isLoading, setIsLoading]           = useState(true);

  // ── Parent state ──────────────────────────────────────────────
  const [parentMood, setParentMood]                     = useState('Calm');
  const [parentMoodDate, setParentMoodDate]             = useState('');
  const [parentRoomStyle, setParentRoomStyle]           = useState('forest');
  const [parentPagesDraft, setParentPagesDraft]         = useState('');
  const [parentPagesEntries, setParentPagesEntries]     = useState<any[]>([]);
  const [parentCirclePosts, setParentCirclePosts]       = useState<any[]>([]);
  const [parentCirclePostText, setParentCirclePostText] = useState('');
  const [parentVoiceNotes, setParentVoiceNotes]         = useState<any[]>([]);
  const [parentOracleProfile, setParentOracleProfile]   = useState<any>(null);
  const [parentOracleSessions, setParentOracleSessions] = useState<any[]>([]);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      const state = await loadState();
      if (state.theme)                setTheme(state.theme);
      if (state.mood)                 setMood(state.mood);
      if (state.userSide)             setUserSide(state.userSide);
      if (state.selectedSekret)       setSelectedSekret(state.selectedSekret);
      if (state.growthPath)           setGrowthPath(state.growthPath);
      if (state.entries)              setEntries(state.entries);
      if (state.moodHistory)          setMoodHistory(state.moodHistory);
      if (state.circlePosts)          setCirclePosts(state.circlePosts);
      // parent
      if (state.parentMood)             setParentMood(state.parentMood);
      if (state.parentMoodDate)         setParentMoodDate(state.parentMoodDate);
      if (state.parentRoomStyle)        setParentRoomStyle(state.parentRoomStyle);
      if (state.parentPagesDraft)       setParentPagesDraft(state.parentPagesDraft);
      if (state.parentPagesEntries)     setParentPagesEntries(state.parentPagesEntries);
      if (state.parentCirclePosts)      setParentCirclePosts(state.parentCirclePosts);
      if (state.parentCirclePostText)   setParentCirclePostText(state.parentCirclePostText);
      if (state.parentVoiceNotes)       setParentVoiceNotes(state.parentVoiceNotes);
      if (state.parentOracleProfile)    setParentOracleProfile(state.parentOracleProfile);
      if (state.parentOracleSessions)   setParentOracleSessions(state.parentOracleSessions);
      setIsLoading(false);
    })();
  }, []);

  // Persist whenever state changes
  useEffect(() => {
    if (!isLoading) {
      saveState({
        theme, mood, userSide, selectedSekret,
        growthPath, entries, moodHistory, circlePosts,
        parentMood, parentMoodDate, parentRoomStyle,
        parentPagesDraft, parentPagesEntries,
        parentCirclePosts, parentCirclePostText,
        parentVoiceNotes, parentOracleProfile, parentOracleSessions,
      });
    }
  }, [
    theme, mood, userSide, selectedSekret,
    growthPath, entries, moodHistory, circlePosts,
    parentMood, parentMoodDate, parentRoomStyle,
    parentPagesDraft, parentPagesEntries,
    parentCirclePosts, parentCirclePostText,
    parentVoiceNotes, parentOracleProfile, parentOracleSessions,
    isLoading,
  ]);

  return {
    theme, setTheme,
    mood, setMood,
    userSide, setUserSide,
    selectedSekret, setSelectedSekret,
    growthPath, setGrowthPath,
    entries, setEntries,
    moodHistory, setMoodHistory,
    circlePosts, setCirclePosts,
    // parent
    parentMood, setParentMood,
    parentMoodDate, setParentMoodDate,
    parentRoomStyle, setParentRoomStyle,
    parentPagesDraft, setParentPagesDraft,
    parentPagesEntries, setParentPagesEntries,
    parentCirclePosts, setParentCirclePosts,
    parentCirclePostText, setParentCirclePostText,
    parentVoiceNotes, setParentVoiceNotes,
    parentOracleProfile, setParentOracleProfile,
    parentOracleSessions, setParentOracleSessions,
    isLoading,
  };
}
