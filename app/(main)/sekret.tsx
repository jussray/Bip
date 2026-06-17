/**
 * app/(main)/sekret.tsx
 *
 * Se'kret personality screen — stub.
 * Wired to full personality AI in Step 3 when services/ai/ is populated.
 * Maps to: chat/[personalityId] for each companion.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { AI_PERSONALITIES } from '@/services/ai';

export default function SekretTab() {
  const { theme } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Companion 💜</Text>
      {AI_PERSONALITIES.map((id) => (
        <TouchableOpacity
          key={id}
          style={styles.btn}
          onPress={() => router.push(`/(main)/chat/${id}` as any)}
        >
          <Text style={styles.btnText}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', padding: 24, paddingTop: 60 },
  title:     { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  btn:       { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 12 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
});
