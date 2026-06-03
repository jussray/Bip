import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, Animated, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SPLASH_BG = require('../assets/images/sekret-splash.png');

interface SplashScreenProps {
  setScreen: (screen: string) => void;
}

export function SplashScreen({ setScreen }: SplashScreenProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim  = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Fade in on mount
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

    // Glow pulse on button
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.7, 1],
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

      {/* Bottom content */}
      <Animated.View style={[styles.bottomContent, { opacity: fadeAnim }]}>

        {/* Enter button */}
        <Text style={styles.enterPrompt}>Press Se'kret Bip</Text>
        <Text style={styles.enterSub}>to enter your safe space</Text>

        <Animated.View style={[styles.mainBtnWrap, { opacity: glowOpacity }]}>
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => setScreen('home')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Enter Se'kret Bip"
            accessibilityHint="Opens your safe space"
          >
            <Text style={styles.mainBtnText}>Se'kret Bip ♡</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick action buttons */}
        <View style={styles.quickRow}>
          {[
            { emoji: '✏️', label: 'Write It Out', target: 'pages'        },
            { emoji: '🎙️', label: 'Voice Bip',    target: 'voiceBip'     },
            { emoji: '☁️', label: 'Calm Me',       target: 'calm'         },
            { emoji: '👥', label: 'Circle',         target: 'circle'       },
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

        {/* Tagline */}
        <Text style={styles.tagline}>your space. your voice. always you. ♡</Text>

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

  // Bottom content
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  enterPrompt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  enterSub: {
    color: '#c4b5fd',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Main button
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
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
