// constants/theme.ts
// Public theme entrypoint. The preserved implementation remains in theme.base.ts;
// canonical app-entry and corrected production assets override only legacy/fallback aliases here.
import { AVATARS as BASE_AVATARS, IMAGES as BASE_IMAGES } from './theme.base';

export * from './theme.base';

const sekretSplashTeen = require('../assets/images/splash-teen.jpeg');
const sekretSplashParent = require('../assets/images/splash-parent.png');
const rayleneFullbody = require('../assets/images/raylene-fullbody.png');

export const IMAGES = {
  ...BASE_IMAGES,
  rayleneFullbody,
  sekretSplash: sekretSplashTeen,
  sekretSplashTeen,
  sekretSplashParent,
} as const;

// Preserve legacy internal ids while correcting the public visual mapping.
// `raylene` remains the internal id; user-facing canon is Suhana.
export const AVATARS = {
  raylene: {
    ...BASE_AVATARS.raylene,
    fullbody: rayleneFullbody,
  },
  rylane: BASE_AVATARS.rylane,
  cloud: BASE_AVATARS.cloud,
  night: BASE_AVATARS.night,
} as const;
