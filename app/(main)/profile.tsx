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
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

/** Returns the number of consecutive days ending today that have an entry. */
function calcStreak(entries: { date: string }[]): number {
  if (!entries.length) return 0;
  const unique = [...new Set(entries.map((e) => e.date))].sort().reverse();
  const today  = new Date().toISOString().slice(0, 10);
  let streak   = 0;
  const cursor = new Date(today);
  for (const d of unique) {
    const expected = cursor.toISOString().slice(0, 10);
    if (d !== expected) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const MOOD_LABELS: Record<string, string> = {
  happy: '😊 Happy', calm: '😌 Calm', sad: '😢 Sad',
  anxious: '😰 Anxious', angry: '😤 Angry', numb: '😶 Numb',
};

export default function ProfileScreen() {
  const { entries, mood } = useAppContext();
  const streak = calcStreak(entries);

  const moodCounts = entries.reduce<Record<string, number>>((acc, e) => {
    if (e.mood) acc[e.mood] = (acc[e.mood] ?? 0) + 1;
    return acc;
  }, {});

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your Space 🌿</Text>

        {/* Streak + top mood */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak > 0 ? streak : '—'}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {topMood ? MOOD_LABELS[topMood]?.split(' ')[0] ?? '—' : '—'}
            </Text>
            <Text style={styles.statLabel}>Top mood</Text>
          </View>
        </View>

        {/* Recent entries */}
        <Text style={styles.sectionLabel}>Recent Entries</Text>
        {entries.length === 0 ? (
          <Text style={styles.empty}>No entries yet. Start writing on the Pages tab.</Text>
        ) : (
          entries.slice(-5).reverse().map((entry, i) => (
            <View key={i} style={styles.entryCard}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              {entry.mood && (
                <Text style={styles.entryMood}>{MOOD_LABELS[entry.mood] ?? entry.mood}</Text>
              )}
              <Text style={styles.entrySnippet} numberOfLines={2}>{entry.text}</Text>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(main)/settings')}>
          <Text style={styles.settingsBtnText}>⚙️  Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#0d0d0d' },
  content:        { padding: 24, paddingTop: 56, paddingBottom: 40 },
  heading:        { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  statsRow:       { flexDirection: 'row', marginBottom: 28 },
  statCard:       {
    flex:            1,
    backgroundColor: '#111827',
    borderRadius:    16,
    padding:         16,
    alignItems:      'center',
    marginRight:     8,
  },
  statValue:      { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel:      { color: '#666', fontSize: 11, marginTop: 4 },
  sectionLabel:   { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  empty:          { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 24 },
  entryCard:      { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10 },
  entryDate:      { color: '#666', fontSize: 11, marginBottom: 4 },
  entryMood:      { color: '#A78BFA', fontSize: 12, marginBottom: 4 },
  entrySnippet:   { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },
  settingsBtn:    { marginTop: 32, alignItems: 'center', padding: 14 },
  settingsBtnText:{ color: '#555', fontSize: 14 },
});
