// src/utils/parentLink.ts
// Se'kret Bip — Parent ↔ Teen linking helpers
//
// Flow:
//   Teen:   generateInviteCode()   → share 6-char code with parent
//   Parent: redeemInviteCode(code) → atomically activates link + verifies teen
//   Parent: fetchLinkedTeenId()    → returns teen's user_id for snapshot reads
//   Teen:   revokeParentLink()     → sets status='revoked', parent loses access
//
// All operations are safe no-ops when Supabase isn't configured.
// RLS and protected verification transitions are enforced server-side.

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
 * Existing pending invite for this teen is replaced.
 */
export async function generateInviteCode(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const code = randomCode();

  try {
    await sb
      .from('parent_links')
      .update({ status: 'revoked' })
      .eq('teen_user_id', uid)
      .eq('status', 'pending');

    const { error } = await sb.from('parent_links').insert({
      teen_user_id: uid,
      invite_code: code,
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      console.warn('[parentLink] generateInviteCode failed:', error.message);
      return null;
    }

    return code;
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] generateInviteCode threw', error);
    return null;
  }
}

/**
 * (Parent) Redeem an invite code through the server-authoritative RPC.
 * The database atomically activates the parent link and moves the teen to
 * VERIFIED_TEEN. The client never writes account_verification directly.
 */
export async function redeemInviteCode(code: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const normalized = code.toUpperCase().trim();
  if (!normalized) return null;

  try {
    const { data, error } = await sb.rpc('redeem_parent_link_invite', {
      p_invite_code: normalized,
    });

    if (error) {
      console.warn('[parentLink] redeemInviteCode failed:', error.message);
      return null;
    }

    return typeof data === 'string' ? data : null;
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] redeemInviteCode threw', error);
    return null;
  }
}

/** Return the teen_user_id for the active link belonging to this parent. */
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
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[parentLink] fetchLinkedTeenId failed:', error.message);
      return null;
    }

    return (data?.teen_user_id as string) ?? null;
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] fetchLinkedTeenId threw', error);
    return null;
  }
}

/** Teen revokes the active parent link. */
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
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] revokeParentLink threw', error);
    return false;
  }
}
