import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { validateEnv } from '@/utils/env';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { registerAndSavePushToken } from '@/utils/notifications';

void validateEnv();

function RouteBoundary() {
  const { userSide, isLoading } = useAppContext();
  const segments = useSegments();

  // Auth guard + push token registration on every session start.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

    void sb.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/(auth)/login'); return; }
      void registerAndSavePushToken(data.session.user.id);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) { router.replace('/(auth)/login'); return; }
      void registerAndSavePushToken(session.user.id);
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
