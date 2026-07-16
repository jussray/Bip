import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { useVerificationContext } from '@/context/VerificationContext';
import { SplashScreen } from '@screens/SplashScreen';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import {
  hydrateAccountProfile,
  type AccountProfile,
  type AccountSide,
} from '@/features/identity/accountProfile';
import { fetchPostAuthBootstrap } from '@/services/auth/postAuthBootstrap';
import {
  resolveParentEntryState,
  routeForParentEntryState,
} from '@/services/parentEntryState';

function getBuildSide(): AccountSide | null {
  const variant = process.env.EXPO_PUBLIC_APP_VARIANT;
  if (variant === 'teen' || variant === 'parent') return variant;
  return null;
}

export default function Index() {
  const { userSide, setUserSide, isLoading } = useAppContext();
  const { verificationState, isVerificationLoading } = useVerificationContext();
  const [authChecked, setAuthChecked] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [hasPermanentSession, setHasPermanentSession] = useState(!isSupabaseConfigured);
  const [requiresAccountUpgrade, setRequiresAccountUpgrade] = useState(false);
  const [requiredConsentsComplete, setRequiredConsentsComplete] = useState(!isSupabaseConfigured);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [splashEntered, setSplashEntered] = useState(false);
  const [routed, setRouted] = useState(false);
  const buildSide = useMemo(getBuildSide, []);
  const effectiveSide: AccountSide = accountProfile?.accountSide ?? buildSide ?? userSide ?? 'teen';

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootstrapError(null);
      setProfileResolved(false);
      setRequiresAccountUpgrade(false);
      try {
        if (isSupabaseConfigured) {
          const sb = getSupabase();
          if (!sb) throw new Error('Supabase account service is unavailable.');
          const { data, error } = await sb.auth.getSession();
          if (error) throw error;
          const user = data.session?.user;

          if (!user) {
            if (!cancelled) {
              setHasPermanentSession(false);
              setRequiredConsentsComplete(false);
              setAccountProfile(null);
            }
            return;
          }

          if (user.is_anonymous) {
            if (!cancelled) {
              setHasPermanentSession(false);
              setRequiresAccountUpgrade(true);
              setRequiredConsentsComplete(false);
              setAccountProfile(null);
            }
            return;
          }

          const result = await fetchPostAuthBootstrap(buildSide);
          if (cancelled) return;
          setHasPermanentSession(true);
          setRequiredConsentsComplete(result.requiredConsentsComplete);
          setAccountProfile(result.profile);
          if (result.accountSide !== userSide) setUserSide(result.accountSide);
          return;
        }

        const profile = await hydrateAccountProfile(buildSide);
        if (cancelled) return;
        setAccountProfile(profile);
        setHasPermanentSession(true);
        setRequiredConsentsComplete(true);
        if (profile?.accountSide && profile.accountSide !== userSide) {
          setUserSide(profile.accountSide);
        } else if (!profile && buildSide && buildSide !== userSide) {
          setUserSide(buildSide);
        }
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : 'Unable to load your Bip profile.');
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
          setProfileResolved(true);
        }
      }
    }

    void bootstrap();
    return () => { cancelled = true; };
  }, [bootstrapAttempt, buildSide, setUserSide, userSide]);

  useEffect(() => {
    if (
      isLoading
      || isVerificationLoading
      || !authChecked
      || !profileResolved
      || !splashEntered
      || routed
      || bootstrapError
    ) return;

    let active = true;
    setRouted(true);

    async function route() {
      if (!hasPermanentSession) {
        if (requiresAccountUpgrade) {
          router.replace(`/(auth)/signup?side=${effectiveSide}` as never);
        } else {
          router.replace(buildSide === 'parent' ? '/(onboarding)/parent-splash' : '/(onboarding)/welcome');
        }
        return;
      }

      if (!requiredConsentsComplete) {
        router.replace(`/(onboarding)/consent?side=${effectiveSide}` as never);
        return;
      }

      if (!accountProfile?.onboardingComplete) {
        router.replace(
          effectiveSide === 'parent'
            ? '/(onboarding)/parent-setup'
            : '/(onboarding)/name',
        );
        return;
      }

      if (accountProfile.accountSide === 'parent') {
        try {
          const parentEntry = await resolveParentEntryState();
          if (active) router.replace(routeForParentEntryState(parentEntry) as never);
        } catch (error) {
          if (active) {
            setBootstrapError(error instanceof Error ? error.message : 'Unable to verify Parent Side access.');
          }
        }
        return;
      }

      router.replace(
        verificationState === 'VERIFIED_TEEN'
          ? '/(teen)/room'
          : '/(auth)/limited-mode',
      );
    }

    void route();
    return () => {
      active = false;
    };
  }, [
    accountProfile,
    authChecked,
    bootstrapError,
    buildSide,
    effectiveSide,
    hasPermanentSession,
    isLoading,
    isVerificationLoading,
    profileResolved,
    requiredConsentsComplete,
    requiresAccountUpgrade,
    routed,
    splashEntered,
    verificationState,
  ]);

  if (bootstrapError) {
    return (
      <View style={styles.root}>
        <Text style={styles.errorTitle}>We could not restore your Bip profile.</Text>
        <Text style={styles.errorBody}>{bootstrapError}</Text>
        <TouchableOpacity
          style={styles.retry}
          onPress={() => {
            setRouted(false);
            setBootstrapAttempt(value => value + 1);
          }}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && !isVerificationLoading && authChecked && profileResolved && !splashEntered) {
    return (
      <SplashScreen
        userSide={hasPermanentSession ? effectiveSide : buildSide ?? 'teen'}
        setScreen={() => setSplashEntered(true)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ActivityIndicator color="#c4b5fd" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  errorTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  errorBody: { color: '#b9afc5', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  retry: { minWidth: 160, height: 52, borderRadius: 16, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
