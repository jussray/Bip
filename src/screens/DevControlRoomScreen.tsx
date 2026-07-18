import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import DevControlRoomWorkspace from './DevControlRoomWorkspace';
import FounderOperatorPanel from '@/features/control-room/FounderOperatorPanel';
import PromptOsPanel from '@/features/control-room/PromptOsPanel';
import GuardianReviewsPanel from '@/features/control-room/GuardianReviewsPanel';
import WorkerPanel from '@/features/control-room/WorkerPanel';
import { getCurrentFounderProfile, isFounderProfile, type FounderProfile } from '@/services/founderAudit';

type ControlRoomSurface = 'founder-operator' | 'operations' | 'guardian-reviews' | 'prompt-os' | 'worker';

export default function DevControlRoomScreen() {
  const [surface, setSurface] = useState<ControlRoomSurface>('founder-operator');
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCurrentFounderProfile().then((value) => {
      if (active) setProfile(value);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#a78bfa"/><Text style={styles.muted}>Opening Control Room…</Text></View>;
  }

  if (!isFounderProfile(profile)) {
    return <View style={styles.center}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.lockTitle}>Developer tools locked</Text>
      <TouchableOpacity style={styles.primary} onPress={() => router.replace('/')}>
        <Text style={styles.primaryText}>Back to Bip</Text>
      </TouchableOpacity>
    </View>;
  }

  return <View style={styles.root}>
    <View style={styles.switcher}>
      <TouchableOpacity style={[styles.button, surface === 'founder-operator' && styles.active]} onPress={() => setSurface('founder-operator')}>
        <Text style={[styles.label, surface === 'founder-operator' && styles.activeLabel]}>Operator</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, surface === 'operations' && styles.active]} onPress={() => setSurface('operations')}>
        <Text style={[styles.label, surface === 'operations' && styles.activeLabel]}>Operations</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, surface === 'guardian-reviews' && styles.active]} onPress={() => setSurface('guardian-reviews')}>
        <Text style={[styles.label, surface === 'guardian-reviews' && styles.activeLabel]}>Guardians</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, surface === 'prompt-os' && styles.active]} onPress={() => setSurface('prompt-os')}>
        <Text style={[styles.label, surface === 'prompt-os' && styles.activeLabel]}>Prompt OS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, surface === 'worker' && styles.active]} onPress={() => setSurface('worker')}>
        <Text style={[styles.label, surface === 'worker' && styles.activeLabel]}>Worker</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.content}>
      {surface === 'founder-operator'
        ? <FounderOperatorPanel />
        : surface === 'operations'
          ? <DevControlRoomWorkspace />
          : surface === 'guardian-reviews'
            ? <GuardianReviewsPanel />
            : surface === 'prompt-os'
              ? <PromptOsPanel />
              : <WorkerPanel />}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#080611', padding: 24 },
  muted: { color: '#8f899e', fontSize: 12 },
  lock: { fontSize: 34 },
  lockTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  primary: { backgroundColor: '#6d28d9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  primaryText: { color: '#fff', fontWeight: '900' },
  switcher: { position: 'absolute', zIndex: 20, right: 12, left: 12, top: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, backgroundColor: '#0d0a15', borderRadius: 18, padding: 4, borderWidth: 1, borderColor: '#272238' },
  button: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  active: { backgroundColor: '#6d28d9' },
  label: { color: '#8f899e', fontWeight: '800', fontSize: 11 },
  activeLabel: { color: '#fff' },
  content: { flex: 1 },
});
