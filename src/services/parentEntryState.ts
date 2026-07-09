import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDevTestFamily } from '@/features/testing/devTestFamily';
import { fetchLinkedTeenId } from '@/utils/parentLink';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

export type ParentEntryState =
  | { state: 'signed_out' }
  | { state: 'profile_required' }
  | { state: 'unlinked' }
  | { state: 'active'; teenUserId: string; source: 'supabase' | 'dev' }
  | { state: 'recovery' };

export async function resolveParentEntryState(): Promise<ParentEntryState> {
  const devFamily = await getDevTestFamily();
  if (devFamily) {
    return { state: 'active', teenUserId: devFamily.teenId, source: 'dev' };
  }

  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    if (!supabase) return { state: 'recovery' };

    const { data, error } = await supabase.auth.getSession();
    if (error) return { state: 'recovery' };
    if (!data.session) return { state: 'signed_out' };
  }

  const profileRaw = await AsyncStorage.getItem('parent_profile_data');
  if (!profileRaw) return { state: 'profile_required' };

  try {
    const profile = JSON.parse(profileRaw) as { name?: unknown; roomStyle?: unknown; focus?: unknown };
    if (
      typeof profile.name !== 'string' || profile.name.trim().length === 0 ||
      (profile.roomStyle !== 'mom' && profile.roomStyle !== 'dad') ||
      typeof profile.focus !== 'string' || profile.focus.length === 0
    ) {
      return { state: 'profile_required' };
    }
  } catch {
    return { state: 'profile_required' };
  }

  if (!isSupabaseConfigured) return { state: 'unlinked' };

  const teenUserId = await fetchLinkedTeenId();
  if (!teenUserId) return { state: 'unlinked' };

  await AsyncStorage.multiSet([
    ['parent_profile_done', 'true'],
    ['linked_teen_id', teenUserId],
  ]);

  return { state: 'active', teenUserId, source: 'supabase' };
}

export function routeForParentEntry(state: ParentEntryState): string {
  switch (state.state) {
    case 'signed_out':
      return '/(auth)/login';
    case 'profile_required':
      return '/(onboarding)/parent-welcome';
    case 'unlinked':
    case 'recovery':
      return '/(onboarding)/parent-link';
    case 'active':
      return '/(parent)/room';
  }
}
