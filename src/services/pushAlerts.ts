import { getSupabase } from '@/utils/supabase';

type BridgePushAudience = 'linked_parent' | 'linked_teen';

export async function sendBridgePushAlert(params: {
  audience: BridgePushAudience;
  teenId?: string;
  title: string;
  body: string;
  url: string;
}): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      audience: params.audience,
      teenId: params.teenId,
      title: params.title,
      body: params.body,
      url: params.url,
    },
  });

  if (error) {
    if (__DEV__) console.info('[push-alerts] send failed', error.message);
    return false;
  }

  return true;
}
