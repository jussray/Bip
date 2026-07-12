/**
 * CompanionStyleLabPanel
 *
 * Control Room panel — OBSERVER only.
 * Displays the current style profile for each companion and highlights
 * generic-chatbot drift failures. Builds on Companion Lab — does not replace it.
 *
 * Style profiles live in:  src/features/sekret/styleProfiles.ts
 * Agent skill:             .agents/skills/bip-companion-style-engine/SKILL.md
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export type CompanionStyleProfile = {
  id: 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret';
  displayName: string;
  textStyleSample: string;
  speechStyleSample: string;
  questionBudget: number;
  slangLevel: number;       // 0–10
  warmthScore: number;      // 0–10
  brevityScore: number;     // 0–10
  driftFailures: string[];
};

type Props = {
  profiles: CompanionStyleProfile[];
  candidateReplies?: { companionId: string; text: string }[];
};

export function CompanionStyleLabPanel({ profiles, candidateReplies = [] }: Props) {
  const [selected, setSelected] = useState<string>(profiles[0]?.id ?? 'raylene');
  const profile = profiles.find((p) => p.id === selected);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Companion Style Lab</Text>

      {/* Tab strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {profiles.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.tab, selected === p.id && styles.tabActive]}
            onPress={() => setSelected(p.id)}
          >
            <Text style={[styles.tabLabel, selected === p.id && styles.tabLabelActive]}>
              {p.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {profile && (
        <View style={styles.card}>
          <Row label="Question budget" value={String(profile.questionBudget)} />
          <Row label="Slang level" value={`${profile.slangLevel}/10`} />
          <Row label="Warmth" value={`${profile.warmthScore}/10`} />
          <Row label="Brevity" value={`${profile.brevityScore}/10`} />

          <Text style={styles.sectionLabel}>Text style sample</Text>
          <Text style={styles.sample}>{profile.textStyleSample}</Text>

          <Text style={styles.sectionLabel}>Speech style sample</Text>
          <Text style={styles.sample}>{profile.speechStyleSample}</Text>

          {profile.driftFailures.length > 0 && (
            <>
              <Text style={styles.driftHeading}>⚠ Drift failures</Text>
              {profile.driftFailures.map((f, i) => (
                <Text key={i} style={styles.driftItem}>• {f}</Text>
              ))}
            </>
          )}
        </View>
      )}

      {candidateReplies.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Candidate replies</Text>
          {candidateReplies.map((r, i) => (
            <View key={i} style={styles.candidateRow}>
              <Text style={styles.candidateId}>{r.companionId}</Text>
              <Text style={styles.candidateText}>{r.text}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  tabs: { flexDirection: 'row', marginBottom: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8 },
  tabActive: { backgroundColor: '#1a1a2e' },
  tabLabel: { fontSize: 13, color: '#333' },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13, color: '#555' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sample: { fontSize: 13, fontStyle: 'italic', color: '#333', marginBottom: 4 },
  driftHeading: { fontSize: 13, fontWeight: '700', color: '#c0392b', marginTop: 10 },
  driftItem: { fontSize: 12, color: '#c0392b', marginTop: 2 },
  candidateRow: { backgroundColor: '#f5f5f5', borderRadius: 6, padding: 10, marginBottom: 8 },
  candidateId: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 2 },
  candidateText: { fontSize: 13 },
});
