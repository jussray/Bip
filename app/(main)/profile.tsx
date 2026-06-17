/**
 * app/(main)/profile.tsx
 *
 * User profile — mood history, journal streak, growth path.
 * Full Supabase-backed persistence in a later sprint.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants';

export default function ProfileScreen() {
  const { mood, moodHistory, entries, theme, selectedSekret } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  const streak = entries.length; // simplified — replace with date-based calc later

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: currentTheme.card }]}>
          <Text style={styles.avatarEmoji}>{currentTheme.emoji}</Text>
        </View>
        <Text style={styles.handle}>@you</Text>
        <Text style={styles.vibe}>Current mood: {mood}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: currentTheme.accent }]}>{entries.length}</Text>
            <Text style={styles.statLabel}>Journal entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: currentTheme.accent }]}>{moodHistory.length}</Text>
            <Text style={styles.statLabel}>Mood check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: currentTheme.accent }]}>{streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
        </View>

        {/* Mood history */}
        {moodHistory.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Recent Moods</Text>
            {moodHistory.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.moodRow}>
                <Text style={styles.moodEmoji}>
                  {entry.mood === 'Happy' ? '😊'
                    : entry.mood === 'Sad'   ? '😔'
                    : entry.mood === 'Angry' ? '😡'
                    : '😴'}
                </Text>
                <View>
                  <Text style={styles.moodLabel}>{entry.mood}</Text>
                  <Text style={styles.moodMeta}>{entry.date} · {entry.time}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {moodHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌙</Text>
            <Text style={styles.emptyText}>Check in with a mood to start your history.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  content:      { padding: 24, paddingTop: 56, alignItems: 'center', paddingBottom: 60 },
  avatar:       { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarEmoji:  { fontSize: 36 },
  handle:       { color: '#fff', fontSize: 18, fontWeight: '700' },
  vibe:         { color: '#888', fontSize: 13, marginTop: 4, marginBottom: 24 },
  statsRow:     { flexDirection: 'row', gap: 12, marginBottom: 28, width: '100%' },
  statCard:     { flex: 1, backgroundColor: '#111827', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statNum:      { fontSize: 22, fontWeight: '800' },
  statLabel:    { color: '#666', fontSize: 11, textAlign: 'center' },
  sectionLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, alignSelf: 'flex-start', width: '100%' },
  moodRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 8, width: '100%' },
  moodEmoji:    { fontSize: 24 },
  moodLabel:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  moodMeta:     { color: '#555', fontSize: 11, marginTop: 2 },
  emptyState:   { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyEmoji:   { fontSize: 32 },
  emptyText:    { color: '#555', fontSize: 13, textAlign: 'center', maxWidth: 240 },
});
