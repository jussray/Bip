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
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");
const splashBg = require("../assets/images/splash-bg.png");
const parentSplashBg = require("../assets/images/parent-space-splash.png");

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
  userSide?: "teen" | "parent";
  interactive?: boolean;
}

export function SplashScreen({ setScreen, userSide = "teen", interactive = true }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isParent = userSide === "parent";

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
          source={isParent ? parentSplashBg : splashBg}
          style={styles.bgImage}
          resizeMode={isParent ? "contain" : "cover"}
        />
      </View>

      {isParent ? (
        <View style={styles.parentIntro} pointerEvents="none">
          <Text style={styles.parentEyebrow}>PARENT SPACE</Text>
          <Text style={styles.parentTitle}>A softer way to stay connected.</Text>
          <Text style={styles.parentBody}>Your teen’s private space stays private. Bridge moments are shared on purpose.</Text>
        </View>
      ) : null}

      {interactive ? (
        <>
          {/* Se'kret Bip CTA button — the only way to enter the app */}
          <TouchableOpacity
            style={isParent ? styles.parentEnter : [styles.hitTarget, {
              top: height * CTA_TOP,
              height: height * (CTA_BOTTOM - CTA_TOP),
              left: width * CTA_LEFT,
              right: width * (1 - CTA_RIGHT),
            }]}
            onPress={() => setScreen("home")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isParent ? "Enter Parent Space" : "Se'kret Bip — enter your safe space"}
            accessibilityHint="Opens the app"
          />

          {/* Transparent hit-targets aligned with the shortcut row baked into the image */}
          {!isParent ? <View style={[styles.shortcutRow, {
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
          </View> : null}
        </>
      ) : null}
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
  parentIntro: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 138,
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(18, 9, 31, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(226, 194, 255, 0.34)",
  },
  parentEyebrow: { color: "#d7b8ef", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  parentTitle: { color: "#fff", fontSize: 22, lineHeight: 27, fontWeight: "800", marginTop: 6 },
  parentBody: { color: "#dfd5e7", fontSize: 13, lineHeight: 19, marginTop: 7 },
  parentEnter: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(153, 104, 185, 0.24)",
    borderWidth: 1,
    borderColor: "rgba(240, 217, 255, 0.55)",
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
