// src/utils/parentLink.ts
// Se'kret Bip — Parent ↔ Teen linking helpers

import { captureRuntimeError } from '@/services/runtimeAudit';
import { getSupabase } from './supabase';
import {
  mapParentLinkRpcError,
  type ParentLinkErrorCode,
  type ParentLinkFailure,
} from './parentLinkErrors';

export type { ParentLinkErrorCode } from './parentLinkErrors';

export const PARENT_INVITE_CODE_LENGTH = 8;

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

export type ParentLinkStatus = 'pending' | 'active' | 'revoked' | 'expired';
export type ParentLinkAccountSide = 'teen' | 'parent';

export interface ParentLinkStatusSnapshot {
  linkId: string;
  status: ParentLinkStatus;
  isActive: boolean;
  updatedAt: string | null;
  expiresAt: string | null;
  canRevoke: boolean;
}

interface RedeemParentLinkRow {
  link_id?: unknown;
  teen_user_id?: unknown;
  parent_user_id?: unknown;
  status?: unknown;
  activated_at?: unknown;
}

interface ParentLinkStatusRow {
  id?: unknown;
  status?: unknown;
  is_active?: unknown;
  updated_at?: unknown;
  expires_at?: unknown;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PARENT_LINK_STATUSES = new Set<ParentLinkStatus>(['pending', 'active', 'revoked', 'expired']);

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

function rpcFailure(error: { message?: string | null; code?: string | null; hint?: string | null }): ParentLinkFailure {
  return mapParentLinkRpcError(error.message);
}

export function normalizeParentInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PARENT_INVITE_CODE_LENGTH);
}

export function validateRedeemedParentLink(
  data: unknown,
  expectedParentId: string,
): RedeemedParentLink | null {
  const row: RedeemParentLinkRow | null = Array.isArray(data)
    ? ((data[0] as RedeemParentLinkRow | undefined) ?? null)
    : data && typeof data === 'object'
      ? (data as RedeemParentLinkRow)
      : null;

  if (!row) return null;
  if (typeof row.link_id !== 'string' || !UUID_PATTERN.test(row.link_id)) return null;
  if (typeof row.teen_user_id !== 'string' || !UUID_PATTERN.test(row.teen_user_id)) return null;
  if (typeof row.parent_user_id !== 'string' || row.parent_user_id !== expectedParentId) return null;
  if (row.status !== 'active') return null;
  if (row.activated_at != null && typeof row.activated_at !== 'string') return null;

  return {
    linkId: row.link_id,
    teenUserId: row.teen_user_id,
    parentUserId: row.parent_user_id,
    status: 'active',
    activatedAt: row.activated_at ?? null,
  };
}

async function currentUserIdResult(): Promise<ParentLinkResult<string>> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, code: 'not_configured', message: 'The secure connection service is not configured.' };
  }
  try {
    const { data, error } = await sb.auth.getUser();
    if (error) {
      await auditParentLinkFailure('auth_user_lookup_failed', new Error(error.message), {
        error_code: error.code ?? null,
      });
      return { ok: false, code: 'server_error', message: 'Could not verify your account. Check your connection and try again.' };
    }
    const userId = data?.user?.id;
    if (!userId) {
      return { ok: false, code: 'not_authenticated', message: 'Sign in to manage a parent relationship.' };
    }
    return { ok: true, value: userId };
  } catch (error) {
    await auditParentLinkFailure('auth_user_lookup_threw', error);
    return { ok: false, code: 'server_error', message: 'Could not verify your account. Check your connection and try again.' };
  }
}

async function currentUserId(): Promise<string | null> {
  const result = await currentUserIdResult();
  return result.ok ? result.value : null;
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
      await auditParentLinkFailure('invite_generation_rpc_failed', new Error(error.message), {
        error_code: error.code ?? null,
        error_hint: error.hint ?? null,
      });
      const failure = rpcFailure(error);
      return { ok: false, ...failure };
    }

    const code = typeof data === 'string' ? normalizeParentInviteCode(data) : '';
    if (code.length !== PARENT_INVITE_CODE_LENGTH) {
      await auditParentLinkFailure(
        'invite_generation_response_invalid',
        new Error('Invalid invite-code response shape'),
        { response_type: Array.isArray(data) ? 'array' : typeof data },
      );
      return { ok: false, code: 'invalid_response', message: 'The server returned an invalid invite code.' };
    }

    return { ok: true, value: code };
  } catch (error) {
    await auditParentLinkFailure('invite_generation_threw', error);
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
      await auditParentLinkFailure('pending_invite_lookup_failed', new Error(error.message), {
        error_code: error.code ?? null,
      });
      return null;
    }
    if (!data?.invite_code) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return null;

    const code = normalizeParentInviteCode(String(data.invite_code));
    return code.length === PARENT_INVITE_CODE_LENGTH ? code : null;
  } catch (error) {
    await auditParentLinkFailure('pending_invite_lookup_threw', error);
    return null;
  }
}

export async function redeemInviteCodeResult(
  code: string,
): Promise<ParentLinkResult<RedeemedParentLink>> {
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
      await auditParentLinkFailure('invite_redemption_rpc_failed', new Error(error.message), {
        error_code: error.code ?? null,
        error_hint: error.hint ?? null,
      });
      const failure = rpcFailure(error);
      return { ok: false, ...failure };
    }

    if (Array.isArray(data) && data.length === 0) {
      await auditParentLinkFailure(
        'invite_redemption_expired',
        new Error('Invite redemption returned no active link'),
      );
      return {
        ok: false,
        code: 'expired_or_used',
        message: 'That code has expired or was already used. Ask your teen for a new one.',
      };
    }

    const redeemedLink = validateRedeemedParentLink(data, userId);
    if (!redeemedLink) {
      await auditParentLinkFailure(
        'invite_redemption_response_invalid',
        new Error('Unverified parent-link response'),
        { response_type: Array.isArray(data) ? 'array' : typeof data },
      );
      return {
        ok: false,
        code: 'invalid_response',
        message: 'The connection response could not be verified. Try again before entering Parent Side.',
      };
    }

    return { ok: true, value: redeemedLink };
  } catch (error) {
    await auditParentLinkFailure('invite_redemption_threw', error);
    return { ok: false, code: 'server_error', message: 'Could not connect right now. Check your connection and try again.' };
  }
}

export async function redeemInviteCode(code: string): Promise<string | null> {
  const result = await redeemInviteCodeResult(code);
  return result.ok ? result.value.teenUserId : null;
}

export async function fetchParentLinkStatuses(
  accountSide: ParentLinkAccountSide,
): Promise<ParentLinkResult<ParentLinkStatusSnapshot[]>> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, code: 'not_configured', message: 'The secure connection service is not configured.' };
  }

  const userResult = await currentUserIdResult();
  if (!userResult.ok) return userResult;

  try {
    let query = sb
      .from('parent_links')
      .select('id,status,is_active,updated_at,expires_at')
      .order('updated_at', { ascending: false });

    query = accountSide === 'teen'
      ? query.eq('teen_user_id', userResult.value)
      : query.eq('parent_user_id', userResult.value);

    const { data, error } = await query;
    if (error) {
      await auditParentLinkFailure('link_status_lookup_failed', new Error(error.message), {
        account_side: accountSide,
        error_code: error.code ?? null,
      });
      return { ok: false, code: 'server_error', message: 'Could not load relationship status. Check your connection and retry.' };
    }

    if (!Array.isArray(data)) {
      await auditParentLinkFailure('link_status_response_invalid', new Error('Expected a relationship status list'), {
        account_side: accountSide,
        response_type: typeof data,
      });
      return { ok: false, code: 'invalid_response', message: 'The relationship status could not be verified. Retry before making changes.' };
    }

    const links: ParentLinkStatusSnapshot[] = [];
    for (const value of data) {
      const row = value as ParentLinkStatusRow;
      if (
        typeof row.id !== 'string'
        || !UUID_PATTERN.test(row.id)
        || typeof row.status !== 'string'
        || !PARENT_LINK_STATUSES.has(row.status as ParentLinkStatus)
        || typeof row.is_active !== 'boolean'
        || (row.updated_at != null && typeof row.updated_at !== 'string')
        || (row.expires_at != null && typeof row.expires_at !== 'string')
      ) {
        await auditParentLinkFailure('link_status_row_invalid', new Error('Unverified relationship status row'), {
          account_side: accountSide,
        });
        return { ok: false, code: 'invalid_response', message: 'The relationship status could not be verified. Retry before making changes.' };
      }

      const status = row.status as ParentLinkStatus;
      links.push({
        linkId: row.id,
        status,
        isActive: row.is_active,
        updatedAt: row.updated_at ?? null,
        expiresAt: row.expires_at ?? null,
        canRevoke: row.is_active && (status === 'pending' || status === 'active'),
      });
    }

    return { ok: true, value: links };
  } catch (error) {
    await auditParentLinkFailure('link_status_lookup_threw', error, { account_side: accountSide });
    return { ok: false, code: 'server_error', message: 'Could not load relationship status. Check your connection and retry.' };
  }
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
      await auditParentLinkFailure('linked_teen_lookup_failed', new Error(error.message), {
        error_code: error.code ?? null,
      });
      return null;
    }

    return typeof data?.teen_user_id === 'string' ? data.teen_user_id : null;
  } catch (error) {
    await auditParentLinkFailure('linked_teen_lookup_threw', error);
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
      await auditParentLinkFailure('linked_parent_lookup_failed', new Error(error.message), {
        error_code: error.code ?? null,
      });
      return null;
    }

    return typeof data?.parent_user_id === 'string' ? data.parent_user_id : null;
  } catch (error) {
    await auditParentLinkFailure('linked_parent_lookup_threw', error);
    return null;
  }
}

export async function revokeParentLinkResult(
  linkId?: string,
): Promise<ParentLinkResult<boolean>> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, code: 'not_configured', message: 'The secure connection service is not configured.' };
  }
  if (linkId && !UUID_PATTERN.test(linkId)) {
    return { ok: false, code: 'invalid_response', message: 'The selected relationship could not be verified. Refresh and try again.' };
  }

  const userResult = await currentUserIdResult();
  if (!userResult.ok) return userResult;

  try {
    const request = linkId
      ? sb.rpc('revoke_parent_link', { p_link_id: linkId })
      : sb.rpc('revoke_parent_link');
    const { data, error } = await request;
    if (error) {
      await auditParentLinkFailure('link_revocation_rpc_failed', new Error(error.message), {
        error_code: error.code ?? null,
      });
      const failure = rpcFailure(error);
      return { ok: false, ...failure };
    }

    if (typeof data !== 'boolean') {
      await auditParentLinkFailure('link_revocation_response_invalid', new Error('Invalid revocation response shape'));
      return { ok: false, code: 'invalid_response', message: 'The server response could not be verified. Refresh relationship status before retrying.' };
    }

    return { ok: true, value: data };
  } catch (error) {
    await auditParentLinkFailure('link_revocation_threw', error);
    return { ok: false, code: 'server_error', message: 'Could not unlink right now. Check your connection and try again.' };
  }
}

export async function revokeParentLink(linkId?: string): Promise<boolean> {
  const result = await revokeParentLinkResult(linkId);
  return result.ok && result.value;
}
