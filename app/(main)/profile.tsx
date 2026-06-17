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

/**
 * Calculate the current consecutive-day journaling streak.
 * Walks backward from today through moodHistory dates,
 * counting each day that has at least one entry.
 * Returns 0 if no entries exist or the last entry was not today/yesterday.
 */
function calcStreak(entries: { date: string }[]): number {
  if (entries.length === 0) return 0;

  // Collect unique date strings, most-recent first
  const uniqueDates = [
    ...new Set(entries.map((e) => e.date)),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  let streak    = 0;
  let checkDate = new Date(today);

  for (const dateStr of uniqueDates) {
    const entryDate = new Date(dateStr);
    entryDate.setHours(0, 0, 0, 0);

    const diffDays =
      Math.round((checkDate.getTime() - entryDate.getTime()) / 86_400_000);

    if (diffDays === 0 || (streak > 0 && diffDays === 1)) {
      streak += 1;
      // Advance checkDate back one day for next iteration
      checkDate = new Date(entryDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Gap found — streak is broken
      break;
    }
  }

  return streak;
}

export default function ProfileScreen() {
  const { mood, moodHistory, entries, theme, selectedSekret } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  // Streak is based on consecutive days that have journal entries,
  // not total entry count.
  const streak       = calcStreak(entries);
  const streakLabel  = streak > 0 ? `${streak}` : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: currentTheme.card }]}>
          <Text style={styles.avatarEmoji}>{selectedSekret || '🌙'}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakLabel}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{moodHistory.length}</Text>
            <Text style={styles.statLabel}>Mood logs</Text>
          </View>
        </View>

        {/* Current mood */}
        {mood ? (
          <View style={styles.moodCard}>
            <Text style={styles.moodLabel}>Current mood</Text>
            <Text style={styles.moodValue}>{mood}</Text>
          </View>
        ) : null}

        {/* Mood history */}
        {moodHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood History</Text>
            {moodHistory.slice(0, 10).map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyMood}>{entry.mood}</Text>
                <Text style={styles.historyDate}>{entry.date} · {entry.time}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  content:      { padding: 24, paddingTop: 56, paddingBottom: 40, alignItems: 'center' },
  avatar:       { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  avatarEmoji:  { fontSize: 40 },
  statsRow:     { flexDirection: 'row', marginBottom: 20 },
  statCard:     { alignItems: 'center', marginHorizontal: 16 },
  statValue:    { color: '#fff', fontSize: 28, fontWeight: '800' },
  statLabel:    { color: '#555', fontSize: 12, marginTop: 4 },
  moodCard:     { backgroundColor: '#111827', borderRadius: 16, padding: 16, width: '100%', marginBottom: 20 },
  moodLabel:    { color: '#555', fontSize: 12, marginBottom: 4 },
  moodValue:    { color: '#E2E8F0', fontSize: 18, fontWeight: '700' },
  section:      { width: '100%' },
  sectionTitle: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  historyMood:  { color: '#E2E8F0', fontSize: 15 },
  historyDate:  { color: '#555', fontSize: 12 },
});
