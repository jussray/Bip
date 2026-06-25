import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { validateEnv } from '@/utils/env';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { getAuthenticatedProfile, signOutAndClearLocalState } from '@/utils/account';

void validateEnv();

function RouteBoundary() {
  const { userSide, isLoading } = useAppContext();
  const segments = useSegments();

  // Auth + account-profile guard. Sign-out events route back to login
  // and clear private in-memory caches via onAuthStateChange.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

    void sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace('/(auth)/login');
        return;
      }
      // After auth is confirmed, make sure a private profile row exists.
      // If not, send the user to profile-setup before they enter the app.
      const profile = await getAuthenticatedProfile();
      if (!profile) router.replace('/(auth)/profile-setup');
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        await signOutAndClearLocalState().catch(() => {});
        router.replace('/(auth)/login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !userSide) return;
    const area = String(segments[0] ?? '');
    if (userSide === 'teen' && (area === '(parent)' || area === 'parent')) {
      router.replace('/(teen)/room');
    }
    if (userSide === 'parent' && (area === '(teen)' || area === 'teen')) {
      router.replace('/(parent)/room');
    }
  }, [isLoading, segments, userSide]);

  return null;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RouteBoundary />
      <Analytics />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
