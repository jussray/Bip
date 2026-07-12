import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { NotificationBootstrap } from '@/components/shared/NotificationBootstrap';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { VerificationProvider, useVerificationContext } from '@/context/VerificationContext';
import { installSekretBipGuardrailRuntime } from '@/config/visionGuardrails';
import { decideRouteAccess } from '@/services/routeAccess';
import { validateEnv } from '@/utils/env';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { clearPrivateAccountCache } from '@/utils/storage';
import { clearProfileIdentityCache } from '@/features/identity/clearProfileIdentityCache';
import { getDevSplitViewSideOverride } from '@/utils/devSplitViewSide';

void validateEnv();

const SOCIAL_SEGMENTS = new Set(['circle', 'crew', 'bip-crew', 'discover']);

function RouteBoundary() {
  const { userSide, isLoading } = useAppContext();
  const {
    verificationState,
    isVerificationLoading,
    isAuthResolved,
    isAuthenticated,
  } = useVerificationContext();
  const segments = useSegments();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

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
    const routeSegments = Array.from(segments) as string[];
    const first = String(routeSegments[0] ?? '');
    const second = String(routeSegments[1] ?? '');

    // Never enforce protected routing from an unresolved local/default state.
    // Authentication and verification must both be hydrated from Supabase first.
    if (!isAuthResolved || isLoading || isVerificationLoading) return;

    if (isSupabaseConfigured && !isAuthenticated) {
      if (first !== '(auth)') router.replace('/(auth)/login');
      return;
    }

    const effectiveUserSide = getDevSplitViewSideOverride() ?? userSide;
    if (!effectiveUserSide) return;

    // Teen and parent routes share the same leaf segment names (e.g. both
    // (teen)/circle and (parent)/circle are just "circle"), so only treat
    // this as a gated social route when it's actually on the teen side.
    const firstSegment = first === '(teen)' && SOCIAL_SEGMENTS.has(second) ? '(social)' : first;
    const decision = decideRouteAccess({
      firstSegment,
      userSide: effectiveUserSide,
      verificationState,
    });

    if (!decision.allowed && decision.redirectTo) {
      router.replace(decision.redirectTo);
    }
  }, [
    isAuthResolved,
    isAuthenticated,
    isLoading,
    isVerificationLoading,
    segments,
    userSide,
    verificationState,
  ]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    installSekretBipGuardrailRuntime();
  }, []);

  return (
    <VerificationProvider>
      <AppProvider>
        <RouteBoundary />
        <NotificationBootstrap />
        <Analytics />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </VerificationProvider>
  );
}
