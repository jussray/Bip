// screens/SplashScreen.tsx
// Se'kret Bip — Opening Screen
//
// Teen splash (splash-bg.png): Raylene + Rylane back-to-back, cloud with headphones,
//   neon title, "Press Se'kret Bip to enter your safe space".
// Parent splash (parent-space-splash.png): Parent Space artwork.
//
// Both splashes: ONLY the CTA button is a hit target.
// No shortcut hit targets on either side — the CTA is the gate.
// Shortcuts visible in the artwork are decorative; the app routes to 'home'
// which renders RoomScreen (teen) or ParentRoomScreen (parent) based on userSide.
//
// Hit targets are positioned as fractions of the rendered image so they scale
// with any screen size.

import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");
const teenSplashBg   = require("../assets/images/splash-bg.png");
const parentSplashBg = require("../assets/images/parent-space-splash.png");

// ── Teen CTA hit target (fractions of 1024×1536 source artwork) ──────────────
// "Se'kret Bip" button: roughly 63%–71% vertically, 11%–89% horizontally.
const T_CTA_TOP    = 0.63;
const T_CTA_BOTTOM = 0.71;
const T_CTA_LEFT   = 0.11;
const T_CTA_RIGHT  = 0.89;

// ── Parent CTA hit target (fractions of parent-space-splash.png) ─────────────
// "Se'kret Bip ♡" button: roughly 72%–82% vertically, 5%–95% horizontally.
const P_CTA_TOP    = 0.72;
const P_CTA_BOTTOM = 0.82;
const P_CTA_LEFT   = 0.05;
const P_CTA_RIGHT  = 0.95;

interface SplashScreenProps {
  setScreen: (screen: string) => void;
  userSide?: "teen" | "parent";
}

export function SplashScreen({ setScreen, userSide = "teen" }: SplashScreenProps) {
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
          source={isParent ? parentSplashBg : teenSplashBg}
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

      {/* CTA button — sole entry point for both sides */}
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
        accessibilityLabel={isParent ? "Se’kret Bip — enter your parent space" : "Se’kret Bip — enter your safe space"}
        accessibilityHint="Opens the app"
      />
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
});
