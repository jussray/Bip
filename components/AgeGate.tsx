/**
 * components/AgeGate.tsx
 *
 * Guardrail 6 — Age boundary guardrail.
 *
 * The branded splash stays visible while age-gate storage resolves or while
 * a first-launch user answers the age question. The routed app children are
 * held back until an allowed status is known, so new users cannot see app
 * content underneath the translucent age prompt. Only the 'blocked'
 * (under-13) outcome takes over the full screen, since that one has to be a
 * hard stop rather than an ambient overlay.
 *
 * Confirms the person opening the app is in an allowed age range before
 * letting them continue — under-13 visitors are guided toward a parent/
 * guardian instead of being onboarded as a teen, and nothing beyond the
 * single answer itself is collected or stored.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from '../screens/SplashScreen';

const AGE_GATE_KEY = 'age_gate_status';
export type AgeGateStatus = 'teen' | 'guardian' | 'blocked';

interface Props {
  children: React.ReactNode;
  onResolved?: (status: AgeGateStatus) => void;
}

export function AgeGate({ children, onResolved }: Props) {
  const [status, setStatus] = useState<AgeGateStatus | 'unset' | 'loading'>('loading');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(AGE_GATE_KEY)
      .then(val => {
        const next = (val as AgeGateStatus) || 'unset';
        if (!mounted) return;
        setStatus(next);
        if (next === 'teen' || next === 'guardian') {
          onResolved?.(next);
        }
      })
      .catch(() => { if (mounted) setStatus('unset'); });
    return () => { mounted = false; };
  }, []);

  const choose = async (next: AgeGateStatus) => {
    try { await AsyncStorage.setItem(AGE_GATE_KEY, next); } catch {}
    setStatus(next);
    onResolved?.(next);
  };

  if (status === 'teen' || status === 'guardian') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return <SplashScreen setScreen={() => {}} interactive={false} />;
  }

  if (status === 'blocked') {
    return (
      <View style={styles.root}>
        <Text style={styles.emoji}>💜</Text>
        <Text style={styles.title}>This space is for teens 13–17.</Text>
        <Text style={styles.body}>
          If you're under 13, Se'kret Bip isn't the right fit yet — ask a parent
          or guardian to come in with you, or have them set up the parent side
          themselves.
        </Text>
        <TouchableOpacity style={styles.linkBtn} onPress={() => choose('teen')}>
          <Text style={styles.linkText}>Actually, I'm 13 or older</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // status === 'unset' — first launch ever. Keep only the branded splash
  // visible underneath; the routed app children stay unmounted until the
  // person chooses an allowed status.
  return (
    <View style={styles.unsetRoot}>
      <SplashScreen setScreen={() => {}} interactive={false} />
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Quick check before you come in</Text>
          <Text style={styles.body}>
            How old are you? This just helps us show you the right space —
            nothing else is collected.
          </Text>

          <TouchableOpacity style={styles.optionBtn} onPress={() => choose('teen')}>
            <Text style={styles.optionText}>I'm 13–17</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={() => choose('guardian')}>
            <Text style={styles.optionText}>I'm a parent or guardian (18+)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtnSubtle} onPress={() => choose('blocked')}>
            <Text style={styles.optionTextSubtle}>I'm under 13</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0820', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  unsetRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,4,18,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#150b28',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(200,120,255,0.28)',
    borderBottomWidth: 0,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, color: '#c4b5fd', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  optionBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 18, borderWidth: 1.5,
    borderColor: 'rgba(200,120,255,0.5)', backgroundColor: 'rgba(200,120,255,0.12)',
    alignItems: 'center', marginBottom: 12,
  },
  optionText: { color: '#e2d8ff', fontSize: 15, fontWeight: '700' },
  optionBtnSubtle: { paddingVertical: 10 },
  optionTextSubtle: { color: '#9b8ec4', fontSize: 13 },
  linkBtn: { marginTop: 20, paddingVertical: 10 },
  linkText: { color: '#9b8ec4', fontSize: 13, textDecorationLine: 'underline' },
});
