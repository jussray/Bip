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
import type {
  JournalEntry, MoodEntry, CirclePost, ParentCirclePost, VoiceNote,
  ComfortSession, CrewMember, CrewCheckIn,
} from '../../types/index';
import type {
  CircleTab,
  PublicCirclePost,
  FriendsCirclePost,
  CrewCirclePost,
  ParentCirclePost as CircleParentPost,
} from '../../types/circle';

// ── Internal helpers ────────────────────────────────────────────────────────
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
    await sb.from(table).upsert(withUser, { onConflict: 'id,user_id' });
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
    await sb.from(table).delete().match({ id, user_id: uid });
  } catch (e) {
    if (__DEV__) console.warn(`[sync] delete ${table} failed`, e);
  }
}

// ── Anonymous sign-in ────────────────────────────────────────────────────────
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

// ── Mood ────────────────────────────────────────────────────────────────────
export function syncMood(entry: MoodEntry): void {
  void safeUpsert(TABLES.moodHistory, {
    id:   entry.id,
    mood: entry.mood,
    date: entry.date,
    time: entry.time,
  });
}

// ── Journal ────────────────────────────────────────────────────────────────
export function syncJournal(entry: JournalEntry): void {
  void safeUpsert(TABLES.journalEntries, {
    id:           entry.id,
    text:         entry.text,
    mood:         entry.mood,
    date:         entry.date,
    time:         entry.time,
    sekret_reply: entry.sekretReply ?? null,
  });
}

// ── Circle (legacy drain path) ──────────────────────────────────────────────
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

// ── Parent Circle: cloud read ─────────────────────────────────────────────────
/**
 * loadParentCircleFeed
 * Reads the user's own parent_circle_posts from Supabase, most-recent first.
 * Returns an empty array if Supabase is unconfigured, the user is not
 * authenticated, or the network call fails — never throws.
 *
 * Merge strategy in the caller: use the returned array to fill any posts that
 * are missing from local state (additive, never destructive).
 */
export async function loadParentCircleFeed(
  limit = 50,
): Promise<ParentCirclePost[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  try {
    const { data, error } = await sb
      .from(TABLES.parentCirclePosts)
      .select('id, text, date, time, reactions, circle_tag')
      .eq('user_id', uid)
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id:        r.id,
      text:      r.text,
      date:      r.date,
      time:      r.time,
      reactions: r.reactions ?? { beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0 },
      circleTag: r.circle_tag ?? undefined,
    })) as ParentCirclePost[];
  } catch (e) {
    if (__DEV__) console.warn('[sync] loadParentCircleFeed failed', e);
    return [];
  }
}

// ── Circle V1: resolve circle_id ─────────────────────────────────────────────
async function resolveOwnCircleId(
  uid: string,
  kind: 'public' | 'friends' | 'crew',
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from(TABLES.circles)
      .select('id')
      .eq('owner_user_id', uid)
      .eq('kind', kind)
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  } catch (e) {
    if (__DEV__) console.warn(`[sync] resolveOwnCircleId(${kind}) failed`, e);
    return null;
  }
}

// ── Circle V1: Live feed reads ────────────────────────────────────────────────
export async function loadCircleFeed(
  tab: CircleTab,
  limit = 30,
): Promise<PublicCirclePost[] | FriendsCirclePost[] | CrewCirclePost[] | CircleParentPost[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  if (tab === 'parent') return [];
  try {
    if (tab === 'public') {
      const { data, error } = await sb
        .from(TABLES.posts)
        .select(`id, body, mood_tag, is_identity_revealed, created_at, circles!inner ( kind )`)
        .eq('circles.kind', 'public')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id: r.id, text: r.body, post_mood: r.mood_tag ?? null,
        media_kind: null, reactions: {}, created_at: r.created_at,
      })) as PublicCirclePost[];
    }
    if (tab === 'friends') {
      const { data, error } = await sb
        .from(TABLES.posts)
        .select(`id, author_user_id, body, mood_tag, created_at, circles!inner ( kind )`)
        .eq('circles.kind', 'friends')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id: r.id, user_id: r.author_user_id, nickname: '', avatar_emoji: '',
        text: r.body, post_mood: r.mood_tag ?? null, media_kind: null,
        reactions: {}, created_at: r.created_at,
      })) as FriendsCirclePost[];
    }
    if (tab === 'crew') {
      const { data, error } = await sb
        .from(TABLES.posts)
        .select(`id, author_user_id, body, mood_tag, created_at, circles!inner ( kind )`)
        .eq('circles.kind', 'crew')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id: r.id, user_id: r.author_user_id, nickname: '', avatar_emoji: '',
        text: r.body, post_mood: r.mood_tag ?? null, media_kind: null,
        reactions: {}, created_at: r.created_at,
      })) as CrewCirclePost[];
    }
    return null;
  } catch (e) {
    if (__DEV__) console.warn(`[sync] loadCircleFeed(${tab}) failed`, e);
    return null;
  }
}

// ── Circle V1: Reaction sync ──────────────────────────────────────────────────
export async function syncCircleReaction(
  postId: string | number,
  tabOrReaction: string,
  reaction?: string,
): Promise<void> {
  const actualReaction = reaction ?? tabOrReaction;
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await sb
      .from(TABLES.postReactions)
      .upsert(
        { post_id: postId, user_id: uid, reaction: actualReaction },
        { onConflict: 'post_id,user_id,reaction', ignoreDuplicates: true },
      );
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncCircleReaction failed', e);
  }
}

// ── Circle V1: Post write ─────────────────────────────────────────────────────
export async function writeCirclePost(
  tab: CircleTab,
  text: string,
  opts: { postMood?: string; circleTag?: string; mediaKind?: string; revealIdentity?: boolean } = {},
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  if (tab === 'parent') {
    if (__DEV__) console.warn('[sync] writeCirclePost: parent tab is not a post destination');
    return;
  }
  const kind = tab as 'public' | 'friends' | 'crew';
  const circleId = await resolveOwnCircleId(uid, kind);
  if (!circleId) {
    if (__DEV__) console.warn(`[sync] writeCirclePost: no circle found for kind=${kind}`);
    return;
  }
  try {
    await sb.from(TABLES.posts).insert({
      author_user_id:       uid,
      circle_id:            circleId,
      body:                 text,
      mood_tag:             opts.postMood  ?? null,
      content_warning:      opts.circleTag ?? null,
      is_identity_revealed: kind === 'public' ? (opts.revealIdentity ?? false) : true,
      is_deleted:           false,
      created_at:           new Date().toISOString(),
    });
  } catch (e) {
    if (__DEV__) console.warn(`[sync] writeCirclePost(${tab}) failed`, e);
  }
}

// ── Voice ─────────────────────────────────────────────────────────────────────
export function syncVoiceNote(note: VoiceNote): void {
  void safeUpsert(TABLES.voiceNotes, {
    id: note.id, title: note.title, date: note.date,
    time: note.time, duration: note.duration,
  });
}

// ── Comfort sessions ──────────────────────────────────────────────────────────
export function syncComfortSession(session: ComfortSession): void {
  void safeUpsert(TABLES.comfortSessions, {
    id: session.id, type: session.type,
    mood: session.mood ?? null, date: session.date, time: session.time,
  });
}

// ── Crew ──────────────────────────────────────────────────────────────────────
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
  void safeUpsert(TABLES.crewCheckIns, {
    id: c.id, member_id: c.memberId, note: c.note,
    mood: c.mood ?? null, date: c.date, time: c.time,
  });
}

// ── Points snapshot ──────────────────────────────────────────────────────────
export async function snapshotPoints(total: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await sb.from(TABLES.bipPoints).insert({
      user_id: uid, total, captured_at: new Date().toISOString(),
    });
  } catch (e) {
    if (__DEV__) console.warn('[sync] snapshotPoints failed', e);
  }
}

// ── Period calendar ───────────────────────────────────────────────────────────

/** Upsert a single period day (ISO date string, e.g. '2026-06-17'). */
export async function syncPeriodDay(day: string, note?: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await sb.from(TABLES.periodDays).upsert(
      { user_id: uid, day, note: note ?? null },
      { onConflict: 'user_id,day' },
    );
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
    await sb.from(TABLES.periodDays).delete().match({ user_id: uid, day });
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

// ── Oracle / companion memory ─────────────────────────────────────────────────

/**
 * Upsert the full oracle memory snapshot for a personality.
 * personality_id: 'teen' | 'parent'
 */
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
    await sb.from('oracle_sessions').upsert(
      {
        user_id:        uid,
        personality_id: personalityId,
        memory,
        session_count:  sessionCount,
        last_synced:    new Date().toISOString(),
      },
      { onConflict: 'user_id,personality_id' },
    );
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncOracleSession failed', e);
  }
}

/**
 * Load the latest oracle memory snapshot for a personality.
 * Returns null if not found or Supabase not configured.
 */
export async function loadOracleSession(
  personalityId: string,
): Promise<{ memory: Record<string, unknown>; sessionCount: number } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await sb
      .from('oracle_sessions')
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

// ── Bulk pull ─────────────────────────────────────────────────────────────────
export async function pullAll(): Promise<{
  moodHistory:       MoodEntry[];
  journalEntries:    JournalEntry[];
  circlePosts:       CirclePost[];
  voiceNotes:        VoiceNote[];
  comfortSessions:   ComfortSession[];
  crewMembers:       CrewMember[];
  crewCheckIns:      CrewCheckIn[];
  parentCirclePosts: ParentCirclePost[];
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
    const tables = [
      TABLES.moodHistory, TABLES.journalEntries, TABLES.circlePosts,
      TABLES.voiceNotes, TABLES.comfortSessions, TABLES.crewMembers,
      TABLES.crewCheckIns, TABLES.parentCirclePosts,
    ];
    const results = await Promise.all(
      tables.map(t => sb.from(t).select('*').eq('user_id', uid).order('id', { ascending: false })),
    );
    const [mood, journal, circle, voice, comfort, crew, check, parentCircle] =
      results.map(r => r.data || []);
    const { data: roomRow } = await sb
      .from(TABLES.roomMemory).select('*').eq('user_id', uid).maybeSingle();
    return {
      moodHistory:    mood as MoodEntry[],
      journalEntries: (journal as any[]).map(r => ({
        ...r, sekretReply: r.sekret_reply ?? undefined,
      })) as JournalEntry[],
      circlePosts:     circle  as CirclePost[],
      voiceNotes:      voice   as VoiceNote[],
      comfortSessions: comfort as ComfortSession[],
      crewMembers: (crew as any[]).map(r => ({
        id: String(r.id), name: r.name, emoji: r.emoji, relation: r.relation ?? '',
        commitment: r.commitment, cadence: r.cadence, inviteCode: r.invite_code, addedAt: r.added_at,
      })),
      crewCheckIns: (check as any[]).map(r => ({
        id: r.id, memberId: r.member_id, note: r.note,
        mood: r.mood, date: r.date, time: r.time,
      })),
      parentCirclePosts: (parentCircle as any[]).map(r => ({
        id: r.id, text: r.text, date: r.date, time: r.time,
        reactions: r.reactions ?? { beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0 },
        circleTag: r.circle_tag ?? undefined,
        mood: r.mood ?? undefined,
      })) as ParentCirclePost[],
      roomMemory: roomRow ? {
        character:   roomRow.character    ?? 'raylene',
        lastVisit:   roomRow.last_visit   ?? '',
        lastHotspot: roomRow.last_hotspot ?? '',
        lastSummon:  roomRow.last_summon  ?? '',
        visitCount:  roomRow.visit_count  ?? 0,
      } : null,
    };
  } catch (e) {
    if (__DEV__) console.warn('[sync] pullAll failed', e);
    return null;
  }
}
