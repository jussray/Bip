/**
 * src/components/room/RoomBackground.tsx
 *
 * Drop-in room background with parallax (Option A).
 *
 * Usage:
 *   <RoomBackground sekret="raylene" variant="evening" />
 *
 * The image is rendered 16px wider and taller than the screen
 * (8px bleed on each side) so parallax movement never exposes
 * a raw edge.
 *
 * Props
 * ─────
 * sekret   – 'raylene' | 'rylane' | 'cloud' | 'night' | 'dad' | 'mom'
 * variant  – 'day' | 'midday' | 'afternoon' | 'evening' | 'night'
 *            | 'deep-night' | 'rain'
 * style    – optional additional ViewStyle for the container
 * children – layered on top (Se'kret sprite, UI chrome, etc.)
 */

import React from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useRoomParallax } from './useRoomParallax';

// ─── Asset map ────────────────────────────────────────────────────────────────
// Every file in assets/images/archive/ that follows the
// bg-{sekret}-room-{variant}.png convention.

type Sekret = 'raylene' | 'rylane' | 'cloud' | 'night' | 'dad' | 'mom';
type Variant = 'day' | 'midday' | 'afternoon' | 'evening' | 'night' | 'deep-night' | 'rain';

const ROOM_ASSETS: Record<Sekret, Partial<Record<Variant, ReturnType<typeof require>>>> = {
  raylene: {
    day:        require('../../../assets/images/archive/bg-raylene-room-day.png'),
    midday:     require('../../../assets/images/archive/bg-raylene-room-midday.png'),
    afternoon:  require('../../../assets/images/archive/bg-raylene-room-afternoon.png'),
    evening:    require('../../../assets/images/archive/bg-raylene-room-evening.png'),
    night:      require('../../../assets/images/archive/bg-raylene-room-night.png'),
    'deep-night': require('../../../assets/images/archive/bg-raylene-room-deep-night.png'),
    rain:       require('../../../assets/images/archive/bg-raylene-room-rain.png'),
  },
  rylane: {
    day:        require('../../../assets/images/archive/bg-rylane-room-day.png'),
    midday:     require('../../../assets/images/archive/bg-rylane-room-midday.png'),
    afternoon:  require('../../../assets/images/archive/bg-rylane-room-afternoon.png'),
    evening:    require('../../../assets/images/archive/bg-rylane-room-evening.png'),
    night:      require('../../../assets/images/archive/bg-rylane-room-night.png'),
    'deep-night': require('../../../assets/images/archive/bg-rylane-room-deep-night.png'),
    rain:       require('../../../assets/images/archive/bg-rylane-room-rain.png'),
  },
  cloud: {
    day:        require('../../../assets/images/archive/bg-cloud-room-day.png'),
    midday:     require('../../../assets/images/archive/bg-cloud-room-midday.png'),
    afternoon:  require('../../../assets/images/archive/bg-cloud-room-afternoon.png'),
    evening:    require('../../../assets/images/archive/bg-cloud-room-evening.png'),
    night:      require('../../../assets/images/archive/bg-cloud-room-night.png'),
    'deep-night': require('../../../assets/images/archive/bg-cloud-room-deep-night.png'),
    rain:       require('../../../assets/images/archive/bg-cloud-room-rain.png'),
  },
  night: {
    day:        require('../../../assets/images/archive/bg-night-room-day.png'),
    midday:     require('../../../assets/images/archive/bg-night-room-midday.png'),
    afternoon:  require('../../../assets/images/archive/bg-night-room-afternoon.png'),
    evening:    require('../../../assets/images/archive/bg-night-room-evening.png'),
    night:      require('../../../assets/images/archive/bg-night-room-night.png'),
    'deep-night': require('../../../assets/images/archive/bg-night-room-deep-night.png'),
    rain:       require('../../../assets/images/archive/bg-night-room-rain.png'),
  },
  dad: {
    day:        require('../../../assets/images/archive/bg-dad-room-day.png'),
    evening:    require('../../../assets/images/archive/bg-dad-room-evening.png'),
    night:      require('../../../assets/images/archive/bg-dad-room-night.png'),
    'deep-night': require('../../../assets/images/archive/bg-dad-room-deep-night.png'),
    rain:       require('../../../assets/images/archive/bg-dad-room-rain.png'),
  },
  mom: {
    day:        require('../../../assets/images/archive/bg-mom-room-day.png'),
    evening:    require('../../../assets/images/archive/bg-mom-room-evening.png'),
    night:      require('../../../assets/images/archive/bg-mom-room-night.png'),
    'deep-night': require('../../../assets/images/archive/bg-mom-room-deep-night.png'),
    rain:       require('../../../assets/images/archive/bg-mom-room-rain.png'),
  },
};

/** Bleed on each edge in pixels — image is rendered this much larger than screen. */
const BLEED = 8;

interface RoomBackgroundProps {
  sekret: Sekret;
  variant: Variant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function RoomBackground({
  sekret,
  variant,
  style,
  children,
}: RoomBackgroundProps) {
  const { offset } = useRoomParallax();
  const { width, height } = Dimensions.get('window');

  const source = ROOM_ASSETS[sekret]?.[variant];

  if (!source) {
    // Variant not available for this Se'kret (e.g. dad has no midday).
    // Fall back to 'day' silently.
    const fallback = ROOM_ASSETS[sekret]?.day;
    if (__DEV__) {
      console.warn(
        `[RoomBackground] No asset for ${sekret}/${variant}. Falling back to day.`,
      );
    }
    if (!fallback) return null;
  }

  const resolvedSource = source ?? ROOM_ASSETS[sekret]?.day;

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={resolvedSource}
        style={[
          styles.image,
          {
            width: width + BLEED * 2,
            height: height + BLEED * 2,
            // Offset by bleed so the image is centered at rest.
            marginLeft: -BLEED,
            marginTop: -BLEED,
            transform: [
              { translateX: offset.x },
              { translateY: offset.y },
            ],
          },
        ]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
});
