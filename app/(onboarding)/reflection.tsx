import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { IMAGES } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useVerificationContext } from '@/context/VerificationContext';
import {
  saveAccountProfile,
  type AgeRange,
  type Companion,
  type ProfileGender,
} from '@/features/identity/accountProfile';

const QUESTIONS: Record<string, string> = {
  '13-15': 'What do you wish somebody understood about you?',
  '16-17': 'What is taking up the most space in your head right now?',
  '18-19': 'What are you figuring out right now?',
  default: 'What are you carrying right now?',
};

function isAgeRange(value: string): value is AgeRange {
  return value === '13-15' || value === '16-17' || value === '18-19';
}

function isGender(value: string | null): value is ProfileGender {
  return value === 'girl' || value === 'boy' || value === 'other';
}

function isCompanion(value: string): value is Companion {
  return value === 'raylene' || value === 'rylane' || value === 'cloud' || value === 'night';
}

export default function ReflectionScreen() {
  const { setSelectedSekret, setUserSide } = useAppContext();
  const { verificationState } = useVerificationContext();
  const [question, setQuestion] = useState(QUESTIONS.default);
  const [name, setName] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.multiGet(['bip_onboarding_age', 'bip_onboarding_name']).then(pairs => {
      const age = pairs[0][1] ?? 'default';
      const nick = pairs[1][1] ?? '';
      setQuestion(QUESTIONS[age] ?? QUESTIONS.default);
      setName(nick);
    });
    Animated.timing(fade, { toValue: 1, duration: 700, delay: 150, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1.04, duration: 2800, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1, duration: 2800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [fade, breathe]);

  async function handleEnter() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const trimmed = answer.trim();
      const values = await AsyncStorage.multiGet([
        'bip_onboarding_age',
        'bip_onboarding_gender',
        'bip_onboarding_companion',
      ]);
      const age = values[0][1] ?? '';
      const gender = values[1][1];
      const choice = values[2][1] ?? 'raylene';

      if (!name.trim() || !isAgeRange(age) || !isGender(gender) || !isCompanion(choice)) {
        throw new Error('Your onboarding profile is incomplete. Go back and finish each step.');
      }

      await saveAccountProfile({
        accountSide: 'teen',
        privateDisplayName: name.trim(),
        onboardingComplete: true,
        ageRange: age,
        gender,
        selectedCompanion: choice,
        circleNickname: 'anonymous bip',
      });

      await AsyncStorage.multiSet([
        ['bip_onboarding_reflection', trimmed],
        ['sekret_self_discovery_profile', JSON.stringify({ reflection: trimmed, updatedAt: new Date().toISOString() })],
      ]);
      setUserSide('teen');
      setSelectedSekret(choice === 'raylene' ? 'soft' : choice);
      router.replace(
        verificationState === 'VERIFIED_TEEN'
          ? '/(teen)/room'
          : '/(auth)/limited-mode',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your Bip profile.');
    } finally {
      setSaving(false);
    }
  }

  const canEnter = answer.trim().length > 0 && !saving;
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.step}>4 OF 4</Text>
        <Animated.View style={[styles.avatarWrap, { transform: [{ scale: breathe }] }]}><Image source={IMAGES.cloudAvatarNeutral} style={styles.avatar} resizeMode="contain" /></Animated.View>
        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.companionLabel}>Se'kret</Text>
          <Text style={styles.question}>{question}</Text>
          <View style={styles.answerWrap}><TextInput value={answer} onChangeText={text => { setAnswer(text); setError(null); }} placeholder="say it exactly how it feels…" placeholderTextColor="#4a4357" style={styles.answerInput} multiline textAlignVertical="top" maxLength={500} /></View>
          {name ? <Text style={styles.nameHint}>We'll remember this for you, {name}.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity disabled={!canEnter} onPress={handleEnter} style={[styles.btn, !canEnter && styles.btnDisabled]} activeOpacity={0.85}><Text style={styles.btnText}>{saving ? 'entering…' : "Enter Se'kret Bip 💜"}</Text></TouchableOpacity>
        <TouchableOpacity disabled={saving} onPress={handleEnter} style={styles.skipLink}><Text style={styles.skipText}>skip for now</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090711' },
  scroll: { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28, paddingBottom: 24 },
  back: { marginBottom: 20 },
  backText: { color: '#7a7089', fontSize: 22 },
  step: { color: '#6d28d9', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 20 },
  avatarWrap: { alignSelf: 'center', marginBottom: 16 },
  avatar: { width: 110, height: 110 },
  companionLabel: { color: '#8ed9e7', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 14, textAlign: 'center' },
  question: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 32, marginBottom: 28, textAlign: 'center' },
  answerWrap: { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff14', backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, minHeight: 130, marginBottom: 16 },
  answerInput: { color: '#eee7f1', fontSize: 16, lineHeight: 26, minHeight: 100 },
  nameHint: { color: '#5a5167', fontSize: 12, textAlign: 'center' },
  error: { color: '#fca5a5', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 14 },
  footer: { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn: { height: 58, borderRadius: 20, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  skipLink: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#4a4357', fontSize: 13 },
});
