import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import DevControlRoomWorkspace from './DevControlRoomWorkspace';
import { CONTROL_ROOM_OPERATIONS } from '@/config/controlRoomOperations';
import { getCurrentFounderProfile, isFounderProfile } from '@/services/founderAudit';
import {
  getControlRoomAgentSnapshot,
  launchBip,
  stopBip,
  type AgentSnapshot,
} from '@/services/controlRoomAgent';

type ControlRoomMode = 'missions' | 'telemetry';

function statusColor(status?: string) {
  if (status === 'running') return '#4ade80';
  if (status === 'starting') return '#facc15';
  if (status === 'failed' || status === 'unreachable') return '#fb7185';
  return '#a78bfa';
}

export default function DevControlRoomScreen() {
  const [mode, setMode] = useState<ControlRoomMode>('missions');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);

  const refreshAgent = useCallback(async () => {
    setSnapshot(await getControlRoomAgentSnapshot());
  }, []);

  useEffect(() => {
    void (async () => {
      const profile = await getCurrentFounderProfile();
      const founder = isFounderProfile(profile);
      setAuthorized(founder);
      if (founder) await refreshAgent();
      setLoading(false);
    })();
  }, [refreshAgent]);

  const runLaunchMission = async () => {
    setBusy(true);
    try {
      setSnapshot(await launchBip());
    } finally {
      setBusy(false);
    }
  };

  const stopLaunchMission = async () => {
    setBusy(true);
    try {
      setSnapshot(await stopBip());
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#a78bfa" />
        <Text style={s.muted}>Opening Control Room…</Text>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={s.center}>
        <Text style={s.lock}>🔒</Text>
        <Text style={s.title}>Developer tools locked</Text>
        <TouchableOpacity style={s.primary} onPress={() => router.replace('/')}>
          <Text style={s.primaryText}>Back to Bip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'telemetry') {
    return (
      <View style={s.root}>
        <View style={s.modeBar}>
          <TouchableOpacity style={s.modeButton} onPress={() => setMode('missions')}>
            <Text style={s.modeButtonText}>Missions</Text>
          </TouchableOpacity>
          <View style={[s.modeButton, s.modeButtonActive]}>
            <Text style={s.modeButtonTextActive}>Telemetry</Text>
          </View>
        </View>
        <DevControlRoomWorkspace />
      </View>
    );
  }

  const launchStatus = snapshot?.launchBip.status || 'unreachable';
  const running = launchStatus === 'running' || launchStatus === 'starting';

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>SE'KRET BIP · FOUNDER</Text>
        <Text style={s.title}>Control Room</Text>
        <Text style={s.subtitle}>{CONTROL_ROOM_OPERATIONS.mission}</Text>

        <View style={s.modeRow}>
          <View style={[s.modeButton, s.modeButtonActive]}>
            <Text style={s.modeButtonTextActive}>Missions</Text>
          </View>
          <TouchableOpacity style={s.modeButton} onPress={() => setMode('telemetry')}>
            <Text style={s.modeButtonText}>Telemetry</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.flex}>
              <Text style={s.eyebrow}>MISSION 001</Text>
              <Text style={s.cardTitle}>Launch Bip</Text>
            </View>
            <Text style={[s.status, { color: statusColor(launchStatus) }]}>{launchStatus}</Text>
          </View>

          <Text style={s.body}>
            Start Expo locally, surface the launch logs, and avoid depending on GitHub Actions or Codespaces to see Bip.
          </Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.primary} disabled={busy || running} onPress={() => void runLaunchMission()}>
              <Text style={s.primaryText}>{busy ? 'Working…' : running ? 'Bip is running' : 'Launch Bip'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondary} disabled={busy} onPress={() => void refreshAgent()}>
              <Text style={s.secondaryText}>Refresh</Text>
            </TouchableOpacity>
            {running ? (
              <TouchableOpacity style={s.danger} disabled={busy} onPress={() => void stopLaunchMission()}>
                <Text style={s.dangerText}>Stop</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {launchStatus === 'unreachable' ? (
            <View style={s.notice}>
              <Text style={s.noticeTitle}>Local agent not reachable</Text>
              <Text style={s.muted}>Run `npm run control-room:agent` from the Bip repository.</Text>
              <Text style={s.muted}>The Control Room still works; only local execution is unavailable.</Text>
            </View>
          ) : null}

          {snapshot?.launchBip.logs?.length ? (
            <View style={s.logs}>
              <Text style={s.noticeTitle}>Latest agent output</Text>
              <Text style={s.logText}>{snapshot.launchBip.logs.slice(-10).join('\n')}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.card}>
          <Text style={s.eyebrow}>PROJECT MEMORY</Text>
          <Text style={s.cardTitle}>GitHub</Text>
          <Text style={s.body}>{CONTROL_ROOM_OPERATIONS.repository} remains the source of truth for code, PRs, and decisions—not the only execution engine.</Text>
          <TouchableOpacity style={s.secondaryWide} onPress={() => void Linking.openURL(CONTROL_ROOM_OPERATIONS.repositoryUrl)}>
            <Text style={s.secondaryText}>Open repository</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.eyebrow}>FOUNDER NOTIFICATIONS</Text>
          <Text style={s.cardTitle}>{CONTROL_ROOM_OPERATIONS.founderNotificationEmail}</Text>
          <Text style={s.body}>Stored as the configured destination for future mission-failure and release-blocking reports. No email is sent yet.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  content: { paddingTop: 58, paddingHorizontal: 18, paddingBottom: 80 },
  center: { flex: 1, backgroundColor: '#080611', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  kicker: { color: '#a78bfa', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  title: { color: '#fff', fontWeight: '900', fontSize: 31, marginTop: 5 },
  subtitle: { color: '#9d96aa', lineHeight: 20, marginTop: 8, marginBottom: 16 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  modeBar: { flexDirection: 'row', gap: 8, paddingTop: 48, paddingHorizontal: 16, paddingBottom: 6, backgroundColor: '#080611' },
  modeButton: { backgroundColor: '#171321', borderWidth: 1, borderColor: '#2b2540', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  modeButtonActive: { backgroundColor: '#6d28d9', borderColor: '#a78bfa' },
  modeButtonText: { color: '#9d96aa', fontWeight: '800' },
  modeButtonTextActive: { color: '#fff', fontWeight: '900' },
  card: { backgroundColor: '#12101c', borderWidth: 1, borderColor: '#2b2540', borderRadius: 18, padding: 16, marginBottom: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  eyebrow: { color: '#8b5cf6', fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 20, marginTop: 5, marginBottom: 8 },
  body: { color: '#c7c1d0', fontSize: 13, lineHeight: 19 },
  status: { fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  primary: { backgroundColor: '#6d28d9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '900' },
  secondary: { backgroundColor: '#211c30', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  secondaryWide: { backgroundColor: '#211c30', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 13, alignItems: 'center' },
  secondaryText: { color: '#c4b5fd', fontWeight: '800' },
  danger: { backgroundColor: '#3f1622', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  dangerText: { color: '#fda4af', fontWeight: '900' },
  notice: { backgroundColor: '#1b1726', borderRadius: 12, padding: 12, marginTop: 14, gap: 5 },
  noticeTitle: { color: '#fff', fontWeight: '800', marginBottom: 4 },
  muted: { color: '#8f899e', fontSize: 12, lineHeight: 18 },
  logs: { backgroundColor: '#09070e', borderRadius: 12, padding: 12, marginTop: 12 },
  logText: { color: '#b7f7c4', fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  lock: { fontSize: 36 },
});
