/**
 * SekretIdentityAuditPanel
 *
 * Control Room panel — OBSERVER only.
 * Reads audit results from the identity-audit service and displays pass/fail
 * for every identity surface. Does not contain reply logic or style logic.
 *
 * Audit checks performed by: src/services/audit/sekretIdentityAudit.ts (TODO)
 * Agent skill:               .agents/skills/bip-sekret-identity/SKILL.md
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export type IdentityCheck = {
  surface: string;
  pass: boolean;
  detail: string;
};

type Props = {
  checks: IdentityCheck[];
  lastRunAt: string | null;
};

export function SekretIdentityAuditPanel({ checks, lastRunAt }: Props) {
  const failures = checks.filter((c) => !c.pass);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Se'kret Identity Audit</Text>
      {lastRunAt && (
        <Text style={styles.meta}>Last run: {lastRunAt}</Text>
      )}
      {failures.length === 0 ? (
        <Text style={styles.allPass}>✓ All identity surfaces pass</Text>
      ) : (
        <Text style={styles.failCount}>{failures.length} failure(s) detected</Text>
      )}
      {checks.map((check) => (
        <View key={check.surface} style={styles.row}>
          <Text style={check.pass ? styles.pass : styles.fail}>
            {check.pass ? '✓' : '✗'} {check.surface}
          </Text>
          {!check.pass && (
            <Text style={styles.detail}>{check.detail}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 12, color: '#888', marginBottom: 12 },
  allPass: { color: '#2a9d2a', fontWeight: '600', marginBottom: 8 },
  failCount: { color: '#c0392b', fontWeight: '600', marginBottom: 8 },
  row: { marginBottom: 8 },
  pass: { color: '#2a9d2a' },
  fail: { color: '#c0392b', fontWeight: '600' },
  detail: { fontSize: 12, color: '#c0392b', marginTop: 2, paddingLeft: 16 },
});
