import { useEffect, useState } from 'react';
import { getSupabase } from '@/utils/supabase';
import { subscribeToEvents, type ActivityEventType } from './events';

export const POINTS_PER_EVENT: Partial<Record<ActivityEventType, number>> = {
  mood_logged: 2,
  journal_saved: 5,
  voice_completed: 5,
  circle_post: 4,
  comfort_completed: 3,
  breathe_completed: 3,
  crew_checkin: 6,
  goal_completed: 4,
  streak_milestone: 3,
};

export interface Tier {
  key: string;
  label: string;
  min: number;
  max: number;
  emoji: string;
  color: string;
}

export const TIERS: Tier[] = [
  { key: 't0', label: 'cloud just forming', min: 0, max: 50, emoji: '🌫️', color: '#c4b5fd' },
  { key: 't1', label: 'cloud is here', min: 50, max: 150, emoji: '☁️', color: '#7dd3fc' },
  { key: 't2', label: 'soft sky', min: 150, max: 350, emoji: '🌤️', color: '#f5b8cf' },
  { key: 't3', label: 'full moon energy', min: 350, max: 750, emoji: '🌙', color: '#fbbf24' },
  { key: 't4', label: 'whole night sky', min: 750, max: 9_999_999, emoji: '✨', color: '#e879a3' },
];

export function tierFor(points: number): Tier {
  return TIERS.find(tier => points >= tier.min && points < tier.max) ?? TIERS[0];
}

export interface BreakdownRow {
  key: string;
  label: string;
  each: number;
  count: number;
  pts: number;
  emoji: string;
}

export interface PointsLedger {
  total: number;
  tier: Tier;
  breakdown: BreakdownRow[];
  isLoaded: boolean;
}

const BREAKDOWN_TEMPLATE: Omit<BreakdownRow, 'count' | 'pts'>[] = [
  { key: 'mood', label: 'mood logs', each: POINTS_PER_EVENT.mood_logged!, emoji: '💭' },
  { key: 'journal', label: 'journal entries', each: POINTS_PER_EVENT.journal_saved!, emoji: '📓' },
  { key: 'voice', label: 'voice bips', each: POINTS_PER_EVENT.voice_completed!, emoji: '🎤' },
  { key: 'circle', label: 'circle drops', each: POINTS_PER_EVENT.circle_post!, emoji: '🌫️' },
  { key: 'comfort', label: 'comfort sessions', each: POINTS_PER_EVENT.comfort_completed!, emoji: '🤍' },
  { key: 'crew', label: 'crew check-ins', each: POINTS_PER_EVENT.crew_checkin!, emoji: '🤝' },
  { key: 'growth', label: 'growth tracks', each: POINTS_PER_EVENT.goal_completed!, emoji: '🌱' },
  { key: 'streak', label: 'streak days', each: POINTS_PER_EVENT.streak_milestone!, emoji: '🌙' },
];

const KEY_TO_EVENTS: Record<string, ActivityEventType[]> = {
  mood: ['mood_logged'],
  journal: ['journal_saved'],
  voice: ['voice_completed'],
  circle: ['circle_post'],
  comfort: ['comfort_completed', 'breathe_completed'],
  crew: ['crew_checkin'],
  growth: ['goal_completed'],
  streak: ['streak_milestone'],
};

const DEFAULT_LEDGER: PointsLedger = {
  total: 0,
  tier: TIERS[0],
  breakdown: BREAKDOWN_TEMPLATE.map(row => ({ ...row, count: 0, pts: 0 })),
  isLoaded: false,
};

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function applyInactivityAdjustment(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc('apply_inactivity_point_adjustment');
    if (error && __DEV__) console.warn('[ledger] inactivity adjustment failed:', error.message);
  } catch (error) {
    if (__DEV__) console.warn('[ledger] inactivity adjustment threw:', error);
  }
}

async function fetchLedger(): Promise<PointsLedger> {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!supabase || !userId) return { ...DEFAULT_LEDGER, isLoaded: true };

  try {
    const [{ data: balanceRow, error: balanceError }, { data: transactions, error: transactionError }] =
      await Promise.all([
        supabase.from('point_balances').select('available').eq('user_id', userId).maybeSingle(),
        supabase
          .from('point_transactions')
          .select('event_type, amount, points, source_type')
          .eq('user_id', userId),
      ]);

    if (balanceError) throw balanceError;
    if (transactionError) throw transactionError;

    const countsByType: Record<string, number> = {};
    for (const row of transactions ?? []) {
      if (row.source_type !== 'app_action' || !row.event_type) continue;
      countsByType[row.event_type] = (countsByType[row.event_type] ?? 0) + 1;
    }

    const breakdown = BREAKDOWN_TEMPLATE.map(template => {
      const count = (KEY_TO_EVENTS[template.key] ?? []).reduce(
        (sum, eventType) => sum + (countsByType[eventType] ?? 0),
        0,
      );
      return { ...template, count, pts: count * template.each };
    });

    const total = Number(balanceRow?.available ?? 0);
    return { total, tier: tierFor(total), breakdown, isLoaded: true };
  } catch (error) {
    if (__DEV__) console.warn('[ledger] fetch failed:', error);
    return { ...DEFAULT_LEDGER, isLoaded: true };
  }
}

export interface InitialCounts {
  moodCount: number;
  journalCount: number;
  voiceCount: number;
  circleCount: number;
  comfortCount: number;
  crewCount: number;
  streakDays: number;
}

/**
 * Initializes the server-owned points economy.
 *
 * The database trigger awards app-action points after a bip_events insert.
 * The client never writes directly to point_transactions, preventing duplicate
 * awards and keeping chore bonuses, inactivity adjustments, and redemptions in
 * the same authoritative wallet.
 */
export function initPointLedger(_initialCounts?: InitialCounts): () => void {
  void applyInactivityAdjustment();
  return () => {};
}

export function usePoints(): PointsLedger {
  const [ledger, setLedger] = useState<PointsLedger>(DEFAULT_LEDGER);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const next = await fetchLedger();
      if (active) setLedger(next);
    };

    void refresh();
    const unsubscribe = subscribeToEvents(event => {
      if (POINTS_PER_EVENT[event.type]) {
        // The event write and database trigger are asynchronous. A short retry
        // gives the transaction and balance trigger time to settle.
        setTimeout(() => void refresh(), 350);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return ledger;
}
