// src/utils/parentLink.ts
// Se'kret Bip — Parent ↔ Teen linking helpers

import { captureRuntimeError } from '@/services/runtimeAudit';
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

export interface RedeemedParentLink {
  linkId: string;
  teenUserId: string;
  parentUserId: string;
  status: 'active';
  activatedAt: string | null;
}

interface RedeemParentLinkRow {
  link_id?: unknown;
  teen_user_id?: unknown;
  parent_user_id?: unknown;
  status?: unknown;
  activated_at?: unknown;
}

async function auditParentLinkFailure(
  eventType: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await captureRuntimeError('parent_window', error, {
    event_type: eventType,
    screen: 'parentLink',
    severity: 'warning',
    metadata,
  }).catch(() => {});
}

export function normalizeParentInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PARENT_INVITE_CODE_LENGTH);
}

function firstRedeemRow(data: unknown): RedeemParentLinkRow | null {
  if (Array.isArray(data)) return (data[0] as RedeemParentLinkRow | undefined) ?? null;
  return data && typeof data === 'object' ? (data as RedeemParentLinkRow) : null;
}

function extractRedeemedTeenId(data: unknown): string | null {
  const row = firstRedeemRow(data);
  return typeof row?.teen_user_id === 'string' && row.teen_user_id.length > 0
    ? row.teen_user_id
    : null;
}

function parseRedeemedParentLink(data: unknown, expectedParentId: string): RedeemedParentLink | null {
  const row = firstRedeemRow(data);
  const teenUserId = extractRedeemedTeenId(data);
  if (!row || !teenUserId) return null;
  if (typeof row.link_id !== 'string' || row.link_id.length === 0) return null;
  if (typeof row.parent_user_id !== 'string' || row.parent_user_id !== expectedParentId) return null;
  if (row.status !== 'active') return null;
  if (row.activated_at != null && typeof row.activated_at !== 'string') return null;

  return {
    linkId: row.link_id,
    teenUserId,
    parentUserId: row.parent_user_id,
    status: 'active',
    activatedAt: row.activated_at ?? null,
  };
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.auth.getUser();
    if (error) {
      await auditParentLinkFailure('auth_user_lookup_failed', error);
      return null;
    }
    return data?.user?.id ?? null;
  } catch (error) {
    await auditParentLinkFailure('auth_user_lookup_threw', error);
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
      await auditParentLinkFailure('invite_generation_rpc_failed', error, { user_id: userId });
      return mapParentInviteRpcError(error.message);
    }

    const code = typeof data === 'string' ? normalizeParentInviteCode(data) : '';
    if (code.length !== PARENT_INVITE_CODE_LENGTH) {
      await auditParentLinkFailure(
        'invite_generation_response_invalid',
        new Error('Invalid invite-code response shape'),
        { response_type: typeof data },
      );
      return { ok: false, code: 'server_error', message: 'The server returned an invalid invite code.' };
    }

    return { ok: true, value: code };
  } catch (error) {
    await auditParentLinkFailure('invite_generation_threw', error, { user_id: userId });
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

    if (error) {
      await auditParentLinkFailure('pending_invite_lookup_failed', error, { user_id: userId });
      return null;
    }
    if (!data?.invite_code) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return null;

    const code = normalizeParentInviteCode(String(data.invite_code));
    return code.length === PARENT_INVITE_CODE_LENGTH ? code : null;
  } catch (error) {
    await auditParentLinkFailure('pending_invite_lookup_threw', error, { user_id: userId });
    return null;
  }
}

export async function redeemInviteCodeResult(code: string): Promise<ParentLinkResult<RedeemedParentLink>> {
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
      await auditParentLinkFailure('invite_redemption_rpc_failed', error, { user_id: userId });
      return mapParentInviteRpcError(error.message);
    }

    const redeemedLink = parseRedeemedParentLink(data, userId);
    if (!redeemedLink) {
      await auditParentLinkFailure(
        'invite_redemption_response_invalid',
        new Error('Unverified parent-link response'),
        { user_id: userId, response_type: Array.isArray(data) ? 'array' : typeof data },
      );
      return {
        ok: false,
        code: 'server_error',
        message: 'The connection response could not be verified. Try again before entering Parent Side.',
      };
    }

    return { ok: true, value: redeemedLink };
  } catch (error) {
    await auditParentLinkFailure('invite_redemption_threw', error, { user_id: userId });
    return { ok: false, code: 'server_error', message: 'Could not connect right now. Check your connection and try again.' };
  }
}

export async function redeemInviteCode(code: string): Promise<string | null> {
  const result = await redeemInviteCodeResult(code);
  return result.ok ? result.value.teenUserId : null;
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
      await auditParentLinkFailure('linked_teen_lookup_failed', error, { user_id: uid });
      return null;
    }

    return (data?.teen_user_id as string) ?? null;
  } catch (error) {
    await auditParentLinkFailure('linked_teen_lookup_threw', error, { user_id: uid });
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
      await auditParentLinkFailure('linked_parent_lookup_failed', error, { user_id: uid });
      return null;
    }

    return (data?.parent_user_id as string) ?? null;
  } catch (error) {
    await auditParentLinkFailure('linked_parent_lookup_threw', error, { user_id: uid });
    return null;
  }
}

export async function revokeParentLink(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { data, error } = await sb.rpc('revoke_parent_link');
    if (error) {
      await auditParentLinkFailure('link_revocation_rpc_failed', error);
      return false;
    }

    return data === true;
  } catch (error) {
    await auditParentLinkFailure('link_revocation_threw', error);
    return false;
  }
}
