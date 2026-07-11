import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DevControlRoomWorkspace from './DevControlRoomWorkspace';
import PromptOsPanel from '@/features/control-room/PromptOsPanel';
import GuardianReviewsPanel from '@/features/control-room/GuardianReviewsPanel';

type ControlRoomSurface = 'operations' | 'guardian-reviews' | 'prompt-os';

export default function DevControlRoomScreen() {
  const [surface, setSurface] = useState<ControlRoomSurface>('operations');

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
    </View>
    <View style={styles.content}>
      {surface === 'operations'
        ? <DevControlRoomWorkspace />
        : surface === 'guardian-reviews'
          ? <GuardianReviewsPanel />
          : <PromptOsPanel />}
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
});
