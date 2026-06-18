/**
 * src/context/AppContext.tsx
 *
 * PHASE 5 FIX: Added all parent state + actions.
 * setUserSide exposed so splash can persist side choice.
 * patchJournalEntry added so onSekretReply can persist Worker replies.
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
import { useSekretState } from '@/hooks/useSekretState';
import { HOME_MESSAGES } from '@constants/theme';

interface JournalEntry {
  id: number;
  text: string;
  mood: string;
  date: string;
  time: string;
  sekretReply?: string;
}

interface MoodHistoryEntry {
  id: number;
  mood: string;
  date: string;
  time: string;
}

export interface CirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  reactions: { felt: number; comfort: number; proud: number; stay: number };
}

interface AppContextValue {
  // Identity
  theme: string;
  userSide: 'teen' | 'parent' | null;
  setUserSide: (side: 'teen' | 'parent') => void;
  selectedSekret: string;

  // Teen mood
  mood: string;
  setMood: (mood: string) => void;
  selectMood: (mood: string) => void;
  moodHistory: MoodHistoryEntry[];

  // Journal
  journalText: string;
  setJournalText: (text: string) => void;
  entries: JournalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  saveEntry: () => void;
  /** Merge a partial update into an existing JournalEntry by id. */
  patchJournalEntry: (id: number, patch: Partial<JournalEntry>) => void;

  // Teen voice notes
  voiceNotes: any[];
  setVoiceNotes: React.Dispatch<React.SetStateAction<any[]>>;

  // Teen circle
  circlePosts: CirclePost[];
  setCirclePosts: React.Dispatch<React.SetStateAction<CirclePost[]>>;

  // UI
  homeMessageIndex: number;
  breatheAnim: Animated.Value;
  isLoading: boolean;

  // ── Parent state ──────────────────────────────────────────────
parentMood: string;
  setParentMood: (mood: string) => void;
  parentMoodDate: string;
  setParentMoodDate: (date: string) => void;
  parentRoomStyle: string;
  setParentRoomStyle: (style: string) => void;
  parentPagesDraft: string;
  setParentPagesDraft: (text: string) => void;
  parentPagesEntries: any[];
  setParentPagesEntries: React.Dispatch<React.SetStateAction<any[]>>;
  parentCirclePosts: any[];
  setParentCirclePosts: React.Dispatch<React.SetStateAction<any[]>>;
  parentCirclePostText: string;
  setParentCirclePostText: (text: string) => void;
  parentVoiceNotes: any[];
  setParentVoiceNotes: React.Dispatch<React.SetStateAction<any[]>>;
  parentOracleProfile: any;
  setParentOracleProfile: (profile: any) => void;
  parentOracleSessions: any[];
  setParentOracleSessions: React.Dispatch<React.SetStateAction<any[]>>;

  // Parent actions
  saveParentPageEntry: () => void;
  saveParentCirclePost: () => void;
  reactToParentPost: (postId: number, reaction: string) => void;
  completeParentOracleSession: (session: any) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [journalText, setJournalText] = useState('');
  const [homeMessageIndex, setHomeMessageIndex] = useState(0);
  const [circlePosts, setCirclePosts] = useState<CirclePost[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const s = useSekretState();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1.0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setHomeMessageIndex((p) => (p + 1) % HOME_MESSAGES.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  function selectMood(m: string) {
    s.setMood(m);
    s.setMoodHistory((h: MoodHistoryEntry[]) => [
      { id: Date.now(), mood: m, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() },
      ...h,
    ]);
  }

  function saveEntry() {
    if (!journalText.trim()) return;
    s.setEntries((e: JournalEntry[]) => [
      { id: Date.now(), text: journalText, mood: s.mood, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() },
      ...e,
    ]);
    setJournalText('');
  }

  /**
   * Merge a partial update into an existing JournalEntry by id.
   * Used by onSekretReply to persist Worker replies without replacing the entry.
   */
  function patchJournalEntry(id: number, patch: Partial<JournalEntry>) {
    s.setEntries((prev: JournalEntry[]) =>
      prev.map(entry => entry.id === id ? { ...entry, ...patch } : entry)
    );
  }

  // ── Parent actions ───────────────────────────────────────────────
  function saveParentPageEntry() {
    if (!s.parentPagesDraft.trim()) return;
    s.setParentPagesEntries((e: any[]) => [
      { id: Date.now(), text: s.parentPagesDraft, mood: s.parentMood, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() },
      ...e,
    ]);
    s.setParentPagesDraft('');
  }

  function saveParentCirclePost() {
    if (!s.parentCirclePostText.trim()) return;
    s.setParentCirclePosts((posts: any[]) => [
      { id: Date.now(), text: s.parentCirclePostText, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), reactions: { felt: 0, support: 0, relate: 0 } },
      ...posts,
    ]);
    s.setParentCirclePostText('');
  }

  function reactToParentPost(postId: number, reaction: string) {
    s.setParentCirclePosts((posts: any[]) =>
      posts.map(p => p.id === postId
        ? { ...p, reactions: { ...p.reactions, [reaction]: (p.reactions[reaction] ?? 0) + 1 } }
        : p
      )
    );
  }

  function completeParentOracleSession(session: any) {
    s.setParentOracleSessions((sessions: any[]) => [session, ...sessions].slice(0, 50));
    s.setParentOracleProfile(session.profileSnapshot ?? null);
  }

  const value: AppContextValue = {
    theme: s.theme,
    userSide: s.userSide,
    setUserSide: s.setUserSide,
    selectedSekret: s.selectedSekret,
    mood: s.mood,
    setMood: s.setMood,
    selectMood,
    moodHistory: s.moodHistory,
    journalText,
    setJournalText,
    entries: s.entries,
    setEntries: s.setEntries,
    saveEntry,
    patchJournalEntry,
    voiceNotes,
    setVoiceNotes,
    circlePosts,
    setCirclePosts,
    homeMessageIndex,
    breatheAnim,
    isLoading: s.isLoading,
    // parent
    parentMood: s.parentMood,
    setParentMood: s.setParentMood,
    parentMoodDate: s.parentMoodDate,
    setParentMoodDate: s.setParentMoodDate,
    parentRoomStyle: s.parentRoomStyle,
    setParentRoomStyle: s.setParentRoomStyle,
    parentPagesDraft: s.parentPagesDraft,
    setParentPagesDraft: s.setParentPagesDraft,
    parentPagesEntries: s.parentPagesEntries,
    setParentPagesEntries: s.setParentPagesEntries,
    parentCirclePosts: s.parentCirclePosts,
    setParentCirclePosts: s.setParentCirclePosts,
    parentCirclePostText: s.parentCirclePostText,
    setParentCirclePostText: s.setParentCirclePostText,
    parentVoiceNotes: s.parentVoiceNotes,
    setParentVoiceNotes: s.setParentVoiceNotes,
    parentOracleProfile: s.parentOracleProfile,
    setParentOracleProfile: s.setParentOracleProfile,
    parentOracleSessions: s.parentOracleSessions,
    setParentOracleSessions: s.setParentOracleSessions,
    saveParentPageEntry,
    saveParentCirclePost,
    reactToParentPost,
    completeParentOracleSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
