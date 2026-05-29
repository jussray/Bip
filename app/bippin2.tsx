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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>your soft growth dashboard ✦</Text>
          <Text style={styles.title}>Bippin2 ✨</Text>
          <Text style={styles.sub}>
            Mood patterns, private tracking, tiny wins, and proof that you are still showing up.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💜</Text>
            <Text style={styles.statNumber}>6/10</Text>
            <Text style={styles.statLabel}>heart energy</Text>
          </View>
        </View>

        <View style={styles.weatherCard}>
          <View>
            <Text style={styles.cardKicker}>emotional weather</Text>
            <Text style={styles.weatherTitle}>Heavy Heart 🌧️</Text>
            <Text style={styles.weatherText}>
              You’ve had a few heavy moments, but you kept checking in. That counts.
            </Text>
          </View>

          <View style={styles.weatherBubble}>
            <Text style={styles.weatherBubbleText}>steady</Text>
          </View>
        </View>

        <View style={styles.gardenCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardKicker}>growth garden</Text>
              <Text style={styles.cardTitle}>4 of 7 days watered 🌱</Text>
            </View>
            <Text style={styles.gardenEmoji}>🌿</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '58%' }]} />
          </View>

          <Text style={styles.softText}>
            Not perfect. Still growing. That’s the whole point.
          </Text>
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.cardKicker}>this week</Text>
          <Text style={styles.cardTitle}>You showed up quietly.</Text>

          <View style={styles.weekGrid}>
            {[
              { icon: '📓', label: 'journal entries', value: '3' },
              { icon: '🎙️', label: 'voice bips', value: '2' },
              { icon: '☁️', label: 'comfort checks', value: '4' },
              { icon: '🌙', label: 'late-night pauses', value: '1' },
            ].map((item) => (
              <View key={item.label} style={styles.weekItem}>
                <Text style={styles.weekIcon}>{item.icon}</Text>
                <Text style={styles.weekValue}>{item.value}</Text>
                <Text style={styles.weekLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sekretCard}>
          <Text style={styles.sekretTitle}>☁️ Se&apos;kret says...</Text>
          <Text style={styles.sekretText}>
            You’ve been showing up for yourself lately. That matters more than being perfect.
          </Text>
        </View>

        <View style={styles.tinyWinCard}>
          <Text style={styles.tinyWinEmoji}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tinyWinTitle}>Tiny Win</Text>
            <Text style={styles.tinyWinText}>
              You opened Bip today. That is enough for now.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>growth tools</Text>

        {[
          {
            icon: '💜',
            title: 'Mood Insights',
            text: 'See emotional patterns without judging yourself.',
          },
          {
            icon: '🌙',
            title: 'Cycle Tracker',
            text: 'Private body tracking with soft reminders.',
          },
          {
            icon: '✨',
            title: 'Growth Streaks',
            text: 'Track consistency without shame spirals.',
          },
          {
            icon: '☁️',
            title: 'Soft Goals',
            text: 'Tiny goals that feel possible on heavy days.',
          },
        ].map((item) => (
          <View key={item.title} style={styles.toolCard}>
            <Text style={styles.toolIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolTitle}>{item.title}</Text>
              <Text style={styles.toolText}>{item.text}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </ScrollView>

      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 110,
  },

  hero: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderPk,
  },
  kicker: {
    color: C.lavender,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    color: C.pinkHot,
    fontWeight: '900',
  },
  sub: {
    color: C.mutedLt,
    marginTop: 8,
    lineHeight: 21,
  },

  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginRight: 10,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    color: C.white,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },

  weatherCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardKicker: {
    color: C.pinkHot,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  weatherTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
  },
  weatherText: {
    color: C.mutedLt,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 245,
  },
  weatherBubble: {
    marginLeft: 'auto',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(244,114,182,0.16)',
    borderWidth: 1,
    borderColor: C.borderPk,
  },
  weatherBubbleText: {
    color: C.pinkHot,
    fontWeight: '800',
    fontSize: 11,
  },

  gardenCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: '900',
  },
  gardenEmoji: {
    fontSize: 32,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: C.pinkHot,
  },
  softText: {
    color: C.mutedLt,
    marginTop: 10,
    fontStyle: 'italic',
  },

  weekCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 12,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  weekItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  weekIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  weekValue: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
  },
  weekLabel: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },

  sekretCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderWidth: 1,
    borderColor: C.borderPk,
  },
  sekretTitle: {
    color: C.pinkHot,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  sekretText: {
    color: C.white,
    fontSize: 18,
    lineHeight: 27,
  },

  tinyWinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tinyWinEmoji: {
    fontSize: 34,
    marginRight: 14,
  },
  tinyWinTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '900',
  },
  tinyWinText: {
    color: C.mutedLt,
    marginTop: 4,
    lineHeight: 20,
  },

  sectionTitle: {
    color: C.lavender,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  toolIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  toolTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
  },
  toolText: {
    color: C.muted,
    marginTop: 3,
    lineHeight: 18,
  },
  chevron: {
    color: C.muted,
    fontSize: 26,
    marginLeft: 8,
  },
});