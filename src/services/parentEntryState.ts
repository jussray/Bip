import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDevTestFamily } from '@/features/testing/devTestFamily';
import { withRuntimeAudit } from '@/services/runtimeAudit';
import { fetchLinkedTeenId } from '@/utils/parentLink';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

export type ParentEntryState =
  | { state: 'signed_out' }
  | { state: 'profile_required' }
  | { state: 'unlinked' }
  | { state: 'active'; teenUserId: string; source: 'supabase' | 'dev' }
  | { state: 'recovery' };

export async function resolveParentEntryState(): Promise<ParentEntryState> {
  try {
    return await withRuntimeAudit(
      'parent_window',
      {
        event_type: 'entry_resolution_failed',
        screen: 'parentEntryState.resolveParentEntryState',
        severity: 'error',
      },
      async () => {
        const devFamily = await getDevTestFamily();
        if (devFamily) {
          return { state: 'active', teenUserId: devFamily.teenId, source: 'dev' } as const;
        }

        if (isSupabaseConfigured) {
          const supabase = getSupabase();
          if (!supabase) throw new Error('Supabase client unavailable during parent entry resolution');

          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) return { state: 'signed_out' } as const;
        }

        const profileRaw = await AsyncStorage.getItem('parent_profile_data');
        if (!profileRaw) return { state: 'profile_required' } as const;

        try {
          const profile = JSON.parse(profileRaw) as { name?: unknown; roomStyle?: unknown; focus?: unknown };
          if (
            typeof profile.name !== 'string' || profile.name.trim().length === 0 ||
            (profile.roomStyle !== 'mom' && profile.roomStyle !== 'dad') ||
            typeof profile.focus !== 'string' || profile.focus.length === 0
          ) {
            return { state: 'profile_required' } as const;
          }
        } catch {
          return { state: 'profile_required' } as const;
        }

        if (!isSupabaseConfigured) return { state: 'unlinked' } as const;

        const teenUserId = await fetchLinkedTeenId();
        if (!teenUserId) return { state: 'unlinked' } as const;

        await AsyncStorage.multiSet([
          ['parent_profile_done', 'true'],
          ['linked_teen_id', teenUserId],
        ]);

        return { state: 'active', teenUserId, source: 'supabase' } as const;
      },
    );
  } catch {
    return { state: 'recovery' };
  }
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
