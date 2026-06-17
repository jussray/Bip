/**
 * app/(main)/chat/[personalityId].tsx
 *
 * Dynamic route — one file covers all 5 personalities:
 *   /chat/raylene  →  Raylene
 *   /chat/rylane   →  Rylane
 *   /chat/cloud    →  Cloud
 *   /chat/night    →  Night
 *   /chat/oracle   →  Oracle
 *
 * In Step 2b: read useLocalSearchParams().personalityId and
 * render the correct personality chat screen.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PersonalityChatScreen() {
  const { personalityId } = useLocalSearchParams<{ personalityId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{personalityId ?? 'Chat'} — migration placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  label:     { color: '#888', fontSize: 14 },
});
