/**
 * app/(main)/profile.tsx
 *
 * User profile / Se'kret identity screen.
 * Maps to: state.screen === 'sekret' in current router.
 *
 * Placeholder until Step 2b.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile — migration placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  label:     { color: '#888', fontSize: 14 },
});
