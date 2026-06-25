import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

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
      <LinearGradient
        colors={['#10091b', '#1a0d2e', '#090711']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow */}
      <Animated.View style={[styles.glow, { transform: [{ scale: pulse }] }]} />

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
        <Text style={styles.kicker}>SE'KRET BIP</Text>

        <Text style={styles.title}>A space{'\n'}that keeps you.</Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Four companions. One place for everything you're carrying — your thoughts, your voice, your story.
        </Text>
        <Text style={styles.bodyAccent}>
          Private by default. Yours always.
        </Text>

        <View style={styles.companionRow}>
          {['💜 Star', '💙 Rylane', '☁️ Cloud', '🌙 Night'].map(label => (
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
        >
          <Text style={styles.btnText}>I'm ready →</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>For ages 13 and up</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#090711' },
  glow:          { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#6d28d9', opacity: 0.12, top: '18%', alignSelf: 'center' },
  content:       { flex: 1, paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingHorizontal: 28 },
  kicker:        { color: '#9a78c8', fontSize: 11, fontWeight: '900', letterSpacing: 3, marginBottom: 20 },
  title:         { color: '#fff', fontSize: 46, fontWeight: '900', lineHeight: 52 },
  divider:       { width: 40, height: 3, backgroundColor: '#6d28d9', borderRadius: 2, marginTop: 22, marginBottom: 22 },
  body:          { color: '#c5bbcf', fontSize: 16, lineHeight: 26, marginBottom: 12 },
  bodyAccent:    { color: '#8b7fa0', fontSize: 13, marginBottom: 36 },
  companionRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  companionChip: { borderRadius: 999, borderWidth: 1, borderColor: '#ffffff15', paddingHorizontal: 12, paddingVertical: 7 },
  companionText: { color: '#a89ec0', fontSize: 12, fontWeight: '700' },
  footer:        { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 52 : 36 },
  btn:           { height: 58, borderRadius: 20, backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  btnText:       { color: '#fff', fontSize: 17, fontWeight: '900' },
  legal:         { color: '#5a5167', fontSize: 11, textAlign: 'center' },
});
