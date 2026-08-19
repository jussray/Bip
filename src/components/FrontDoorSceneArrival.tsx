import React, { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';

import { FRONT_DOOR_MOTION } from '@/motion/frontDoorMotion';

type ArrivalState = 'entering' | 'settled' | 'reduced';

function prefersReducedMotionOnFirstFrame(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function FrontDoorSceneArrival({ children }: PropsWithChildren) {
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotionOnFirstFrame);
  const [arrivalState, setArrivalState] = useState<ArrivalState>(() => (
    prefersReducedMotionOnFirstFrame() ? 'reduced' : 'entering'
  ));
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setReduceMotion(true);
      return;
    }

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener?.('change', update);

    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    progress.stopAnimation();

    if (reduceMotion) {
      progress.setValue(1);
      setArrivalState('reduced');
      return;
    }

    progress.setValue(0);
    setArrivalState('entering');
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FRONT_DOOR_MOTION.arrivalDurationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) setArrivalState('settled');
    });

    return () => animation.stop();
  }, [progress, reduceMotion]);

  const sceneStyle = reduceMotion
    ? styles.settled
    : {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: FRONT_DOOR_MOTION.arrivalOpacity,
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.arrivalTranslateY,
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: FRONT_DOOR_MOTION.arrivalScale,
            }),
          },
        ],
      };

  return (
    <Animated.View
      testID="web-welcome-scene-arrival"
      accessibilityLabel="Se'kret Bip welcome scene"
      accessibilityState={{ busy: arrivalState === 'entering' }}
      accessibilityValue={{ text: arrivalState }}
      style={[styles.scene, sceneStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
  settled: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
});
