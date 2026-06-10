import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CompanionLevel, CompanionCheckIn } from '../types/sekretCompanion';

interface SekretCompanionCardProps {
  personality: string;
  greeting: string;
  memoryMessage: string;
  level: CompanionLevel;
  checkIn?: CompanionCheckIn | null;
  onAction: (action: 'write' | 'voice' | 'comfort' | 'checkIn') => void;
}

export function SekretCompanionCard({
  personality,
  greeting,
  memoryMessage,
  level,
  checkIn,
  onAction,
}: SekretCompanionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.badge}>{personality}</Text>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.memoryText}>{memoryMessage}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level {level.level}</Text>
          <Text style={styles.levelTitle}>{level.title}</Text>
        </View>
      </View>

      {checkIn ? (
        <View style={styles.checkInWrap}>
          <Text style={styles.checkInLabel}>Se’kret check-in</Text>
          <Text style={styles.checkInText}>{checkIn.message}</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('write')}>
          <Text style={styles.actionEmoji}>✍️</Text>
          <Text style={styles.actionLabel}>Write</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('voice')}>
          <Text style={styles.actionEmoji}>🎙️</Text>
          <Text style={styles.actionLabel}>Voice Bip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('comfort')}>
          <Text style={styles.actionEmoji}>🫶</Text>
          <Text style={styles.actionLabel}>Comfort Me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('checkIn')}>
          <Text style={styles.actionEmoji}>💜</Text>
          <Text style={styles.actionLabel}>Check In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(16, 12, 30, 0.92)',
    borderColor: 'rgba(167, 139, 250, 0.7)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#a855f7',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  badge: {
    color: '#f5f0ff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  memoryText: {
    color: '#d8b4fe',
    fontSize: 12,
    lineHeight: 18,
  },
  levelBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
  },
  levelText: { color: '#f5f0ff', fontSize: 11, fontWeight: '800' },
  levelTitle: { color: '#e9d5ff', fontSize: 10, marginTop: 2 },
  checkInWrap: {
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  checkInLabel: { color: '#f5f0ff', fontSize: 10, fontWeight: '700', marginBottom: 3 },
  checkInText: { color: '#f5f0ff', fontSize: 12, lineHeight: 18 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flexBasis: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    alignItems: 'center',
  },
  actionEmoji: { fontSize: 16, marginBottom: 2 },
  actionLabel: { color: '#f5f0ff', fontSize: 11, fontWeight: '700' },
});
