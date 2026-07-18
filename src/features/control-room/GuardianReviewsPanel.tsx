import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSupabase } from '@/utils/supabase';
import { getCurrentFounderProfile, isFounderProfile } from '@/services/founderAudit';

type GuardianReviewRow = {
  target_user_id: string;
  email: string | null;
  private_display_name: string | null;
  verification_state: 'PENDING_GUARDIAN_REVIEW';
  verification_reason: string | null;
  submitted_at: string;
};

/**
 * Replit-style plan-review gate:
 * Before the founder can approve or reject, we show a blast-radius
 * summary (what will change, what will NOT change) and require a
 * notes entry for rejections. An inline confirm step replaces the
 * old direct-action buttons.
 */
type ReviewGateState =
  | { phase: 'idle' }
  | { phase: 'plan'; row: GuardianReviewRow; approve: boolean }
  | { phase: 'confirm'; row: GuardianReviewRow; approve: boolean; note: string };

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function GuardianReviewsPanel() {
  const [rows, setRows] = useState<GuardianReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  // Replit plan-review gate state
  const [gate, setGate] = useState<ReviewGateState>({ phase: 'idle' });

  const load = useCallback(async () => {
    setError(null);
    const founder = await getCurrentFounderProfile();
    if (!founder || !isFounderProfile(founder) || !founder.can_manage_app) {
      setAuthorized(false);
      setRows([]);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    const { data, error: queueError } = await supabase.rpc('list_guardian_verification_queue');
    if (queueError) {
      setError(queueError.message);
      setRows([]);
    } else {
      setRows((data ?? []) as GuardianReviewRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function refresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  // ── Step 1: open the plan gate ──
  function openGate(row: GuardianReviewRow, approve: boolean) {
    setGate({ phase: 'plan', row, approve });
  }

  // ── Step 2: move to confirm ──
  function advanceToConfirm(note: string) {
    if (gate.phase !== 'plan') return;
    if (!gate.approve && !note.trim()) {
      setError('A reason is required before rejecting a guardian review.');
      return;
    }
    setError(null);
    setGate({ phase: 'confirm', row: gate.row, approve: gate.approve, note });
  }

  // ── Step 3: apply ──
  async function applyDecision() {
    if (gate.phase !== 'confirm') return;
    const { row, approve, note } = gate;
    const supabase = getSupabase();
    if (!supabase || busyId) return;
    setBusyId(row.target_user_id);
    setError(null);
    setGate({ phase: 'idle' });
    try {
      const { error: reviewError } = await supabase.rpc('review_guardian_verification', {
        p_target_user_id: row.target_user_id,
        p_approve: approve,
        p_reason: note.trim() || null,
      });
      if (reviewError) throw reviewError;
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to review this guardian account.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#a78bfa" /></View>;
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.locked}>Founder or admin management access is required.</Text>
      </View>
    );
  }

  // ── Plan gate overlay ──
  if (gate.phase === 'plan' || gate.phase === 'confirm') {
    const row = gate.row;
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{gate.phase === 'plan' ? 'PLAN MODE' : 'CONFIRM APPLY'}</Text>
        <Text style={styles.title}>
          {gate.approve ? 'Approve guardian?' : 'Reject guardian?'}
        </Text>

        {/* Blast-radius summary */}
        <View style={styles.blastCard}>
          <Text style={styles.blastTitle}>Blast radius</Text>
          <Text style={styles.blastItem}>✓ Unlocks Parent surfaces for this account</Text>
          <Text style={styles.blastItem}>✓ Creates audit record with your founder ID</Text>
          <Text style={styles.blastNot}>✕ Does NOT create a parent–teen link</Text>
          <Text style={styles.blastNot}>✕ Does NOT expose journal, voice, or private source</Text>
          <Text style={styles.blastNot}>✕ Does NOT grant any teen account access</Text>
        </View>

        <View style={styles.reviewTarget}>
          <Text style={styles.name}>{row.private_display_name || 'Unnamed guardian'}</Text>
          <Text style={styles.email}>{row.email || 'No email'}</Text>
          <Text style={styles.meta}>Submitted {formatDate(row.submitted_at)}</Text>
          {row.verification_reason ? (
            <Text style={styles.meta}>Stated reason: {row.verification_reason}</Text>
          ) : null}
        </View>

        {gate.phase === 'plan' && (
          <PlanGateNote
            requireNote={!gate.approve}
            onConfirm={advanceToConfirm}
            onCancel={() => setGate({ phase: 'idle' })}
          />
        )}

        {gate.phase === 'confirm' && (
          <>
            {gate.note.trim() ? (
              <View style={styles.notePreview}>
                <Text style={styles.kicker}>DECISION NOTE</Text>
                <Text style={styles.body}>{gate.note}</Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.reject]}
                onPress={() => setGate({ ...gate, phase: 'plan' })}
              >
                <Text style={styles.rejectText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, gate.approve ? styles.approve : styles.reject]}
                onPress={() => void applyDecision()}
              >
                {busyId ? (
                  <ActivityIndicator color={gate.approve ? '#07140e' : '#fda4af'} />
                ) : (
                  <Text style={gate.approve ? styles.approveText : styles.rejectText}>
                    {gate.approve ? 'Apply: Approve' : 'Apply: Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    );
  }

  // ── Queue view ──
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a78bfa" />}
    >
      <Text style={styles.kicker}>GUARDIAN REVIEW</Text>
      <Text style={styles.title}>Verify adults without touching teen consent.</Text>
      <Text style={styles.body}>
        Approval unlocks guardian-only Parent surfaces. It does not create a parent link or expose any teen journal, voice note, or private source.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Queue clear</Text>
          <Text style={styles.muted}>No completed Parent accounts are awaiting review.</Text>
        </View>
      ) : rows.map((row) => {
        const busy = busyId === row.target_user_id;
        return (
          <View key={row.target_user_id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.grow}>
                <Text style={styles.name}>{row.private_display_name || 'Unnamed guardian'}</Text>
                <Text style={styles.email}>{row.email || 'No email available'}</Text>
              </View>
              <Text style={styles.state}>PENDING</Text>
            </View>
            <Text style={styles.meta}>Submitted {formatDate(row.submitted_at)}</Text>
            {row.verification_reason ? (
              <Text style={styles.meta}>Reason: {row.verification_reason}</Text>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity
                disabled={busy}
                style={[styles.button, styles.reject]}
                onPress={() => openGate(row, false)}
              >
                <Text style={styles.rejectText}>Review reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                style={[styles.button, styles.approve]}
                onPress={() => openGate(row, true)}
              >
                {busy ? (
                  <ActivityIndicator color="#07140e" />
                ) : (
                  <Text style={styles.approveText}>Review approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Plan-gate note entry ─────────────────────────────────────────────────────

function PlanGateNote({
  requireNote,
  onConfirm,
  onCancel,
}: {
  requireNote: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');
  return (
    <>
      <Text style={styles.fieldLabel}>
        {requireNote ? 'Rejection reason (required)' : 'Decision note (optional)'}
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={requireNote ? 'State the reason for rejection…' : 'Optional note for audit trail…'}
        placeholderTextColor="#625b72"
        style={styles.input}
        multiline
        maxLength={500}
      />
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.ghost]} onPress={onCancel}>
          <Text style={styles.ghostText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.planNext, requireNote && !note.trim() && styles.planNextDisabled]}
          disabled={requireNote && !note.trim()}
          onPress={() => onConfirm(note)}
        >
          <Text style={styles.planNextText}>Review decision →</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#080611' },
  content:          { padding: 22, paddingTop: 72, paddingBottom: 48 },
  center:           { flex: 1, backgroundColor: '#080611', alignItems: 'center', justifyContent: 'center', padding: 28 },
  locked:           { color: '#c4b5fd', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  kicker:           { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 2.3, marginBottom: 10 },
  title:            { color: '#fff', fontSize: 26, lineHeight: 33, fontWeight: '900', marginBottom: 12 },
  body:             { color: '#aaa1b8', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  error:            { color: '#fca5a5', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  empty:            { borderWidth: 1, borderColor: '#2a2436', borderRadius: 20, padding: 22, backgroundColor: '#0d0a15' },
  emptyTitle:       { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 6 },
  muted:            { color: '#7c7489', fontSize: 12, lineHeight: 18 },
  card:             { borderWidth: 1, borderColor: '#2a2436', borderRadius: 20, padding: 18, backgroundColor: '#0d0a15', marginBottom: 14 },
  row:              { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  grow:             { flex: 1 },
  name:             { color: '#fff', fontSize: 16, fontWeight: '900' },
  email:            { color: '#aaa1b8', fontSize: 12, marginTop: 4 },
  state:            { color: '#fbbf24', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  meta:             { color: '#7c7489', fontSize: 11, lineHeight: 17, marginTop: 8 },
  input:            { minHeight: 72, borderRadius: 14, borderWidth: 1, borderColor: '#2f293c', color: '#fff', backgroundColor: '#080611', padding: 12, marginTop: 14, textAlignVertical: 'top' },
  fieldLabel:       { color: '#a78bfa', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginTop: 16, marginBottom: 6 },
  actions:          { flexDirection: 'row', gap: 10, marginTop: 14 },
  button:           { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reject:           { borderWidth: 1, borderColor: '#fb718566', backgroundColor: '#fb718514' },
  approve:          { backgroundColor: '#6ee7b7' },
  rejectText:       { color: '#fda4af', fontSize: 13, fontWeight: '900' },
  approveText:      { color: '#07140e', fontSize: 13, fontWeight: '900' },
  ghost:            { borderWidth: 1, borderColor: '#2f293c', backgroundColor: 'transparent' },
  ghostText:        { color: '#7c7489', fontSize: 13, fontWeight: '700' },
  planNext:         { backgroundColor: '#6d28d9' },
  planNextDisabled: { opacity: 0.4 },
  planNextText:     { color: '#fff', fontSize: 13, fontWeight: '900' },
  // Blast-radius card
  blastCard:        { borderWidth: 1, borderColor: '#272238', borderRadius: 16, padding: 16, backgroundColor: '#0d0a15', marginBottom: 16 },
  blastTitle:       { color: '#a78bfa', fontWeight: '900', fontSize: 12, letterSpacing: 1.5, marginBottom: 10 },
  blastItem:        { color: '#6ee7b7', fontSize: 12, lineHeight: 19, marginBottom: 4 },
  blastNot:         { color: '#fb7185', fontSize: 12, lineHeight: 19, marginBottom: 4 },
  reviewTarget:     { borderWidth: 1, borderColor: '#2a2436', borderRadius: 16, padding: 14, backgroundColor: '#0d0a15', marginBottom: 16 },
  notePreview:      { borderWidth: 1, borderColor: '#332c48', borderRadius: 14, padding: 14, marginBottom: 14, backgroundColor: '#0d0a15' },
});
