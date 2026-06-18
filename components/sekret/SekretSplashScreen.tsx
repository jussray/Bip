// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Asset map ───────────────────────────────────────────────────────────────
// Teen splash  → the two teens (back-to-back, neon pink/purple, headphone cloud mascot)
// Parent splash → the couple (candlelight, lanterns, warm purple neon)
const SPLASH_ASSETS = {
  teen: require('../../assets/images/A2EB8B5A-0109-4A02-927A-FA7080B5F501.png'),
  parent: require('../../assets/images/088975D0-598A-4B68-8857-67410DA25BA0.jpeg'),
} as const;

// ─── Role-specific copy ──────────────────────────────────────────────────────
const ROLE_CONFIG = {
  teen: {
    tagline: 'Press Se\u2019kret Bip to enter your safe space',
    ctaLabel: 'Se\u2019kret Bip \u2665',
    quickActions: [
      { icon: '\u270F\uFE0F', label: 'Write It Out' },
      { icon: '\uD83C\uDFA4', label: 'Voice Bip' },
      { icon: '\uD83D\uDCA7', label: 'Calm Me' },
      { icon: '\uD83D\uDC65', label: 'Circle' },
    ],
    footer: 'your space. your voice. always you. \u2665',
    accentColor: '#FF3CA0',
    glowColor: 'rgba(255, 60, 160, 0.35)',
  },
  parent: {
    tagline: 'Press Se\u2019kret Bip to enter your parent space',
    ctaLabel: 'Se\u2019kret Bip \u2665',
    quickActions: [
      { icon: '\uD83D\uDCD6', label: 'Parent Pages' },
      { icon: '\uD83C\uDFA4', label: 'Parent Voice' },
      { icon: '\uD83C\uDF09', label: 'Bridge' },
      { icon: '\uD83D\uDC65', label: 'Parent Circle' },
    ],
    footer: 'better conversations start here. \u2665',
    accentColor: '#9B59FF',
    glowColor: 'rgba(155, 89, 255, 0.35)',
  },
} as const;

export type SekretRole = 'teen' | 'parent';

interface SekretSplashScreenProps {
  /** Determines which artwork and copy are shown */
  role: SekretRole;
  /** Called when the user taps the primary CTA button */
  onEnter: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function SekretSplashScreen({ role, onEnter }: SekretSplashScreenProps) {
  const insets = useSafeAreaInsets();
  const config = ROLE_CONFIG[role];

  // Fade-in animation for the overlay content
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed artwork */}
      <Image
        source={SPLASH_ASSETS[role]}
        style={styles.artwork}
        resizeMode="cover"
        accessibilityLabel={role === 'teen' ? 'Se\u2019kret Bip teen safe space' : 'Se\u2019kret Bip parent space'}
      />

      {/* Dark gradient overlay so bottom text stays readable */}
      <View style={styles.gradient} />

      {/* Animated bottom content */}
      <Animated.View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + 16 },
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Tagline */}
        <Text style={styles.tagline}>{config.tagline}</Text>

        {/* Primary CTA ─ neon pill button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onEnter}
          style={[
            styles.ctaButton,
            {
              borderColor: config.accentColor,
              shadowColor: config.accentColor,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Enter Se'kret Bip ${role} space`}
        >
          <Text style={[styles.ctaLabel, { color: config.accentColor }]}>
            {config.ctaLabel}
          </Text>
        </TouchableOpacity>

        {/* Quick-action tiles */}
        <View style={styles.quickRow}>
          {config.quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.quickTile,
                { borderColor: `${config.accentColor}55` },
              ]}
              onPress={onEnter}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={[styles.quickLabel, { color: config.accentColor }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer tagline */}
        <Text style={[styles.footer, { color: config.accentColor }]}>
          {config.footer}
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0010',
  },
  artwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.55,
    // CSS-style gradient approximated with a solid-to-transparent bottom mask
    backgroundColor: 'transparent',
    // React Native doesn't support linearGradient natively;
    // use expo-linear-gradient if available, else this dark bg is the fallback.
    // The artwork already has a dark bottom — this deepens it.
    backgroundImage: undefined,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginBottom: 2,
  },
  ctaButton: {
    borderWidth: 2,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: 'rgba(10, 0, 16, 0.55)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  ctaLabel: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 0, 16, 0.6)',
    gap: 5,
    minHeight: 64,
  },
  quickIcon: {
    fontSize: 20,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  footer: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 2,
    marginBottom: 4,
    opacity: 0.9,
  },
});
