import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { VerificationProvider, useVerificationContext } from '@/context/VerificationContext';
import { decideRouteAccess } from '@/services/routeAccess';
import { validateEnv } from '@/utils/env';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { clearPrivateAccountCache } from '@/utils/storage';
import { clearProfileIdentityCache } from '@/features/identity/clearProfileIdentityCache';

void validateEnv();

const SOCIAL_SEGMENTS = new Set(['circle', 'crew', 'bip-crew']);

function RouteBoundary() {
  const { userSide, isLoading } = useAppContext();
  const { verificationState, isVerificationLoading } = useVerificationContext();
  const segments = useSegments();

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
    if (isLoading || isVerificationLoading || !userSide) return;

    const first = String(segments[0] ?? '');
    const second = String(segments[1] ?? '');
    const firstSegment = SOCIAL_SEGMENTS.has(second) ? '(social)' : first;
    const decision = decideRouteAccess({
      firstSegment,
      userSide,
      verificationState,
    });

    if (!decision.allowed && decision.redirectTo) {
      router.replace(decision.redirectTo);
    }
  }, [isLoading, isVerificationLoading, segments, userSide, verificationState]);

  return null;
}

export default function RootLayout() {
  return (
    <VerificationProvider>
      <AppProvider>
        <RouteBoundary />
        <Analytics />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </VerificationProvider>
  );
}
