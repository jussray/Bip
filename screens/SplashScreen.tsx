// screens/SplashScreen.tsx
//
// Full-screen splash artwork for teen and parent entry.
// The painted "Se'kret Bip ♡" button in each image is the main tap target.
// Parent uses a slightly larger invisible clip because its artwork has shifted
// across recent asset swaps and should never auto-skip or trap the user.
//
// Hit-target fractions are relative to rendered image height/width (cover fill).
// Tune T_BTN_* and P_BTN_* if the button lands slightly off on a particular device.

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

const { width: W, height: H } = Dimensions.get("window");

const TEEN_BG   = require("../assets/images/splash-bg.png");
const PARENT_BG = require("../assets/images/parent-space-splash.png");

// ── Teen splash: "Se'kret Bip ♡" pill button position (fractions of screen) ──
// Pill sits below the cloud artwork, above the shortcut row.
const T_BTN = { top: 0.800, bottom: 0.875, left: 0.08, right: 0.08 };

// ── Parent splash: broader hit zone so the parent door is actually usable ────
// The visual button shifted between parent splash assets. Keep this generous.
const P_BTN = { top: 0.700, bottom: 0.900, left: 0.05, right: 0.05 };

interface SplashScreenProps {
  userSide?: "teen" | "parent";
  setScreen: () => void;
}

export function SplashScreen({ userSide = "teen", setScreen }: SplashScreenProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const isParent = userSide === "parent";
  const btn = isParent ? P_BTN : T_BTN;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={[s.root, { opacity: fade }]}> 
      <StatusBar style="light" />

      {/* Full-screen artwork — pointer events disabled so only the hit clip fires */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={isParent ? PARENT_BG : TEEN_BG}
          style={s.art}
          resizeMode="cover"
        />
      </View>

      {/* Invisible clip over the painted "Se'kret Bip ♡" button */}
      <TouchableOpacity
        style={[
          s.clip,
          {
            top:    H * btn.top,
            height: H * (btn.bottom - btn.top),
            left:   W * btn.left,
            right:  W * btn.right,
          },
        ]}
        onPress={setScreen}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={
          isParent
            ? "Se'kret Bip — enter your parent space"
            : "Se'kret Bip — enter your safe space"
        }
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090011" },
  art:  { width: W, height: H },
  clip: { position: "absolute" },
});
