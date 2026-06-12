// hooks/useStickerExpression.ts
// Se'kret Bip — Sticker Expression Hook
// ─────────────────────────────────────────────────────────────────────────────
// Drives smooth animated fade transitions between sticker images.
// Se'kret Brain sets an EmotionalState — the hook resolves the image and
// fades out the old one, fades in the new one automatically.
//
// Usage (basic):
//   const { imageSource, animatedStyle } = useStickerExpression('raylene', 'thinking');
//   <Animated.Image source={imageSource} style={[styles.sticker, animatedStyle]} />
//
// Usage (Se'kret Brain driven):
//   const [state, setState] = useState<EmotionalState>('neutral');
//   const { imageSource, animatedStyle } = useStickerExpression(character, state, {
//     screen: 'voiceBip',
//     timeOfDay: 'night',
//   });
//   // When Brain decides: setState('listening') — UI fades to the right image.
//
// Usage (manual trigger):
//   const { imageSource, animatedStyle, triggerExpression } = useStickerExpression(...);
//   triggerExpression('comforting');   // override from outside the hook
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect, useCallback } from 'react';
import { Animated }                                  from 'react-native';
import type { ImageSourcePropType }                  from 'react-native';
import type { SekretPersonality }                    from '../services/sekretPresence';
import {
  getStickerForState,
  type EmotionalState,
  type StickerContext,
}                                                    from '../constants/stickerEngine';

// ── Config ────────────────────────────────────────────────────────────────────

export interface StickerTransitionConfig {
  /** Duration of the fade-out in ms. Default: 180 */
  fadeOutMs?: number;
  /** Duration of the fade-in in ms. Default: 260 */
  fadeInMs?:  number;
  /** Do not animate — instant swap. Default: false */
  instant?:   boolean;
}

// ── Return value ──────────────────────────────────────────────────────────────

export interface StickerExpressionResult {
  /** The resolved ImageSourcePropType — pass directly to <Animated.Image source> */
  imageSource:     ImageSourcePropType;
  /** Animated style with opacity — spread onto <Animated.Image style> */
  animatedStyle:   { opacity: Animated.Value };
  /** Current emotional state being displayed */
  currentState:    EmotionalState;
  /** Manually trigger a state change from outside the hook */
  triggerExpression: (state: EmotionalState) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStickerExpression(
  character:   SekretPersonality,
  state:       EmotionalState,
  context?:    StickerContext,
  config?:     StickerTransitionConfig,
): StickerExpressionResult {

  const fadeOutMs = config?.fadeOutMs ?? 180;
  const fadeInMs  = config?.fadeInMs  ?? 260;
  const instant   = config?.instant   ?? false;

  // Opacity animated value — starts fully visible
  const opacity = useRef(new Animated.Value(1)).current;

  // Track the currently displayed state so we can avoid re-animating same→same
  const [displayedState, setDisplayedState] = useState<EmotionalState>(state);
  const [displayedImage, setDisplayedImage] = useState<ImageSourcePropType>(
    getStickerForState(character, state, context),
  );

  // Ref to prevent stale closures in the animation sequence
  const pendingState   = useRef<EmotionalState>(state);
  const isTransitioning = useRef(false);

  const runTransition = useCallback(
    (nextState: EmotionalState) => {
      const nextImage = getStickerForState(character, nextState, context);

      if (instant) {
        setDisplayedImage(nextImage);
        setDisplayedState(nextState);
        opacity.setValue(1);
        isTransitioning.current = false;
        return;
      }

      isTransitioning.current = true;

      // 1. Fade out
      Animated.timing(opacity, {
        toValue:         0,
        duration:        fadeOutMs,
        useNativeDriver: true,
      }).start(() => {
        // 2. Swap image while invisible
        setDisplayedImage(nextImage);
        setDisplayedState(nextState);

        // 3. Fade in
        Animated.timing(opacity, {
          toValue:         1,
          duration:        fadeInMs,
          useNativeDriver: true,
        }).start(() => {
          isTransitioning.current = false;

          // If another state was queued during the transition, run it now
          if (pendingState.current !== nextState) {
            runTransition(pendingState.current);
          }
        });
      });
    },
    [character, context, fadeOutMs, fadeInMs, instant, opacity],
  );

  // React to external state changes (Se'kret Brain → state prop updates)
  useEffect(() => {
    if (state === displayedState) return;

    pendingState.current = state;

    // If already transitioning, let the current animation finish —
    // it will pick up pendingState at the end.
    if (!isTransitioning.current) {
      runTransition(state);
    }
  }, [state, displayedState, runTransition]);

  // Manual trigger — allows imperative control from outside the hook
  const triggerExpression = useCallback(
    (nextState: EmotionalState) => {
      pendingState.current = nextState;
      if (!isTransitioning.current) {
        runTransition(nextState);
      }
    },
    [runTransition],
  );

  return {
    imageSource:       displayedImage,
    animatedStyle:     { opacity },
    currentState:      displayedState,
    triggerExpression,
  };
}
