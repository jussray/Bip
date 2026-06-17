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
import { PERSONALITY_CONFIG } from '@/services/ai';
import type { PersonalityId } from '@/types';

const PERSONALITY_ORDER: PersonalityId[] = ['raylene', 'rylane', 'cloud', 'night', 'oracle'];

export default function SekretTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Se'kret 💜</Text>
        <Text style={styles.sub}>Choose who you want to talk to.</Text>

        {PERSONALITY_ORDER.map((id) => {
          const p = PERSONALITY_CONFIG[id];
          return (
            <TouchableOpacity
              key={id}
              style={[styles.card, { borderColor: p.accentColor + '40' }]}
              onPress={() => router.push(`/(main)/chat/${id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{p.emoji}</Text>
              <View style={styles.cardBody}>
                <Text style={[styles.name, { color: p.accentColor }]}>{p.name}</Text>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.vibe}>{p.vibe}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#0d0d0d' },
  content:  { padding: 24, paddingTop: 56, paddingBottom: 40 },
  heading:  { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sub:      { color: '#666', fontSize: 14, marginBottom: 28 },
  card:     {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: '#111827',
    borderRadius:    20,
    padding:         18,
    marginBottom:    14,
    borderWidth:     1,
  },
  emoji:    { fontSize: 32, marginTop: 2, marginRight: 14 },
  cardBody: { flex: 1 },
  name:     { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  title:    { color: '#888', fontSize: 12, marginBottom: 6 },
  vibe:     { color: '#555', fontSize: 13, lineHeight: 18 },
});
