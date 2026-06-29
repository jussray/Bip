import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { validateEnv } from '@/utils/env';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { clearPrivateAccountCache } from '@/utils/storage';
import { clearProfileIdentityCache } from '@/features/identity/clearProfileIdentityCache';

void validateEnv();

function RouteBoundary() {
  const { userSide, isLoading } = useAppContext();
  const segments = useSegments();

  // Auth guard at root so all routes are protected, not just the index.
  // Listens for sign-out events too (e.g. session expiry).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

    void sb.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/(auth)/login');
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (session) return;
      if (event === 'SIGNED_OUT') {
        void (async () => {
          try {
            await clearPrivateAccountCache();
            await clearProfileIdentityCache();
          } finally {
            router.replace('/(auth)/login');
          }
        })();
        return;
      }
      router.replace('/(auth)/login');
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
