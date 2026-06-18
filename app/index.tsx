/**
 * app/index.tsx — splash / side-selection gate
 *
 * PHASE 1 FIX:
 *  - Teen button: setUserSide('teen') + router.replace('/(main)/home')
 *  - Parent button: setUserSide('parent') + router.replace('/(main)/parent-room')
 *  - Returning teen  → /(main)/home
 *  - Returning parent → /(main)/parent-room
 *  - First visit → show chooser (no auto-skip)
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

export default function Index() {
  const { userSide, setUserSide, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color="#c4b5fd" />
      </View>
    );
  }

  // Returning user — go directly to their side
  if (userSide === 'teen') return <Redirect href="/(main)/home" />;
  if (userSide === 'parent') return <Redirect href="/(main)/parent-room" />;

  // First visit — deliberate side choice required
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>Se&#39;kret Bip 💜</Text>
      <Text style={styles.tagline}>Who&#39;s here right now?</Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnTeen]}
        onPress={() => {
          setUserSide('teen');
          router.replace('/(main)/home');
        }}
        activeOpacity={0.82}
      >
        <Text style={styles.btnText}>I&#39;m the teen 💜</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnParent]}
        onPress={() => {
          setUserSide('parent');
          router.replace('/(main)/parent-room');
        }}
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
