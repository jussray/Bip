import type { ImageSourcePropType } from 'react-native';
import type { TeenCompanion, TeenCompanionPose } from '@/types/companions';

/**
 * Production image registry for teen companions.
 *
 * Keep this registry empty until a real PNG exists at the matching path.
 * React Native requires image paths to be static and present at build time,
 * so missing assets must never be referenced with require().
 */
export const TEEN_COMPANION_IMAGES: {
  [C in TeenCompanion]: Partial<Record<TeenCompanionPose<C>, ImageSourcePropType>>;
} = {
  raylene: {},
  rylane: {},
  night: {},
};
