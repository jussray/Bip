// constants/theme.ts
// Public theme entrypoint. The preserved implementation remains in theme.base.ts;
// canonical app-entry assets override only legacy/fallback aliases here.
import { AVATARS as BASE_AVATARS, IMAGES as BASE_IMAGES } from './theme.base';

export * from './theme.base';

const sekretSplashTeen = require('../assets/images/splash-teen.jpeg');
const sekretSplashParent = require('../assets/images/splash-parent.png');
const suhanaRoomMaster = require('../assets/images/companions/raylene/raylene-master.png');

export const IMAGES = {
  ...BASE_IMAGES,
  sekretSplash: sekretSplashTeen,
  sekretSplashTeen,
  sekretSplashParent,
} as const;

// Preserve legacy ids and the base image map while allowing Room-facing
// consumers of AVATARS.raylene.fullbody to use the canonical Suhana master.
// This is the same master owned by companionRuntimeRegistry.
export const AVATARS: typeof BASE_AVATARS = {
  ...BASE_AVATARS,
  raylene: {
    ...BASE_AVATARS.raylene,
    fullbody: suhanaRoomMaster,
  },
};
