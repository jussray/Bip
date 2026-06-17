/**
 * src/context/AppContext.tsx
 *
 * Global app context — replaces prop drilling of theme, mood,
 * userSide, breatheAnim, journal state, and mood history that
 * previously threaded through app/index.tsx → every screen.
 *
 * Usage:
 *   const { theme, mood, selectMood } = useAppContext();
 *
 * Provider is mounted in app/_layout.tsx so all routes have access.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Animated } from 'react-native';
import { useSekretState } from '@hooks/useSekretState';
import { HOME_MESSAGES } from '@constants/theme';

// ── Types ──────────────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number;
  text: string;
  mood: string;
  date: string;
  time: string;
}

interface MoodHistoryEntry {
  id: number;
  mood: string;
  date: string;
  time: string;
}

interface AppContextValue {
  // Theme + identity
  theme: string;
  userSide: 'teen' | 'parent';
  selectedSekret: string;

  // Mood
  mood: string;
  setMood: (mood: string) => void;
  selectMood: (mood: string) => void;   // setMood + append to moodHistory
  moodHistory: MoodHistoryEntry[];

  // Journal
  journalText: string;
  setJournalText: (text: string) => void;
  entries: JournalEntry[];
  saveEntry: () => void;

  // UI state
  homeMessageIndex: number;
  breatheAnim: Animated.Value;

  // Misc
  isLoading: boolean;
}

// ── Context ────────────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // Journal local state
  const [journalText, setJournalText] = useState('');
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);

  // breatheAnim lives here so it persists across tab navigation
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const {
    theme,
    mood,
    setMood,
    userSide,
    selectedSekret,
    entries,
    setEntries,
    moodHistory,
    setMoodHistory,
    isLoading,
  } = useSekretState();

  // Breathe animation — runs once for the entire app lifetime
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1.0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Rotate home messages every 5 s
  useEffect(() => {
    const id = setInterval(
      () => setHomeMessageIndex((p) => (p + 1) % HOME_MESSAGES.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  function selectMood(m: string) {
    setMood(m);
    setMoodHistory((h: MoodHistoryEntry[]) => [
      {
        id: Date.now(),
        mood: m,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      ...h,
    ]);
  }

  function saveEntry() {
    if (!journalText.trim()) return;
    setEntries((e: JournalEntry[]) => [
      {
        id: Date.now(),
        text: journalText,
        mood,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      ...e,
    ]);
    setJournalText('');
  }

  const value: AppContextValue = {
    theme,
    userSide,
    selectedSekret,
    mood,
    setMood,
    selectMood,
    moodHistory,
    journalText,
    setJournalText,
    entries,
    saveEntry,
    homeMessageIndex,
    breatheAnim,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
