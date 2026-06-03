// screens/PeriodCalendarScreen.tsx
// Se'kret Bip — Cycle Calendar
// Private. On-device only. No data ever leaves this phone.
//
// Fixes applied (audit 2026-06-03):
//   A3 — back button no longer hardcoded to 'bippin2'; uses backTarget prop (defaults 'home')
//   C6 — JSON.parse wrapped in try/catch to guard against corrupted AsyncStorage data

import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  Image,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES } from '../constants/theme';

const RAYLENE_THINKING = IMAGES.rayleneThinking;

// ── Props ────────────────────────────────────────────────────────────────────

interface PeriodCalendarScreenProps {
  theme:        Record<string, any>;
  setScreen:    (screen: string) => void;
  backTarget?:  string;   // Fix A3: where the back button navigates. Defaults to 'home'.
}

// ── Component ────────────────────────────────────────────────────────────────

export function PeriodCalendarScreen({
  theme,
  setScreen,
  backTarget = 'home',
}: PeriodCalendarScreenProps) {

  const today = new Date();
  const [currentMonth,     setCurrentMonth]     = useState(today.getMonth());
  const [currentYear,      setCurrentYear]       = useState(today.getFullYear());
  const [markedDays,       setMarkedDays]         = useState<Record<string, string>>({});
  const [lastPeriodStart,  setLastPeriodStart]    = useState<string | null>(null);

  // Fix C6: JSON.parse guarded with try/catch on both storage reads
  useEffect(() => {
    AsyncStorage.getItem('periodDays').then(v => {
      try {
        if (v) setMarkedDays(JSON.parse(v));
      } catch {
        // Corrupted storage — start fresh rather than crash
        setMarkedDays({});
      }
    });
    AsyncStorage.getItem('lastPeriodStart').then(v => {
      if (v) setLastPeriodStart(v);
    });
  }, []);

  const save = async (days: Record<string, string>, start: string | null) => {
    await AsyncStorage.setItem('periodDays', JSON.stringify(days));
    if (start) await AsyncStorage.setItem('lastPeriodStart', start);
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (m: number, y: number) => new Date(y, m, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', {
    month: 'long',
    year:  'numeric',
  });

  const toggleDay = (day: number) => {
    const key  = `${currentYear}-${currentMonth + 1}-${day}`;
    const next = { ...markedDays };

    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 'period';
      if (!lastPeriodStart) {
        setLastPeriodStart(key);
        save(next, key);
        setMarkedDays(next);
        return;
      }
    }
    setMarkedDays(next);
    save(next, lastPeriodStart);
  };

  const predictNext = (): string | null => {
    if (!lastPeriodStart) return null;
    const [y, m, d] = lastPeriodStart.split('-').map(Number);
    const next = new Date(y, m - 1, d + 28);
    return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const days     = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const cells    = Array(firstDay).fill(null).concat(
    Array.from({ length: days }, (_, i) => i + 1),
  );

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const prediction = predictNext();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Back — Fix A3: uses backTarget prop ── */}
      <TouchableOpacity
        onPress={() => setScreen(backTarget)}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.logo}>Cycle Calendar 🩸</Text>
      <Text style={styles.subtitle}>Track your cycle privately. Only you can see this.</Text>

      <Image source={RAYLENE_THINKING} style={styles.artworkMedium} resizeMode="contain" />

      {/* ── Calendar card ── */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={prevMonth}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Text style={[styles.navArrow, { color: theme.accent }]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthName}>{monthName}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Text style={[styles.navArrow, { color: theme.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dayHeaders}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            const key    = day ? `${currentYear}-${currentMonth + 1}-${day}` : null;
            const marked = key ? markedDays[key] : null;
            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={() => day && toggleDay(day)}
                disabled={!day}
                accessibilityRole="button"
                accessibilityLabel={day ? `${day}${marked ? ', marked' : ''}` : undefined}
              >
                <View style={[styles.dayCircle, marked ? { backgroundColor: theme.accent } : null]}>
                  <Text style={[
                    styles.dayText,
                    { color: day ? (marked ? '#fff' : '#E2E8F0') : 'transparent' },
                  ]}>
                    {day || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Prediction ── */}
      {prediction && (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={[styles.softLabel, { color: theme.soft }]}>Next predicted period</Text>
          <Text style={styles.predictionDate}>~{prediction}</Text>
          <Text style={styles.predictionSub}>Based on a 28-day average cycle</Text>
        </View>
      )}

      {/* ── Comfort tips ── */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={styles.tipsTitle}>Comfort Tips 💜</Text>
        {[
          'Use a heating pad for cramps',
          'Stay hydrated — water helps a lot',
          'Rest when your body asks for it',
          "Be gentle with yourself, it's okay to slow down",
          'Dark chocolate and warm tea are your friends 🍫',
        ].map(tip => (
          <Text key={tip} style={styles.tip}>• {tip}</Text>
        ))}
      </View>

      {/* ── Privacy note ── */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={[styles.privacyNote, { color: theme.soft }]}>
          Tap any day to mark it. Your data stays private on this device. 🔒
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flexGrow: 1, padding: 20, paddingTop: 60 },
  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  backBtn:        { marginBottom: 12 },
  backText:       { color: '#94A3B8', fontSize: 14 },
  monthNav:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navArrow:       { fontSize: 22 },
  monthName:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dayHeaders:     { flexDirection: 'row', marginBottom: 8 },
  dayHeader:      { flex: 1, textAlign: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  grid:           { flexDirection: 'row', flexWrap: 'wrap' },
  cell:           { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dayCircle:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayText:        { fontSize: 14 },
  softLabel:      { fontSize: 13, marginBottom: 4 },
  predictionDate: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  predictionSub:  { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  tipsTitle:      { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  tip:            { color: '#CBD5E1', fontSize: 14, marginBottom: 6 },
  privacyNote:    { fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  artworkMedium:  { width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
});
