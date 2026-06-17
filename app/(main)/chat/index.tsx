/**
 * app/(main)/chat/index.tsx
 *
 * Bip chat hub — personality selector + active chat.
 * Maps to: state.screen === 'home' (teen side) in current router.
 *
 * Placeholder until Step 2b wires Expo Router navigation.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatHubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chat Hub — migration placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  label:     { color: '#888', fontSize: 14 },
});
