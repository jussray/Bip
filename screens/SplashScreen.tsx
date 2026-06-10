// screens/SplashScreen.tsx
// Se'kret Bip — Opening Screen
//
// Per docs/VISION.md:
//   "Immediately create emotional safety. User sees: Raylene, Rylane, Cloud.
//    Main CTA: ENTER SE'KRET BIP.
//    Feeling: Entering your safe space. Not opening an app."

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

const { height, width } = Dimensions.get("window");

const splashBg = require("../assets/images/splash-bg.png");

interface SplashScreenProps {
  setScreen: (screen: string) => void;
}

export function SplashScreen({ setScreen }: SplashScreenProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0.6)).current;
  const ctaAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade the whole screen in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();

    // CTA slides up after artwork is visible
    Animated.timing(ctaAnim, {
      toValue: 1,
      delay: 700,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Soft button glow pulse
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
      ]),
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.7, 1],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-screen splash artwork */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Image
          source={splashBg}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Bottom gradient so buttons stay readable over the artwork */}
      <LinearGradient
        colors={["transparent", "rgba(9,0,17,0.72)", "rgba(9,0,17,0.97)"]}
        locations={[0, 0.38, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Interactive CTA — fades + slides up after artwork appears */}
      <Animated.View
        style={[
          styles.bottomContent,
          {
            opacity: ctaAnim,
            transform: [
              {
                translateY: ctaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.enterSub}>tap to step into your safe space</Text>

        {/* Main CTA */}
        <Animated.View style={[styles.mainBtnWrap, { opacity: glowOpacity }]}>
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => setScreen("home")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Enter Se'kret Bip"
            accessibilityHint="Opens your safe space"
          >
            <Text style={styles.mainBtnText}>Se'kret Bip ♡</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick shortcuts */}
        <View style={styles.quickRow}>
          {[
            { emoji: "✍️", label: "Write It Out", target: "pages" },
            { emoji: "🎙️", label: "Voice Bip",   target: "voiceBip" },
            { emoji: "🌙", label: "Calm Me",      target: "calm" },
            { emoji: "🌐", label: "Circle",       target: "circle" },
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

        <Text style={styles.tagline}>your space. your voice. always you. ♡</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#090011",
  },
  bgImage: {
    width,
    height,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.44,
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  enterSub: {
    color: "#c4b5fd",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },
  mainBtnWrap: {
    width: "100%",
    marginBottom: 18,
  },
  mainBtn: {
    backgroundColor: "rgba(30, 0, 60, 0.85)",
    borderWidth: 2,
    borderColor: "#d946ef",
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#d946ef",
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  mainBtnText: {
    color: "#f472b6",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#d946ef",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
    marginBottom: 14,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "rgba(30, 0, 60, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(167, 114, 192, 0.4)",
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
  },
  quickEmoji: {
    fontSize: 20,
    marginBottom: 3,
  },
  quickLabel: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  tagline: {
    color: "#c4b5fd",
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.85,
  },
});
