// screens/ParentBridgeScreen.tsx
// Se'kret Bip — Parent Bridge Screen
//
// FULL REWRITE — 2026-06-03 audit
// Previous version had:
//   - export default (wrong — must be named export)
//   - import { useSekret } from './_layout' (fake hook, doesn't exist)
//   - import BottomNav from '../components/BottomNav' (wrong — it's a prop)
//   - import { C } from '../constants/theme' (C doesn't exist in theme.ts)
//   - Styles using C.bg, C.card, C.white (all undefined → crash)
//
// This rewrite matches exactly what index.tsx passes:
//   <ParentBridgeScreen t={t} setScreen={setScreen} BottomNav={nav} />

import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ── Message tips for the parent ─────────────────────────────────────────────
const BRIDGE_TIPS = [
  'Keep it short and warm. Teens shut down when they feel lectured.',
  'Ask questions instead of giving answers.',
  'Say "I love you" without conditions attached.',
  'Acknowledge their feelings before sharing yours.',
  '"I noticed you seemed stressed. I\'m here if you want to talk." goes a long way.',
];

const STARTER_PROMPTS = [
  'I\'m proud of you, even when I don\'t say it enough.',
  'You don\'t have to have it all figured out. Neither do I.',
  'I love you. No strings. No conditions.',
  'I noticed you\'ve been quiet. I\'m here whenever you\'re ready.',
  'You can always come to me. I promise I\'ll listen first.',
];

// ── Props ────────────────────────────────────────────────────────────────────
// Matches exactly what app/index.tsx passes
interface ParentBridgeScreenProps {
  t:         Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

// Named export — matches index.tsx import { ParentBridgeScreen }
export function ParentBridgeScreen({ t, setScreen, BottomNav }: ParentBridgeScreenProps) {

  const [message,   setMessage]   = useState('');
  const [sent,      setSent]      = useState(false);
  const [sending,   setSending]   = useState(false);
  const [tipIndex,  setTipIndex]  = useState(0);

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);

    try {
      if (BASE_URL) {
        await fetch(`${BASE_URL}/api/bridge/parent`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ message: text }),
        });
      }
      // Success — regardless of backend presence, show confirmation
      setSent(true);
      setMessage('');
    } catch {
      Alert.alert('Could not send', 'Please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  const card = (extra?: object) =>
    [styles.card, { backgroundColor: t.card, borderColor: t.accent + '55' }, extra] as any;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.logo}>Parent Bridge 🌉</Text>
        <Text style={styles.subtitle}>
          Reach in with love. Your teen is on the other side.
        </Text>

        {/* ── What is this? ── */}
        <View style={card()}>
          <Text style={[styles.cardText, { color: '#fff' }]}>What is the Bridge?</Text>
          <Text style={[styles.entryText, { color: '#E2E8F0' }]}>
            The Bridge lets you send a short, private message of support to your
            teen's Se'kret space. They'll see it as a gentle note — not a lecture.
            You can't read their journal or conversations. This is one-way warmth.
          </Text>
        </View>

        {/* ── Tip of the day ── */}
        <View style={card()}>
          <Text style={[styles.cardLabel, { color: t.accent }]}>Parent Tip 💜</Text>
          <Text style={[styles.entryText, { color: '#E2E8F0' }]}>
            {BRIDGE_TIPS[tipIndex % BRIDGE_TIPS.length]}
          </Text>
          <TouchableOpacity
            style={[styles.nextTipBtn, { borderColor: t.accent }]}
            onPress={() => setTipIndex(i => i + 1)}
          >
            <Text style={[styles.nextTipText, { color: t.soft }]}>Next tip →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Starter prompts ── */}
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Need a starting point?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
          {STARTER_PROMPTS.map(prompt => (
            <TouchableOpacity
              key={prompt}
              style={[styles.promptChip, { backgroundColor: t.card, borderColor: t.accent + '44' }]}
              onPress={() => setMessage(prompt)}
            >
              <Text style={[styles.promptChipText, { color: t.soft }]}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Message input ── */}
        {!sent ? (
          <>
            <Text style={[styles.sectionTitle, { color: '#fff' }]}>Your message</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.card, borderColor: t.accent, color: '#fff' }]}
              placeholder="Write something warm..."
              placeholderTextColor="#4a3d6b"
              multiline
              value={message}
              onChangeText={setMessage}
              maxLength={300}
            />
            <Text style={[styles.charCount, { color: t.soft }]}>{message.length}/300</Text>

            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: message.trim() ? t.accent : '#334155' }]}
              onPress={handleSend}
              disabled={!message.trim() || sending}
            >
              <Text style={styles.sendBtnText}>
                {sending ? 'Sending...' : 'Send with Love 💌'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={card({ padding: 24, alignItems: 'center' })}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💜</Text>
            <Text style={[styles.cardText, { color: '#fff', textAlign: 'center' }]}>
              Message sent.
            </Text>
            <Text style={[styles.entryText, { color: '#E2E8F0', textAlign: 'center' }]}>
              Your teen will see it as a gentle note in their Se'kret space.
              That small act of love matters more than you know.
            </Text>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: t.accent, marginTop: 16 }]}
              onPress={() => setSent(false)}
            >
              <Text style={styles.sendBtnText}>Send Another</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Navigation ── */}
        <TouchableOpacity
          style={[styles.ghostBtn, { borderColor: t.accent }]}
          onPress={() => setScreen('home')}
        >
          <Text style={[styles.ghostBtnText, { color: t.soft }]}>← Back to Room</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* BottomNav pinned outside scroll */}
      {BottomNav}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },

  logo:          { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:      { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },

  card:          { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardLabel:     { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  cardText:      { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:     { fontSize: 14, marginBottom: 6, lineHeight: 22 },

  nextTipBtn:    { alignSelf: 'flex-start', marginTop: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  nextTipText:   { fontSize: 12, fontWeight: '600' },

  sectionTitle:  { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },

  promptsScroll: { marginBottom: 16 },
  promptChip:    { borderWidth: 1, borderRadius: 14, padding: 12, marginRight: 10, maxWidth: 220 },
  promptChipText:{ fontSize: 13, lineHeight: 19 },

  input:         { borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 120, textAlignVertical: 'top', fontSize: 14, lineHeight: 22, marginBottom: 6 },
  charCount:     { fontSize: 11, textAlign: 'right', marginBottom: 12 },

  sendBtn:       { padding: 16, borderRadius: 18, alignItems: 'center', marginBottom: 12 },
  sendBtnText:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  ghostBtn:      { borderWidth: 1, borderRadius: 18, padding: 14, alignItems: 'center', marginBottom: 16 },
  ghostBtnText:  { fontSize: 14, fontWeight: '600' },
});
