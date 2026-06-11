// screens/SplashScreen.tsx
// Se'kret Bip — Opening Screen
//
// splash-bg.png is the full neon Se'kret Bip artwork:
//   Raylene + Rylane back-to-back, cloud with headphones, neon title,
//   "Press Se'kret Bip to enter your safe space", CTA + shortcuts — all baked in.
//
// This component renders the image full-screen and wires up touch targets.
// No duplicate React Native text or buttons are overlaid on top of the artwork.

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

      {/* Full-screen artwork — all visual UI is baked into the image */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => setScreen("home")}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel="Enter Se'kret Bip"
        accessibilityHint="Opens your safe space"
      >
        <Image
          source={splashBg}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Transparent hit-targets aligned with the shortcut row baked into the image */}
      <View style={styles.shortcutRow} pointerEvents="box-none">
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
  shortcutRow: {
    position: "absolute",
    // The shortcuts row in the artwork sits in the bottom ~10% of the image.
    // With cover scaling on a portrait device, it lands roughly here:
    bottom: Platform.OS === "ios" ? 28 : 18,
    left: 0,
    right: 0,
    height: height * 0.10,
    flexDirection: "row",
  },
  shortcutHit: {
    flex: 1,
    height: "100%",
  },
});
