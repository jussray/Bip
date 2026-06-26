import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

type AppVariant = 'teen' | 'parent';

const TEEN_EAS_PROJECT_ID = '3f2f2425-7119-43dd-bd7d-5bc752dabead';
const PARENT_EAS_PROJECT_ID = process.env.EXPO_PUBLIC_PARENT_EAS_PROJECT_ID;

type ExpoExtra = NonNullable<ExpoConfig['extra']>;

function getAppVariant(): AppVariant {
  const value = process.env.APP_VARIANT ?? process.env.EXPO_PUBLIC_APP_VARIANT;
  return value === 'parent' ? 'parent' : 'teen';
}

function getBaseExtra(base: ExpoConfig): ExpoExtra {
  return base.extra && typeof base.extra === 'object' ? base.extra : {};
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getAppVariant();
  const isParent = variant === 'parent';
  const base = appJson.expo as ExpoConfig;
  const baseExtra = getBaseExtra(base);

  const easProjectId = isParent
    ? PARENT_EAS_PROJECT_ID ?? TEEN_EAS_PROJECT_ID
    : TEEN_EAS_PROJECT_ID;

  return {
    ...config,
    ...base,
    name: isParent ? "Se'kret Bip Parent" : "Se'kret Bip",
    slug: isParent ? 'sekret-bip-parent' : 'sekret-bip',
    scheme: isParent ? 'sekretbipparent' : 'sekretbip',
    icon: isParent
      ? './assets/images/parent-icon.png'
      : './assets/images/icon.png',
    splash: {
      ...base.splash,
      image: isParent
        ? './assets/images/parent-space-splash.png'
        : './assets/images/A2EB8B5A-0109-4A02-927A-FA7080B5F501.png',
      resizeMode: 'contain',
      backgroundColor: '#160028',
    },
    ios: {
      ...base.ios,
      bundleIdentifier: isParent ? 'com.sekretbip.parent' : 'com.sekretbip.app',
    },
    android: {
      ...base.android,
      package: isParent ? 'com.sekretbip.parent' : 'com.sekretbip.app',
      adaptiveIcon: {
        foregroundImage: isParent
          ? './assets/images/parent-icon.png'
          : './assets/images/icon.png',
        backgroundColor: '#160028',
      },
    },
    extra: {
      ...baseExtra,
      appVariant: variant,
      eas: {
        projectId: easProjectId,
      },
    },
  };
};
