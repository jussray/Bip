/**
 * app/(main)/bridge.tsx
 *
 * Bridge — teen/parent connection screen placeholder.
 * Step 3: wire to Supabase bridge_messages + userSide gate.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BridgeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Bridge — coming in Step 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center' },
  label:     { color: '#888', fontSize: 14 },
});
