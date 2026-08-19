// constants/theme.ts
// Public theme entrypoint. The preserved implementation remains in theme.base.ts;
// canonical app-entry assets override only legacy/fallback aliases here.
import { AVATARS as BASE_AVATARS, IMAGES as BASE_IMAGES } from './theme.base';

export * from './theme.base';

const sekretSplashTeen = require('../assets/images/splash-teen.jpeg');
const sekretSplashParent = require('../assets/images/splash-parent.png');
const suhanaRoomFullbody = require('../assets/images/raylene-fullbody.png');

export const IMAGES = {
  ...BASE_IMAGES,
  sekretSplash: sekretSplashTeen,
  sekretSplashTeen,
  sekretSplashParent,
} as const;

// Room renderers consume AVATARS, while legacy non-Room surfaces such as
// Bippin2 continue to consume the preserved IMAGES.rayleneFullbody alias.
export const AVATARS = {
  ...BASE_AVATARS,
  raylene: {
    ...BASE_AVATARS.raylene,
    fullbody: suhanaRoomFullbody,
  },
} as const;
