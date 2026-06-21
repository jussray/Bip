import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { SplashScreen } from '@screens/SplashScreen';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

export default function Index() {
  const { userSide, isLoading } = useAppContext();
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [routed,      setRouted]      = useState(false);

  // Auth gate — only when Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) { setAuthChecked(true); return; }
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
    if (isLoading || !authChecked || routed) return;

    async function route() {
      setRouted(true);
      if (userSide === 'parent') {
        const done = await AsyncStorage.getItem('parent_profile_done');
        router.replace(done === 'true' ? '/(parent)/room' : '/(parent)/profile');
        return;
      }
      // Teen or brand-new user → onboarding if not done, else room
      const done = await AsyncStorage.getItem('teen_profile_done');
      router.replace(done === 'true' ? '/(teen)/room' : '/(onboarding)/welcome');
    }

    void route();
  }, [isLoading, authChecked, routed, userSide]);

  // Returning user: show splash while routing resolves
  if (!isLoading && authChecked && userSide) {
    return (
      <SplashScreen
        userSide={userSide}
        setScreen={() => {/* routing handled above */}}
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
