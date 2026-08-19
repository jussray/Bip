/**
 * src/features/activity/events.ts
 *
 * Activity Event System — Phase 2A
 *
 * Every meaningful user action emits an ActivityEvent. This is the
 * single source of truth that feeds:
 *   - Point ledger (Phase 2B)
 *   - Companion Engine context (Phase 2C)
 *   - Parent consent layer (Phase 2D)
 *   - Safety Coordinator (Phase 2E)
 *   - History / Bip Replay (Phase 3)
 *
 * Rules:
 *   - Never throw. Local experience must never break because the cloud is down.
 *   - Fire-and-forget from callsites: void emitEvent(...).
 *   - Local consumers (subscribers) are called synchronously before the async
 *     cloud write, so the UI can respond immediately.
 */

import { getSupabase } from '@/utils/supabase';
import { bumpStreak } from '../../../services/sekretMemory';

// ── Event type registry ──────────────────────────────────────────────────────

export type ActivityEventType =
  | 'mood_logged'
  | 'journal_saved'
  | 'voice_completed'
  | 'comfort_completed'
  | 'breathe_completed'
  | 'crew_checkin'
  | 'circle_post'
  | 'circle_reaction'
  | 'companion_message'
  | 'app_opened'
  | 'goal_completed'
  | 'streak_milestone';

export interface ActivityEvent {
  type:       ActivityEventType;
  // ISO timestamp — set by emitEvent, not by callers
  occurredAt: string;
  // Optional structured payload — kept minimal, never PII
  meta?: ActivityEventMeta;
}

export interface ActivityEventMeta {
  mood?:          string;   // mood_logged, journal_saved
  wordCount?:     number;   // journal_saved
  durationSecs?:  number;   // voice_completed, breathe_completed
  personalityId?: string;   // companion_message
  messageIndex?:  number;   // companion_message
  reactionKey?:   string;   // circle_reaction
  milestone?:     number;   // streak_milestone
  date?:          string;   // app_opened
}

// ── Subscriber registry (in-process, synchronous) ───────────────────────────

type Subscriber = (event: ActivityEvent) => void;
const subscribers: Subscriber[] = [];

export function subscribeToEvents(fn: Subscriber): () => void {
  subscribers.push(fn);
  return () => {
    const i = subscribers.indexOf(fn);
    if (i !== -1) subscribers.splice(i, 1);
  };
}

function notifySubscribers(event: ActivityEvent): void {
  for (const fn of subscribers) {
    try { fn(event); } catch { /* subscriber errors must not block the emitter */ }
  }
}

// ── Cloud write ──────────────────────────────────────────────────────────────

async function persistEvent(userId: string, event: ActivityEvent): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('bip_events').insert({
      user_id:     userId,
      event_type:  event.type,
      occurred_at: event.occurredAt,
      meta:        event.meta ?? {},
    });
    if (error) {
      if (__DEV__) console.warn('[events] persist failed:', error.message);
    }
  } catch (e) {
    if (__DEV__) console.warn('[events] persist threw:', e);
  }
}

// ── Public emitter ───────────────────────────────────────────────────────────

/**
 * Emit an activity event.
 *
 * - Notifies in-process subscribers synchronously (for immediate UI feedback).
 * - Persists to Supabase in the background (fire-and-forget).
 * - Silently no-ops if there's no auth session.
 */
export function emitEvent(type: ActivityEventType, meta?: ActivityEventMeta): void {
  const event: ActivityEvent = {
    type,
    occurredAt: new Date().toISOString(),
    meta,
  };

  notifySubscribers(event);
  void bumpStreak();

  void (async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data } = await sb.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      await persistEvent(uid, event);
    } catch {
      // never surface errors to the user
    }
  })();
}
