// screens/BridgeScreen.tsx
// Se'kret Bip — Bridge Screen (Teen Side)
// ─────────────────────────────────────────────────────────────────────────────
// Props from index.tsx:
//   t             — theme object (THEME_PACKS[theme])
//   currentSekret — SEKRET_PROFILES[selectedSekret] object
//   setScreen     — navigation function (setScreen only, no router.push)
//   BottomNav     — rendered nav node
//
// PURPOSE: Lets the teen share a moment with a trusted adult via the Bridge.
// The teen picks a share type, writes a message, and generates a Bridge card.
// The parent sees it in ParentBridgeScreen.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import type { BridgePayload } from '../types/index';

// ── Props ─────────────────────────────────────────────────────────────────────

interface BridgeScreenProps {
  t:             Record<string, any>;
  currentSekret: Record<string, any>;
  setScreen:     (screen: string) => void;
  BottomNav:     React.ReactNode;
}

// ── Share type options ────────────────────────────────────────────────────────

const SHARE_TYPES = [
  { id: 'mood',      emoji: '💜', label: 'My Mood',       placeholder: 'Tell them how you're feeling…' },
  { id: 'thought',   emoji: '💭', label: 'A Thought',      placeholder: 'Something on your mind…' },
  { id: 'need',      emoji: '🌿', label: 'Something I Need', placeholder: 'What would help right now…' },
  { id: 'win',       emoji: '⚡', label: 'A Win',           placeholder: 'Something good that happened…' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function BridgeScreen({ t, currentSekret, setScreen, BottomNav }: BridgeScreenProps) {
  const [shareType, setShareType]   = useState<string | null>(null);
  const [message, setMessage]       = useState('');
  const [sent, setSent]             = useState(false);

  const selectedType = SHARE_TYPES.find(s => s.id === shareType);

  const handleSend = () => {
    if (!shareType || !message.trim()) {
      Alert.alert('Almost there', 'Pick a share type and write your message first.');
      return;
    }

    // Bridge payload — matches BridgePayload type in types/bridge.ts
    // Future: POST to Supabase bridge_shares table
    const payload: BridgePayload = {
      shareTypeLabel: selectedType?.label,
      preview:        message.trim().slice(0, 80),
      sharedAt:       new Date().toISOString(),
      softPrompt:     `${currentSekret?.name ?? 'Bip'} helped share this.`,
    };

    // TODO: await api.post('/bridge/share', payload)
    console.log('[BridgeScreen] Bridge payload:', payload);

    setSent(true);
    setMessage('');
    setShareType(null);
  };

  // ── Sent confirmation ────────────────────────────────────────────────────
  if (sent) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
        <Text style={styles.logo}>🌉 Bridge</Text>
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={styles.sentEmoji}>💌</Text>
          <Text style={[styles.sentTitle, { color: t.soft }]}>Sent to your person.</Text>
          <Text style={styles.sentSub}>
            They'll see it when they open the Parent Bridge. You did something brave.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: t.accent }]}
            onPress={() => setSent(false)}
          >
            <Text style={styles.buttonText}>Send Another</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostButton, { borderColor: t.accent }]}
            onPress={() => setScreen('home')}
          >
            <Text style={[styles.ghostButtonText, { color: t.soft }]}>Back to Room</Text>
          </TouchableOpacity>
        </View>
        {BottomNav}
      </ScrollView>
    );
  }

  // ── Main screen ──────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>🌉 Bridge</Text>
      <Text style={styles.subtitle}>
        Share something with your person — no pressure, no full explanation needed.
      </Text>

      {/* Share type selector */}
      <Text style={[styles.sectionLabel, { color: t.soft }]}>What do you want to share?</Text>
      <View style={styles.typeRow}>
        {SHARE_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeChip,
              {
                backgroundColor: shareType === type.id ? t.accent : t.card,
                borderColor:     shareType === type.id ? t.accent : t.soft + '44',
              },
            ]}
            onPress={() => setShareType(type.id)}
          >
            <Text style={styles.typeEmoji}>{type.emoji}</Text>
            <Text style={[styles.typeLabel, { color: shareType === type.id ? '#fff' : t.soft }]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Message input */}
      {shareType && (
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.accent }]}>
          <Text style={[styles.cardLabel, { color: t.soft }]}>
            {selectedType?.emoji} {selectedType?.label}
          </Text>
          <TextInput
            style={[styles.input, { color: '#fff', borderColor: t.accent + '66' }]}
            placeholder={selectedType?.placeholder}
            placeholderTextColor={t.soft + '88'}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            maxLength={280}
          />
          <Text style={[styles.charCount, { color: t.soft + '88' }]}>
            {message.length}/280
          </Text>
        </View>
      )}

      {/* Send button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: shareType && message.trim() ? t.accent : t.card,
            opacity:          shareType && message.trim() ? 1 : 0.5,
          },
        ]}
        onPress={handleSend}
        disabled={!shareType || !message.trim()}
      >
        <Text style={styles.buttonText}>🌉 Send to Bridge</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.ghostButton, { borderColor: t.accent }]}
        onPress={() => setScreen('home')}
      >
        <Text style={[styles.ghostButtonText, { color: t.soft }]}>Back to Room</Text>
      </TouchableOpacity>

      {BottomNav}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:            { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:        { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 24 },
  sectionLabel:    { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  typeRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  typeEmoji:       { fontSize: 18 },
  typeLabel:       { fontSize: 14, fontWeight: '600' },
  card:            { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardLabel:       { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  input:           { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 8 },
  charCount:       { fontSize: 12, textAlign: 'right' },
  button:          { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ghostButton:     { padding: 14, borderRadius: 18, marginBottom: 12, alignItems: 'center', borderWidth: 1 },
  ghostButtonText: { fontSize: 15, fontWeight: '600' },
  sentEmoji:       { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  sentTitle:       { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sentSub:         { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
});
