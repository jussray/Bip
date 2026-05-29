import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '@components/BottomNav';
import { C } from '@constants/theme';

export default function BridgeScreen() {
  const { userSide, bridgeText, setBridgeText, selectedTone, setSelectedTone } = useSekret();

  const tones = [
    { id: 'softStart', label: '🌙 Soft Start' },
    { id: 'honest', label: '💜 Honest Version' },
    { id: 'boundary', label: '🛡️ Calm Boundary' },
    { id: 'dontKnow', label: "☁️ Don't Know How" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Bridge 💜</Text>
        <Text style={styles.sub}>Say it safely. Say it softer.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's sitting heavy?</Text>
          <TextInput
            style={styles.input}
            placeholder="Write it how it feels..."
            placeholderTextColor="#4a3d6b"
            multiline
            value={bridgeText}
            onChangeText={setBridgeText}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose a tone</Text>
          {tones.map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSelectedTone(t.id)}
              style={[styles.tone, selectedTone === t.id && styles.active]}
            >
              <Text style={styles.toneText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomNav userSide={userSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, color: C.pinkHot, fontWeight: '800' },
  sub: { color: C.muted, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardTitle: { color: C.white, fontWeight: '700', marginBottom: 12 },
  input: { minHeight: 110, color: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 14, padding: 12 },
  tone: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  active: { borderColor: C.pinkHot, backgroundColor: 'rgba(124,58,237,0.25)' },
  toneText: { color: C.lavender, fontWeight: '600' },
});
