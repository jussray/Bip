import { isRelationshipFeatureAvailable } from '@/constants/relationshipFeatureFlags';
import type {
  CrewCheckinEmoji,
  RelationshipResult,
} from '@/types/relationshipLayer';
import { getSupabase } from '@/utils/supabase';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CrewCheckInInput {
  localDate: string;        // YYYY-MM-DD
  emoji: CrewCheckinEmoji;
  note?: string;            // max 280 chars; stripped before storage
  shareWithUserIds: string[]; // must all be accepted crew members
}

export interface CrewCheckInItem {
  id: string;
  ownerUserId: string;
  localDate: string;
  emoji: CrewCheckinEmoji;
  note: string | null;
  status: 'active' | 'deleted';
  createdAt: string;
  shares: Array<{ sharedWith: string; status: 'active' | 'revoked' }>;
}

export interface CrewFeedItem {
  checkInId: string;
  shareId: string;
  ownerUserId: string;
  localDate: string;
  emoji: CrewCheckinEmoji;
  note: string | null;
  createdAt: string;
  encouragementCount: number;
  myEncouragementKey: string | null;
}

export interface EncouragementInput {
  checkInId: string;
  recipientUserId: string;
  presetKey: string;
  localDate: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function unavailable<T>(): RelationshipResult<T> {
  return { ok: false, code: 'not_configured', message: 'Crew Accountability is not available yet.' };
}

const MAX_NOTE_LENGTH = 280;
const MAX_SHARES = 10;

function sanitizeNote(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, MAX_NOTE_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

// ─────────────────────────────────────────────────────────────
// createCheckIn
// Teen creates a check-in and immediately shares with chosen crew.
// All shareWithUserIds are verified accepted crew before insert.
// ─────────────────────────────────────────────────────────────

export async function createCheckIn(
  input: CrewCheckInInput,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<{ checkInId: string }>> {
  if (!isRelationshipFeatureAvailable('crewAccountability', audience)) return unavailable();

  if (!input.localDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.localDate)) {
    return { ok: false, code: 'invalid_input', message: 'localDate must be YYYY-MM-DD.' };
  }
  if (input.shareWithUserIds.length === 0) {
    return { ok: false, code: 'invalid_input', message: 'Choose at least one crew member to share with.' };
  }
  if (input.shareWithUserIds.length > MAX_SHARES) {
    return { ok: false, code: 'invalid_input', message: `You can share with at most ${MAX_SHARES} crew members at once.` };
  }

  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'not_authenticated', message: 'Sign in to create a check-in.' };

  // Verify all recipients are accepted crew members
  const { data: crewRows, error: crewError } = await sb
    .from('crew_members')
    .select('member_id')
    .eq('user_id', user.id)
    .eq('connection_status', 'accepted')
    .in('member_id', input.shareWithUserIds);

  if (crewError) return { ok: false, code: 'server_error', message: crewError.message };

  const acceptedIds = new Set((crewRows ?? []).map((r: { member_id: string }) => r.member_id));
  const unaccepted = input.shareWithUserIds.filter((id) => !acceptedIds.has(id));
  if (unaccepted.length > 0) {
    return { ok: false, code: 'not_authorized', message: 'One or more recipients are not accepted crew members.' };
  }

  // Insert check-in
  const { data: checkIn, error: insertError } = await sb
    .from('crew_check_ins')
    .insert({
      owner_user_id: user.id,
      local_date: input.localDate,
      emoji: input.emoji,
      note: sanitizeNote(input.note),
    })
    .select('id')
    .single();

  if (insertError || !checkIn) {
    return { ok: false, code: 'server_error', message: insertError?.message ?? 'Could not create the check-in.', retryable: true };
  }

  // Insert shares
  const shareRows = input.shareWithUserIds.map((memberId) => ({
    check_in_id: checkIn.id,
    owner_user_id: user.id,
    shared_with: memberId,
  }));

  const { error: shareError } = await sb.from('crew_check_in_shares').insert(shareRows);
  if (shareError) {
    // Check-in exists but shares failed — return partial failure with retryable hint
    return { ok: false, code: 'server_error', message: 'Check-in saved but could not share with crew.', retryable: true };
  }

  return { ok: true, value: { checkInId: checkIn.id } };
}

// ─────────────────────────────────────────────────────────────
// revokeCheckInShare
// Teen revokes a specific share. Access ends immediately.
// ─────────────────────────────────────────────────────────────

export async function revokeCheckInShare(
  checkInId: string,
  sharedWithUserId: string,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<{ revoked: boolean }>> {
  if (!isRelationshipFeatureAvailable('crewAccountability', audience)) return unavailable();

  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'not_authenticated', message: 'Sign in to revoke a share.' };

  const { error } = await sb
    .from('crew_check_in_shares')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('check_in_id', checkInId)
    .eq('owner_user_id', user.id)
    .eq('shared_with', sharedWithUserId);

  if (error) return { ok: false, code: 'server_error', message: error.message };
  return { ok: true, value: { revoked: true } };
}

// ─────────────────────────────────────────────────────────────
// fetchMyCheckIns
// Teen's own check-in history with share status.
// ─────────────────────────────────────────────────────────────

export async function fetchMyCheckIns(
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<CrewCheckInItem[]>> {
  if (!isRelationshipFeatureAvailable('crewAccountability', audience)) return unavailable();

  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'not_authenticated', message: 'Sign in to view your check-ins.' };

  const { data, error } = await sb
    .from('crew_check_ins')
    .select(`
      id, owner_user_id, local_date, emoji, note, status, created_at,
      crew_check_in_shares (shared_with, status)
    `)
    .eq('owner_user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { ok: false, code: 'server_error', message: error.message };

  const items: CrewCheckInItem[] = (data ?? []).map((row: {
    id: string; owner_user_id: string; local_date: string; emoji: string;
    note: string | null; status: string; created_at: string;
    crew_check_in_shares: Array<{ shared_with: string; status: string }>;
  }) => ({
    id: row.id,
    ownerUserId: row.owner_user_id,
    localDate: row.local_date,
    emoji: row.emoji as CrewCheckinEmoji,
    note: row.note,
    status: row.status as 'active' | 'deleted',
    createdAt: row.created_at,
    shares: (row.crew_check_in_shares ?? []).map((s) => ({
      sharedWith: s.shared_with,
      status: s.status as 'active' | 'revoked',
    })),
  }));

  return { ok: true, value: items };
}

// ─────────────────────────────────────────────────────────────
// fetchCrewFeed
// Crew member sees check-ins shared with them.
// RLS ensures only accepted connections reach this query.
// ─────────────────────────────────────────────────────────────

export async function fetchCrewFeed(
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<CrewFeedItem[]>> {
  if (!isRelationshipFeatureAvailable('crewAccountability', audience)) return unavailable();

  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'not_authenticated', message: 'Sign in to view your crew feed.' };

  const { data: shares, error: shareError } = await sb
    .from('crew_check_in_shares')
    .select('id, check_in_id, owner_user_id, status')
    .eq('shared_with', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  if (shareError) return { ok: false, code: 'server_error', message: shareError.message };
  if (!shares || shares.length === 0) return { ok: true, value: [] };

  const checkInIds = shares.map((s: { check_in_id: string }) => s.check_in_id);

  const { data: checkIns, error: checkInError } = await sb
    .from('crew_check_ins')
    .select('id, owner_user_id, local_date, emoji, note, created_at')
    .in('id', checkInIds)
    .eq('status', 'active');

  if (checkInError) return { ok: false, code: 'server_error', message: checkInError.message };

  const { data: encouragements, error: encError } = await sb
    .from('crew_encouragements')
    .select('check_in_id, sender_user_id, preset_key')
    .in('check_in_id', checkInIds)
    .eq('status', 'active');

  if (encError) return { ok: false, code: 'server_error', message: encError.message };

  const checkInMap = new Map(
    (checkIns ?? []).map((c: {
      id: string; owner_user_id: string; local_date: string;
      emoji: string; note: string | null; created_at: string;
    }) => [c.id, c])
  );

  // Tally encouragements per check-in and find my own
  const encCountMap = new Map<string, number>();
  const myEncMap = new Map<string, string>();
  for (const enc of (encouragements ?? []) as Array<{ check_in_id: string; sender_user_id: string; preset_key: string }>) {
    encCountMap.set(enc.check_in_id, (encCountMap.get(enc.check_in_id) ?? 0) + 1);
    if (enc.sender_user_id === user.id) myEncMap.set(enc.check_in_id, enc.preset_key);
  }

  const items: CrewFeedItem[] = [];
  for (const share of shares as Array<{ id: string; check_in_id: string; owner_user_id: string }>) {
    const c = checkInMap.get(share.check_in_id);
    if (!c) continue;
    items.push({
      checkInId: c.id,
      shareId: share.id,
      ownerUserId: c.owner_user_id,
      localDate: c.local_date,
      emoji: c.emoji as CrewCheckinEmoji,
      note: c.note,
      createdAt: c.created_at,
      encouragementCount: encCountMap.get(c.id) ?? 0,
      myEncouragementKey: myEncMap.get(c.id) ?? null,
    });
  }

  return { ok: true, value: items };
}

// ─────────────────────────────────────────────────────────────
// sendEncouragement
// Crew member sends a preset reaction back to the teen.
// ─────────────────────────────────────────────────────────────

export async function sendEncouragement(
  input: EncouragementInput,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
): Promise<RelationshipResult<{ encouragementId: string }>> {
  if (!isRelationshipFeatureAvailable('crewAccountability', audience)) return unavailable();

  if (!input.presetKey.trim()) {
    return { ok: false, code: 'invalid_input', message: 'Choose a preset encouragement.' };
  }
  if (!input.localDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.localDate)) {
    return { ok: false, code: 'invalid_input', message: 'localDate must be YYYY-MM-DD.' };
  }

  const sb = getSupabase();
  if (!sb) return unavailable();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'not_authenticated', message: 'Sign in to send encouragement.' };

  const { data, error } = await sb
    .from('crew_encouragements')
    .insert({
      check_in_id: input.checkInId,
      sender_user_id: user.id,
      recipient_user_id: input.recipientUserId,
      preset_key: input.presetKey.trim(),
      local_date: input.localDate,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, code: 'server_error', message: error?.message ?? 'Could not send encouragement.', retryable: true };
  }

  return { ok: true, value: { encouragementId: data.id } };
}
