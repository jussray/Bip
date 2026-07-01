// src/utils/sync.ts
// Se'kret Bip — Cloud sync layer (Phase 2 + Phase 3 backend)
//
// All cloud writes go through here. Every helper is a SAFE NO-OP when
// Supabase isn't configured — the app keeps working off AsyncStorage, no
// errors thrown. This lets us ship the UI now and add credentials later.
//
// Auth model: each row is scoped to auth.uid() via RLS. If there's no
// signed-in user yet, writes are silently skipped (kept locally only).
// ensureAnonymousSession() is called from useAppEffects on mount.
//
// IMPORTANT: never throw. The user's local experience must never break
// because the cloud is down. Errors are logged and swallowed.

import { getSupabase, TABLES } from './supabase';
import { loadState } from './storage';
import { emitEvent } from '@/features/activity/events';
import type {
  JournalEntry, MoodEntry, CirclePost, ParentCirclePost, VoiceNote,
  ComfortSession, CrewMember, CrewCheckIn,
} from '../types/index';
import type {
  CircleTab,
  PublicCirclePost,
  FriendsCirclePost,
  CrewCirclePost,
  ParentCirclePost as CircleParentPost,
} from '../../types/circle';

// ── Internal helpers ──────────────────────────────────────────────
async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function safeUpsert(table: string, payload: any | any[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const rows = Array.isArray(payload) ? payload : [payload];
    const withUser = rows.map(r => ({ ...r, user_id: uid }));
    const { error } = await sb.from(table).upsert(withUser, { onConflict: 'id,user_id' });
    if (error) {
      console.warn('[sync] safeUpsert failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn(`[sync] upsert ${table} failed`, e);
  }
}

async function safeDelete(table: string, id: number | string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb.from(table).delete().match({ id, user_id: uid });
    if (error) {
      console.warn('[sync] safeDelete failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn(`[sync] delete ${table} failed`, e);
  }
}

// ── Anonymous sign-in ────────────────────────────────────────────
export async function ensureAnonymousSession(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    if (data?.user?.id) return data.user.id;
    const { data: signed, error } = await sb.auth.signInAnonymously();
    if (error) {
      if (__DEV__) console.warn('[sync] anon sign-in failed', error);
      return null;
    }
    return signed?.user?.id ?? null;
  } catch (e) {
    if (__DEV__) console.warn('[sync] ensureAnonymousSession threw', e);
    return null;
  }
}

// ── Mood ───────────────────────────────────────────────────────────
export function syncMood(entry: MoodEntry): void {
  emitEvent('mood_logged', { mood: entry.mood });
  void safeUpsert(TABLES.moodHistory, {
    id:   entry.id,
    mood: entry.mood,
    date: entry.date,
    time: entry.time,
  });
}

// ── Journal ─────────────────────────────────────────────────────────
export function syncJournal(entry: JournalEntry): void {
  emitEvent('journal_saved', {
    mood:      entry.mood,
    wordCount: entry.text ? entry.text.trim().split(/\s+/).filter(Boolean).length : 0,
  });
  void safeUpsert(TABLES.journalEntries, {
    id:           entry.id,
    text:         entry.text,
    mood:         entry.mood,
    date:         entry.date,
    time:         entry.time,
    sekret_reply: entry.sekretReply ?? null,
  });
}

// ── Circle (legacy drain path) ───────────────────────────────────────
export function syncCirclePost(post: CirclePost): void {
  void safeUpsert(TABLES.circlePosts, {
    id:         post.id,
    text:       post.text,
    date:       post.date,
    time:       post.time,
    reactions:  post.reactions,
    circle_tag: post.circleTag ?? null,
    post_mood:  post.postMood  ?? null,
    media_kind: post.mediaKind ?? null,
  });
}

export function syncParentCirclePost(post: ParentCirclePost): void {
  void safeUpsert(TABLES.parentCirclePosts, {
    id:         post.id,
    text:       post.text,
    date:       post.date,
    time:       post.time,
    reactions:  post.reactions,
    circle_tag: post.circleTag ?? null,
  });
}

// ── Circle V2: shared helpers ──────────────────────────────────────────────
// DB circle_kind enum: 'public' | 'friends' | 'crew' | 'parent' | 'parent_community'.
// UI CircleTab (types/circle.ts): 'public' | 'friends' | 'crew' | 'parent'.
// The UI's 'parent' tab is the guardian COMMUNITY feed and maps to
// circle_kind 'parent_community' — NOT the DB's 'parent' kind, which is a
// private space scoped to exactly one parent_links row (Bridge), a
// separate, newer concept this UI doesn't expose. See
// docs/circle-v2-migration-plan.md §1.2/§1.3 for why.
type DbCircleKind = 'public' | 'friends' | 'crew' | 'parent_community';

function dbKindForTab(tab: CircleTab): DbCircleKind {
  return tab === 'parent' ? 'parent_community' : tab;
}

const DEFAULT_REACTIONS_PARENT: Record<string, number> = {
  beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0,
};

interface CircleRow { id: string; kind: DbCircleKind }

/** Aggregate post_reactions rows into the legacy `{ reactionKey: count }` shape the UI expects. */
async function fetchReactionCounts(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  postIds: string[],
): Promise<Map<string, Record<string, number>>> {
  const byPost = new Map<string, Record<string, number>>();
  if (postIds.length === 0) return byPost;
  const { data } = await sb.from(TABLES.postReactions).select('post_id, reaction').in('post_id', postIds);
  for (const r of (data ?? []) as any[]) {
    const bucket = byPost.get(r.post_id) ?? {};
    bucket[r.reaction] = (bucket[r.reaction] ?? 0) + 1;
    byPost.set(r.post_id, bucket);
  }
  return byPost;
}

/** Get-or-create the caller's own circle of a non-crew kind (one per owner per kind). */
async function resolveOwnCircle(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  uid: string,
  kind: 'public' | 'friends' | 'parent_community',
): Promise<CircleRow | null> {
  const { data: existing } = await sb
    .from(TABLES.circles).select('id, kind')
    .eq('owner_user_id', uid).eq('kind', kind).maybeSingle();
  if (existing) return existing as CircleRow;

  const name = kind === 'public' ? 'Public' : kind === 'friends' ? 'Friends' : 'Parent Community';
  const { data: created, error } = await sb
    .from(TABLES.circles)
    .insert({ owner_user_id: uid, kind, name })
    .select('id, kind')
    .single();
  if (error) {
    console.warn('[circle] resolveOwnCircle failed:', error.message);
    return null;
  }
  return created as CircleRow;
}

/**
 * Resolve the caller's crew circle: the first crew they own, falling back
 * to the first crew-kind circle they're a member of.
 * TODO: there's no crew-selection UI yet — a user who owns/belongs to more
 * than one crew can only post to/read whichever this resolves first. Needs
 * real UI work before multi-crew is actually usable; tracked as a known gap,
 * not silently "handled."
 */
async function resolveCrewCircle(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  uid: string,
): Promise<CircleRow | null> {
  const { data: owned } = await sb
    .from(TABLES.circles).select('id, kind')
    .eq('owner_user_id', uid).eq('kind', 'crew')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (owned) return owned as CircleRow;

  const { data: memberRow } = await sb
    .from(TABLES.circleMembers)
    .select('circle_id, circles!inner(id, kind)')
    .eq('user_id', uid).eq('circles.kind', 'crew')
    .limit(1).maybeSingle();
  const joined = (memberRow as any)?.circles;
  return joined ? (joined as CircleRow) : null;
}

// ── Parent Circle: personal post history (guardian's own posts, parent_community kind) ──
export async function loadParentCircleFeed(
  limit = 50,
): Promise<ParentCirclePost[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  try {
    const { data, error } = await sb
      .from(TABLES.posts)
      .select('id, body, mood_tag, created_at, circles!inner(kind)')
      .eq('author_user_id', uid)
      .eq('circles.kind', 'parent_community')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const rows = (data ?? []) as any[];
    const reactionsByPost = await fetchReactionCounts(sb, rows.map(r => r.id as string));
    return rows.map((r) => {
      const created = new Date(r.created_at);
      return {
        id:        r.id,
        text:      r.body,
        date:      created.toLocaleDateString(),
        time:      created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: reactionsByPost.get(r.id) ?? DEFAULT_REACTIONS_PARENT,
        circleTag: undefined,
      };
    }) as ParentCirclePost[];
  } catch (e) {
    if (__DEV__) console.warn('[sync] loadParentCircleFeed failed', e);
    return [];
  }
}

// ── Circle V2: Live feed reads ─────────────────────────────────────────────────
export async function loadCircleFeed(
  tab: CircleTab,
  limit = 30,
): Promise<PublicCirclePost[] | FriendsCirclePost[] | CrewCirclePost[] | CircleParentPost[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const dbKind = dbKindForTab(tab);
    const { data, error } = await sb
      .from(TABLES.posts)
      .select('id, author_user_id, body, mood_tag, is_identity_revealed, created_at, circles!inner(kind)')
      .eq('circles.kind', dbKind)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const rows = (data ?? []) as any[];
    if (rows.length === 0) return [];

    const reactionsByPost = await fetchReactionCounts(sb, rows.map(r => r.id as string));

    if (dbKind === 'public') {
      // media_kind: null — media_attachments exists but isn't joined into
      // reads yet; posting/rendering media through Circle is separate work.
      return rows.map((r) => ({
        id: r.id, text: r.body, post_mood: r.mood_tag ?? null,
        media_kind: null, reactions: reactionsByPost.get(r.id) ?? {},
        created_at: r.created_at,
      })) as PublicCirclePost[];
    }

    if (dbKind === 'parent_community') {
      // Always anonymous — DB-enforced (enforce_circle_anonymity trigger)
      // independent of this mapping; identity fields are never selected here.
      return rows.map((r) => ({
        id:                r.id,
        user_id:           '',
        text:              r.body,
        reactions:         reactionsByPost.get(r.id) ?? DEFAULT_REACTIONS_PARENT,
        circle_tag:        null,
        created_at:        r.created_at,
        identity_revealed: false,
      })) as CircleParentPost[];
    }

    // friends / crew — safe pseudonymous identity via circle_profiles.
    const userIds = [...new Set(rows.map(r => r.author_user_id as string))];
    let profileMap: Record<string, { nickname: string; avatar_emoji: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await sb
        .from(TABLES.circleProfiles)
        .select('user_id, nickname, avatar_emoji')
        .in('user_id', userIds);
      profileMap = Object.fromEntries(
        (profiles ?? []).map((p: any) => [p.user_id, { nickname: p.nickname, avatar_emoji: p.avatar_emoji }]),
      );
    }
    return rows.map((r) => ({
      id: r.id, user_id: r.author_user_id,
      nickname:     profileMap[r.author_user_id]?.nickname     ?? 'Anonymous',
      avatar_emoji: profileMap[r.author_user_id]?.avatar_emoji ?? '🌙',
      text: r.body, post_mood: r.mood_tag ?? null,
      media_kind: null, reactions: reactionsByPost.get(r.id) ?? {},
      created_at: r.created_at,
    })) as FriendsCirclePost[] | CrewCirclePost[];
  } catch (e) {
    if (__DEV__) console.warn(`[sync] loadCircleFeed(${tab}) failed`, e);
    return null;
  }
}

// ── Circle V2: Reaction sync ───────────────────────────────────────────────────
// post_reactions has no post_type/tab column — post_id alone determines the
// circle via its FK, so `tab` is unused here. Kept in the signature only for
// call-site compatibility with existing callers.
export async function syncCircleReaction(
  postId: string | number,
  tabOrReaction: string,
  reaction?: string,
): Promise<void> {
  const emoji = reaction ?? tabOrReaction;
  emitEvent('circle_reaction', { reactionKey: emoji });
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb
      .from(TABLES.postReactions)
      .upsert(
        { post_id: postId, user_id: uid, reaction: emoji },
        { onConflict: 'post_id,user_id,reaction', ignoreDuplicates: true },
      );
    if (error) {
      console.warn('[sync] syncCircleReaction failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncCircleReaction failed', e);
  }
}

// ── Circle V2: Post write ──────────────────────────────────────────────────────
export async function writeCirclePost(
  tab: CircleTab,
  text: string,
  opts: { postMood?: string; circleTag?: string; mediaKind?: string; revealIdentity?: boolean } = {},
): Promise<void> {
  emitEvent('circle_post');
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;

  const dbKind = dbKindForTab(tab);
  const circle = dbKind === 'crew'
    ? await resolveCrewCircle(sb, uid)
    : await resolveOwnCircle(sb, uid, dbKind);
  if (!circle) return;

  // Identity is never revealed on public/parent_community — this mirrors
  // the DB's enforce_circle_anonymity trigger, which rejects it either way;
  // setting it correctly here just avoids a round-trip that would fail.
  const isAnonymousKind = dbKind === 'public' || dbKind === 'parent_community';
  try {
    const { error } = await sb.from(TABLES.posts).insert({
      author_user_id:       uid,
      circle_id:            circle.id,
      body:                 text,
      mood_tag:             opts.postMood ?? null,
      content_warning:      null,
      is_identity_revealed: isAnonymousKind ? false : Boolean(opts.revealIdentity),
      is_deleted:            false,
    });
    if (error) {
      console.warn('[sync] writeCirclePost failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn(`[sync] writeCirclePost(${tab}) failed`, e);
  }
  // opts.circleTag / opts.mediaKind have no destination on `posts` yet
  // (no circle_tag column; media needs a separate media_attachments insert
  // after the post exists) — silently ignored, kept in the signature only
  // for call-site compatibility.
}

// ── Voice ─────────────────────────────────────────────────────────────
export function syncVoiceNote(note: VoiceNote): void {
  emitEvent('voice_completed', { durationSecs: note.duration ? Number(note.duration) : undefined });
  void safeUpsert(TABLES.voiceNotes, {
    id: note.id, title: note.title, date: note.date,
    time: note.time, duration: note.duration,
  });
}

// ── Comfort sessions ─────────────────────────────────────────────────────
export function syncComfortSession(session: ComfortSession): void {
  emitEvent(session.type === 'breathe' ? 'breathe_completed' : 'comfort_completed');
  void safeUpsert(TABLES.comfortSessions, {
    id: session.id, type: session.type,
    mood: session.mood ?? null, date: session.date, time: session.time,
  });
}

// ── Crew ─────────────────────────────────────────────────────────────
export function syncCrewMember(m: CrewMember): void {
  void safeUpsert(TABLES.crewMembers, {
    id: m.id, name: m.name, emoji: m.emoji,
    commitment: m.commitment, cadence: m.cadence,
    invite_code: m.inviteCode, added_at: m.addedAt ? new Date(m.addedAt).toISOString() : null,
  });
}

export function deleteCrewMember(id: number | string): void {
  void safeDelete(TABLES.crewMembers, id);
}

export function syncCrewCheckIn(c: CrewCheckIn): void {
  emitEvent('crew_checkin');
  void safeUpsert(TABLES.crewCheckIns, {
    id: c.id, member_id: c.memberId, note: c.note,
    mood: c.mood ?? null, date: c.date, time: c.time,
  });
}

// ── Room memory ───────────────────────────────────────────────────────────────
export async function syncRoomMemory(rm: {
  character: string; lastVisit: string; lastHotspot: string;
  lastSummon: string; visitCount: number;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb.from(TABLES.roomMemory).upsert(
      {
        user_id:      uid,
        character:    rm.character,
        last_visit:   rm.lastVisit    || null,
        last_hotspot: rm.lastHotspot  || null,
        last_summon:  rm.lastSummon   || null,
        visit_count:  rm.visitCount,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) {
      console.warn('[sync] syncRoomMemory failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncRoomMemory failed', e);
  }
}

// ── Points snapshot ───────────────────────────────────────────────────────────
export async function snapshotPoints(total: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb.from(TABLES.bipPoints).insert({
      user_id: uid, total, captured_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[sync] snapshotPoints failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] snapshotPoints failed', e);
  }
}

// ── Period calendar ──────────────────────────────────────────────────────

/** Upsert a single period day (ISO date string, e.g. '2026-06-17'). */
export async function syncPeriodDay(day: string, note?: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb.from(TABLES.periodDays).upsert(
      { user_id: uid, day, note: note ?? null },
      { onConflict: 'user_id,day' },
    );
    if (error) {
      console.warn('[sync] syncPeriodDay failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncPeriodDay failed', e);
  }
}

/** Remove a period day (un-mark). */
export async function deletePeriodDay(day: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb.from(TABLES.periodDays).delete().match({ user_id: uid, day });
    if (error) {
      console.warn('[sync] deletePeriodDay failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] deletePeriodDay failed', e);
  }
}

/** Pull all period days from cloud. Returns array of ISO date strings. */
export async function loadPeriodDays(): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  try {
    const { data, error } = await sb
      .from(TABLES.periodDays)
      .select('day')
      .eq('user_id', uid)
      .order('day', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => r.day as string);
  } catch (e) {
    if (__DEV__) console.warn('[sync] loadPeriodDays failed', e);
    return [];
  }
}

// ── Oracle / companion memory ───────────────────────────────────────────────

export async function syncOracleSession(
  personalityId: string,
  memory: Record<string, unknown>,
  sessionCount: number,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await sb.from(TABLES.oracleSessions).upsert(
      {
        user_id:        uid,
        personality_id: personalityId,
        memory,
        session_count:  sessionCount,
        last_synced:    new Date().toISOString(),
      },
      { onConflict: 'user_id,personality_id' },
    );
    if (error) {
      console.warn('[sync] syncOracleSession failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncOracleSession failed', e);
  }
}

export async function loadOracleSession(
  personalityId: string,
): Promise<{ memory: Record<string, unknown>; sessionCount: number } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await sb
      .from(TABLES.oracleSessions)
      .select('memory, session_count')
      .eq('user_id', uid)
      .eq('personality_id', personalityId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      memory:       (data.memory as Record<string, unknown>) ?? {},
      sessionCount: (data.session_count as number) ?? 0,
    };
  } catch (e) {
    if (__DEV__) console.warn('[sync] loadOracleSession failed', e);
    return null;
  }
}

// ── Teen activity summary — parent-facing snapshot ─────────────────────────

export interface TeenActivitySummary {
  streak_days: number;
  session_count: number;
  points_tier: string;
}

function deriveTier(sessionCount: number): string {
  if (sessionCount >= 50) return 't4';
  if (sessionCount >= 25) return 't3';
  if (sessionCount >= 10) return 't2';
  if (sessionCount >= 3)  return 't1';
  return 't0';
}

export async function syncTeenActivitySummary(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const state = await loadState();
    const streakDays: number = parseInt(state.streakDays ?? '0', 10) || 0;
    const comfortSessions: ComfortSession[] = Array.isArray(state.comfortSessions)
      ? state.comfortSessions
      : [];
    const sessionCount = comfortSessions.length;
    const pointsTier = deriveTier(sessionCount);

    const { error } = await sb.from('teen_activity_summary').upsert(
      {
        user_id:       uid,
        streak_days:   streakDays,
        session_count: sessionCount,
        points_tier:   pointsTier,
        last_active_at: new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) {
      console.warn('[sync] syncTeenActivitySummary failed:', error.message, error.code);
    }
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncTeenActivitySummary failed', e);
  }
}

export function initTeenActivitySync(): () => void {
  void syncTeenActivitySummary();
  const interval = setInterval(() => {
    void syncTeenActivitySummary();
  }, 10 * 60 * 1000);
  return () => clearInterval(interval);
}

export async function fetchTeenActivitySummary(
  teenId: string,
): Promise<TeenActivitySummary | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('parent_teen_activity_snapshot')
      .select('streak_days, session_count, points_tier')
      .eq('user_id', teenId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      streak_days:   data.streak_days   as number,
      session_count: data.session_count as number,
      points_tier:   data.points_tier   as string,
    };
  } catch (e) {
    if (__DEV__) console.warn('[sync] fetchTeenActivitySummary failed', e);
    return null;
  }
}

// ── Bulk pull ──────────────────────────────────────────────────────────────

/**
 * Authored Circle V2 posts (public/friends/crew/parent_community), for
 * account restore. Separate from `circlePosts`/`parentCirclePosts` below,
 * which still read the legacy V1 tables — writes now go to `posts`
 * (§ writeCirclePost), so without this, restoring an account would silently
 * lose everything written since the V2 cutover. Reaction counts aren't
 * included here (would be an extra query per restore, not worth it for a
 * one-time bulk pull) — local reaction state isn't restored by this field.
 */
export interface CircleV2Post {
  id:                  string;
  kind:                'public' | 'friends' | 'crew' | 'parent_community';
  text:                string;
  postMood?:           string;
  isIdentityRevealed:  boolean;
  createdAt:           string;
}

export async function pullAll(): Promise<{
  moodHistory:       MoodEntry[];
  journalEntries:    JournalEntry[];
  circlePosts:       CirclePost[];
  voiceNotes:        VoiceNote[];
  comfortSessions:   ComfortSession[];
  crewMembers:       CrewMember[];
  crewCheckIns:      CrewCheckIn[];
  parentCirclePosts: ParentCirclePost[];
  circleV2Posts:     CircleV2Post[];
  roomMemory: {
    character: string; lastVisit: string; lastHotspot: string;
    lastSummon: string; visitCount: number;
  } | null;
} | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  try {
    const [
      moodRes, journalRes, circleRes, voiceRes, comfortRes,
      crewMemberRes, crewCheckInRes, parentCircleRes, circleV2Res, roomRes,
    ] = await Promise.allSettled([
      sb.from(TABLES.moodHistory).select('id, mood, date, time').eq('user_id', uid).order('id'),
      sb.from(TABLES.journalEntries).select('id, text, mood, date, time, sekret_reply').eq('user_id', uid).order('id'),
      sb.from(TABLES.circlePosts).select('id, text, date, time, reactions, circle_tag, post_mood, media_kind').eq('user_id', uid).order('id'),
      sb.from(TABLES.voiceNotes).select('id, title, date, time, duration').eq('user_id', uid).order('id'),
      sb.from(TABLES.comfortSessions).select('id, type, mood, date, time').eq('user_id', uid).order('id'),
      sb.from(TABLES.crewMembers).select('id, name, emoji, commitment, cadence, invite_code, added_at').eq('user_id', uid),
      sb.from(TABLES.crewCheckIns).select('id, member_id, note, mood, date, time').eq('user_id', uid).order('id'),
      sb.from(TABLES.parentCirclePosts).select('id, text, date, time, reactions, circle_tag').eq('user_id', uid).order('id'),
      sb.from(TABLES.posts)
        .select('id, body, mood_tag, is_identity_revealed, created_at, circles!inner(kind)')
        .eq('author_user_id', uid).eq('is_deleted', false).order('created_at'),
      sb.from(TABLES.roomMemory).select('character, last_visit, last_hotspot, last_summon, visit_count').eq('user_id', uid).maybeSingle(),
    ]);

    function settled<T>(res: PromiseSettledResult<{ data: T | null; error: any }>): T | null {
      if (res.status === 'rejected') return null;
      if (res.value.error) { console.warn('[sync] pullAll partial error:', res.value.error.message); return null; }
      return res.value.data;
    }

    const moods       = settled<any[]>(moodRes as any)         ?? [];
    const journals    = settled<any[]>(journalRes as any)      ?? [];
    const circles     = settled<any[]>(circleRes as any)       ?? [];
    const voices      = settled<any[]>(voiceRes as any)        ?? [];
    const comforts    = settled<any[]>(comfortRes as any)      ?? [];
    const crewMs      = settled<any[]>(crewMemberRes as any)   ?? [];
    const crewCIs     = settled<any[]>(crewCheckInRes as any)  ?? [];
    const parentPosts = settled<any[]>(parentCircleRes as any) ?? [];
    const circleV2    = settled<any[]>(circleV2Res as any)     ?? [];
    const room        = settled<any>(roomRes as any);

    return {
      moodHistory: moods.map(r => ({ id: r.id, mood: r.mood, date: r.date, time: r.time })) as MoodEntry[],
      journalEntries: journals.map(r => ({ id: r.id, text: r.text, mood: r.mood, date: r.date, time: r.time, sekretReply: r.sekret_reply ?? undefined })) as JournalEntry[],
      circlePosts: circles.map(r => ({ id: r.id, text: r.text, date: r.date, time: r.time, reactions: r.reactions ?? {}, circleTag: r.circle_tag ?? undefined, postMood: r.post_mood ?? undefined, mediaKind: r.media_kind ?? undefined })) as CirclePost[],
      voiceNotes: voices.map(r => ({ id: r.id, title: r.title, date: r.date, time: r.time, duration: r.duration })) as VoiceNote[],
      comfortSessions: comforts.map(r => ({ id: r.id, type: r.type, mood: r.mood ?? undefined, date: r.date, time: r.time })) as ComfortSession[],
      crewMembers: crewMs.map(r => ({ id: r.id, name: r.name, emoji: r.emoji, commitment: r.commitment, cadence: r.cadence, inviteCode: r.invite_code, addedAt: r.added_at ? new Date(r.added_at).getTime() : undefined })) as CrewMember[],
      crewCheckIns: crewCIs.map(r => ({ id: r.id, memberId: r.member_id, note: r.note, mood: r.mood ?? undefined, date: r.date, time: r.time })) as CrewCheckIn[],
      parentCirclePosts: parentPosts.map(r => ({ id: r.id, text: r.text, date: r.date, time: r.time, reactions: r.reactions ?? {}, circleTag: r.circle_tag ?? undefined })) as ParentCirclePost[],
      circleV2Posts: circleV2.map(r => ({
        id: r.id, kind: r.circles.kind, text: r.body,
        postMood: r.mood_tag ?? undefined,
        isIdentityRevealed: Boolean(r.is_identity_revealed),
        createdAt: r.created_at,
      })) as CircleV2Post[],
      roomMemory: room ? { character: room.character, lastVisit: room.last_visit ?? '', lastHotspot: room.last_hotspot ?? '', lastSummon: room.last_summon ?? '', visitCount: room.visit_count ?? 0 } : null,
    };
  } catch (e) {
    if (__DEV__) console.warn('[sync] pullAll failed', e);
    return null;
  }
}

// ── Re-export compat modules so all @/utils/sync imports keep working ────────
export * from './parentBridgeCompat';
export * from './pointsCompat';
