/**
 * Renders a Se'kret character sprite with idle and mood motion.
 * Night resolves through the static room registry so unavailable generated
 * poses fail safely to the approved canonical neutral master.
 */
import React, { useEffect, useRef } from 'react';
import { Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { getNightPoseAsset } from '@/config/nightRoomAssetRegistry';

const { width: W } = Dimensions.get('window');

type Sekret = 'raylene' | 'rylane' | 'cloud' | 'night' | 'dad' | 'mom';

const PLACEHOLDER = require('../../../../assets/images/archive/bg-raylene-room-day.png');

const SPRITE_IDLE: Record<Sekret, ReturnType<typeof require>> = {
  raylene: require('../../../../assets/images/companions/raylene/raylene-master.png'),
  rylane: require('../../../../assets/images/companions/rylane/rylane-master.png'),
  cloud: require('../../../../assets/images/cloud.png'),
  night: getNightPoseAsset('neutral').source,
  dad: PLACEHOLDER,
  mom: PLACEHOLDER,
};

export type SekretMood = 'neutral' | 'happy' | 'sad' | 'anxious' | 'calm' | 'excited';

interface SekretSpriteProps {
  sekret: Sekret;
  mood?: SekretMood;
  size?: number;
}

export function SekretSprite({ sekret, mood = 'neutral', size = W * 0.45 }: SekretSpriteProps) {
  const prevMood = useRef<SekretMood>(mood);
  const bobY = useSharedValue(0);

  useEffect(() => {
    bobY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bobY]);

  const scale = useSharedValue(1);
  useEffect(() => {
    if (mood !== prevMood.current) {
      prevMood.current = mood;
      scale.value = withSequence(
        withSpring(1.08, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 180 }),
      );
    }
  }, [mood, scale]);

  const spriteStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={spriteStyle}>
      <Image
        source={SPRITE_IDLE[sekret]}
        style={{ width: size, height: size * 2 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}
