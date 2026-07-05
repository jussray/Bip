/**
 * src/components/room/useRoomParallax.ts
 *
 * Drives parallax offset for RoomBackground.
 *
 * • On a real device  → gyroscope (expo-sensors) gives a natural tilt feel.
 * • In simulator/web  → gentle idle float so the room still feels alive.
 *
 * Returns shared Animated.ValueXY so RoomBackground can interpolate
 * without triggering React re-renders on every sensor tick.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Gyroscope } from 'expo-sensors';

/** Maximum pixel offset in each direction. Keep this ≤ half the bleed. */
const MAX_OFFSET = 8;

/** How fast the room "catches up" to the tilt. Lower = floatier. */
const LERP_SPEED = 120;

export interface RoomParallaxResult {
  /** Animated.ValueXY ready to pass to Animated.Image's transform. */
  offset: Animated.ValueXY;
}

export function useRoomParallax(): RoomParallaxResult {
  const offset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gyroAvailable = useRef(false);
  const idleAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let subscription: ReturnType<typeof Gyroscope.addListener> | null = null;

    const startIdleFloat = () => {
      // Gentle figure-8 float when no gyroscope.
      const floatX = Animated.sequence([
        Animated.timing(offset.x, {
          toValue: MAX_OFFSET * 0.4,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(offset.x, {
          toValue: -MAX_OFFSET * 0.4,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]);
      const floatY = Animated.sequence([
        Animated.timing(offset.y, {
          toValue: -MAX_OFFSET * 0.25,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(offset.y, {
          toValue: MAX_OFFSET * 0.25,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]);

      idleAnim.current = Animated.loop(
        Animated.parallel([floatX, floatY]),
      );
      idleAnim.current.start();
    };

    Gyroscope.isAvailableAsync().then((available) => {
      gyroAvailable.current = available;

      if (!available) {
        startIdleFloat();
        return;
      }

      Gyroscope.setUpdateInterval(16); // ~60fps

      // Accumulate raw gyro rotation into a clamped target offset.
      let targetX = 0;
      let targetY = 0;

      subscription = Gyroscope.addListener(({ x, y }) => {
        // y-axis rotation → horizontal shift; x-axis → vertical shift.
        // Scale is arbitrary — feels good at 1.5 per radian/s.
        targetX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, targetX + y * 1.5));
        targetY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, targetY + x * 1.5));

        Animated.spring(offset, {
          toValue: { x: targetX, y: targetY },
          speed: LERP_SPEED,
          bounciness: 0,
          useNativeDriver: true,
        }).start();
      });
    });

    return () => {
      subscription?.remove();
      idleAnim.current?.stop();
    };
  }, [offset]);

  return { offset };
}
