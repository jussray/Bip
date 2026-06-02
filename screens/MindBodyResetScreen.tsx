import React from 'react';
import {
  Text, TouchableOpacity, ScrollView,
  View, Animated, Image, StyleSheet, Platform,
} from 'react-native';

const CLOUD_HEADPHONES = require('../assets/images/cloud-headphones.png');
const CLOUD            = require('../assets/images/cloud.png');

interface MindBodyResetScreenProps {
  screen: 'mindReset' | 'bodyReset';
  t: Record<string, any>;
  breatheAnim: Animated.Value;
  art: Record<string, any>;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
}

export function MindBodyResetScreen({
  screen, t, breatheAnim, art, setScreen, BottomNav,
}: MindBodyResetScreenProps) {
  const isMind = screen === 'mindReset';
  const card   = () => [styles.card, { backgroundColor: t.card, borderColor: t.accent }] as any;
  const btn    = () => [styles.button, { backgroundColor: t.accent, shadowColor: t.accent }] as any;

  const steps = isMind
    ? ['☁️ Unclench your jaw.', '🌙 Relax your shoulders.', '🫧 Take one slow breath in.', '💭 Let one thought pass without chasing it.', '🕯️ Your mind does not need to solve everything tonight.']
    : ['🫧 Roll your shoulders slowly.', '🌿 Stretch your neck gently.', '💧 Drink a little water.', '🧍🏾 Unclench your hands.', '🌙 Let your body soften for a second.'];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      <Text style={styles.logo}>{isMind ? '7-Min Mind Reset 🌙' : '7-Min Body Reset 🫧'}</Text>
      <Text style={styles.subtitle}>{isMind ? 'Quiet the noise for a minute.' : 'Let your body breathe too.'}</Text>

      <Image source={art.window} style={styles.artworkMedium} resizeMode="contain" />

      <Animated.View style={[
        styles.circle,
        {
          transform: [{ scale: breatheAnim }],
          backgroundColor: t.accent,
          shadowColor: t.accent,
          shadowOpacity: 0.6,
          shadowRadius: 25,
          elevation: 12,
          marginBottom: 30,
        },
      ]}>
        <Image source={isMind ? CLOUD_HEADPHONES : CLOUD} style={styles.circleImg} resizeMode="contain" />
        <Text style={styles.circleTextSmall}>inhale • exhale</Text>
      </Animated.View>

      <View style={card()}>
        <Text style={styles.cardText}>{isMind ? 'Mind Reset Steps' : 'Body Reset Steps'}</Text>
        {steps.map(step => (
          <Text key={step} style={styles.entryText}>{step}</Text>
        ))}
      </View>

      <View style={card()}>
        <Text style={styles.cardEmoji}>{isMind ? '🌙' : '💙'}</Text>
        <Text style={styles.cardText}>{isMind ? 'Your thoughts can slow down now.' : 'Your body deserves gentleness too.'}</Text>
        <Text style={styles.entryText}>{isMind ? 'You are allowed to rest without fixing everything.' : 'Tension lives in the body. Let some of it go.'}</Text>
      </View>

      <TouchableOpacity style={btn()} onPress={() => setScreen('comfort')}>
        <Text style={styles.buttonText}>Open Comfort Mode 💙</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.smallButton} onPress={() => setScreen('calm')}>
        <Text style={styles.smallButtonText}>Back to Calm 🌙</Text>
      </TouchableOpacity>

      {BottomNav}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo:            { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:        { fontSize: 15, color: '#CBD5E1', textAlign: 'center', marginBottom: 20 },
  card:            { padding: 18, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  cardEmoji:       { fontSize: 32, marginBottom: 8 },
  cardText:        { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  entryText:       { color: '#E2E8F0', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  button:          { padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  smallButton:     { backgroundColor: '#334155', padding: 11, borderRadius: 14, marginTop: 8 },
  smallButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  circle:          { width: 170, height: 170, borderRadius: 85, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  circleImg:       { width: 90, height: 90 },
  circleTextSmall: { color: '#fff', fontSize: 16, marginTop: 6, fontWeight: 'bold' },
  artworkMedium:   { width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
});
