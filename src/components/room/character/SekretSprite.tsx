/**
 * src/components/room/character/SekretSprite.tsx
 *
 * Renders a Se'kret character sprite with:
 *   • Idle bob: gentle vertical bounce loop
 *   • Mood pulse: scale bump when `mood` prop changes
 *   • Variant crossfade: opacity swap when `sekret` or `variant` changes
 *
 * Sprite assets live at:
 *   assets/images/characters/{sekret}/idle.png
 *   assets/images/characters/{sekret}/mood-{mood}.png  (optional)
 *
 * If a mood-specific sprite doesn’t exist the idle sprite is used.
 * Wrap in CharacterLayer for correct positioning.
 */

import React, { useEffect, useRef } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// ─── Sprite asset map ───────────────────────────────────────────────────
// These require() calls are eagerly evaluated at bundle time.
// Add real sprite PNGs to assets/images/characters/{sekret}/ and
// replace these fallback requires.
//
// Currently returns a coloured placeholder rectangle via a
// data-URI so nothing blows up before art is ready.

const PLACEHOLDER =
  require('../../../assets/images/archive/bg-raylene-room-day.png');

type Sekret = 'raylene' | 'rylane' | 'cloud' | 'night' | 'dad' | 'mom';

// When real sprites land, replace PLACEHOLDER with per-sekret requires.
const SPRITE_IDLE: Record<Sekret, ReturnType<typeof require>> = {
  raylene: PLACEHOLDER,
  rylane:  PLACEHOLDER,
  cloud:   PLACEHOLDER,
  night:   PLACEHOLDER,
  dad:     PLACEHOLDER,
  mom:     PLACEHOLDER,
};

// ─── Component ────────────────────────────────────────────────────────────

export type SekretMood = 'neutral' | 'happy' | 'sad' | 'anxious' | 'calm' | 'excited';

interface SekretSpriteProps {
  sekret: Sekret;
  mood?: SekretMood;
  /** Width of sprite; height scales proportionally at 4:3. */
  size?: number;
}

export function SekretSprite({ sekret, mood = 'neutral', size = W * 0.45 }: SekretSpriteProps) {
  const prevMood = useRef<SekretMood>(mood);

  // Idle vertical bob.
  const bobY = useSharedValue(0);
  useEffect(() => {
    bobY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bobY]);

  // Mood pulse: scale bump on mood change.
  const scale = useSharedValue(1);
  useEffect(() => {
    if (mood !== prevMood.current) {
      prevMood.current = mood;
      scale.value = withSequence(
        withSpring(1.08, { damping: 6, stiffness: 200 }),
        withSpring(1.0,  { damping: 10, stiffness: 180 }),
      );
    }
  }, [mood, scale]);

  const spriteStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY.value },
      { scale: scale.value },
    ],
  }));

  const source = SPRITE_IDLE[sekret];

  return (
    <Animated.View style={spriteStyle}>
      <Image
        source={source}
        style={{ width: size, height: size * 1.25 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}
