/**
 * app/(main)/discover.tsx
 *
 * Oracle discovery screen.
 * Maps to: state.screen === 'cloudThoughts' / 'voiceBip' in current router.
 *
 * Placeholder until Step 2b.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Discover — migration placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  label:     { color: '#888', fontSize: 14 },
});
