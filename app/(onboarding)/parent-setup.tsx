import React, { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
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
import { useAppContext } from '@/context/AppContext';

const FOCUS_OPTIONS = [
  { id: 'support', label: 'Support', emoji: '🤝' },
  { id: 'listen', label: 'Listen', emoji: '👂' },
  { id: 'repair', label: 'Repair', emoji: '🌱' },
  { id: 'learn', label: 'Learn', emoji: '📖' },
];

const ROOM_STYLE_OPTIONS: { id: 'mom' | 'dad'; label: string; emoji: string; desc: string }[] = [
  { id: 'mom', label: 'Mom', emoji: '💜', desc: 'Mom Room' },
  { id: 'dad', label: 'Dad', emoji: '👑', desc: 'Dad Room' },
];

export default function ParentSetup() {
  const { setUserSide, setParentRoomStyle } = useAppContext();
  const [name, setName] = useState('');
  const [roomStyle, setRoomStyle] = useState<'mom' | 'dad' | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const underline = useRef(new Animated.Value(0)).current;

  function handleNameChange(text: string) {
    setName(text);
    Animated.timing(underline, {
      toValue: text.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }

  const ready = name.trim().length > 0 && roomStyle !== null && focus !== null && !saving;

  async function handleFinish() {
    if (!ready) return;
    setSaving(true);
    Keyboard.dismiss();
    try {
      setUserSide('parent');
      setParentRoomStyle(roomStyle);
      await AsyncStorage.setItem(
        'parent_profile_data',
        JSON.stringify({ name: name.trim(), roomStyle, focus }),
      );
      await AsyncStorage.removeItem('parent_profile_done');
      router.replace('/(onboarding)/parent-link');
    } finally {
      setSaving(false);
    }
  }

  const underlineColor = underline.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff14', '#a7f3d0'],
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#071410', '#0d1f18', '#08140f']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.step}>PARENT SETUP</Text>
        <Text style={styles.title}>Quick intro,{`\n`}then connect.</Text>

        <Text style={styles.label}>What should your teen call you?</Text>
        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Mom, Dad, Titi…"
            placeholderTextColor="#3d5e4a"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            maxLength={32}
            autoFocus
          />
          <Animated.View style={[styles.inputUnderline, { backgroundColor: underlineColor }]} />
        </TouchableOpacity>

        <Text style={styles.label}>You are</Text>
        <View style={styles.grid}>
          {ROOM_STYLE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setRoomStyle(opt.id)}
              style={[styles.card, roomStyle === opt.id && styles.cardActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: roomStyle === opt.id }}
            >
              <Text style={styles.cardEmoji}>{opt.emoji}</Text>
              <Text style={[styles.cardText, roomStyle === opt.id && styles.cardTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>Shapes your Room art and greeting. You can change this later in Settings.</Text>

        <Text style={[styles.label, styles.labelSpaced]}>What's your main intention here?</Text>
        <View style={styles.grid}>
          {FOCUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setFocus(opt.id)}
              style={[styles.card, focus === opt.id && styles.cardActive]}
            >
              <Text style={styles.cardEmoji}>{opt.emoji}</Text>
              <Text style={[styles.cardText, focus === opt.id && styles.cardTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!ready}
          onPress={handleFinish}
          style={[styles.btn, !ready && styles.btnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{saving ? 'saving…' : 'Continue to private code →'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08140f' },
  scroll: { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingHorizontal: 28, paddingBottom: 24 },
  back: { marginBottom: 28 },
  backText: { color: '#789082', fontSize: 22 },
  step: { color: '#6ee7b7', fontSize: 10, fontWeight: '900', letterSpacing: 2.5, marginBottom: 10 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 40, marginBottom: 36 },
  label: { color: '#8aaf9c', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 14 },
  labelSpaced: { marginTop: 24 },
  hint: { color: '#3d5e4a', fontSize: 11, lineHeight: 16, marginTop: 10 },
  inputWrap: { marginBottom: 36, paddingBottom: 8 },
  input: { color: '#fff', fontSize: 28, fontWeight: '800', paddingBottom: 8 },
  inputUnderline: { height: 2, borderRadius: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47%', height: 72, borderRadius: 20, borderWidth: 1.5, borderColor: '#ffffff10', backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cardActive: { borderColor: '#a7f3d0', backgroundColor: 'rgba(167,243,208,0.12)' },
  cardEmoji: { fontSize: 20 },
  cardText: { color: '#789082', fontSize: 13, fontWeight: '800' },
  cardTextActive: { color: '#a7f3d0' },
  footer: { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn: { height: 58, borderRadius: 20, backgroundColor: '#a7f3d0', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#062015', fontSize: 17, fontWeight: '900' },
});
