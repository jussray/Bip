// screens/SplashScreen.tsx
// Se'kret Bip — Opening Screen
//
// Per docs/VISION.md:
//   "Immediately create emotional safety. User sees: Raylene, Rylane, Cloud.
//    Main CTA: ENTER SE'KRET BIP.
//    Feeling: Entering your safe space. Not opening an app."

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, Animated, Platform, Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SPLASH_BG = IMAGES.sekretSplash;

interface SplashScreenProps {
  setScreen: (screen: string) => void;
}

export function SplashScreen({ setScreen }: SplashScreenProps) {
  // Entrance
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Looping ambience
  const glowAnim       = useRef(new Animated.Value(0.6)).current;
  const cloudDriftAnim = useRef(new Animated.Value(0)).current;
  const cloudBreathAnim = useRef(new Animated.Value(1)).current;

  // Staggered companion reveal (Raylene → Rylane → Cloud → CTA)
  const rayleneAnim = useRef(new Animated.Value(0)).current;
  const rylaneAnim  = useRef(new Animated.Value(0)).current;
  const cloudAnim   = useRef(new Animated.Value(0)).current;
  const ctaAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background fade in + soft scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger the three characters in so the user sees them appear one by
    // one — meets vision: "User sees Raylene, Rylane, Cloud"
    Animated.stagger(260, [
      Animated.timing(rayleneAnim, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rylaneAnim,  { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cloudAnim,   { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(ctaAnim,     { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Soft button glow loop (opacity → native driver safe)
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    // Cloud drift — gentle horizontal float (~6s cycle)
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudDriftAnim, { toValue: 1,  duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudDriftAnim, { toValue: 0,  duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    driftLoop.start();

    // Cloud breath — gentle scale pulse to feel alive
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudBreathAnim, { toValue: 1.08, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cloudBreathAnim, { toValue: 1,    duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    breathLoop.start();

    return () => {
      glowLoop.stop();
      driftLoop.stop();
      breathLoop.stop();
    };
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.7, 1],
  });

  const cloudDriftX = cloudDriftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full screen background */}
      <Animated.View style={[styles.bgWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={SPLASH_BG}
          style={styles.bg}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      {/* Real gradient fade so text stays readable across the bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(13,0,20,0.55)', 'rgba(13,0,20,0.92)']}
        locations={[0, 0.45, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Floating Cloud — emotional mascot, breathes + drifts above the CTA */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.cloudWrap,
          {
            opacity: cloudAnim,
            transform: [
              { translateX: cloudDriftX },
              { scale: cloudBreathAnim },
            ],
          },
        ]}
      >
        <Image source={IMAGES.cloud} style={styles.cloudImg} resizeMode="contain" />
      </Animated.View>

      {/* Bottom content */}
      <Animated.View style={[styles.bottomContent, { opacity: fadeAnim }]}>

        {/* Companion silhouettes — Raylene on left, Rylane on right */}
        <View style={styles.companionRow}>
          <Animated.View
            style={[
              styles.companionWrap,
              {
                opacity: rayleneAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }),
                transform: [{ translateY: rayleneAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <Image source={IMAGES.rayleneNeutral} style={styles.companionImg} resizeMode="contain" />
            <Text style={styles.companionLabel}>Raylene 💜</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.companionWrap,
              {
                opacity: rylaneAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }),
                transform: [{ translateY: rylaneAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <Image source={IMAGES.rylaneNeutral} style={styles.companionImg} resizeMode="contain" />
            <Text style={styles.companionLabel}>Rylane ⚡</Text>
          </Animated.View>
        </View>

        {/* Invitation */}
        <Animated.View style={{ opacity: ctaAnim, transform: [{ translateY: ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          <Text style={styles.enterPrompt}>when you’re ready</Text>
          <Text style={styles.enterSub}>tap to step into your safe space</Text>

          {/* Main CTA — vision: "ENTER SE'KRET BIP" */}
          <Animated.View style={[styles.mainBtnWrap, { opacity: glowOpacity }]}>
            <TouchableOpacity
              style={styles.mainBtn}
              onPress={() => setScreen('home')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Enter Se'kret Bip"
              accessibilityHint="Opens your safe space"
            >
              <Text style={styles.mainBtnText}>ENTER SE’KRET BIP ♡</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick action buttons — shortcuts straight into the rooms */}
          <View style={styles.quickRow}>
            {[
              { emoji: '✍️', label: 'Write It Out', target: 'pages'    },
              { emoji: '🎙️', label: 'Voice Bip',    target: 'voiceBip' },
              { emoji: '🌙', label: 'Calm Me',       target: 'calm'     },
              { emoji: '🌐', label: 'Circle',         target: 'circle'   },
            ].map(({ emoji, label, target }) => (
              <TouchableOpacity
                key={target}
                style={styles.quickBtn}
                onPress={() => setScreen(target)}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Text style={styles.quickEmoji}>{emoji}</Text>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tagline — vision verbatim: "My space. My voice. My pace." */}
          <Text style={styles.tagline}>my space. my voice. my pace. ♡</Text>
        </Animated.View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0014',
  },

  // Background
  bgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  bg: {
    width,
    height,
  },

  // Real bottom gradient — fades from transparent at top to dark at bottom
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },

  // Floating cloud above the CTA
  cloudWrap: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: height * 0.52,
    width: 110,
    height: 110,
    shadowColor: '#c4b5fd',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cloudImg: {
    width: '100%',
    height: '100%',
  },

  // Bottom content stack
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Companion silhouettes row
  companionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  companionWrap: {
    alignItems: 'center',
    width: 72,
  },
  companionImg: {
    width: 64,
    height: 80,
    borderRadius: 12,
  },
  companionLabel: {
    color: '#f5f0ff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(13,0,20,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  enterPrompt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  enterSub: {
    color: '#c4b5fd',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Main CTA
  mainBtnWrap: {
    width: '100%',
    marginBottom: 20,
  },
  mainBtn: {
    backgroundColor: 'rgba(30, 0, 60, 0.85)',
    borderWidth: 2,
    borderColor: '#d946ef',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#d946ef',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  mainBtnText: {
    color: '#f472b6',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#d946ef',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: 'rgba(30, 0, 60, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(167, 114, 192, 0.4)',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickLabel: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Tagline
  tagline: {
    color: '#c4b5fd',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.85,
  },
});
