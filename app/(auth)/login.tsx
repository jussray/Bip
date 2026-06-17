/**
 * app/(auth)/login.tsx
 *
 * Placeholder — will replace the splash/login setScreen flow in Step 2b.
 * Maps to: state.screen === 'splash' (teen side)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Login — migration placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  label:     { color: '#888', fontSize: 14 },
});
