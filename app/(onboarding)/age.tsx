import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

const AGE_OPTIONS = [
  { id: '13-15' as const, label: '13 – 15' },
  { id: '16-17' as const, label: '16 – 17' },
  { id: '18-19' as const, label: '18 – 19' },
];

type AgeRange = '13-15' | '16-17' | '18-19';

export default function AgeScreen() {
  const { setUserSide } = useAppContext();
  const [selected, setSelected] = useState<AgeRange | null>(null);

  async function handleNext() {
    if (!selected) return;
    await AsyncStorage.setItem('bip_onboarding_age', selected);
    setUserSide('teen');
    router.push('/(onboarding)/name');
  }

  async function handleParent() {
    const done = await AsyncStorage.getItem('parent_profile_done');
    if (done === 'true') {
      setUserSide('parent');
      router.replace('/(parent)/room');
    } else {
      router.push('/(onboarding)/parent-welcome');
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.step}>1 OF 3</Text>
        <Text style={styles.title}>How old are you?</Text>
        <Text style={styles.sub}>Helps your Se'kret know how to be with you.</Text>

        <View style={styles.options}>
          {AGE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setSelected(opt.id)}
              style={[styles.option, selected === opt.id && styles.optionActive]}
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
        >
          <Text style={styles.btnText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleParent} style={styles.parentLink}>
          <Text style={styles.parentLinkText}>I'm a parent →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#090711' },
  content:         { flex: 1, paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28 },
  back:            { marginBottom: 32 },
  backText:        { color: '#7a7089', fontSize: 22 },
  step:            { color: '#6d28d9', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 12 },
  title:           { color: '#fff', fontSize: 34, fontWeight: '900', marginBottom: 10 },
  sub:             { color: '#8b7fa0', fontSize: 14, lineHeight: 22, marginBottom: 42 },
  options:         { gap: 12 },
  option:          { height: 68, borderRadius: 20, borderWidth: 1.5, borderColor: '#ffffff14', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  optionActive:    { borderColor: '#6d28d9', backgroundColor: 'rgba(109,40,217,0.18)' },
  optionText:      { color: '#a89ec0', fontSize: 20, fontWeight: '800' },
  optionTextActive: { color: '#fff' },
  footer:          { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn:             { height: 58, borderRadius: 20, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  btnDisabled:     { opacity: 0.35 },
  btnText:         { color: '#fff', fontSize: 17, fontWeight: '900' },
  parentLink:      { alignItems: 'center', paddingVertical: 8 },
  parentLinkText:  { color: '#6d4a9c', fontSize: 13, fontWeight: '700' },
});
