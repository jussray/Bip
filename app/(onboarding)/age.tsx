import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ONBOARDING_SIDE_KEY } from '@/services/auth/postAuthBootstrap';
import { useOnboarding } from '@/context/OnboardingContext';
import { advanceStage } from '@/services/onboarding';
import { getSupabase } from '@/utils/supabase';

const AGE_OPTIONS = [
  { id: '13-15' as const, label: '13 – 15' },
  { id: '16-17' as const, label: '16 – 17' },
  { id: '18-19' as const, label: '18 – 19' },
];

type AgeRange = '13-15' | '16-17' | '18-19';

const PURPLE     = '#7c3aed';
const PURPLE_DIM = '#4c1d95';
const BG         = '#0a0a0a';
const TEXT       = '#f3f3f5';
const MUTED      = '#8b7fa0';
const ACCENT     = '#a78bfa';

const STEPS = 4;

export default function AgeScreen() {
  const { setUserSide } = useAppContext();
  const { advance } = useOnboarding();
  const [selected, setSelected] = useState<AgeRange | null>(null);

  async function handleNext() {
    if (!selected) return;
    await AsyncStorage.multiSet([
      ['bip_onboarding_age', selected],
      [ONBOARDING_SIDE_KEY, 'teen'],
    ]);
    setUserSide('teen');
    await advance('age_verified', { age_bucket: selected });
    router.push('/(auth)/signup?side=teen' as never);
  }

  async function handleParent() {
    await AsyncStorage.setItem(ONBOARDING_SIDE_KEY, 'parent');
    setUserSide('parent');
    getSupabase()
      ?.auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          advanceStage(data.user.id, 'role_selected', { role: 'parent' }).catch(() => null);
        }
      });
    router.push('/(onboarding)/parent-splash');
  }

  return (
    <View style={styles.root}>
      <View style={styles.bgDot1} pointerEvents="none" />
      <View style={styles.bgDot2} pointerEvents="none" />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Step dots */}
        <View style={styles.stepDots}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.title}>How old are you?</Text>
        <Text style={styles.sub}>Helps your Se'kret know how to be with you.</Text>

        <View style={styles.options}>
          {AGE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setSelected(opt.id)}
              style={[styles.option, selected === opt.id && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === opt.id }}
            >
              <Text style={[styles.optionText, selected === opt.id && styles.optionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!selected}
          onPress={handleNext}
          style={[styles.btn, !selected && styles.btnDisabled]}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create my account"
        >
          <Text style={styles.btnText}>Create my account →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleParent} style={styles.parentLink} accessibilityRole="link" accessibilityLabel="I'm a parent">
          <Text style={styles.parentLinkText}>I'm a parent →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  bgDot1:           { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#4c1d9520', top: -80, right: -100 },
  bgDot2:           { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#7c3aed12', bottom: 60, left: -80 },
  content:          { flex: 1, paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28 },
  back:             { marginBottom: 28 },
  backText:         { color: MUTED, fontSize: 22 },
  stepDots:         { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  dotActive:        { backgroundColor: PURPLE, width: 18, borderRadius: 3 },
  title:            { color: TEXT, fontSize: 34, fontWeight: '900', marginBottom: 10 },
  sub:              { color: MUTED, fontSize: 14, lineHeight: 22, marginBottom: 42 },
  options:          { gap: 12 },
  option:           { height: 68, borderRadius: 20, borderWidth: 1.5, borderColor: '#ffffff14', backgroundColor: '#16161e', alignItems: 'center', justifyContent: 'center' },
  optionActive:     { borderColor: PURPLE, backgroundColor: 'rgba(124,58,237,0.18)' },
  optionText:       { color: ACCENT, fontSize: 20, fontWeight: '800' },
  optionTextActive: { color: TEXT },
  footer:           { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn:              { height: 58, borderRadius: 20, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  btnDisabled:      { opacity: 0.35 },
  btnText:          { color: '#fff', fontSize: 17, fontWeight: '900' },
  parentLink:       { alignItems: 'center', paddingVertical: 8 },
  parentLinkText:   { color: ACCENT, fontSize: 13, fontWeight: '700' },
});
