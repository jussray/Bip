export type ParentInviteRpcErrorCode =
  | 'not_authenticated'
  | 'invalid_code'
  | 'invite_not_found'
  | 'invite_not_pending'
  | 'invite_expired'
  | 'self_link'
  | 'server_error';

export type ParentInviteRpcFailure = {
  ok: false;
  code: ParentInviteRpcErrorCode;
  message: string;
};

const contains = (message: string, code: string) =>
  message.toLowerCase().includes(code.toLowerCase());

export function mapParentInviteRpcError(message: string): ParentInviteRpcFailure {
  if (contains(message, 'unauthorized')) {
    return { ok: false, code: 'not_authenticated', message: 'Sign in before connecting.' };
  }
  if (contains(message, 'invalid_invite_code')) {
    return { ok: false, code: 'invalid_code', message: 'Enter the full eight-character code.' };
  }
  if (contains(message, 'invite_not_found')) {
    return { ok: false, code: 'invite_not_found', message: 'That code was not found. Ask for a fresh code.' };
  }
  if (contains(message, 'invite_not_pending')) {
    return { ok: false, code: 'invite_not_pending', message: 'That code is no longer available. Ask for a fresh code.' };
  }
  if (contains(message, 'invite_expired')) {
    return { ok: false, code: 'invite_expired', message: 'That code expired. Ask for a fresh code.' };
  }
  if (contains(message, 'cannot_link_self')) {
    return { ok: false, code: 'self_link', message: 'Use the separate parent or trusted-adult account.' };
  }
  return { ok: false, code: 'server_error', message: 'Could not connect right now. Try again.' };
}
