// utils/sync.ts
// Se'kret Bip — Cloud sync layer (Phase 2 backend)
//
// All cloud writes go through here. Every helper is a SAFE NO-OP when
// Supabase isn't configured — the app keeps working off AsyncStorage, no
// errors thrown. This lets us ship the UI now and add credentials later.
//
// Auth model: each row is scoped to auth.uid() via RLS. If there's no
// signed-in user yet, writes are silently skipped (kept locally only). We'll
// add anonymous sign-in (supabase.auth.signInAnonymously) once we're ready
// to flip the switch in app/index.tsx.
//
// IMPORTANT: never throw. The user's local experience must never break
// because the cloud is down. Errors are logged and swallowed.

import { getSupabase, TABLES } from './supabase';
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
} from '../types/circle';

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

// ── Anonymous sign-in (call once on app boot if desired) ────────────────────
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
// sekret_reply is written when present so the reply survives device migration.
// The column is nullable — older rows without a reply write NULL, which is safe.
// MIGRATION REQUIRED before this field persists to Supabase:
//   supabase/migrations/add_sekret_reply.sql
//   ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sekret_reply text;
export function syncJournal(entry: JournalEntry): void {
  void safeUpsert(TABLES.journalEntries, {
    id:           entry.id,
    text:         entry.text,
    mood:         entry.mood,
    date:         entry.date,
    time:         entry.time,
    // sekretTyping is transient — never persisted.
    sekret_reply: entry.sekretReply ?? null,
  });
}

// ── Circle (legacy — used by pullAll drain path only) ───────────────────────
// Do not use syncCirclePost or syncParentCirclePost for new writes.
// These exist only to keep pullAll working until the V1 migration is complete.
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

// ── Circle V1: resolve circle_id for a tab ──────────────────────────────────
//
// Fetches the calling user's own circle row for the given kind.
// Returns null if not found (circle not yet created for this user).
// Callers: writeCirclePost, loadCircleFeed (friends/crew need circle_id for
// the feed owner — public reads all circles of kind='public').
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

// ── Circle V1: Live feed reads ───────────────────────────────────────────────
//
// Reads posts from the unified `posts` table, filtered by circle kind via a
// join on `circles`. RLS enforces visibility server-side — this function only
// maps DB rows to the typed shapes used by CircleScreen.
//
// Tab → circle kind:
//   public  → circles.kind = 'public'   (all users; user_id omitted from select)
//   friends → circles.kind = 'friends'  (mutual friendships; nickname via profile join)
//   crew    → circles.kind = 'crew'     (crew members only; nickname via profile join)
//   parent  → circles.kind = 'parent'   (parent bridge; summary only, no raw posts)
//
// Returns null when Supabase is not configured — caller falls back to mock data.
export async function loadCircleFeed(
  tab: CircleTab,
  limit = 30,
): Promise<PublicCirclePost[] | FriendsCirclePost[] | CrewCirclePost[] | CircleParentPost[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Parent tab does not surface raw posts — caller renders mood summary instead.
  if (tab === 'parent') return [];

  try {
    if (tab === 'public') {
      // Select posts in any public circle. user_id intentionally excluded.
      const { data, error } = await sb
        .from(TABLES.posts)
        .select(`
          id,
          body,
          mood_tag,
          is_identity_revealed,
          created_at,
          circles!inner ( kind )
        `)
        .eq('circles.kind', 'public')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id:           r.id,
        text:         r.body,
        post_mood:    r.mood_tag    ?? null,
        media_kind:   null,
        reactions:    {},
        created_at:   r.created_at,
      })) as PublicCirclePost[];
    }

    if (tab === 'friends') {
      const { data, error } = await sb
        .from(TABLES.posts)
        .select(`
          id,
          author_user_id,
          body,
          mood_tag,
          created_at,
          circles!inner ( kind )
        `)
        .eq('circles.kind', 'friends')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id:           r.id,
        user_id:      r.author_user_id,
        nickname:     '',    // populated from profile join in screen layer
        avatar_emoji: '',
        text:         r.body,
        post_mood:    r.mood_tag ?? null,
        media_kind:   null,
        reactions:    {},
        created_at:   r.created_at,
      })) as FriendsCirclePost[];
    }

    if (tab === 'crew') {
      const { data, error } = await sb
        .from(TABLES.posts)
        .select(`
          id,
          author_user_id,
          body,
          mood_tag,
          created_at,
          circles!inner ( kind )
        `)
        .eq('circles.kind', 'crew')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id:           r.id,
        user_id:      r.author_user_id,
        nickname:     '',
        avatar_emoji: '',
        text:         r.body,
        post_mood:    r.mood_tag ?? null,
        media_kind:   null,
        reactions:    {},
        created_at:   r.created_at,
      })) as CrewCirclePost[];
    }

    return null;
  } catch (e) {
    if (__DEV__) console.warn(`[sync] loadCircleFeed(${tab}) failed`, e);
    return null;
  }
}

// ── Circle V1: Reaction sync ─────────────────────────────────────────────────
//
// Upserts a reaction to post_reactions.
// UNIQUE constraint on (post_id, user_id, reaction) prevents double-tapping.
// ignoreDuplicates:true means a second tap is a no-op on DB.
// The optimistic update in CircleScreen is the user-visible change — this
// call keeps the cloud count eventually consistent.
export async function syncCircleReaction(
  postId: string,
  reaction: string,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await sb
      .from(TABLES.postReactions)
      .upsert(
        { post_id: postId, user_id: uid, reaction },
        { onConflict: 'post_id,user_id,reaction', ignoreDuplicates: true },
      );
  } catch (e) {
    if (__DEV__) console.warn('[sync] syncCircleReaction failed', e);
  }
}

// ── Circle V1: Post write ────────────────────────────────────────────────────
//
// Routes a new post to the unified `posts` table using the circle_id resolved
// from the calling user's own circle for the selected tab.
// Identity fields (author_user_id) are set explicitly from auth.uid().
// For the Public tab, is_identity_revealed defaults to false (anonymous).
export async function writeCirclePost(
  tab: CircleTab,
  text: string,
  opts: { postMood?: string; circleTag?: string; mediaKind?: string; revealIdentity?: boolean } = {},
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;

  // Parent tab is not a post destination — it is a read-only bridge.
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

// ── Voice ────────────────────────────────────────────────────────────────────
export function syncVoiceNote(note: VoiceNote): void {
  void safeUpsert(TABLES.voiceNotes, {
    id:       note.id,
    title:    note.title,
    date:     note.date,
    time:     note.time,
    duration: note.duration,
  });
}

// ── Comfort sessions ─────────────────────────────────────────────────────────
export function syncComfortSession(session: ComfortSession): void {
  void safeUpsert(TABLES.comfortSessions, {
    id:   session.id,
    type: session.type,
    mood: session.mood ?? null,
    date: session.date,
    time: session.time,
  });
}

// ── Crew ─────────────────────────────────────────────────────────────────────
export function syncCrewMember(m: CrewMember): void {
  void safeUpsert(TABLES.crewMembers, {
    id:          m.id,
    name:        m.name,
    emoji:       m.emoji,
    commitment:  m.commitment,
    cadence:     m.cadence,
    invite_code: m.inviteCode,
    added_at:    new Date(m.addedAt).toISOString(),
  });
}

export function deleteCrewMember(id: number): void {
  void safeDelete(TABLES.crewMembers, id);
}

export function syncCrewCheckIn(c: CrewCheckIn): void {
  void safeUpsert(TABLES.crewCheckIns, {
    id:        c.id,
    member_id: c.memberId,
    note:      c.note,
    mood:      c.mood ?? null,
    date:      c.date,
    time:      c.time,
  });
}

// ── Points snapshot (optional — derived in UI, can also be stored) ────────────
export async function snapshotPoints(total: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await sb.from(TABLES.bipPoints).insert({
      user_id:     uid,
      total,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    if (__DEV__) console.warn('[sync] snapshotPoints failed', e);
  }
}

// ── Bulk pull (initial restore — optional, opt-in from app boot) ──────────────
// Reads cloud rows for the signed-in user. Useful when migrating a fresh
// install. Returns null if offline — caller falls back to local state.
//
// NOTE: circlePosts and parentCirclePosts still read the legacy flat tables
// as a drain path. Once pullAll is migrated to V1 (posts + circles), remove
// those keys and switch to loadCircleFeed.
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
    character:   string;
    lastVisit:   string;
    lastHotspot: string;
    lastSummon:  string;
    visitCount:  number;
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

    // room_memory is a single-row-per-user table (PK is user_id only).
    const { data: roomRow } = await sb
      .from(TABLES.roomMemory)
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    return {
      moodHistory:    mood as MoodEntry[],
      journalEntries: (journal as any[]).map(r => ({
        ...r,
        sekretReply: r.sekret_reply ?? undefined,
      })) as JournalEntry[],
      circlePosts:     circle  as CirclePost[],
      voiceNotes:      voice   as VoiceNote[],
      comfortSessions: comfort as ComfortSession[],
      crewMembers: (crew as any[]).map(r => ({
        id: r.id, name: r.name, emoji: r.emoji, commitment: r.commitment,
        cadence: r.cadence, inviteCode: r.invite_code, addedAt: r.added_at,
      })),
      crewCheckIns: (check as any[]).map(r => ({
        id: r.id, memberId: r.member_id, note: r.note,
        mood: r.mood, date: r.date, time: r.time,
      })),
      parentCirclePosts: (parentCircle as any[]).map(r => ({
        id:        r.id,
        text:      r.text,
        date:      r.date,
        time:      r.time,
        reactions: r.reactions ?? {
          beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0,
        },
        circleTag: r.circle_tag ?? undefined,
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
