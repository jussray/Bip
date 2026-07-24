/**
 * app/(auth)/_layout.tsx
 *
 * Auth route group layout.
 * Screens: login, signup
 *
 * Active: app/index.tsx routes to /(auth)/login when no session exists.
 * app/_layout.tsx subscribes to onAuthStateChange and redirects on sign-out.
 *
 * Direct teen signup must not collect email, password, or username until the
 * neutral age-assurance entry has stored an allowed age decision. Parent signup
 * stays available because parent accounts are the consent/guardian path.
 */
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack, useGlobalSearchParams, useSegments } from 'expo-router';

import { AGE_ASSURANCE_STORAGE_KEYS } from '@/features/onboarding/ageAssurance';

type SignupGateState = 'checking' | 'allowed' | 'needs-age' | 'needs-parental-consent';

const ALLOWED_TEEN_AGE_STATUSES = new Set([
  'self_declared',
  'guardian_required',
  'third_party_required',
  'verified',
]);

export default function AuthLayout() {
  const segments = useSegments();
  // This layout gates a child route, so it must read the globally focused URL
  // params. useLocalSearchParams() can omit child-route query parameters here,
  // which previously sent `/(auth)/signup?side=parent` into teen age assurance.
  const params = useGlobalSearchParams<{ side?: string }>();
  const [signupGateState, setSignupGateState] = useState<SignupGateState>('checking');

  const isSignupRoute = useMemo(
    () => segments.map(String).includes('signup'),
    [segments],
  );
  const isParentSignup = params.side === 'parent';

  useEffect(() => {
    let active = true;

    async function resolveSignupGate() {
      if (!isSignupRoute || isParentSignup) {
        if (active) setSignupGateState('allowed');
        return;
      }

      try {
        const values = await AsyncStorage.multiGet([
          AGE_ASSURANCE_STORAGE_KEYS.bucket,
          AGE_ASSURANCE_STORAGE_KEYS.status,
        ]);
        if (!active) return;

        const stored = Object.fromEntries(values);
        const bucket = stored[AGE_ASSURANCE_STORAGE_KEYS.bucket];
        const status = stored[AGE_ASSURANCE_STORAGE_KEYS.status];

        if (bucket === 'under-13' || status === 'blocked') {
          setSignupGateState('needs-parental-consent');
          return;
        }

        if (status && ALLOWED_TEEN_AGE_STATUSES.has(status)) {
          setSignupGateState('allowed');
          return;
        }

        setSignupGateState('needs-age');
      } catch {
        if (active) setSignupGateState('needs-age');
      }
    }

    setSignupGateState('checking');
    void resolveSignupGate();

    return () => {
      active = false;
    };
  }, [isParentSignup, isSignupRoute]);

  if (signupGateState === 'checking') return null;
  if (signupGateState === 'needs-age') return <Redirect href="/(onboarding)/welcome" />;
  if (signupGateState === 'needs-parental-consent') return <Redirect href="/(onboarding)/parental-consent" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { overflow: 'hidden' },
      }}
    />
  );
}
