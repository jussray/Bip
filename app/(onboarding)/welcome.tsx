import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

const PURPLE     = '#7c3aed';
const PURPLE_DIM = '#4c1d95';
const BG         = '#0a0a0a';
const TEXT       = '#f3f3f5';
const MUTED      = '#8b7fa0';
const ACCENT     = '#a78bfa';

export default function Welcome() {
  const fade  = useRef(new Animated.Value(0)).current;
  const rise  = useRef(new Animated.Value(24)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 900, delay: 200, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 2600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 2600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, rise, pulse]);

  return (
    <View style={styles.root}>
      {/* Atmospheric dot blobs */}
      <View style={styles.bgDot1} pointerEvents="none" />
      <View style={styles.bgDot2} pointerEvents="none" />

      {/* Pulsing glow */}
      <Animated.View style={[styles.glow, { transform: [{ scale: pulse }] }]} pointerEvents="none" />

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
        {/* Logo block */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoMark}>Bip</Text>
          <Text style={styles.logoHeart}>💜</Text>
        </View>
        <Text style={styles.wordmark}>Se'kret Bip</Text>

        <Text style={styles.title}>A space{`\n`}that keeps you.</Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Four companions. One place for everything you're carrying — your thoughts, your voice, your story.
        </Text>
        <Text style={styles.bodyAccent}>Private by default. Yours always.</Text>

        <View style={styles.companionRow}>
          {['💜 Raylene', '💙 Rylane', '☁️ Cloud', '🌙 Night'].map(label => (
            <View key={label} style={styles.companionChip}>
              <Text style={styles.companionText}>{label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fade }]}>
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => router.push('/(onboarding)/age')}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.btnText}>I'm ready →</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>For ages 13 and up</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  bgDot1:        { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#4c1d9520', top: -80, right: -100 },
  bgDot2:        { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#7c3aed12', bottom: 60, left: -80 },
  glow:          { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: PURPLE, opacity: 0.10, top: '18%', alignSelf: 'center' },
  content:       { flex: 1, paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingHorizontal: 28, alignItems: 'flex-start' },
  logoWrap:      { width: 64, height: 64, borderRadius: 20, backgroundColor: PURPLE_DIM, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: PURPLE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 12 },
  logoMark:      { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  logoHeart:     { fontSize: 11, position: 'absolute', bottom: 8, right: 9 },
  wordmark:      { color: TEXT, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 32 },
  title:         { color: TEXT, fontSize: 46, fontWeight: '900', lineHeight: 52 },
  divider:       { width: 40, height: 3, backgroundColor: PURPLE, borderRadius: 2, marginTop: 22, marginBottom: 22 },
  body:          { color: '#c5bbcf', fontSize: 16, lineHeight: 26, marginBottom: 12 },
  bodyAccent:    { color: MUTED, fontSize: 13, marginBottom: 36 },
  companionRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  companionChip: { borderRadius: 999, borderWidth: 1, borderColor: '#ffffff15', paddingHorizontal: 12, paddingVertical: 7 },
  companionText: { color: ACCENT, fontSize: 12, fontWeight: '700' },
  footer:        { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn:           { height: 58, borderRadius: 20, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  btnText:       { color: '#fff', fontSize: 17, fontWeight: '900' },
  legal:         { color: '#5a5167', fontSize: 11, textAlign: 'center' },
});
