import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { IMAGES } from '@/constants/theme';
import { updateSekretMemory } from '../../services/sekretMemory';
import { useAppContext } from '@/context/AppContext';

const QUESTIONS: Record<string, string> = {
  '13-15': "What's something you keep to yourself that you really wish someone just got?",
  '16-17': "Right now, what's taking up the most space in your head?",
  '18-19': "What's something you're figuring out that no one around you seems to understand?",
  default:  "What's one thing you're carrying right now that nobody else knows?",
};

export default function ReflectionScreen() {
  const { setSelectedSekret } = useAppContext();
  const [question, setQuestion] = useState(QUESTIONS.default);
  const [name,     setName]     = useState('');
  const [answer,   setAnswer]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const fade  = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.multiGet(['bip_onboarding_age', 'bip_onboarding_name']).then(pairs => {
      const age  = pairs[0][1] ?? 'default';
      const nick = pairs[1][1] ?? '';
      setQuestion(QUESTIONS[age] ?? QUESTIONS.default);
      setName(nick);
    });

    Animated.timing(fade, { toValue: 1, duration: 700, delay: 150, useNativeDriver: true }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.04, duration: 2800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,    duration: 2800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, breathe]);

  async function handleEnter() {
    if (saving) return;
    setSaving(true);
    try {
      const trimmed = answer.trim();
      const age     = (await AsyncStorage.getItem('bip_onboarding_age')) ?? '';

      // Persist the full profile
      await AsyncStorage.multiSet([
        ['teen_profile_done', 'true'],
        ['teen_profile_data', JSON.stringify({ name, age, reflection: trimmed })],
        ['bip_onboarding_reflection', trimmed],
      ]);

      // Seed sekretMemory with the first oracle signal
      if (trimmed) {
        await updateSekretMemory({
          selectedSekret: 'raylene',
          oracleSignals: { personalityNote: trimmed },
        }).catch(() => null);
      }

      setSelectedSekret('raylene');
      router.replace('/(teen)/room');
    } finally {
      setSaving(false);
    }
  }

  const canSkip = !saving;
  const canEnter = answer.trim().length > 0 && !saving;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#10091b', '#171024', '#090711']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.step}>3 OF 3</Text>

        {/* Companion */}
        <Animated.View style={[styles.avatarWrap, { transform: [{ scale: breathe }] }]}>
          <Image source={IMAGES.cloudAvatarNeutral} style={styles.avatar} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.companionLabel}>Se'kret</Text>

          <Text style={styles.question}>{question}</Text>

          <View style={styles.answerWrap}>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="say it exactly how it feels…"
              placeholderTextColor="#4a4357"
              style={styles.answerInput}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {name ? (
            <Text style={styles.nameHint}>
              We'll remember this for you, {name}.
            </Text>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!canEnter}
          onPress={handleEnter}
          style={[styles.btn, !canEnter && styles.btnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{saving ? 'entering…' : 'Enter Se\'kret Bip 💜'}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!canSkip} onPress={handleEnter} style={styles.skipLink}>
          <Text style={styles.skipText}>skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#090711' },
  scroll:        { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28, paddingBottom: 24 },
  back:          { marginBottom: 20 },
  backText:      { color: '#7a7089', fontSize: 22 },
  step:          { color: '#6d28d9', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 20 },
  avatarWrap:    { alignSelf: 'center', marginBottom: 16 },
  avatar:        { width: 110, height: 110 },
  companionLabel: { color: '#8ed9e7', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 14, textAlign: 'center' },
  question:      { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 32, marginBottom: 28, textAlign: 'center' },
  answerWrap:    { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff14', backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, minHeight: 130, marginBottom: 16 },
  answerInput:   { color: '#eee7f1', fontSize: 16, lineHeight: 26, minHeight: 100 },
  nameHint:      { color: '#5a5167', fontSize: 12, textAlign: 'center' },
  footer:        { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn:           { height: 58, borderRadius: 20, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnDisabled:   { opacity: 0.35 },
  btnText:       { color: '#fff', fontSize: 17, fontWeight: '900' },
  skipLink:      { alignItems: 'center', paddingVertical: 8 },
  skipText:      { color: '#4a4357', fontSize: 13 },
});
