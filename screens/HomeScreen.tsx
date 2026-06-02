import React from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  Animated,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (local — kept in sync with index.tsx, not imported to avoid
// circular deps while screens/ folder is still prop-based)
// ─────────────────────────────────────────────────────────────────────────────
const MOODS = [
  { id: 'Happy', emoji: '😊' },
  { id: 'Sad',   emoji: '😔' },
  { id: 'Angry', emoji: '😡' },
  { id: 'Tired', emoji: '😴' },
];

const HOME_MESSAGES = [
  "Don't stay up carrying the whole world tonight.",
  'Rest is productive too.',
  'You deserve softness too.',
  'Heavy days do not define you.',
  'Your mind deserves rest.',
  'Breathe slowly tonight.',
  'You made it through today.',
];

const CLOUD_IMAGE = require('../assets/images/cloud.png');

const getHeroText = (mood: string) => {
  if (mood === 'Happy') return "I'm glad\nyou're smiling\ntonight 🌤️";
  if (mood === 'Sad')   return "I'm here with\nyou tonight ☁️";
  if (mood === 'Angry') return "Let it out,\nyou're safe here 🔥";
  if (mood === 'Tired') return "Rest your heart\ntonight 🌙";
  return 'Welcome back 🌙';
};

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface HomeScreenProps {
  mood: string;
  selectMood: (mood: string) => void;
  t: Record<string, any>;
  currentSekret: Record<string, any>;
  homeMessageIndex: number;
  breatheAnim: Animated.Value;
  userSide: string;
  screen: string;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function HomeScreen({
  mood,
  selectMood,
  t,
  currentSekret,
  homeMessageIndex,
  breatheAnim,
  userSide,
  screen,
  setScreen,
  BottomNav,
}: HomeScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar style="light" />

      {userSide === 'parent' && (
        <View style={styles.parentBadge}>
          <Text style={{ color: '#6EE7B7', fontSize: 12 }}>🌿 PARENT SIDE</Text>
        </View>
      )}

      <Text style={styles.logo}>Se'kret Bip {currentSekret.emoji}</Text>
      <Text style={styles.subtitle}>your space. your voice. always you.</Text>

      {/* Breathing cloud */}
      <Animated.View style={[styles.cloudWrap, { transform: [{ scale: breatheAnim }] }]}>
        <Image source={CLOUD_IMAGE} style={styles.cloudImg} resizeMode="contain" />
      </Animated.View>

      {/* Hero message card */}
      <View style={card()}>
        <Text style={{ color: t.soft, fontSize: 13, marginBottom: 4 }}>
          {currentSekret.name} says...
        </Text>
        <Text style={styles.heroText}>{getHeroText(mood)}</Text>
        <Text style={styles.entryText}>
          Your Se'kret is {currentSekret.name} energy.
        </Text>
      </View>

      {/* Tonight's rotating reminder */}
      <View style={card()}>
        <Text style={styles.cardText}>Tonight's Reminder ✨</Text>
        <Text style={styles.entryText}>{HOME_MESSAGES[homeMessageIndex]}</Text>
      </View>

      {/* Mood selector */}
      <Text style={styles.sectionTitle}>How's your heart right now? 💜</Text>
      <View style={styles.moodRow}>
        {MOODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.moodBubble,
              mood === m.id && {
                backgroundColor: t.accent,
                shadowColor: t.accent,
                shadowOpacity: 0.8,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
            onPress={() => selectMood(m.id)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Se'kret sees you — mood-aware */}
      <View style={card()}>
        <Text style={styles.cardText}>Se'kret sees you 💜</Text>
        <Text style={styles.entryText}>
          {mood === 'Sad'
            ? "Heavy nights don't last forever. I'm right here with you."
            : mood === 'Angry'
            ? "Your feelings make sense. You're safe to let it out here."
            : mood === 'Tired'
            ? "Rest is an act of self-love. You've done enough today."
            : "I read your energy tonight. You're doing better than you think."}
        </Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.smallButton} onPress={() => setScreen('sekret')}>
            <Text style={styles.smallButtonText}>💬 Talk more</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={() => setScreen('calm')}>
            <Text style={styles.smallButtonText}>🌙 Calm me</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions ⚡</Text>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {[
          ['✍️', 'Write It Out', 'pages'],
          ['🎙️', 'Voice Bip',   'voiceBip'],
          ['🌙', 'Calm',        'calm'],
          ['🌐', 'Circle',      'circle'],
          ['🌉', 'Bridge',      userSide === 'parent' ? 'parentBridge' : 'bridge'],
        ].map(([e, l, to]) => (
          <TouchableOpacity
            key={l}
            style={[styles.smallAction, { backgroundColor: t.card, borderColor: t.accent }]}
            onPress={() => setScreen(to as string)}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{e}</Text>
            <Text style={styles.smallButtonText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {BottomNav}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  heroText:       { fontSize: 24, color: '#fff', textAlign: 'center', fontWeight: 'bold', marginBottom: 10, lineHeight: 32 },
  sectionTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:           { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardText:       { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:      { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  row:            { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  smallAction:    { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  smallButton:    { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText:{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  moodRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, gap: 8 },
  moodBubble:     { width: 66, height: 66, borderRadius: 33, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  moodEmoji:      { fontSize: 28 },
  cloudWrap:      { alignItems: 'center', marginVertical: 16 },
  cloudImg:       { width: 100, height: 100 },
  parentBadge:    { backgroundColor: '#065F46', borderRadius: 10, padding: 6, alignSelf: 'center', marginBottom: 10 },
});
