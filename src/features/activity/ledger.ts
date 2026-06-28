/**
 * src/features/activity/ledger.ts
 *
 * Point Ledger — Phase 2B
 *
 * Replaces the PointsScreen "count arrays at render time" approach with a
 * real transaction log. Every qualifying ActivityEvent awards points via
 * a row in point_transactions.
 *
 * Public surface:
 *   initPointLedger(initialCounts?)  — call once on app mount (teen side only)
 *   usePoints()                      — React hook returning live totals
 *   TIERS / tierFor()                — shared tier logic (PointsScreen re-uses these)
 */

import { useState, useEffect } from 'react';
import { getSupabase } from '@/utils/supabase';
import { subscribeToEvents, type ActivityEventType } from './events';

// ── Point values ─────────────────────────────────────────────────────────────

export const POINTS_PER_EVENT: Partial<Record<ActivityEventType, number>> = {
  mood_logged:        2,
  journal_saved:      5,
  voice_completed:    5,
  circle_post:        4,
  comfort_completed:  3,
  breathe_completed:  3,
  crew_checkin:       6,
  goal_completed:     4,
  streak_milestone:   3,
};

// ── Tier definitions (single source of truth — PointsScreen reads from here) ─

export interface Tier {
  key:   string;
  label: string;
  min:   number;
  max:   number;
  emoji: string;
  color: string;
}

export const TIERS: Tier[] = [
  { key: 't0', label: 'cloud just forming', min: 0,   max: 50,      emoji: '🌫️', color: '#c4b5fd' },
  { key: 't1', label: 'cloud is here',      min: 50,  max: 150,     emoji: '☁️',     color: '#7dd3fc' },
  { key: 't2', label: 'soft sky',           min: 150, max: 350,     emoji: '🌤️', color: '#f5b8cf' },
  { key: 't3', label: 'full moon energy',   min: 350, max: 750,     emoji: '🌙',     color: '#fbbf24' },
  { key: 't4', label: 'whole night sky',    min: 750, max: 9_999_999, emoji: '✨',   color: '#e879a3' },
];

export function tierFor(pts: number): Tier {
  for (const t of TIERS) if (pts >= t.min && pts < t.max) return t;
  return TIERS[0];
}

// ── Breakdown type ────────────────────────────────────────────────────────────

export interface BreakdownRow {
  key:   string;
  label: string;
  each:  number;
  count: number;
  pts:   number;
  emoji: string;
}

export interface PointsLedger {
  total:     number;
  tier:      Tier;
  breakdown: BreakdownRow[];
  isLoaded:  boolean;
}

const BREAKDOWN_TEMPLATE: Omit<BreakdownRow, 'count' | 'pts'>[] = [
  { key: 'mood',    label: 'mood logs',        each: POINTS_PER_EVENT.mood_logged!,       emoji: '💭' },
  { key: 'journal', label: 'journal entries',  each: POINTS_PER_EVENT.journal_saved!,     emoji: '📓' },
  { key: 'voice',   label: 'voice bips',       each: POINTS_PER_EVENT.voice_completed!,   emoji: '🎤' },
  { key: 'circle',  label: 'circle drops',     each: POINTS_PER_EVENT.circle_post!,       emoji: '🌫️' },
  { key: 'comfort', label: 'comfort sessions', each: POINTS_PER_EVENT.comfort_completed!, emoji: '🤍' },
  { key: 'crew',    label: 'crew check-ins',   each: POINTS_PER_EVENT.crew_checkin!,      emoji: '🤝' },
  { key: 'growth',  label: 'growth tracks',     each: POINTS_PER_EVENT.goal_completed!,    emoji: '🌱' },
  { key: 'streak',  label: 'streak days',      each: POINTS_PER_EVENT.streak_milestone!,  emoji: '🌙' },
];

// Maps breakdown.key → the event_type(s) that feed it
const KEY_TO_EVENTS: Record<string, ActivityEventType[]> = {
  mood:    ['mood_logged'],
  journal: ['journal_saved'],
  voice:   ['voice_completed'],
  circle:  ['circle_post'],
  comfort: ['comfort_completed', 'breathe_completed'],
  crew:    ['crew_checkin'],
  growth:  ['goal_completed'],
  streak:  ['streak_milestone'],
};

function buildBreakdown(countsByType: Record<string, number>): PointsLedger {
  const rows: BreakdownRow[] = BREAKDOWN_TEMPLATE.map(t => {
    const count = (KEY_TO_EVENTS[t.key] ?? []).reduce(
      (sum, evType) => sum + (countsByType[evType] ?? 0), 0,
    );
    return { ...t, count, pts: count * t.each };
  });
  const total = rows.reduce((s, r) => s + r.pts, 0);
  return { total, tier: tierFor(total), breakdown: rows, isLoaded: true };
}

const DEFAULT_LEDGER: PointsLedger = {
  total: 0, tier: TIERS[0], breakdown: BREAKDOWN_TEMPLATE.map(t => ({ ...t, count: 0, pts: 0 })), isLoaded: false,
};

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data?.user?.id ?? null;
  } catch { return null; }
}

async function insertTransactions(
  uid: string,
  rows: Array<{ event_type: string; points: number; occurred_at: string }>,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('point_transactions').insert(
      rows.map(r => ({ ...r, user_id: uid })),
    );
    if (error && __DEV__) console.warn('[ledger] insert failed:', error.message);
  } catch (e) {
    if (__DEV__) console.warn('[ledger] insert threw:', e);
  }
}

async function fetchCountsByType(uid: string): Promise<Record<string, number>> {
  const sb = getSupabase();
  if (!sb) return {};
  try {
    const { data, error } = await sb
      .from('point_transactions')
      .select('event_type')
      .eq('user_id', uid);
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.event_type] = (counts[row.event_type] ?? 0) + 1;
    }
    return counts;
  } catch (e) {
    if (__DEV__) console.warn('[ledger] fetchCountsByType failed:', e);
    return {};
  }
}

// ── Backfill ──────────────────────────────────────────────────────────────────
// Called once when initPointLedger() sees an empty ledger but the user has
// existing local data (first run after Phase 2B ships). Inserts one transaction
// per historical activity item so the points total is accurate on day one.

async function backfillIfEmpty(
  uid: string,
  counts: InitialCounts,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { count } = await sb
      .from('point_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid);
    if ((count ?? 0) > 0) return; // already has data

    const rows: Array<{ event_type: string; points: number; occurred_at: string }> = [];
    const base = Date.now();
    // Spread backfilled rows 1 second apart going backwards so ordering is stable
    let offset = 0;
    function pushRows(eventType: ActivityEventType, n: number) {
      const pts = POINTS_PER_EVENT[eventType] ?? 0;
      for (let i = 0; i < n; i++) {
        rows.push({
          event_type: eventType,
          points:     pts,
          occurred_at: new Date(base - (offset++ * 1000)).toISOString(),
        });
      }
    }
    pushRows('mood_logged',       counts.moodCount);
    pushRows('journal_saved',     counts.journalCount);
    pushRows('voice_completed',   counts.voiceCount);
    pushRows('circle_post',       counts.circleCount);
    pushRows('comfort_completed', counts.comfortCount);
    pushRows('crew_checkin',      counts.crewCount);
    pushRows('streak_milestone',  counts.streakDays);

    if (rows.length > 0) await insertTransactions(uid, rows);
    if (__DEV__) console.log(`[ledger] backfilled ${rows.length} transactions`);
  } catch (e) {
    if (__DEV__) console.warn('[ledger] backfill failed:', e);
  }
}

// ── Public: initPointLedger ───────────────────────────────────────────────────

export interface InitialCounts {
  moodCount:    number;
  journalCount: number;
  voiceCount:   number;
  circleCount:  number;
  comfortCount: number;
  crewCount:    number;
  streakDays:   number;
}

/**
 * Call once per app session on the teen side.
 * Returns a cleanup function that unsubscribes from the event stream.
 */
export function initPointLedger(initialCounts?: InitialCounts): () => void {
  // Backfill existing data if this is the first time the ledger runs
  if (initialCounts) {
    void (async () => {
      const uid = await currentUserId();
      if (uid) await backfillIfEmpty(uid, initialCounts);
    })();
  }

  // Award points for every qualifying event going forward
  const unsubscribe = subscribeToEvents(async (event) => {
    const pts = POINTS_PER_EVENT[event.type];
    if (!pts) return;
    const uid = await currentUserId();
    if (!uid) return;
    await insertTransactions(uid, [{
      event_type:  event.type,
      points:      pts,
      occurred_at: event.occurredAt,
    }]);
  });

  return unsubscribe;
}

// ── Public: usePoints hook ────────────────────────────────────────────────────

/**
 * React hook — returns live point totals from the ledger.
 * Refreshes automatically when a qualifying ActivityEvent fires.
 */
export function usePoints(): PointsLedger {
  const [ledger, setLedger] = useState<PointsLedger>(DEFAULT_LEDGER);

  async function refresh() {
    const uid = await currentUserId();
    if (!uid) return;
    const counts = await fetchCountsByType(uid);
    setLedger(buildBreakdown(counts));
  }

  useEffect(() => {
    void refresh();

    const unsubscribe = subscribeToEvents((event) => {
      if (event.type in POINTS_PER_EVENT) {
        void refresh();
      }
    });

    return unsubscribe;
  }, []);

  return ledger;
}
