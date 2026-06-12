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
    id:     entry.id,
    mood:   entry.mood,
    date:   entry.date,
    time:   entry.time,
  });
}

// ── Journal ────────────────────────────────────────────────────────────────
export function syncJournal(entry: JournalEntry): void {
  void safeUpsert(TABLES.journalEntries, {
    id:    entry.id,
    text:  entry.text,
    mood:  entry.mood,
    date:  entry.date,
    time:  entry.time,
  });
}

// ── Circle (Teen) ──────────────────────────────────────────────────────────
export function syncCirclePost(post: CirclePost): void {
  void safeUpsert(TABLES.circlePosts, {
    id:        post.id,
    text:      post.text,
    date:      post.date,
    time:      post.time,
    reactions: post.reactions,
    circle_tag: post.circleTag ?? null,
    post_mood:  post.postMood ?? null,
    media_kind: post.mediaKind ?? null,
  });
}

// ── Circle (Parent) ────────────────────────────────────────────────────────
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

// ── Voice ──────────────────────────────────────────────────────────────────
export function syncVoiceNote(note: VoiceNote): void {
  void safeUpsert(TABLES.voiceNotes, {
    id:       note.id,
    title:    note.title,
    date:     note.date,
    time:     note.time,
    duration: note.duration,
  });
}

// ── Comfort sessions ───────────────────────────────────────────────────────
export function syncComfortSession(session: ComfortSession): void {
  void safeUpsert(TABLES.comfortSessions, {
    id:   session.id,
    type: session.type,
    mood: session.mood ?? null,
    date: session.date,
    time: session.time,
  });
}

// ── Crew ───────────────────────────────────────────────────────────────────
export function syncCrewMember(m: CrewMember): void {
  void safeUpsert(TABLES.crewMembers, {
    id:          m.id,
    name:        m.name,
    emoji:       m.emoji,
    commitment:  m.commitment,
    cadence:     m.cadence,
    invite_code: m.inviteCode,
    added_at:    m.addedAt,
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

// ── Points snapshot (optional — derived in UI, can also be stored) ────────
export async function snapshotPoints(total: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await sb.from(TABLES.bipPoints).insert({
      user_id: uid,
      total,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    if (__DEV__) console.warn('[sync] snapshotPoints failed', e);
  }
}

// ── Bulk pull (initial restore — optional, opt-in from app boot) ───────────
// Reads cloud rows for the signed-in user. Useful when migrating a fresh
// install. Returns null if offline — caller falls back to local state.
export async function pullAll(): Promise<{
  moodHistory:     MoodEntry[];
  journalEntries:  JournalEntry[];
  circlePosts:     CirclePost[];
  voiceNotes:      VoiceNote[];
  comfortSessions: ComfortSession[];
  crewMembers:     CrewMember[];
  crewCheckIns:    CrewCheckIn[];
} | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const tables = [
      TABLES.moodHistory, TABLES.journalEntries, TABLES.circlePosts,
      TABLES.voiceNotes, TABLES.comfortSessions, TABLES.crewMembers, TABLES.crewCheckIns,
    ];
    const results = await Promise.all(
      tables.map(t => sb.from(t).select('*').eq('user_id', uid).order('id', { ascending: false })),
    );
    const [mood, journal, circle, voice, comfort, crew, check] = results.map(r => r.data || []);
    return {
      moodHistory:     mood     as MoodEntry[],
      journalEntries:  journal  as JournalEntry[],
      circlePosts:     circle   as CirclePost[],
      voiceNotes:      voice    as VoiceNote[],
      comfortSessions: comfort  as ComfortSession[],
      crewMembers:     (crew as any[]).map(r => ({
        id: r.id, name: r.name, emoji: r.emoji, commitment: r.commitment,
        cadence: r.cadence, inviteCode: r.invite_code, addedAt: r.added_at,
      })),
      crewCheckIns:    (check as any[]).map(r => ({
        id: r.id, memberId: r.member_id, note: r.note,
        mood: r.mood, date: r.date, time: r.time,
      })),
    };
  } catch (e) {
    if (__DEV__) console.warn('[sync] pullAll failed', e);
    return null;
  }
}
