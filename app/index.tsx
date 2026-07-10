import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { useVerificationContext } from '@/context/VerificationContext';
import { SplashScreen } from '@screens/SplashScreen';
import { resolveParentEntryState, routeForParentEntry } from '@/services/parentEntryState';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

type AppSide = 'teen' | 'parent';

function getBuildSide(): AppSide | null {
  const variant = process.env.EXPO_PUBLIC_APP_VARIANT;
  if (variant === 'teen' || variant === 'parent') return variant;
  return null;
}

export default function Index() {
  const { userSide, setUserSide, isLoading } = useAppContext();
  const { verificationState, isVerificationLoading } = useVerificationContext();
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [splashEntered, setSplashEntered] = useState(false);
  const [routed, setRouted] = useState(false);
  const buildSide = useMemo(getBuildSide, []);
  const effectiveSide: AppSide = buildSide ?? userSide ?? 'teen';

  useEffect(() => {
    if (buildSide && userSide !== buildSide) {
      setUserSide(buildSide);
    }
  }, [buildSide, setUserSide, userSide]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) {
      setAuthChecked(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/(auth)/login');
      } else {
        setAuthChecked(true);
      }
    });
  }, []);

  useEffect(() => {
    if (isLoading || isVerificationLoading || !authChecked || !splashEntered || routed) return;

    async function route() {
      setRouted(true);
      if (effectiveSide === 'parent') {
        const parentEntry = await resolveParentEntryState();
        router.replace(routeForParentEntry(parentEntry) as any);
        return;
      }

      const done = await AsyncStorage.getItem('teen_profile_done');
      if (done !== 'true') {
        router.replace('/(onboarding)/welcome');
        return;
      }

      router.replace(
        verificationState === 'VERIFIED_TEEN'
          ? '/(teen)/room'
          : '/(auth)/limited-mode',
      );
    }

    void route();
  }, [
    isLoading,
    isVerificationLoading,
    authChecked,
    splashEntered,
    routed,
    effectiveSide,
    verificationState,
  ]);

  if (!isLoading && !isVerificationLoading && authChecked && !splashEntered) {
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
  root: { flex: 1, backgroundColor: '#090711', alignItems: 'center', justifyContent: 'center' },
});
