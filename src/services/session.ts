import { disableCurrentPushToken } from '@/services/pushTokenSync';
import { getSupabase } from '@/utils/supabase';

function isMissingSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const { name, message } = error as { name?: string; message?: string };
  return (
    name === 'AuthSessionMissingError' ||
    message === 'Auth session missing!' ||
    message === 'Auth session missing'
  );
}

export async function getCurrentSessionUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  if (sessionData.session?.user.id) return sessionData.session.user.id;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isMissingSessionError(userError)) return null;
    throw userError;
  }

  return userData.user?.id ?? null;
}

export async function ensureAnonymousSession(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const currentUserId = await getCurrentSessionUserId();
  if (currentUserId) return currentUserId;

  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  return signed.user?.id ?? null;
}

export async function endAuthenticatedSession(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  await disableCurrentPushToken();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
