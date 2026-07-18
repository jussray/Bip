/**
 * src/features/control-room/workspace/ThreadDetailPane.tsx
 *
 * Full-detail view for a single Thread. Shows:
 *   - Status + domain header
 *   - Brief
 *   - Block reason + detail (if blocked)
 *   - PR dependency rail
 *   - Artifacts list
 *   - Approval events log
 *   - Blast radius + rollback
 *   - Founder action buttons (Approve / Reject / Hold)
 *
 * Receives thread via props; approval callbacks are no-ops until
 * the real approval gate (PR #490) is merged.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Thread, ThreadArtifact } from './types';
import PRDependencyRail from './PRDependencyRail';

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

const STATUS_COLOR: Record<string, string> = {
  draft: C.faint,
  planned: C.teal,
  running: C.purple,
  review: C.yellow,
  blocked: C.red,
  failed: C.red,
  approved: C.green,
  applied: C.green,
  rolled_back: C.orange,
};

interface Props {
  thread: Thread;
  onClose?: () => void;
  onApprove?: (threadId: string) => void;
  onReject?: (threadId: string) => void;
  onHold?: (threadId: string) => void;
}

export default function ThreadDetailPane({ thread, onClose, onApprove, onReject, onHold }: Props) {
  const statusColor = STATUS_COLOR[thread.status] ?? C.muted;

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusText, { color: statusColor }]}>
            {thread.status.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={s.domainChip}>{thread.domain}</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.closeBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Title */}
        <Text style={s.title}>{thread.title}</Text>

        {/* Risk badge */}
        <View style={s.riskRow}>
          <Text style={s.sectionLabel}>RISK</Text>
          <Text style={[s.riskValue, {
            color: thread.riskLevel === 'high' ? C.red : thread.riskLevel === 'medium' ? C.yellow : C.green,
          }]}>
            {thread.riskLevel.toUpperCase()}
          </Text>
        </View>

        {/* Brief */}
        <Section label='BRIEF'>
          <Text style={s.body}>{thread.brief}</Text>
        </Section>

        {/* Block detail */}
        {thread.blockDetail && (
          <Section label='BLOCK DETAIL'>
            <View style={s.codeBox}>
              <Text style={s.code}>{thread.blockDetail}</Text>
            </View>
          </Section>
        )}

        {/* Dependency rail */}
        {thread.dependencies.length > 0 && (
          <Section label='DEPENDENCY CHAIN'>
            <PRDependencyRail chain={thread.dependencies} label='' />
          </Section>
        )}

        {/* Artifacts */}
        {thread.artifacts.length > 0 && (
          <Section label='ARTIFACTS'>
            {thread.artifacts.map(a => <ArtifactRow key={a.id} artifact={a} />)}
          </Section>
        )}

        {/* Blast radius + rollback */}
        {thread.blastRadius && (
          <Section label='BLAST RADIUS'>
            <Text style={[s.body, { color: C.orange }]}>{thread.blastRadius}</Text>
          </Section>
        )}
        {thread.rollbackNote && (
          <Section label='ROLLBACK PLAN'>
            <Text style={s.body}>{thread.rollbackNote}</Text>
          </Section>
        )}

        {/* Approval log */}
        {thread.approvals.length > 0 && (
          <Section label='APPROVAL LOG'>
            {thread.approvals.map(ev => (
              <View key={ev.id} style={s.approvalRow}>
                <Text style={[s.approvalDecision, {
                  color: ev.decision === 'approved' ? C.green : ev.decision === 'rejected' ? C.red : C.yellow,
                }]}>
                  {ev.decision.toUpperCase()}
                </Text>
                <Text style={s.approvalActor}>{ev.actorLabel}</Text>
                {ev.note && <Text style={s.approvalNote}>{ev.note}</Text>}
              </View>
            ))}
          </Section>
        )}

        {/* Founder action gate */}
        {(thread.status === 'review' || thread.status === 'blocked') && (
          <View style={s.gateBox}>
            <Text style={s.gateLabel}>⛩ FOUNDER GATE</Text>
            <Text style={s.gateNote}>
              Approval routes to PR #490 when merged. No-op until gate is live.
            </Text>
            <View style={s.gateActions}>
              <GateBtn label='✅ Approve' color={C.green} onPress={() => onApprove?.(thread.id)} />
              <GateBtn label='✋ Hold'    color={C.yellow} onPress={() => onHold?.(thread.id)} />
              <GateBtn label='✗ Reject'  color={C.red}    onPress={() => onReject?.(thread.id)} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sec.root}>
      <Text style={sec.label}>{label}</Text>
      {children}
    </View>
  );
}

function ArtifactRow({ artifact }: { artifact: ThreadArtifact }) {
  const kindEmoji: Record<string, string> = {
    pull_request: '🔀',
    sql_migration: '💾',
    deploy: '🚀',
    email_draft: '✉️',
    spec: '📄',
    report: '📊',
    ci_log: '📋',
  };
  return (
    <View style={sec.artifactRow}>
      <Text style={sec.artifactEmoji}>{kindEmoji[artifact.kind] ?? '📎'}</Text>
      <Text style={sec.artifactLabel}>{artifact.label}</Text>
    </View>
  );
}

function GateBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[sec.gateBtn, { borderColor: color + '77' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[sec.gateBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  domainChip: {
    backgroundColor: C.purpleDim,
    color: C.purple,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  closeBtn: { color: C.muted, fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  title: { color: C.text, fontWeight: '800', fontSize: 17, lineHeight: 24 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  riskValue: { fontSize: 11, fontWeight: '800' },
  body: { color: C.muted, fontSize: 13, lineHeight: 20 },
  codeBox: {
    backgroundColor: C.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
  },
  code: { color: C.red, fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
  approvalRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 4 },
  approvalDecision: { fontSize: 11, fontWeight: '800', width: 72 },
  approvalActor: { color: C.muted, fontSize: 12 },
  approvalNote: { color: C.faint, fontSize: 11, fontStyle: 'italic' },
  gateBox: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.purple + '44',
    padding: 14,
    gap: 8,
  },
  gateLabel: { color: C.purple, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  gateNote: { color: C.muted, fontSize: 11, lineHeight: 16 },
  gateActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});

const sec = StyleSheet.create({
  root: { gap: 8 },
  label: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  artifactRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  artifactEmoji: { fontSize: 14 },
  artifactLabel: { color: C.text, fontSize: 13 },
  gateBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  gateBtnText: { fontSize: 12, fontWeight: '700' },
});
