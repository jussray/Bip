/**
 * app/(main)/sekret.tsx
 *
 * Personality picker tab.
 * Shows all 5 companions as cards — tap to enter the chat.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { AI_PERSONALITIES, PERSONALITY_CONFIG } from '@/services/ai';

export default function SekretTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Choose Your Companion</Text>
        <Text style={styles.subtitle}>
          Each one listens differently. All of them are here for you.
        </Text>

        {AI_PERSONALITIES.map((id) => {
          const cfg = PERSONALITY_CONFIG[id];
          return (
            <TouchableOpacity
              key={id}
              style={[styles.card, { backgroundColor: cfg.cardColor, borderColor: cfg.accentColor + '40' }]}
              onPress={() => router.push(`/(main)/chat/${id}` as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.cardEmoji}>{cfg.emoji}</Text>
              <View style={styles.cardBody}>
                <Text style={[styles.cardName, { color: cfg.accentColor }]}>
                  {cfg.name}
                </Text>
                <Text style={styles.cardTitle}>{cfg.title}</Text>
                <Text style={styles.cardVibe}>{cfg.vibe}</Text>
              </View>
              <Text style={[styles.arrow, { color: cfg.accentColor }]}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#0d0d0d' },
  content:   { padding: 24, paddingTop: 56, paddingBottom: 40 },
  title:     { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle:  { color: '#888', fontSize: 14, marginBottom: 28, lineHeight: 20 },
  card:      {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              14,
    padding:          18,
    borderRadius:     20,
    borderWidth:      1,
    marginBottom:     14,
  },
  cardEmoji: { fontSize: 32, width: 42, textAlign: 'center' },
  cardBody:  { flex: 1, gap: 3 },
  cardName:  { fontSize: 16, fontWeight: '700' },
  cardTitle: { color: '#aaa', fontSize: 13 },
  cardVibe:  { color: '#666', fontSize: 12, marginTop: 2 },
  arrow:     { fontSize: 22, fontWeight: '300' },
});
