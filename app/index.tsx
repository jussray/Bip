/**
 * app/index.tsx — splash / side-selection gate
 *
 * PHASE 3 RESTORE:
 *  - Returning teen   → /(main)/home
 *  - Returning parent → /(main)/parent-room
 *  - First visit      → side chooser (branded, no auto-skip)
 *  - After side chosen, SplashScreen shows with the artwork CTA
 *  - SplashScreen CTA → routes to the correct home
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { SplashScreen } from '@screens/SplashScreen';

export default function Index() {
  const { userSide, setUserSide, isLoading } = useAppContext();

  // After first-time chooser, hold the selected side locally so SplashScreen
  // renders with the right artwork before the context write propagates.
  const [pendingSide, setPendingSide] = useState<'teen' | 'parent' | null>(null);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color="#c4b5fd" />
      </View>
    );
  }

  // Returning user — go straight to their space
  if (userSide === 'teen')   return <Redirect href="/(main)/home" />;
  if (userSide === 'parent') return <Redirect href="/(main)/parent-room" />;

  // After chooser: show the branded splash with CTA
  if (pendingSide) {
    return (
      <SplashScreen
        userSide={pendingSide}
        setScreen={() => {
          // CTA tapped — commit the side and navigate
          setUserSide(pendingSide);
          router.replace(
            pendingSide === 'parent'
              ? '/(main)/parent-room'
              : '/(main)/home',
          );
        }}
      />
    );
  }

  // First visit — side chooser
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
      <Text style={styles.tagline}>Who&#39;s here right now?</Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnTeen]}
        onPress={() => setPendingSide('teen')}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>I&#39;m the teen 💜</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnParent]}
        onPress={() => setPendingSide('parent')}
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
