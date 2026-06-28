/**
 * app/(main)/profile.tsx
 *
 * User profile — mood history, journal streak, growth path.
 *
 * Fixes:
 * - Streak calc now uses toLocaleDateString() consistently (entries store
 *   locale dates, not ISO strings, so the old ISO slice always returned 0).
 * - Mood counts now drawn from moodHistory (dedicated log) instead of
 *   inferring mood from journal entries, which missed moods set without writing.
 * - Settings nav uses navigateTo() instead of raw router.push.
 */
import React, { useEffect, useState } from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import { clearPrivateAccountCache } from '@/utils/storage';

/**
 * Returns the number of consecutive days ending today that have a journal entry.
 * Entries use toLocaleDateString() so we compare in the same format.
 */
function calcStreak(entries: { date: string }[]): number {
  if (!entries.length) return 0;
  const unique = [...new Set(entries.map(e => e.date))].sort().reverse();
  const today = new Date().toLocaleDateString();
  // Walk backwards day-by-day from today
  let streak = 0;
  const cursor = new Date();
  for (const d of unique) {
    const expected = cursor.toLocaleDateString();
    if (d !== expected) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const MOOD_LABELS: Record<string, string> = {
  happy:   '\uD83D\uDE0A Happy',
  calm:    '\uD83D\uDE0C Calm',
  sad:     '\uD83D\uDE22 Sad',
  anxious: '\uD83D\uDE30 Anxious',
  angry:   '\uD83D\uDE24 Angry',
  numb:    '\uD83D\uDE36 Numb',
};

export default function ProfileScreen() {
  const { entries, moodHistory } = useAppContext();
  const streak = calcStreak(entries);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isAnon, setIsAnon] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      if (user.is_anonymous) {
        setIsAnon(true);
      } else {
        setAccountEmail(user.email ?? null);
      }
    });
  }, []);

  async function handleSignOut() {
    Alert.alert('Sign out?', 'Private data saved on this device will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          const sb = getSupabase();
          try {
            if (sb) await sb.auth.signOut();
          } finally {
            await clearPrivateAccountCache();
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  }

  // Mood counts from dedicated mood log (includes moods set without writing)
  const moodCounts = (moodHistory ?? []).reduce<Record<string, number>>((acc, e) => {
    if (e.mood) acc[e.mood] = (acc[e.mood] ?? 0) + 1;
    return acc;
  }, {});

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your Space \uD83C\uDF3F</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak > 0 ? streak : '\u2014'}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {topMood ? (MOOD_LABELS[topMood]?.split(' ')[0] ?? '\u2014') : '\u2014'}
            </Text>
            <Text style={styles.statLabel}>Top mood</Text>
          </View>
        </View>

        {/* Recent entries */}
        <Text style={styles.sectionLabel}>Recent Entries</Text>
        {entries.length === 0 ? (
          <Text style={styles.empty}>No entries yet. Start writing on the Pages tab.</Text>
        ) : (
          entries.slice(0, 5).map((entry, i) => (
            <View key={entry.id ?? i} style={styles.entryCard}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              {entry.mood && (
                <Text style={styles.entryMood}>{MOOD_LABELS[entry.mood] ?? entry.mood}</Text>
              )}
              <Text style={styles.entrySnippet} numberOfLines={2}>{entry.text}</Text>
            </View>
          ))
        )}

        {/* Recent mood log */}
        {(moodHistory ?? []).length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Mood Log</Text>
            {(moodHistory ?? []).slice(0, 5).map((m, i) => (
              <View key={m.id ?? i} style={styles.moodRow}>
                <Text style={styles.moodEmoji}>
                  {MOOD_LABELS[m.mood]?.split(' ')[0] ?? '\u2022'}
                </Text>
                <Text style={styles.moodLabel}>
                  {MOOD_LABELS[m.mood]?.split(' ')[1] ?? m.mood}
                </Text>
                <Text style={styles.moodDate}>{m.date}</Text>
              </View>
            ))}
          </>
        )}

        {/* Account section — only shown when Supabase is configured */}
        {isSupabaseConfigured && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Account</Text>
            {accountEmail ? (
              <View style={styles.accountCard}>
                <Text style={styles.accountEmail}>{accountEmail}</Text>
                <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : isAnon ? (
              <View style={styles.accountCard}>
                <Text style={styles.anonNote}>Using without an account</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/signup')}
                  style={styles.createAccountBtn}
                >
                  <Text style={styles.createAccountText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigateTo('settings')}
        >
          <Text style={styles.settingsBtnText}>\u2699\uFE0F\u2002Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  content:         { padding: 24, paddingTop: 56, paddingBottom: 40 },
  heading:         { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  statsRow:        { flexDirection: 'row', marginBottom: 28 },
  statCard:        {
    flex: 1, backgroundColor: '#111827', borderRadius: 16,
    padding: 16, alignItems: 'center', marginRight: 8,
  },
  statValue:       { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel:       { color: '#666', fontSize: 11, marginTop: 4 },
  sectionLabel:    {
    color: '#555', fontSize: 12, fontWeight: '700',
    letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase',
  },
  empty:           { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 24 },
  entryCard:       { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10 },
  entryDate:       { color: '#666', fontSize: 11, marginBottom: 4 },
  entryMood:       { color: '#A78BFA', fontSize: 12, marginBottom: 4 },
  entrySnippet:    { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },
  moodRow:         {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 12,
    padding: 12, marginBottom: 8,
  },
  moodEmoji:       { fontSize: 18, marginRight: 10 },
  moodLabel:       { color: '#D1D5DB', fontSize: 14, flex: 1 },
  moodDate:        { color: '#555', fontSize: 11 },
  accountCard:     { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 20 },
  accountEmail:    { color: '#D1D5DB', fontSize: 14, marginBottom: 12 },
  signOutBtn:      { borderWidth: 1, borderColor: '#7F1D1D', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  signOutText:     { color: '#F87171', fontWeight: '700', fontSize: 13 },
  anonNote:        { color: '#9CA3AF', fontSize: 13, marginBottom: 12 },
  createAccountBtn:{ backgroundColor: '#6D28D9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  createAccountText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  settingsBtn:     { backgroundColor: '#1F2937', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 28 },
  settingsBtnText: { color: '#D1D5DB', fontWeight: '700', fontSize: 14 },
});
