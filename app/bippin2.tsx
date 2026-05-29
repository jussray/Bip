import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '@components/BottomNav';
import { C } from '@constants/theme';

export default function Bippin2Screen() {
  const { userSide } = useSekret();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Bippin2 ✨</Text>
        <Text style={styles.sub}>Insights, growth, and gentle tracking.</Text>

        {['Mood Insights 💜', 'Cycle Tracker 🌙', 'Growth Streaks ✨', 'Soft Goals ☁️'].map(item => (
          <View key={item} style={styles.card}>
            <Text style={styles.cardText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, color: C.pinkHot, fontWeight: '800' },
  sub: { color: C.muted, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardText: { color: C.white, fontWeight: '600' },
});
