// screens/SplashScreen.tsx
// Se'kret Bip — Opening Screen
//
// Teen splash (splash-bg.png): Raylene + Rylane back-to-back, cloud with headphones,
//   neon title, "Press Se'kret Bip to enter your safe space", CTA + shortcuts baked in.
// Parent splash (parent-space-splash.png): Parent Space artwork, single CTA button.
//   Shortcuts in the artwork are decorative — only the CTA button is a hit target.
//   This gates the parent/guardian path so entry requires the explicit button press.
//
// Hit targets are positioned as fractions of the rendered image so they scale
// with any screen size.

import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

const teenSplashBg   = require("../assets/images/splash-bg.png");
const parentSplashBg = require("../assets/images/parent-space-splash.png");

// ── Teen splash hit targets (fractions of 1024×1536 source artwork) ──────────
// CTA button: roughly 63%–71% vertically, 11%–89% horizontally.
const T_CTA_TOP    = 0.63;
const T_CTA_BOTTOM = 0.71;
const T_CTA_LEFT   = 0.11;
const T_CTA_RIGHT  = 0.89;

// Shortcut row: roughly 75%–85% down.
const T_SC_TOP    = 0.75;
const T_SC_BOTTOM = 0.85;

const TEEN_SHORTCUTS = [
  { label: "Write It Out", target: "pages"    },
  { label: "Voice Bip",   target: "voiceBip" },
  { label: "Calm Me",     target: "calm"      },
  { label: "Circle",      target: "circle"    },
] as const;

// ── Parent splash hit targets (fractions of parent-space-splash.png) ──────────
// "Se'kret Bip ♡" CTA button: roughly 72%–82% vertically, 5%–95% horizontally.
// Shortcut row visible in artwork (~88%–97%) is intentionally NOT tappable —
// parent/guardian entry must go through the CTA button only.
const P_CTA_TOP    = 0.72;
const P_CTA_BOTTOM = 0.82;
const P_CTA_LEFT   = 0.05;
const P_CTA_RIGHT  = 0.95;

interface SplashScreenProps {
  setScreen: (screen: string) => void;
  userSide?: string;
}

export function SplashScreen({ setScreen, userSide }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const isParent = userSide === 'parent';

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Full-screen artwork — display only, no tap-to-enter */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={isParent ? parentSplashBg : teenSplashBg}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </View>

      {/* CTA button — the only way to enter */}
      <TouchableOpacity
        style={[styles.hitTarget, isParent ? {
          top:    height * P_CTA_TOP,
          height: height * (P_CTA_BOTTOM - P_CTA_TOP),
          left:   width  * P_CTA_LEFT,
          right:  width  * (1 - P_CTA_RIGHT),
        } : {
          top:    height * T_CTA_TOP,
          height: height * (T_CTA_BOTTOM - T_CTA_TOP),
          left:   width  * T_CTA_LEFT,
          right:  width  * (1 - T_CTA_RIGHT),
        }]}
        onPress={() => setScreen("home")}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isParent ? "Se'kret Bip — enter your parent space" : "Se'kret Bip — enter your safe space"}
        accessibilityHint="Opens the app"
      />

      {/* Teen shortcuts only — parent splash shortcuts are decorative, not tappable */}
      {!isParent && (
        <View style={[styles.shortcutRow, {
          top:    height * T_SC_TOP,
          height: height * (T_SC_BOTTOM - T_SC_TOP),
        }]}>
          {TEEN_SHORTCUTS.map(({ label, target }) => (
            <TouchableOpacity
              key={target}
              style={styles.shortcutHit}
              onPress={() => setScreen(target)}
              accessibilityRole="button"
              accessibilityLabel={label}
            />
          ))}
        </View>
      )}
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
