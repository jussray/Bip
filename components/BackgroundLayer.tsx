import React, { useMemo } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';

type VoiceKey = 'raylene' | 'rylane';
type ScreenKey = 'default' | 'bippin2' | 'voiceBip' | 'voiceVip';

type RoomVariant = {
  day: number;
  night: number;
};

type BackgroundLayerProps = {
  screen?: ScreenKey;
  voiceKey?: VoiceKey;
  children: React.ReactNode;
  dimOverlay?: boolean;
};

const ROOMS = {
  bippin2: {
    day: require('../assets/images/raylene-bippin2-day.png'),
    night: require('../assets/images/raylene-bippin2-night.png'),
  },
  voiceBip: {
    day: require('../assets/images/raylene-voice-day.png'),
    night: require('../assets/images/raylene-voice-night.png'),
  },
  voiceBipRylane: {
    day: require('../assets/images/rylane-voice-day.png'),
    night: require('../assets/images/rylane-voice-night.png'),
  },
  default: {
    day: require('../assets/images/room-bg.png'),
    night: require('../assets/images/room-bg-dark.png'),
  },
} as const satisfies Record<string, RoomVariant>;

function resolveRoom(screen: ScreenKey, voiceKey: VoiceKey) {
  if (screen === 'bippin2') return ROOMS.bippin2;
  if (screen === 'voiceBip' || screen === 'voiceVip') {
    return voiceKey === 'rylane' ? ROOMS.voiceBipRylane : ROOMS.voiceBip;
  }
  return ROOMS.default;
}

function isNightHour(hour: number) {
  return hour >= 18 || hour < 6;
}

function BackgroundLayer({
  screen = 'default',
  voiceKey = 'raylene',
  children,
  dimOverlay = true,
}: BackgroundLayerProps) {
  const hour = new Date().getHours();
  const night = isNightHour(hour);

  const room = useMemo(() => resolveRoom(screen, voiceKey), [screen, voiceKey]);
  const source = night ? room.night : room.day;

  return (
    <ImageBackground source={source} style={styles.root} resizeMode="cover">
      {dimOverlay && (
        <View
          pointerEvents="none"
          style={styles.overlay}
        />
      )}
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

export default React.memo(BackgroundLayer);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#160028',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 9, 20, 0.42)',
  },
  content: {
    flex: 1,
  },
});
