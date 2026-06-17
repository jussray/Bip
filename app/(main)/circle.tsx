/**
 * app/(main)/circle.tsx
 *
 * Circle — community/peer feed placeholder.
 * Step 3: wire to Supabase circle_posts query.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CircleTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Circle — coming in Step 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center' },
  label:     { color: '#888', fontSize: 14 },
});
