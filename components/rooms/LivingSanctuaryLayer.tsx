import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IMAGES } from '@/constants/theme';
import {
  resolveCompanionId,
  type CompanionId,
  type CompanionRuntimeKey,
} from '@/config/companionRuntimeRegistry';

interface LivingSanctuaryLayerProps {
  companionKey: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HUMAN_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 330);
const HUMAN_HEIGHT = Math.min(SCREEN_HEIGHT * 0.62, 520);

type StageProfile = Pick<ImageStyle, 'left' | 'right' | 'bottom' | 'width' | 'height'>;

const STAGE_PROFILES: Record<CompanionId, StageProfile> = {
  suhana: {
    left: -24,
    bottom: 72,
    width: HUMAN_WIDTH,
    height: HUMAN_HEIGHT,
  },
  sy: {
    right: -20,
    bottom: 72,
    width: HUMAN_WIDTH,
    height: HUMAN_HEIGHT,
  },
  night: {
    left: -18,
    bottom: 70,
    width: HUMAN_WIDTH,
    height: HUMAN_HEIGHT,
  },
  cloud: {
    left: Math.max(18, SCREEN_WIDTH * 0.1),
    bottom: 206,
    width: Math.min(SCREEN_WIDTH * 0.7, 280),
    height: Math.min(SCREEN_WIDTH * 0.56, 224),
  },
  mom: {
    left: -24,
    bottom: 72,
    width: HUMAN_WIDTH,
    height: HUMAN_HEIGHT,
  },
  dad: {
    right: -20,
    bottom: 72,
    width: HUMAN_WIDTH,
    height: HUMAN_HEIGHT,
  },
};

function resolveRuntimeKey(value: string): CompanionRuntimeKey {
  if (
    value === 'raylene' ||
    value === 'rylane' ||
    value === 'cloud' ||
    value === 'night' ||
    value === 'suhana' ||
    value === 'sy' ||
    value === 'mom' ||
    value === 'dad'
  ) {
    return value;
  }

  return 'raylene';
}

function fullBodySource(id: CompanionId): ImageSourcePropType | null {
  if (id === 'suhana') return IMAGES.rayleneFullbody;
  if (id === 'sy') return IMAGES.rylaneFullbody;
  if (id === 'night') return IMAGES.nightFullbody;
  if (id === 'cloud') return IMAGES.cloudAvatarFullbody;
  return null;
}

export function LivingSanctuaryLayer({ companionKey }: LivingSanctuaryLayerProps) {
  const companionId = useMemo(
    () => resolveCompanionId(resolveRuntimeKey(companionKey)),
    [companionKey],
  );
  const source = fullBodySource(companionId);
  const stage = STAGE_PROFILES[companionId];

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="living-sanctuary-layer"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        testID="living-sanctuary-depth"
        colors={[
          'rgba(8,3,22,0.01)',
          'rgba(8,3,22,0.03)',
          'rgba(8,3,22,0.34)',
        ]}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      {source && (
        <Image
          testID="living-sanctuary-companion-visual"
          source={source}
          resizeMode="contain"
          style={[s.companionVisual, stage]}
          accessibilityIgnoresInvertColors
          accessible={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  companionVisual: {
    position: 'absolute',
    zIndex: 1,
    opacity: 0.98,
  },
});
