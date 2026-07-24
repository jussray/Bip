import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DevControlRoomWorkspace from './DevControlRoomWorkspace';
import PromptOsPanel from '@/features/control-room/PromptOsPanel';
import GuardianReviewsPanel from '@/features/control-room/GuardianReviewsPanel';
import WorkerPanel from '@/features/control-room/WorkerPanel';
import { getCurrentFounderProfile, isFounderProfile } from '@/services/founderAudit';

type ControlRoomSurface = 'operations' | 'guardian-reviews' | 'prompt-os' | 'worker';

const WORKER_MANAGER_ROLES = new Set(['admin', 'founder']);

export default function DevControlRoomScreen() {
  const [surface, setSurface] = useState<ControlRoomSurface>('operations');
  const [canManageWorker, setCanManageWorker] = useState<boolean | null>(null);

  useEffect(() => {
    void getCurrentFounderProfile().then((profile) => {
      setCanManageWorker(Boolean(
        profile &&
          isFounderProfile(profile) &&
          profile.can_manage_app &&
          WORKER_MANAGER_ROLES.has(profile.role),
      ));
    });
  }, []);

  function renderWorkerSurface() {
    if (canManageWorker === null) {
      return <View style={styles.locked}><ActivityIndicator color="#a78bfa" /></View>;
    }

    if (!canManageWorker) {
      return (
        <View style={styles.locked}>
          <Text style={styles.lockedText}>Founder or admin management access is required for live Worker operations.</Text>
        </View>
      );
    }

    return <WorkerPanel />;
  }

  return <View style={styles.root}>
    <View style={styles.switcher}>
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
      {surface === 'operations'
        ? <DevControlRoomWorkspace />
        : surface === 'guardian-reviews'
          ? <GuardianReviewsPanel />
          : surface === 'prompt-os'
            ? <PromptOsPanel />
            : renderWorkerSurface()}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  switcher: { position: 'absolute', zIndex: 20, right: 16, top: 16, flexDirection: 'row', gap: 6, backgroundColor: '#0d0a15', borderRadius: 999, padding: 4, borderWidth: 1, borderColor: '#272238' },
  button: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  active: { backgroundColor: '#6d28d9' },
  label: { color: '#8f899e', fontWeight: '800', fontSize: 11 },
  activeLabel: { color: '#fff' },
  content: { flex: 1 },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  lockedText: { color: '#e2dff0', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
});
