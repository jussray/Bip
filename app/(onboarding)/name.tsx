import React, { useState, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';

export default function NameScreen() {
  const { advance } = useOnboarding();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);
  const ready = name.trim().length > 0;

  async function handleNext() {
    if (!ready) return;
    Keyboard.dismiss();
    await AsyncStorage.setItem('bip_onboarding_name', name.trim());

    // ── Onboarding state machine ──────────────────────────────────
    await advance('name_set');
    // ─────────────────────────────────────────────────────────────

    router.push('/(onboarding)/identity');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.step}>2 OF 4</Text>
        <Text style={styles.title}>What should{'\n'}Se'kret call you?</Text>
        <Text style={styles.sub}>A nickname, your name — whatever feels like you.</Text>

        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            value={name}
            onChangeText={setName}
            placeholder="your name here"
            placeholderTextColor="#4a4357"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleNext}
            maxLength={32}
            autoFocus
          />
          <View style={[styles.inputUnderline, ready && styles.inputUnderlineActive]} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!ready}
          onPress={handleNext}
          style={[styles.btn, !ready && styles.btnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>That's me →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: '#090711' },
  content:            { flex: 1, paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28 },
  back:               { marginBottom: 32 },
  backText:           { color: '#7a7089', fontSize: 22 },
  step:               { color: '#6d28d9', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 12 },
  title:              { color: '#fff', fontSize: 34, fontWeight: '900', lineHeight: 42, marginBottom: 10 },
  sub:                { color: '#8b7fa0', fontSize: 14, lineHeight: 22, marginBottom: 52 },
  inputWrap:          { paddingBottom: 8 },
  input:              { color: '#fff', fontSize: 30, fontWeight: '800', paddingBottom: 8 },
  inputUnderline:     { height: 2, borderRadius: 1, backgroundColor: '#ffffff18' },
  inputUnderlineActive: { backgroundColor: '#6d28d9' },
  footer:             { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn:                { height: 58, borderRadius: 20, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center' },
  btnDisabled:        { opacity: 0.35 },
  btnText:            { color: '#fff', fontSize: 17, fontWeight: '900' },
});
