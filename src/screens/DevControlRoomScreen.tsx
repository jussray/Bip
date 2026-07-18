import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DevControlRoomWorkspace from './DevControlRoomWorkspace';
import PromptOsPanel from '@/features/control-room/PromptOsPanel';
import GuardianReviewsPanel from '@/features/control-room/GuardianReviewsPanel';
import WorkerPanel from '@/features/control-room/WorkerPanel';
import ThreadBoardPanel from '@/features/control-room/ThreadBoardPanel';

type ControlRoomSurface = 'operations' | 'board' | 'guardian-reviews' | 'prompt-os' | 'worker';

const SURFACES: { key: ControlRoomSurface; label: string }[] = [
  { key: 'operations', label: 'Operations' },
  { key: 'board',      label: 'Board' },
  { key: 'guardian-reviews', label: 'Guardians' },
  { key: 'prompt-os',  label: 'Prompt OS' },
  { key: 'worker',     label: 'Worker' },
];

export default function DevControlRoomScreen() {
  const [surface, setSurface] = useState<ControlRoomSurface>('operations');

  return (
    <View style={styles.root}>
      <View style={styles.switcher}>
        {SURFACES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.button, surface === key && styles.active]}
            onPress={() => setSurface(key)}
          >
            <Text style={[styles.label, surface === key && styles.activeLabel]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {surface === 'operations'      && <DevControlRoomWorkspace />}
        {surface === 'board'           && <ThreadBoardPanel />}
        {surface === 'guardian-reviews'&& <GuardianReviewsPanel />}
        {surface === 'prompt-os'       && <PromptOsPanel />}
        {surface === 'worker'          && <WorkerPanel />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080611' },
  switcher: {
    position: 'absolute',
    zIndex: 20,
    right: 12,
    top: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    backgroundColor: '#0d0a15',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#272238',
    maxWidth: 320,
    justifyContent: 'flex-end',
  },
  button: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  active: { backgroundColor: '#6d28d9' },
  label: { color: '#8f899e', fontWeight: '800', fontSize: 11 },
  activeLabel: { color: '#fff' },
  content: { flex: 1 },
});
