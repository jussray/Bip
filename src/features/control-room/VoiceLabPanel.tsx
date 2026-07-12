/**
 * VoiceLabPanel
 *
 * Control Room panel — OBSERVER only.
 * Tracks TTS health, generation latency, cost, identity leak, and
 * emotional appropriateness. Does not contain TTS or voice logic.
 *
 * Voice pipeline lives in: worker/sekret-voice.ts
 * Agent skill:             .agents/skills/bip-voice-guard/SKILL.md
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export type VoiceMetrics = {
  provider: string;
  voiceId: string;
  ttsHealthy: boolean;
  avgLatencyMs: number;
  playbackFailures: number;
  costPerResponseCents: number;
  textToSpokenConsistency: number; // 0–1
  oracleLeakDetected: boolean;
  emotionalAppropriatenessScore: number; // 0–10 per character, averaged
};

type Props = {
  metrics: VoiceMetrics | null;
  lastUpdatedAt: string | null;
};

export function VoiceLabPanel({ metrics, lastUpdatedAt }: Props) {
  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Voice Lab</Text>
        <Text style={styles.empty}>No voice metrics available yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Voice Lab</Text>
      {lastUpdatedAt && <Text style={styles.meta}>Updated: {lastUpdatedAt}</Text>}

      <View style={styles.card}>
        <Row label="Provider" value={metrics.provider} />
        <Row label="Voice ID" value={metrics.voiceId} />
        <Row label="TTS healthy" value={metrics.ttsHealthy ? '✓ Yes' : '✗ No'} alert={!metrics.ttsHealthy} />
        <Row label="Avg latency" value={`${metrics.avgLatencyMs} ms`} alert={metrics.avgLatencyMs > 2000} />
        <Row label="Playback failures" value={String(metrics.playbackFailures)} alert={metrics.playbackFailures > 0} />
        <Row label="Cost / response" value={`${metrics.costPerResponseCents}¢`} />
        <Row label="Text↔speech consistency" value={`${Math.round(metrics.textToSpokenConsistency * 100)}%`} alert={metrics.textToSpokenConsistency < 0.9} />
        <Row label="Oracle leak in speech" value={metrics.oracleLeakDetected ? '⚠ DETECTED' : '✓ None'} alert={metrics.oracleLeakDetected} />
        <Row label="Emotional appropriateness" value={`${metrics.emotionalAppropriatenessScore}/10`} alert={metrics.emotionalAppropriatenessScore < 7} />
      </View>
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
  card: { backgroundColor: '#fafafa', borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, color: '#555' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  alertValue: { color: '#c0392b' },
});
