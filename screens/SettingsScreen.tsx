import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Image, StyleSheet, Platform,
} from 'react-native';

// ─── Theme & Profile Data (local — no prop needed) ───────────────────────────

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

// ─── Character avatar assets ──────────────────────────────────────────────────
// Save your character images at these paths in assets/images/
// raylene → assets/images/raylene-neutral.png  (use raylene-avatar.png when available)
// rylane  → assets/images/rylane-profile.png
// others  → assets/images/raylene-neutral.png  (use sekret-avatar.png when available)
const AVATAR_ASSETS: Record<string, any> = {
  soft:   require('../assets/images/raylene-neutral.png'),
  rylane: require('../assets/images/rylane-profile.png'),
  cloud:  require('../assets/images/raylene-neutral.png'),
  night:  require('../assets/images/raylene-neutral.png'),
};

// ─── Props ────────────────────────────────────────────────────────────────────

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
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function SettingsScreen({
  t, theme, setTheme,
  selectedSekret, setSelectedSekret,
  sekretMode, setSekretMode,
  userSide, setUserSide,
  setScreen,
  BottomNav,
}: SettingsScreenProps) {

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const card      = () => [styles.card,        { backgroundColor: t.card,       borderColor: t.accent }] as any;
  const btn       = () => [styles.button,      { backgroundColor: t.accent,     shadowColor: t.accent }] as any;
  const choiceBtn = (active: boolean) => [
    styles.choiceButton,
    { backgroundColor: t.card, borderColor: active ? t.accent : '#334155', borderWidth: active ? 2 : 1 },
  ] as any;

  // ─── Character avatar (safe — falls back to emoji header if image missing) ──
  const avatarSource = AVATAR_ASSETS[selectedSekret] ?? AVATAR_ASSETS.soft;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Text style={styles.logo}>Vibe Lab 💜</Text>
        <Text style={styles.subtitle}>Make Se'kret feel like yours.</Text>

        {/* ── Character Avatar (character-aware, no crash) ────────────────── */}
        <Image
          source={avatarSource}
          style={styles.artworkPortrait}
          resizeMode="contain"
        />

        {/* ── Current Theme chip ─────────────────────────────────────────── */}
        <View style={card()}>
          <Text style={styles.cardText}>Current Theme</Text>
          <Text style={styles.entryText}>{t.emoji} {t.name}</Text>
        </View>

        {/* ── Theme Packs ────────────────────────────────────────────────── */}
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

        {/* ── Choose Your Se'kret ────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Choose Your Se'kret</Text>
        <View style={card()}>
          {Object.keys(SEKRET_PROFILES).map(key => (
            <TouchableOpacity
              key={key}
              style={choiceBtn(selectedSekret === key)}
              onPress={() => setSelectedSekret(key)}
            >
              <Text style={styles.entryText}>
                {SEKRET_PROFILES[key].emoji} {SEKRET_PROFILES[key].name}
              </Text>
              <Text style={styles.miniText}>{SEKRET_PROFILES[key].title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Se'kret Mode ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Se'kret Mode</Text>
        <View style={card()}>
          {Object.keys(SEKRET_MODES).map(key => (
            <TouchableOpacity
              key={key}
              style={choiceBtn(sekretMode === key)}
              onPress={() => setSekretMode(key)}
            >
              <Text style={styles.entryText}>
                {SEKRET_MODES[key].emoji} {SEKRET_MODES[key].label}
              </Text>
              <Text style={styles.miniText}>{SEKRET_MODES[key].description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account Side ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Account Side</Text>
        <View style={card()}>
          <TouchableOpacity
            style={[btn(), userSide === 'teen' && styles.activeSide]}
            onPress={() => setUserSide('teen')}
          >
            <Text style={styles.buttonText}>🧑 Teen Side</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[btn(), { marginTop: 10 }, userSide === 'parent' && styles.activeSide]}
            onPress={() => setUserSide('parent')}
          >
            <Text style={styles.buttonText}>👨‍👩‍👧 Parent Side</Text>
          </TouchableOpacity>
          <Text style={[styles.entryText, { marginTop: 10 }]}>
            Current: {userSide === 'parent' ? 'Parent 🌿' : 'Teen 💜'}
          </Text>
        </View>

        {/* ── Done button ────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[btn(), styles.doneButton]}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.buttonText}>Done ✓</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* BottomNav pinned outside ScrollView so it never scrolls away */}
      {BottomNav}
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },

  sectionTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },

  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  miniText:       { color: '#CBD5E1', fontSize: 12, textAlign: 'center' },

  button:         {
    padding: 16, borderRadius: 18, marginBottom: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  activeSide:     { opacity: 0.7, borderWidth: 2, borderColor: '#fff' },

  choiceButton:   {
    padding: 14, borderRadius: 16, marginBottom: 10,
  },

  themeRow:       { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  themeBubble:    { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  themeEmoji:     { fontSize: 26 },

  artworkPortrait:{ width: 180, height: 220, alignSelf: 'center', marginBottom: 16 },

  doneButton:     { marginTop: 8, marginBottom: 4 },
});
