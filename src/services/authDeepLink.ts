import * as Linking from 'expo-linking';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabase } from '@/utils/supabase';

export type AuthLinkKind = 'session' | 'recovery' | 'email-verification';

export interface AuthLinkResult {
  handled: boolean;
  kind: AuthLinkKind | null;
}

export function getAuthRedirectUrl(): string {
  return Linking.createURL('/callback');
}

function readAuthParam(url: URL, key: string): string | null {
  const searchValue = url.searchParams.get(key);
  if (searchValue) return searchValue;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  return hash.get(key);
}

function kindForType(type: string | null): AuthLinkKind {
  return type === 'recovery' ? 'recovery' : 'email-verification';
}

export async function createSessionFromAuthUrl(rawUrl: string): Promise<AuthLinkResult> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase Auth is unavailable.');

  const url = new URL(rawUrl);
  const errorDescription = readAuthParam(url, 'error_description')
    || readAuthParam(url, 'error');
  if (errorDescription) throw new Error(errorDescription.replace(/\+/g, ' '));

  const type = readAuthParam(url, 'type');
  const code = readAuthParam(url, 'code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return { handled: true, kind: kindForType(type) };
  }

  const tokenHash = readAuthParam(url, 'token_hash');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) throw error;
    return { handled: true, kind: kindForType(type) };
  }

  const accessToken = readAuthParam(url, 'access_token');
  const refreshToken = readAuthParam(url, 'refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return { handled: true, kind: kindForType(type) };
  }

  return { handled: false, kind: null };
}
