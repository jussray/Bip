import type { ImageSourcePropType } from 'react-native';

export const TEEN_COMPANIONS = ['suhana', 'sy', 'night'] as const;
export type TeenCompanion = (typeof TEEN_COMPANIONS)[number];

export const TEEN_COMPANION_POSES = {
  suhana: ['neutral', 'happy', 'listening', 'thinking', 'writing', 'encouraging', 'sleepy'],
  sy: ['neutral', 'happy', 'listening', 'thinking', 'writing', 'encouraging', 'calm'],
  night: ['neutral', 'happy', 'headphones', 'thinking', 'listening', 'writing', 'comfort', 'window', 'rain'],
} as const;

export type TeenCompanionPoseMap = {
  [K in TeenCompanion]: (typeof TEEN_COMPANION_POSES)[K][number];
};

export type TeenCompanionPose<C extends TeenCompanion = TeenCompanion> =
  TeenCompanionPoseMap[C];

export type CompanionAssetStatus = 'missing' | 'review' | 'production';

export interface TeenCompanionAssetEntry<C extends TeenCompanion = TeenCompanion> {
  companion: C;
  pose: TeenCompanionPose<C>;
  status: CompanionAssetStatus;
  relativePath: string;
  source?: ImageSourcePropType;
}
