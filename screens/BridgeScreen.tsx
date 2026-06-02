import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  TextInput, View, Image, StyleSheet, Platform,
} from 'react-native';

const BRIDGE_BG = require('../assets/images/bridge-bg.png');

interface BridgeScreenProps {
  t: Record<string, any>;
  currentSekret: Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function BridgeScreen({ t, currentSekret, setScreen, BottomNav }: BridgeScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Bridge 🌉</Text>
      <Text style={styles.subtitle}>Real conversations. Softer connection.</Text>

      <Image source={BRIDGE_BG} style={styles.artworkLarge} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>{currentSekret.emoji}</Text>
        <Text style={styles.cardText}>You don't gotta explain it perfectly.</Text>
        <Text style={styles.entryText}>Se'kret helps you say hard things gently.</Text>
      </View>

      <View style={card()}>
        <Text style={styles.sectionTitle}>What's sitting heavy?</Text>
        <TextInput
          style={[styles.journalInput, { backgroundColor: t.card, borderColor: t.accent, minHeight: 90 }]}
          placeholder="Write it how it feels..."
          placeholderTextColor="#94A3B8"
          multiline
        />
      </View>

      <View style={card()}>
        <Text style={styles.sectionTitle}>Se'kret Suggestions ✨</Text>
        {[
          ['🌙', 'Soft Start',              '"Hey… can we talk later tonight?"'],
          ['💜', 'Honest Version',           '"I\'ve been overwhelmed and I miss feeling close."'],
          ['🛡️', 'Calm Boundary',            '"I care about this, but I need calmer communication."'],
          ['☁️', "Don't Know How To Say It", '"I don\'t fully know how to explain this yet."'],
        ].map(([e, l, q]) => (
          <TouchableOpacity key={l} style={styles.choiceButton}>
            <Text style={styles.entryText}>{e} {l}</Text>
            <Text style={styles.miniText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={card()}>
        <Text style={styles.cardText}>Se'kret says 💬</Text>
        <Text style={styles.entryText}>Hard conversations don't make you difficult. Wanting understanding is human.</Text>
      </View>

      <TouchableOpacity style={btn()}>
        <Text style={styles.buttonText}>I'm Ready to Send 💌</Text>
      </TouchableOpacity>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:         { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:         { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:    { fontSize: 32, marginBottom: 8 },
  cardText:     { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:    { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  miniText:     { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },
  button:       { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  journalInput: { color: '#fff', padding: 16, borderRadius: 18, minHeight: 90, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },
  choiceButton: { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  artworkLarge: { width: '100%', height: 280, marginBottom: 16, borderRadius: 20 },
});
