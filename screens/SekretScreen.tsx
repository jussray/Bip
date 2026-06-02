import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  TextInput, View, Image, StyleSheet, Platform,
} from 'react-native';

const SEKRET_PROFILES: Record<string, any> = {
  soft:   { name: "Se'kret",       emoji: '🌸', title: 'Soft Big Sis',        vibe: 'Warm, expressive, protective, and real.',        greeting: "Hey love. I'm here. Tell me what's on your mind." },
  rylane: { name: 'Rylane',        emoji: '⚡', title: 'Loyal Bro',           vibe: 'Quiet loyalty. Keeps it real. Never talks down.', greeting: "Aight, I'm here. What's been heavy?" },
  cloud:  { name: "Cloud Se'kret", emoji: '☁️', title: 'Quiet Comfort',       vibe: 'Soft, calm, low-pressure presence.',             greeting: "No pressure. We can just sit here for a minute." },
  night:  { name: "Night Se'kret", emoji: '🌙', title: 'Late-Night Listener', vibe: 'Minimal words, calm energy, safe space.',        greeting: "I'm here. You don't gotta explain perfectly." },
};

interface SekretScreenProps {
  t: Record<string, any>;
  currentSekret: Record<string, any>;
  art: Record<string, any>;
  selectedSekret: string;
  setSelectedSekret: (key: string) => void;
  sekretMessage: string;
  setSekretMessage: (text: string) => void;
  sekretReply: string;
  isSekretTyping: boolean;
  sendSekretMessage: () => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function SekretScreen({
  t, currentSekret, art, selectedSekret, setSelectedSekret,
  sekretMessage, setSekretMessage, sekretReply, isSekretTyping,
  sendSekretMessage, setScreen, BottomNav,
}: SekretScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Talk with Se'kret 💜</Text>
      <Text style={styles.subtitle}>Your safe space. No pressure. Just real.</Text>

      <Image source={art.neutral} style={styles.artworkPortrait} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>{currentSekret.emoji}</Text>
        <Text style={styles.cardText}>{currentSekret.name}</Text>
        <Text style={styles.entryText}>{currentSekret.title}</Text>
        <Text style={styles.entryText}>{currentSekret.vibe}</Text>
      </View>

      <View style={card()}>
        <Text style={styles.entryText}>You: today was a lot. i tried to hold it together...</Text>
        <Text style={[styles.entryText, { color: t.soft }]}>
          {isSekretTyping ? `${currentSekret.name} is typing... ☁️` : sekretReply}
        </Text>
      </View>

      <TextInput
        style={[styles.journalInput, { backgroundColor: t.card, borderColor: t.accent }]}
        placeholder="Talk to Se'kret..."
        placeholderTextColor="#94A3B8"
        multiline
        value={sekretMessage}
        onChangeText={setSekretMessage}
      />
      <TouchableOpacity style={btn()} onPress={sendSekretMessage}>
        <Text style={styles.buttonText}>Send 💜</Text>
      </TouchableOpacity>

      {/* Se'kret selector */}
      <Text style={styles.sectionTitle}>Choose Your Se'kret</Text>
      <View style={card()}>
        {Object.keys(SEKRET_PROFILES).map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.choiceButton, selectedSekret === key && { borderColor: t.accent, borderWidth: 2 }]}
            onPress={() => setSelectedSekret(key)}
          >
            <Text style={styles.entryText}>{SEKRET_PROFILES[key].emoji} {SEKRET_PROFILES[key].name}</Text>
            <Text style={styles.miniText}>{SEKRET_PROFILES[key].title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:      { fontSize: 32, marginBottom: 8 },
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  miniText:       { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },
  button:         { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  journalInput:   { color: '#fff', padding: 16, borderRadius: 18, minHeight: 130, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },
  choiceButton:   { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  artworkPortrait:{ width: 180, height: 220, alignSelf: 'center', marginBottom: 16 },
});
