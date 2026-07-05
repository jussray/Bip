import { supabase } from '@/lib/supabase';

/**
 * Fire-and-forget event logger → app_events table.
 * Silent no-op if user is not authenticated.
 */
export async function logEvent(
  event_type: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('app_events').insert({
      user_id: user.id,
      event_type,
      metadata,
    });
  } catch {
    // never let analytics crash the app
  }
}
