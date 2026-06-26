// src/utils/parentLink.ts
// Se'kret Bip — Parent ↔ Teen linking helpers
//
// Flow:
//   Teen:   generateInviteCode()   → share 6-char code with parent
//   Parent: redeemInviteCode(code) → sets parent_user_id + status='active'
//   Parent: fetchLinkedTeenId()    → returns teen's user_id for snapshot reads
//   Teen:   revokeParentLink()     → sets status='revoked', parent loses access
//
// All operations are safe no-ops when Supabase isn't configured.
// RLS on parent_links is enforced server-side — these helpers just drive it.

import { getSupabase } from './supabase';

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

/** Generate a random 6-char alphanumeric invite code (uppercase). */
function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * (Teen) Create a pending invite link and return the 6-char code.
 * Existing pending invite for this teen is replaced (upsert on teen_user_id).
 * Returns null if Supabase isn't configured or user isn't signed in.
 */
export async function generateInviteCode(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const code = randomCode();
  try {
    // Revoke any existing pending invite first so there's only ever one active code.
    await sb
      .from('parent_links')
      .update({ status: 'revoked' })
      .eq('teen_user_id', uid)
      .eq('status', 'pending');

    const { error } = await sb.from('parent_links').insert({
      teen_user_id: uid,
      invite_code:  code,
      status:       'pending',
      expires_at:   new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });
    if (error) {
      console.warn('[parentLink] generateInviteCode failed:', error.message);
      return null;
    }
    return code;
  } catch (e) {
    if (__DEV__) console.warn('[parentLink] generateInviteCode threw', e);
    return null;
  }
}

/**
 * (Parent) Redeem an invite code.
 * Sets parent_user_id = current user, status = 'active', linked_at = now.
 * Returns the linked teen's user_id on success, null on failure/expired/invalid.
 */
export async function redeemInviteCode(code: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    // Look up the pending invite (RLS 'code lookup' policy allows this for anyone).
    const { data: link, error: lookupErr } = await sb
      .from('parent_links')
      .select('id, teen_user_id, expires_at')
      .eq('invite_code', code.toUpperCase().trim())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (lookupErr || !link) {
      if (__DEV__) console.warn('[parentLink] redeemInviteCode: invalid or expired code', lookupErr?.message);
      return null;
    }

    // Accept the invite — parent update policy enforces status='active' in WITH CHECK.
    const { error: updateErr } = await sb
      .from('parent_links')
      .update({
        parent_user_id: uid,
        status:         'active',
        linked_at:      new Date().toISOString(),
      })
      .eq('id', link.id);

    if (updateErr) {
      console.warn('[parentLink] redeemInviteCode update failed:', updateErr.message);
      return null;
    }

    return link.teen_user_id as string;
  } catch (e) {
    if (__DEV__) console.warn('[parentLink] redeemInviteCode threw', e);
    return null;
  }
}

/**
 * (Parent) Return the teen_user_id for the active link belonging to this parent.
 * Returns null if no active link exists or Supabase isn't configured.
 */
export async function fetchLinkedTeenId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await sb
      .from('parent_links')
      .select('teen_user_id')
      .eq('parent_user_id', uid)
      .eq('status', 'active')
      .order('linked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[parentLink] fetchLinkedTeenId failed:', error.message);
      return null;
    }
    return (data?.teen_user_id as string) ?? null;
  } catch (e) {
    if (__DEV__) console.warn('[parentLink] fetchLinkedTeenId threw', e);
    return null;
  }
}

/**
 * (Teen) Revoke the active parent link.
 * Parent immediately loses access — RLS parent-read policy checks status='active'.
 */
export async function revokeParentLink(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await sb
      .from('parent_links')
      .update({ status: 'revoked' })
      .eq('teen_user_id', uid)
      .eq('status', 'active');

    if (error) {
      console.warn('[parentLink] revokeParentLink failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[parentLink] revokeParentLink threw', e);
    return false;
  }
}
