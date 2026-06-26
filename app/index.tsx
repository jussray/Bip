import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { SplashScreen } from '@screens/SplashScreen';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

type AppSide = 'teen' | 'parent';

function getBuildSide(): AppSide | null {
  const variant = process.env.EXPO_PUBLIC_APP_VARIANT;
  if (variant === 'teen' || variant === 'parent') return variant;
  return null;
}

export default function Index() {
  const { userSide, setUserSide, isLoading } = useAppContext();
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [splashEntered, setSplashEntered] = useState(false);
  const [routed, setRouted] = useState(false);
  const buildSide = useMemo(getBuildSide, []);
  const effectiveSide: AppSide = buildSide ?? userSide ?? 'teen';

  // A dedicated Teen or Parent native build must stay on its own side.
  useEffect(() => {
    if (buildSide && userSide !== buildSide) {
      setUserSide(buildSide);
    }
  }, [buildSide, setUserSide, userSide]);

  // Auth gate — only when Supabase is configured
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

  // Onboarding / room routing — once auth and context are ready
  useEffect(() => {
    if (isLoading || !authChecked || !splashEntered || routed) return;

    async function route() {
      setRouted(true);
      if (effectiveSide === 'parent') {
        const done = await AsyncStorage.getItem('parent_profile_done');
        router.replace(done === 'true' ? '/(parent)/room' : '/(onboarding)/parent-welcome');
        return;
      }

      const done = await AsyncStorage.getItem('teen_profile_done');
      router.replace(done === 'true' ? '/(teen)/room' : '/(onboarding)/welcome');
    }

    void route();
  }, [isLoading, authChecked, splashEntered, routed, effectiveSide]);

  // Show the app-specific splash first; tapping the artwork CTA unlocks routing.
  if (!isLoading && authChecked && !splashEntered) {
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
