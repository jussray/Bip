/**
 * src/features/control-room/workspace/BlockedThreadCard.tsx
 *
 * Specialized card for threads in 'blocked' or 'failed' status.
 * Shows block reason badge, detail text, dependency chain, and
 * a founder action row (hold / escalate / dismiss).
 *
 * Matches existing Control Room dark theme exactly.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Thread, BlockReason } from './types';

// ─── Theme (matches WorkerPanel / GuardianReviewsPanel) ───────────────────────

const C = {
  bg: '#080611',
  surface: '#0d0a15',
  surface2: '#110e1c',
  border: '#272238',
  purple: '#6d28d9',
  purpleDim: '#3b1f6e',
  text: '#e2dff0',
  muted: '#8f899e',
  faint: '#4a4660',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  orange: '#f97316',
  teal: '#14b8a6',
} as const;

// ─── Block reason labels ──────────────────────────────────────────────────────

const BLOCK_LABELS: Record<BlockReason, { label: string; color: string }> = {
  runner_startup_failure:  { label: '🚨 Runner startup failure', color: C.red },
  workflow_no_jobs:        { label: '⚠️ Workflow no jobs',       color: C.orange },
  workflow_step_failure:   { label: '⚠️ Workflow step failure',  color: C.orange },
  founder_gate_pending:    { label: '🔐 Founder gate pending',   color: C.yellow },
  dependency_not_merged:   { label: '🔗 Dependency not merged',  color: C.yellow },
  ci_evidence_incomplete:  { label: '🔍 CI evidence incomplete', color: C.muted },
  supabase_split_brain:    { label: '💾 Supabase split-brain',   color: C.red },
  manual_hold:             { label: '✋ Manual hold',            color: C.faint },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  thread: Thread;
  onViewDetail?: (thread: Thread) => void;
}

export default function BlockedThreadCard({ thread, onViewDetail }: Props) {
  const [expanded, setExpanded] = useState(false);
  const blockMeta = thread.blockReason ? BLOCK_LABELS[thread.blockReason] : null;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => setExpanded(v => !v)}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title} numberOfLines={expanded ? undefined : 1}>
            {thread.title}
          </Text>
          <DomainBadge domain={thread.domain} />
        </View>
        <RiskBadge level={thread.riskLevel} />
      </View>

      {/* Block reason badge */}
      {blockMeta && (
        <View style={[s.blockBadge, { borderColor: blockMeta.color + '55' }]}>
          <Text style={[s.blockBadgeText, { color: blockMeta.color }]}>
            {blockMeta.label}
          </Text>
        </View>
      )}

      {/* Brief */}
      <Text style={s.brief} numberOfLines={expanded ? undefined : 2}>
        {thread.brief}
      </Text>

      {/* Expanded detail */}
      {expanded && (
        <>
          {thread.blockDetail && (
            <View style={s.detailBox}>
              <Text style={s.detailLabel}>DETAIL</Text>
              <Text style={s.detailText}>{thread.blockDetail}</Text>
            </View>
          )}

          {thread.dependencies.length > 0 && (
            <View style={s.depSection}>
              <Text style={s.sectionLabel}>DEPENDENCIES</Text>
              {thread.dependencies.map(dep => (
                <View key={dep.prNumber} style={s.depRow}>
                  <Text style={[
                    s.depStatus,
                    { color: dep.status === 'merged' ? C.green : dep.status === 'closed' ? C.red : C.yellow },
                  ]}>
                    {dep.status === 'merged' ? '✓' : dep.status === 'closed' ? '✗' : '○'}
                  </Text>
                  <Text style={s.depTitle}>#{dep.prNumber} {dep.title}</Text>
                </View>
              ))}
            </View>
          )}

          {thread.blastRadius && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>BLAST RADIUS</Text>
              <Text style={s.metaValue}>{thread.blastRadius}</Text>
            </View>
          )}

          {thread.rollbackNote && (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>ROLLBACK</Text>
              <Text style={s.metaValue}>{thread.rollbackNote}</Text>
            </View>
          )}

          {/* Action row */}
          <View style={s.actionRow}>
            <ActionBtn label='View Detail' color={C.purple} onPress={() => onViewDetail?.(thread)} />
            <ActionBtn label='Hold' color={C.yellow} onPress={() => {}} />
          </View>
        </>
      )}

      {/* Collapse/expand caret */}
      <Text style={s.caret}>{expanded ? '▲ less' : '▼ more'}</Text>
    </TouchableOpacity>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DomainBadge({ domain }: { domain: string }) {
  return (
    <View style={s.domainBadge}>
      <Text style={s.domainText}>{domain.toUpperCase()}</Text>
    </View>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const color = level === 'high' ? C.red : level === 'medium' ? C.yellow : C.green;
  return (
    <View style={[s.riskBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[s.riskText, { color }]}>{level.toUpperCase()}</Text>
    </View>
  );
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.actionBtn, { borderColor: color + '66' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[s.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.red + '44',   // blocked cards have a faint red border
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 4, marginRight: 8 },
  title: { color: C.text, fontWeight: '700', fontSize: 14, lineHeight: 20 },

  blockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: C.surface2,
  },
  blockBadgeText: { fontSize: 11, fontWeight: '700' },

  brief: { color: C.muted, fontSize: 13, lineHeight: 18 },

  detailBox: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    gap: 4,
  },
  detailLabel: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  detailText: { color: C.muted, fontSize: 12, fontFamily: 'monospace' },

  depSection: { gap: 6 },
  sectionLabel: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  depRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  depStatus: { fontSize: 13, fontWeight: '800', width: 14 },
  depTitle: { color: C.text, fontSize: 12, flex: 1 },

  metaRow: { gap: 2 },
  metaLabel: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  metaValue: { color: C.muted, fontSize: 12 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  caret: { color: C.faint, fontSize: 10, textAlign: 'right', marginTop: 2 },

  domainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.purpleDim,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  domainText: { color: C.purple, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  riskText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});
