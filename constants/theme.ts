// constants/theme.ts
// Public theme entrypoint. The preserved implementation remains in theme.base.ts;
// canonical app-entry assets override only legacy/fallback aliases here.
import { AVATARS as BASE_AVATARS, IMAGES as BASE_IMAGES } from './theme.base';

export * from './theme.base';

const sekretSplashTeen = require('../assets/images/splash-teen.jpeg');
const sekretSplashParent = require('../assets/images/splash-parent.png');
const suhanaRoomPose = require('../assets/images/companions/teen/raylene/neutral.png');

export const IMAGES = {
  ...BASE_IMAGES,
  sekretSplash: sekretSplashTeen,
  sekretSplashTeen,
  sekretSplashParent,
} as const;

// Preserve legacy internal ids while letting Room-facing full-body consumers
// use the same production teen Suhana pose already proven on Pages.
export const AVATARS: typeof BASE_AVATARS = {
  ...BASE_AVATARS,
  raylene: {
    ...BASE_AVATARS.raylene,
    fullbody: suhanaRoomPose,
  },
};
