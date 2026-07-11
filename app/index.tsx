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
      try {
        if (isSupabaseConfigured) {
          const sb = getSupabase();
          if (!sb) throw new Error('Supabase account service is unavailable.');
          const { data, error } = await sb.auth.getSession();
          if (error) throw error;
          const user = data.session?.user;
          if (!user) {
            router.replace('/(auth)/login');
            return;
          }
          if (user.is_anonymous) {
            router.replace('/(auth)/signup');
            return;
          }
        }

        const profile = await hydrateAccountProfile(buildSide);
        if (cancelled) return;
        setAccountProfile(profile);
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
  }, [bootstrapAttempt, buildSide]);

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

    setRouted(true);

    if (!accountProfile?.onboardingComplete) {
      router.replace(
        effectiveSide === 'parent'
          ? '/(onboarding)/parent-welcome'
          : '/(onboarding)/welcome',
      );
      return;
    }

    if (accountProfile.accountSide === 'parent') {
      router.replace(
        verificationState === 'VERIFIED_GUARDIAN'
          ? '/(parent)/room'
          : '/(auth)/guardian-verification',
      );
      return;
    }

    router.replace(
      verificationState === 'VERIFIED_TEEN'
        ? '/(teen)/room'
        : '/(auth)/limited-mode',
    );
  }, [
    accountProfile,
    authChecked,
    bootstrapError,
    effectiveSide,
    isLoading,
    isVerificationLoading,
    profileResolved,
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
        userSide={effectiveSide}
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
