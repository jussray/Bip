// screens/SplashScreen.tsx
// Se'kret Bip — Opening Screen
//
// splash-bg.png is the full neon Se'kret Bip artwork (1024×1536):
//   Raylene + Rylane back-to-back, cloud with headphones, neon title,
//   "Press Se'kret Bip to enter your safe space", CTA + shortcuts — all baked in.
//
// Hit targets are positioned as fractions of the rendered image so they scale
// with any screen size. The Se'kret Bip CTA button is the primary entry point.

import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");
const splashBg = require("../assets/images/splash-bg.png");

// Fractions measured against the 1024×1536 source artwork.
// The Se'kret Bip CTA button occupies roughly 63%–71% vertically, 11%–89% horizontally.
const CTA_TOP    = 0.63;
const CTA_BOTTOM = 0.71;
const CTA_LEFT   = 0.11;
const CTA_RIGHT  = 0.89;

// The four shortcut icons sit roughly 75%–85% down.
const SC_TOP    = 0.75;
const SC_BOTTOM = 0.85;

const SHORTCUTS = [
  { label: "Write It Out", target: "pages" },
  { label: "Voice Bip",   target: "voiceBip" },
  { label: "Calm Me",     target: "calm" },
  { label: "Circle",      target: "circle" },
] as const;

interface SplashScreenProps {
  setScreen: (screen: string) => void;
}

export function SplashScreen({ setScreen }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Full-screen artwork — display only, no tap-to-enter */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={splashBg}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </View>

      {/* Se'kret Bip CTA button — the only way to enter the app */}
      <TouchableOpacity
        style={[styles.hitTarget, {
          top:    height * CTA_TOP,
          height: height * (CTA_BOTTOM - CTA_TOP),
          left:   width  * CTA_LEFT,
          right:  width  * (1 - CTA_RIGHT),
        }]}
        onPress={() => setScreen("home")}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Se'kret Bip — enter your safe space"
        accessibilityHint="Opens the app"
      />

      {/* Transparent hit-targets aligned with the shortcut row baked into the image */}
      <View style={[styles.shortcutRow, {
        top:    height * SC_TOP,
        height: height * (SC_BOTTOM - SC_TOP),
      }]}>
        {SHORTCUTS.map(({ label, target }) => (
          <TouchableOpacity
            key={target}
            style={styles.shortcutHit}
            onPress={() => setScreen(target)}
            accessibilityRole="button"
            accessibilityLabel={label}
          />
        ))}
      </View>
    </Animated.View>
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
  hitTarget: {
    position: "absolute",
  },
  shortcutRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  shortcutHit: {
    flex: 1,
    height: "100%",
  },
});
