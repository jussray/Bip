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

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (local — kept in sync with index.tsx)
// ─────────────────────────────────────────────────────────────────────────────
const COMFORT_MESSAGES = [
  { emoji: '🌙', text: "You've survived every hard day so far. That matters." },
  { emoji: '☁️', text: 'Rest is productive too. You are allowed to pause.' },
  { emoji: '💙', text: "Someone is glad you're still here tonight." },
  { emoji: '🌧️', text: 'Bad moments are real. So is your strength.' },
  { emoji: '✨', text: "You don't need to be perfect to be loved." },
  { emoji: '🫶', text: 'Your feelings are allowed here.' },
  { emoji: '🕯️', text: 'Soft moment. Slow breath. Stay with me.' },
];

const CLOUD_HEADPHONES = require('../assets/images/cloud-headphones.png');

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface CalmScreenProps {
  t: Record<string, any>;
  breatheAnim: Animated.Value;
  comfortIdx: number;
  setComfortIdx: React.Dispatch<React.SetStateAction<number>>;
  art: Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CalmScreen({
  t,
  breatheAnim,
  comfortIdx,
  setComfortIdx,
  art,
  setScreen,
  BottomNav,
}: CalmScreenProps) {
  const card = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn  = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>Se'kret Calm 🌙</Text>
      <Text style={styles.subtitle}>Breathe. Reset. Come back to yourself.</Text>

      {/* Window art — character at window, peaceful */}
      <Image source={art.window} style={styles.artworkLarge} resizeMode="contain" />

      <View style={card()}>
        <Text style={styles.cardEmoji}>🌙</Text>
        <Text style={styles.cardText}>Your nervous system deserves softness too.</Text>
        <Text style={styles.entryText}>No pressure. Just one small calm moment at a time.</Text>
      </View>

      {/* Breathing circle */}
      <Animated.View style={[
        styles.circle,
        {
          transform: [{ scale: breatheAnim }],
          backgroundColor: t.accent,
          shadowColor: t.accent,
          shadowOpacity: 0.6,
          shadowRadius: 25,
          elevation: 12,
        },
      ]}>
        <Image source={CLOUD_HEADPHONES} style={styles.circleImg} resizeMode="contain" />
        <Text style={styles.circleTextSmall}>Breathe</Text>
      </Animated.View>

      {/* Comfort message card */}
      <View style={card()}>
        <Text style={styles.cardEmoji}>{COMFORT_MESSAGES[comfortIdx].emoji}</Text>
        <Text style={styles.cardText}>{COMFORT_MESSAGES[comfortIdx].text}</Text>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setComfortIdx(i => (i + 1) % COMFORT_MESSAGES.length)}
        >
          <Text style={styles.smallButtonText}>Another Calm Thought ✨</Text>
        </TouchableOpacity>
      </View>

      {/* Calm tools */}
      <Text style={styles.sectionTitle}>Calm Tools</Text>
      <TouchableOpacity style={btn()} onPress={() => setScreen('mindReset')}>
        <Text style={styles.buttonText}>🌙 7-Min Mind Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('bodyReset')}>
        <Text style={styles.buttonText}>🫧 7-Min Body Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity style={btn()} onPress={() => setScreen('comfort')}>
        <Text style={styles.buttonText}>🚨 Comfort Mode</Text>
      </TouchableOpacity>

      {BottomNav}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:            { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:        { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  sectionTitle:    { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 18 },
  card:            { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:       { fontSize: 32, marginBottom: 8 },
  cardText:        { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:       { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  button:          { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  smallButton:     { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  circle:          { width: 170, height: 170, borderRadius: 85, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  circleImg:       { width: 90, height: 90 },
  circleTextSmall: { color: '#fff', fontSize: 16, marginTop: 6, fontWeight: 'bold' },
  artworkLarge:    { width: '100%', height: 280, marginBottom: 16, borderRadius: 20 },
});
