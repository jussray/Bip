import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getSupabase } from '@/utils/supabase';

function getAppVariant(): 'teen' | 'parent' {
  return Constants.expoConfig?.extra?.appVariant === 'parent' ? 'parent' : 'teen';
}

export async function syncExpoPushToken(token: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || Platform.OS === 'web') return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('push_tokens').upsert({
    user_id: user.id,
    expo_push_token: token,
    platform: Platform.OS,
    app_variant: getAppVariant(),
    enabled: true,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'expo_push_token' });

  if (error) throw error;
}
