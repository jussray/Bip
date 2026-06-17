/**
 * app/index.tsx — splash / parent-entry gate
 *
 * Expo Router boots here.  We do NOT immediately redirect to /(main)/home
 * so the parent-entry experience is preserved.
 *
 * Flow:
 *   • While useSekretState is loading, show a minimal splash.
 *   • If userSide is already confirmed (returning user), go straight to home.
 *   • Otherwise, show the SplashScreen so the user can choose Teen / Parent
 *     with an intentional tap before anything else loads.
 *
 * Parent entry MUST be a deliberate action — no auto-forward.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

export default function Index() {
  const { userSide, isLoading } = useAppContext();

  // While persisted state is being rehydrated, show a neutral splash.
  if (isLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color="#c4b5fd" />
      </View>
    );
  }

  // Returning user — go directly to the main experience.
  if (userSide) {
    return <Redirect href="/(main)/home" />;
  }

  // First visit or cleared storage — show the parent / teen entry gate.
  // Each button navigates explicitly; nothing auto-fires.
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
      <Text style={styles.tagline}>Who&#39;s here right now?</Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnTeen]}
        onPress={() => router.replace('/(main)/home')}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>I&#39;m the teen 💜</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnParent]}
        onPress={() => router.replace('/(main)/home')}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>I&#39;m the parent 🌿</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo:      { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  tagline:   { color: '#94A3B8', fontSize: 15, marginBottom: 48 },
  btn:       { width: '100%', borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginBottom: 14 },
  btnTeen:   { backgroundColor: '#6d28d9' },
  btnParent: { backgroundColor: '#1e3a2f' },
  btnText:   { color: '#fff', fontSize: 17, fontWeight: '700' },
});
