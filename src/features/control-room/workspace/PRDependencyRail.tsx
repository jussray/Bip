/**
 * src/features/control-room/workspace/PRDependencyRail.tsx
 *
 * Visual dependency chain rail: shows #481 → #482 → #490 → #480
 * so the founder can see merge order at a glance before making
 * any approval decision.
 *
 * Purely presentational. Accepts an ordered array of ThreadDependency.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ThreadDependency } from './types';

const C = {
  bg: '#080611',
  surface: '#0d0a15',
  border: '#272238',
  purple: '#6d28d9',
  text: '#e2dff0',
  muted: '#8f899e',
  faint: '#4a4660',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
} as const;

interface Props {
  chain: ThreadDependency[];
  label?: string;
}

export default function PRDependencyRail({ chain, label = 'MERGE ORDER' }: Props) {
  if (chain.length === 0) return null;

  return (
    <View style={s.root}>
      <Text style={s.railLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {chain.map((dep, i) => (
          <React.Fragment key={dep.prNumber}>
            <DepNode dep={dep} />
            {i < chain.length - 1 && (
              <View style={s.arrowWrap}>
                <Text style={s.arrow}>→</Text>
              </View>
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

function DepNode({ dep }: { dep: ThreadDependency }) {
  const statusColor =
    dep.status === 'merged' ? C.green
    : dep.status === 'closed' ? C.red
    : dep.status === 'draft' ? C.muted
    : C.yellow;

  const statusLabel =
    dep.status === 'merged' ? '✓ merged'
    : dep.status === 'closed' ? '✗ closed'
    : dep.status === 'draft' ? '○ draft'
    : '● open';

  return (
    <View style={[s.node, { borderColor: statusColor + '66' }]}>
      <Text style={[s.prNum, { color: statusColor }]}>#{dep.prNumber}</Text>
      <Text style={s.prTitle} numberOfLines={2}>{dep.title}</Text>
      <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { marginVertical: 8 },
  railLabel: {
    color: C.faint,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  node: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    width: 130,
    gap: 4,
  },
  prNum: { fontSize: 13, fontWeight: '800' },
  prTitle: { color: C.muted, fontSize: 11, lineHeight: 15 },
  statusLabel: { fontSize: 10, fontWeight: '700' },
  arrowWrap: { paddingHorizontal: 6 },
  arrow: { color: C.faint, fontSize: 16, fontWeight: '700' },
});
