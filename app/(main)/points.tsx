/**
 * app/(main)/points.tsx
 *
 * Route wrapper for PointsScreen — wires all activity sources to Supabase.
 *
 * voiceNotes + crewCheckIns come from AppContext (already loaded).
 * comfortSessions are loaded on mount from Supabase via loadComfortSessions().
 * streakDays is computed from moodHistory (consecutive days ending today).
 * snapshotPoints() is called inside PointsScreen itself on every total change.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { PointsScreen } from '@screens/PointsScreen';
import { loadComfortSessions } from '@/utils/sync';
import type { ComfortSession } from '@/types';

function computeStreakDays(moodHistory: { date: string }[]): number {
  if (!moodHistory.length) return 0;
  const dates = new Set(moodHistory.map(m => m.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString();
    if (dates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function PointsRoute() {
  const {
    theme, mood, selectedSekret,
    moodHistory, entries, circlePosts,
    voiceNotes, crewCheckIns,
  } = useAppContext();

  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  const [comfortSessions, setComfortSessions] = useState<ComfortSession[]>([]);

  useEffect(() => {
    void loadComfortSessions().then(sessions => {
      if (sessions.length) setComfortSessions(sessions);
    });
  }, []);

  const streakDays = useMemo(() => computeStreakDays(moodHistory), [moodHistory]);

  return (
    <PointsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      moodHistory={moodHistory}
      journalEntries={entries}
      voiceNotes={voiceNotes}
      circlePosts={circlePosts}
      comfortSessions={comfortSessions}
      crewCheckIns={crewCheckIns}
      streakDays={streakDays}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      BottomNav={null}
    />
  );
}
