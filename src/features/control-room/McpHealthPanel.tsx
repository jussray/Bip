/**
 * McpHealthPanel
 *
 * Control Room panel — OBSERVER only.
 * Shows availability, permissions, last successful call, and stale-data
 * warnings for each MCP connector.
 * Does not initiate MCP calls itself.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export type McpConnector = {
  id: string;
  displayName: string;
  available: boolean;
  permissionsGranted: boolean;
  lastSuccessAt: string | null;
  staleDataWarning: boolean;
  staleDataDetail?: string;
  status: 'active' | 'degraded' | 'offline' | 'future';
};

const STATUS_COLOR: Record<McpConnector['status'], string> = {
  active: '#2a9d2a',
  degraded: '#e67e22',
  offline: '#c0392b',
  future: '#aaa',
};

type Props = {
  connectors: McpConnector[];
};

export function McpHealthPanel({ connectors }: Props) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>MCP Health</Text>
      {connectors.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{c.displayName}</Text>
            <Text style={[styles.status, { color: STATUS_COLOR[c.status] }]}>
              {c.status.toUpperCase()}
            </Text>
          </View>
          <Row label="Available" value={c.available ? '✓' : '✗'} alert={!c.available && c.status !== 'future'} />
          <Row label="Permissions" value={c.permissionsGranted ? '✓ Granted' : '✗ Missing'} alert={!c.permissionsGranted && c.status !== 'future'} />
          <Row label="Last success" value={c.lastSuccessAt ?? 'Never'} />
          {c.staleDataWarning && (
            <Text style={styles.stale}>⚠ Stale: {c.staleDataDetail}</Text>
          )}
        </View>
      ))}
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
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowLabel: { fontSize: 12, color: '#555' },
  rowValue: { fontSize: 12, fontWeight: '600' },
  alertValue: { color: '#c0392b' },
  stale: { fontSize: 12, color: '#e67e22', marginTop: 4 },
});
