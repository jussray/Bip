import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Image, StyleSheet, Platform,
} from 'react-native';

const THEME_PACKS: Record<string, any> = {
  night:  { name: 'Golden Moon',  emoji: '🌙', background: '#3A2503', card: '#5B3A00', accent: '#FFD84D', soft: '#FFF3B0' },
  flower: { name: 'Soft Pink',    emoji: '🌸', background: '#4A1028', card: '#6D1B3B', accent: '#FF4FA3', soft: '#FFD6E7' },
  rain:   { name: 'Rain Blue',    emoji: '🌧️', background: '#243447', card: '#36506B', accent: '#4DA3FF', soft: '#B6DCFF' },
  neon:   { name: 'Night Purple', emoji: '💜', background: '#160028', card: '#2B0A4D', accent: '#D946EF', soft: '#F5B8FF' },
  galaxy: { name: 'Galaxy Night', emoji: '🌌', background: '#151A40', card: '#2A2D73', accent: '#7C83FF', soft: '#D7D9FF' },
};

const SEKRET_PROFILES: Record<string, any> = {
  soft:   { name: "Se'kret",       emoji: '🌸', title: 'Soft Big Sis' },
  rylane: { name: 'Rylane',        emoji: '⚡', title: 'Loyal Bro' },
  cloud:  { name: "Cloud Se'kret", emoji: '☁️', title: 'Quiet Comfort' },
  night:  { name: "Night Se'kret", emoji: '🌙', title: 'Late-Night Listener' },
};

const SEKRET_MODES: Record<string, any> = {
  soft:     { emoji: '🌙', label: 'Soft',        description: 'Gentle comfort & reassurance' },
  realTalk: { emoji: '🧠', label: 'Real Talk',   description: 'Honest, caring, keeps it real' },
  distract: { emoji: '😂', label: 'Distract Me', description: 'Light jokes, low-pressure vibes' },
  listen:   { emoji: '☁️', label: 'Just Listen', description: 'No fixing. Just presence.' },
  push:     { emoji: '🔥', label: 'Push Me',     description: 'Motivation & accountability' },
};

interface SettingsScreenProps {
  t: Record<string, any>;
  theme: string;
  setTheme: (theme: string) => void;
  selectedSekret: string;
  setSelectedSekret: (key: string) => void;
  sekretMode: string;
  setSekretMode: (mode: string) => void;
  userSide: string;
  setUserSide: (side: string) => void;
  art: Record<string, any>;
  BottomNav: React.ReactNode;
}

export function SettingsScreen({
  t, theme, setTheme, selectedSekret, setSelectedSekret,
  sekretMode, setSekretMode, userSide, setUserSide,
  art, BottomNav,
}: SettingsScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Vibe Lab 💜</Text>
      <Text style={styles.subtitle}>Make Se'kret feel like yours.</Text>

      <Image source={art.happy} style={styles.artworkPortrait} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardText}>Current Theme</Text>
        <Text style={styles.entryText}>{t.emoji} {t.name}</Text>
      </View>

      <Text style={styles.sectionTitle}>Theme Packs</Text>
      <View style={styles.themeRow}>
        {Object.keys(THEME_PACKS).map(key => (
          <TouchableOpacity
            key={key}
            style={[
              styles.themeBubble,
              {
                backgroundColor: THEME_PACKS[key].card,
                borderColor: theme === key ? THEME_PACKS[key].accent : '#334155',
                borderWidth: theme === key ? 3 : 1,
              },
            ]}
            onPress={() => setTheme(key)}
          >
            <Text style={styles.themeEmoji}>{THEME_PACKS[key].emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      <Text style={styles.sectionTitle}>Se'kret Mode</Text>
      <View style={card()}>
        {Object.keys(SEKRET_MODES).map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.choiceButton, sekretMode === key && { borderColor: t.accent, borderWidth: 2 }]}
            onPress={() => setSekretMode(key)}
          >
            <Text style={styles.entryText}>{SEKRET_MODES[key].emoji} {SEKRET_MODES[key].label}</Text>
            <Text style={styles.miniText}>{SEKRET_MODES[key].description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Account Side</Text>
      <View style={card()}>
        <TouchableOpacity style={btn()} onPress={() => setUserSide('teen')}>
          <Text style={styles.buttonText}>🧑 Teen Side</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[btn(), { marginTop: 10 }]} onPress={() => setUserSide('parent')}>
          <Text style={styles.buttonText}>👨‍👩‍👧 Parent Side</Text>
        </TouchableOpacity>
        <Text style={[styles.entryText, { marginTop: 10 }]}>
          Current: {userSide === 'parent' ? 'Parent 🌿' : 'Teen 💜'}
        </Text>
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
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  miniText:       { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },
  button:         { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  choiceButton:   { backgroundColor: '#1E293B', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  themeRow:       { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  themeBubble:    { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  themeEmoji:     { fontSize: 26 },
  artworkPortrait:{ width: 180, height: 220, alignSelf: 'center', marginBottom: 16 },
});
