import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  loadControlRoomTruth,
  type ControlRoomTruthSnapshot,
} from '@/services/controlRoomTruth';

const CONTINUITY_KEY = 'control-room:truth-membrane:continuity:v1';

type ContinuityReceipt = {
  fingerprint: string;
  observedAt: string;
  state: 'aligned' | 'drifted';
};

type ContinuityState = 'first-observation' | 'stable' | 'changed' | 'held-partial';

const STATE_COLORS = {
  aligned: '#4ade80',
  drifted: '#fb7185',
  partial: '#facc15',
} as const;

function shortSha(value: string | null): string {
  return value ? value.slice(0, 12) : 'UNKNOWN';
}

function title(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function ObservationCard({
  label,
  value,
  detail,
  observed,
}: {
  label: string;
  value: string;
  detail: string;
  observed: boolean;
}) {
  return <View style={styles.observerCard}>
    <View style={styles.row}>
      <Text style={styles.observerLabel}>{label}</Text>
      <Text style={[styles.observerState, { color: observed ? '#4ade80' : '#facc15' }]}>
        {observed ? 'OBSERVED' : 'UNKNOWN'}
      </Text>
    </View>
    <Text selectable style={styles.sha}>{value}</Text>
    <Text style={styles.muted}>{detail}</Text>
  </View>;
}

export default function TruthMembranePanel() {
  const [snapshot, setSnapshot] = useState<ControlRoomTruthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [continuity, setContinuity] = useState<ContinuityState>('first-observation');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let previous: ContinuityReceipt | null = null;
      try {
        const raw = await AsyncStorage.getItem(CONTINUITY_KEY);
        previous = raw ? JSON.parse(raw) as ContinuityReceipt : null;
      } catch {
        previous = null;
      }

      const next = await loadControlRoomTruth();
      setSnapshot(next);

      if (next.state === 'partial') {
        setContinuity('held-partial');
        return;
      }

      if (!previous) setContinuity('first-observation');
      else setContinuity(previous.fingerprint === next.continuityFingerprint ? 'stable' : 'changed');

      const receipt: ContinuityReceipt = {
        fingerprint: next.continuityFingerprint,
        observedAt: next.observedAt,
        state: next.state,
      };
      await AsyncStorage.setItem(CONTINUITY_KEY, JSON.stringify(receipt));
    } catch (truthError) {
      setError(truthError instanceof Error ? truthError.message : 'truth_snapshot_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading && !snapshot) {
    return <View style={styles.center}>
      <ActivityIndicator color="#a78bfa" />
      <Text style={styles.muted}>Reading source and runtime truth…</Text>
    </View>;
  }

  if (!snapshot) {
    return <View style={styles.center}>
      <Text style={styles.title}>Truth membrane unavailable</Text>
      <Text style={styles.warning}>{error || 'No observation could be completed.'}</Text>
      <TouchableOpacity style={styles.primary} onPress={() => void refresh()} accessibilityRole="button">
        <Text style={styles.primaryText}>Try again</Text>
      </TouchableOpacity>
    </View>;
  }

  const stateColor = STATE_COLORS[snapshot.state];
  const continuityLabel = continuity === 'stable'
    ? 'Fingerprint unchanged since last complete observation.'
    : continuity === 'changed'
      ? 'Fingerprint changed. Reconcile what moved before promotion.'
      : continuity === 'held-partial'
        ? 'Continuity receipt was not advanced because evidence is partial.'
        : 'First complete observation on this device.';

  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <Text style={styles.kicker}>SE’KRET BIP · TRUTH MEMBRANE</Text>
      <View style={styles.row}>
        <Text style={styles.title}>What is real right now</Text>
        <View style={[styles.statePill, { borderColor: stateColor }]}>
          <Text style={[styles.stateText, { color: stateColor }]}>{snapshot.state.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.body}>
        Reconcile current GitHub main, the public Pages release marker, and the live Worker identity before treating a release as real.
      </Text>
      <Text style={styles.muted}>Observed {new Date(snapshot.observedAt).toLocaleString()}</Text>
    </View>

    <View style={styles.grid}>
      <ObservationCard
        label="GitHub main"
        value={shortSha(snapshot.source.mainSha)}
        detail="Authoritative source branch head."
        observed={snapshot.source.state === 'observed'}
      />
      <ObservationCard
        label="Pages release"
        value={shortSha(snapshot.pages.releaseSha)}
        detail="Public frontend release identity."
        observed={snapshot.pages.state === 'observed'}
      />
      <ObservationCard
        label="Worker runtime"
        value={shortSha(snapshot.worker.releaseSha)}
        detail={`Health: ${snapshot.worker.ok === null ? 'UNKNOWN' : snapshot.worker.ok ? 'OK' : 'NOT OK'}`}
        observed={snapshot.worker.state === 'observed'}
      />
      <ObservationCard
        label="Local agent"
        value={snapshot.localAgent.state.toUpperCase()}
        detail={snapshot.localAgent.activeMission
          ? `Running: ${snapshot.localAgent.activeMission}`
          : snapshot.localAgent.latestMissionId
            ? `Latest: ${snapshot.localAgent.latestMissionId} · ${snapshot.localAgent.latestMissionStatus ?? 'unknown'}`
            : 'No local mission evidence loaded.'}
        observed={snapshot.localAgent.state === 'online'}
      />
    </View>

    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Continuity fingerprint</Text>
      <Text selectable style={styles.fingerprint}>{snapshot.continuityFingerprint}</Text>
      <Text style={styles.body}>{continuityLabel}</Text>
      <Text style={styles.muted}>
        This fingerprints source/runtime state only. It is not a person, browser, device, session, or authorization fingerprint.
      </Text>
    </View>

    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Authority stays separate</Text>
      <View style={styles.authorityRow}><Text style={styles.muted}>Execute</Text><Text style={styles.denied}>NOT AUTHORIZED</Text></View>
      <View style={styles.authorityRow}><Text style={styles.muted}>Merge</Text><Text style={styles.denied}>NOT AUTHORIZED</Text></View>
      <View style={styles.authorityRow}><Text style={styles.muted}>Deploy</Text><Text style={styles.denied}>NOT AUTHORIZED</Text></View>
      <Text style={styles.body}>{snapshot.authority.reason}</Text>
    </View>

    <View style={[styles.panel, styles.nextGate]}>
      <Text style={styles.kicker}>NEXT GATE</Text>
      <Text style={styles.panelTitle}>{snapshot.nextGate}</Text>
    </View>

    {error ? <Text style={styles.warning}>{error}</Text> : null}
    <TouchableOpacity style={styles.primary} onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Refresh truth membrane">
      <Text style={styles.primaryText}>{loading ? 'Refreshing…' : 'Refresh truth'}</Text>
    </TouchableOpacity>

    <Text style={styles.footer}>
      {title(snapshot.state)} observation does not replace exact-head CI, Playwright, provider proof, or founder approval.
    </Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  content: { padding: 18, paddingTop: 78, paddingBottom: 40, gap: 14, maxWidth: 980, width: '100%', alignSelf: 'center' },
  center: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#080611', padding: 24 },
  hero: { backgroundColor: '#100b1c', borderWidth: 1, borderColor: '#2d2440', borderRadius: 20, padding: 18, gap: 8 },
  kicker: { color: '#a78bfa', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { flex: 1, color: '#fff', fontSize: 24, fontWeight: '900' },
  body: { color: '#d4cfe0', fontSize: 13, lineHeight: 20 },
  muted: { color: '#8f899e', fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  stateText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  observerCard: { flexGrow: 1, flexBasis: 210, minWidth: 210, backgroundColor: '#0d0a15', borderWidth: 1, borderColor: '#272238', borderRadius: 16, padding: 14, gap: 7 },
  observerLabel: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '900' },
  observerState: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sha: { color: '#c4b5fd', fontSize: 18, fontWeight: '900', fontFamily: 'monospace' },
  panel: { backgroundColor: '#0d0a15', borderWidth: 1, borderColor: '#272238', borderRadius: 16, padding: 16, gap: 9 },
  panelTitle: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 22 },
  fingerprint: { color: '#c4b5fd', fontFamily: 'monospace', fontSize: 14, fontWeight: '800' },
  authorityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#272238', paddingVertical: 7 },
  denied: { color: '#fb923c', fontSize: 11, fontWeight: '900' },
  nextGate: { borderColor: '#6d28d9', backgroundColor: '#140d24' },
  primary: { alignSelf: 'flex-start', backgroundColor: '#6d28d9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  primaryText: { color: '#fff', fontWeight: '900' },
  warning: { color: '#facc15', fontSize: 12, lineHeight: 18 },
  footer: { color: '#6f687d', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 2 },
});
