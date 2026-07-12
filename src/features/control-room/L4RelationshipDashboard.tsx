/**
 * L4RelationshipDashboard
 *
 * Control Room panel — OBSERVER only.
 * Displays L4 memory state, relationship phase, active goals, expiry
 * warnings, and delete/forget request status.
 * Does not write memories or run reflection. That is the worker's job.
 *
 * Memory runtime:  src/services/ai/agentMemory.ts
 * Goals runtime:   src/services/ai/agentGoals.ts
 * Reflection:      worker/reflection-worker.ts
 * Agent skill:     .agents/skills/bip-l4-memory/SKILL.md
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export type MemorySummary = {
  totalDurable: number;
  contradictions: number;
  lastReflectionAt: string | null;
  activeGoals: string[];
  relationshipPhase: string;
  memoriesNearExpiry: number;
  pendingDeleteRequests: number;
  crossCompanionShares: number; // should always be 0 unless explicitly allowed
};

type Props = {
  summary: MemorySummary | null;
  userId?: string;
};

export function L4RelationshipDashboard({ summary, userId }: Props) {
  if (!summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>L4 Relationship</Text>
        <Text style={styles.empty}>No memory data loaded.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>L4 Relationship Dashboard</Text>
      {userId && <Text style={styles.meta}>User: {userId}</Text>}

      <View style={styles.card}>
        <Row label="Relationship phase" value={summary.relationshipPhase} />
        <Row label="Durable memories" value={String(summary.totalDurable)} />
        <Row label="Contradictions" value={String(summary.contradictions)} alert={summary.contradictions > 0} />
        <Row label="Active goals" value={String(summary.activeGoals.length)} />
        <Row label="Last reflection" value={summary.lastReflectionAt ?? 'Never'} />
        <Row label="Near expiry" value={String(summary.memoriesNearExpiry)} alert={summary.memoriesNearExpiry > 0} />
        <Row label="Pending deletes" value={String(summary.pendingDeleteRequests)} alert={summary.pendingDeleteRequests > 0} />
        <Row
          label="Cross-companion shares"
          value={summary.crossCompanionShares === 0 ? '✓ None' : `⚠ ${summary.crossCompanionShares}`}
          alert={summary.crossCompanionShares > 0}
        />
      </View>

      {summary.activeGoals.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Active goals</Text>
          {summary.activeGoals.map((g, i) => (
            <Text key={i} style={styles.goalItem}>• {g}</Text>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, alert && styles.alertValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 12, color: '#888', marginBottom: 12 },
  empty: { color: '#aaa', marginTop: 24, textAlign: 'center' },
  card: { backgroundColor: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, color: '#555' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  alertValue: { color: '#c0392b' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  goalItem: { fontSize: 13, marginBottom: 4, paddingLeft: 4 },
});
