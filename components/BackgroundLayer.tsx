import React, { useMemo } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { IMAGES, getRoomScene } from '../constants/theme';

type VoiceKey = 'raylene' | 'rylane';
type ScreenKey = 'default' | 'bippin2' | 'voiceBip' | 'voiceVip';

type RoomVariant = {
  day: any;
  night: any;
};

type BackgroundLayerProps = {
  screen?: ScreenKey;
  voiceKey?: VoiceKey;
  children: React.ReactNode;
  dimOverlay?: boolean;
};

// All room art is sourced from constants/theme.ts so we only have ONE
// place that knows how to map a logical name to a real asset file.
const ROOMS: Record<string, RoomVariant> = {
  bippin2: {
    day:   IMAGES.raylene_Bippin2Day,
    night: IMAGES.raylene_Bippin2Night,
  },
  voiceBip: {
    day:   IMAGES.rayleneVoiceDay,
    night: IMAGES.rayleneVoiceNight,
  },
  voiceBipRylane: {
    day:   IMAGES.rylaneVoiceDay,
    night: IMAGES.rylaneVoiceNight,
  },
  default: {
    day:   getRoomScene('raylene', 'day'),
    night: getRoomScene('raylene', 'night'),
  },
};

function resolveRoom(screen: ScreenKey, voiceKey: VoiceKey) {
  if (screen === 'bippin2') return ROOMS.bippin2;
  if (screen === 'voiceBip' || screen === 'voiceVip') {
    return voiceKey === 'rylane' ? ROOMS.voiceBipRylane : ROOMS.voiceBip;
  }
  return {
    day: getRoomScene(voiceKey, 'day'),
    night: getRoomScene(voiceKey, 'night'),
  };
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
