import { disableCurrentPushToken } from '@/services/pushTokenSync';
import { getSupabase } from '@/utils/supabase';

export async function endAuthenticatedSession(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  await disableCurrentPushToken();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
