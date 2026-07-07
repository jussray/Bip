// src/utils/parentLink.ts
// Se'kret Bip — Parent ↔ Teen linking helpers

import { getSupabase } from './supabase';
import { mapParentInviteRpcError, type ParentInviteRpcErrorCode } from './parentLinkErrors';

export const PARENT_INVITE_CODE_LENGTH = 8;

export type ParentLinkErrorCode =
  | 'not_configured'
  | ParentInviteRpcErrorCode
  | 'expired_or_used';

export type ParentLinkResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: ParentLinkErrorCode; message: string };

interface RedeemParentLinkRow {
  link_id?: unknown;
  teen_user_id?: unknown;
  parent_user_id?: unknown;
  status?: unknown;
  activated_at?: unknown;
}

export function normalizeParentInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PARENT_INVITE_CODE_LENGTH);
}

function extractRedeemedTeenId(data: unknown): string | null {
  const row: RedeemParentLinkRow | null = Array.isArray(data)
    ? ((data[0] as RedeemParentLinkRow | undefined) ?? null)
    : data && typeof data === 'object'
      ? (data as RedeemParentLinkRow)
      : null;

  return typeof row?.teen_user_id === 'string' && row.teen_user_id.length > 0
    ? row.teen_user_id
    : null;
}

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

export async function generateInviteCodeResult(): Promise<ParentLinkResult<string>> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, code: 'not_configured', message: 'The secure connection service is not configured.' };
  }

  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, code: 'not_authenticated', message: 'Sign in to create a parent invite code.' };
  }

  try {
    const { data, error } = await sb.rpc('create_parent_link_invite');
    if (error) {
      console.warn('[parentLink] generateInviteCode failed:', error.message);
      return mapParentInviteRpcError(error.message);
    }

    const code = typeof data === 'string' ? normalizeParentInviteCode(data) : '';
    if (code.length !== PARENT_INVITE_CODE_LENGTH) {
      return { ok: false, code: 'server_error', message: 'The server returned an invalid invite code.' };
    }

    return { ok: true, value: code };
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] generateInviteCode threw', error);
    return { ok: false, code: 'server_error', message: 'Could not create an invite code. Check your connection and try again.' };
  }
}

export async function generateInviteCode(): Promise<string | null> {
  const result = await generateInviteCodeResult();
  return result.ok ? result.value : null;
}

export async function fetchPendingInviteCode(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const userId = await currentUserId();
  if (!userId) return null;

  try {
    const { data, error } = await sb
      .from('parent_links')
      .select('invite_code,expires_at,status,is_active')
      .eq('teen_user_id', userId)
      .eq('status', 'pending')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.invite_code) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return null;

    const code = normalizeParentInviteCode(String(data.invite_code));
    return code.length === PARENT_INVITE_CODE_LENGTH ? code : null;
  } catch {
    return null;
  }
}

export async function redeemInviteCodeResult(code: string): Promise<ParentLinkResult<string>> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, code: 'not_configured', message: 'The secure connection service is not configured.' };
  }

  const normalized = normalizeParentInviteCode(code);
  if (normalized.length !== PARENT_INVITE_CODE_LENGTH) {
    return { ok: false, code: 'invalid_code', message: 'Enter the full eight-character code.' };
  }

  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, code: 'not_authenticated', message: 'Sign in as the parent or trusted adult before connecting.' };
  }

  try {
    const { data, error } = await sb.rpc('redeem_parent_link_invite', {
      p_invite_code: normalized,
    });

    if (error) {
      console.warn('[parentLink] redeemInviteCode failed:', error.message);
      return mapParentInviteRpcError(error.message);
    }

    const teenId = extractRedeemedTeenId(data);
    if (!teenId) {
      return {
        ok: false,
        code: 'expired_or_used',
        message: 'That code could not be connected. Ask your teen for a new one.',
      };
    }

    return { ok: true, value: teenId };
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] redeemInviteCode threw', error);
    return { ok: false, code: 'server_error', message: 'Could not connect right now. Check your connection and try again.' };
  }
}

export async function redeemInviteCode(code: string): Promise<string | null> {
  const result = await redeemInviteCodeResult(code);
  return result.ok ? result.value : null;
}

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
      .eq('is_active', true)
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

export async function fetchLinkedParentId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  try {
    const { data, error } = await sb
      .from('parent_links')
      .select('parent_user_id')
      .eq('teen_user_id', uid)
      .eq('status', 'active')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[parentLink] fetchLinkedParentId failed:', error.message);
      return null;
    }

    return (data?.parent_user_id as string) ?? null;
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] fetchLinkedParentId threw', error);
    return null;
  }
}

export async function revokeParentLink(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data, error } = await sb.rpc('revoke_parent_link');
    if (error) {
      console.warn('[parentLink] revokeParentLink failed:', error.message);
      return false;
    }

    return data === true;
  } catch (error) {
    if (__DEV__) console.warn('[parentLink] revokeParentLink threw', error);
    return false;
  }
}
