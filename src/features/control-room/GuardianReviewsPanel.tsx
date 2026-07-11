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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function GuardianReviewsPanel() {
  const [rows, setRows] = useState<GuardianReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

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

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function decide(row: GuardianReviewRow, approve: boolean) {
    const supabase = getSupabase();
    if (!supabase || busyId) return;
    setBusyId(row.target_user_id);
    setError(null);
    try {
      const reason = notes[row.target_user_id]?.trim() || null;
      if (!approve && !reason) {
        setError('Add a reason before rejecting a guardian review.');
        return;
      }
      const { error: reviewError } = await supabase.rpc('review_guardian_verification', {
        p_target_user_id: row.target_user_id,
        p_approve: approve,
        p_reason: reason,
      });
      if (reviewError) throw reviewError;
      setNotes(current => {
        const next = { ...current };
        delete next[row.target_user_id];
        return next;
      });
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
      ) : rows.map(row => {
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
            {row.verification_reason ? <Text style={styles.meta}>Reason: {row.verification_reason}</Text> : null}
            <TextInput
              value={notes[row.target_user_id] ?? ''}
              onChangeText={value => setNotes(current => ({ ...current, [row.target_user_id]: value }))}
              placeholder="Decision note, required for rejection"
              placeholderTextColor="#625b72"
              style={styles.input}
              multiline
              maxLength={500}
            />
            <View style={styles.actions}>
              <TouchableOpacity disabled={busy} style={[styles.button, styles.reject]} onPress={() => void decide(row, false)}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={busy} style={[styles.button, styles.approve]} onPress={() => void decide(row, true)}>
                {busy ? <ActivityIndicator color="#07140e" /> : <Text style={styles.approveText}>Approve guardian</Text>}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  content: { padding: 22, paddingTop: 72, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#080611', alignItems: 'center', justifyContent: 'center', padding: 28 },
  locked: { color: '#c4b5fd', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  kicker: { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 2.3, marginBottom: 10 },
  title: { color: '#fff', fontSize: 28, lineHeight: 35, fontWeight: '900', marginBottom: 12 },
  body: { color: '#aaa1b8', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  error: { color: '#fca5a5', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  empty: { borderWidth: 1, borderColor: '#2a2436', borderRadius: 20, padding: 22, backgroundColor: '#0d0a15' },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 6 },
  muted: { color: '#7c7489', fontSize: 12, lineHeight: 18 },
  card: { borderWidth: 1, borderColor: '#2a2436', borderRadius: 20, padding: 18, backgroundColor: '#0d0a15', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  grow: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '900' },
  email: { color: '#aaa1b8', fontSize: 12, marginTop: 4 },
  state: { color: '#fbbf24', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  meta: { color: '#7c7489', fontSize: 11, lineHeight: 17, marginTop: 8 },
  input: { minHeight: 72, borderRadius: 14, borderWidth: 1, borderColor: '#2f293c', color: '#fff', backgroundColor: '#080611', padding: 12, marginTop: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reject: { borderWidth: 1, borderColor: '#fb718566', backgroundColor: '#fb718514' },
  approve: { backgroundColor: '#6ee7b7' },
  rejectText: { color: '#fda4af', fontSize: 13, fontWeight: '900' },
  approveText: { color: '#07140e', fontSize: 13, fontWeight: '900' },
});
