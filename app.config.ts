import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

type LegacyExpoConfig = ExpoConfig & { splash?: Record<string, unknown> };

type AppVariant = 'teen' | 'parent';

const EXPO_OWNER = 'sekret-bip';
const TEEN_EAS_PROJECT_ID = '3f2f2425-7119-43dd-bd7d-5bc752dabead';
const PARENT_EAS_PROJECT_ID = '40fc6484-b1e6-4668-b9bc-c7515684f817';

type ExpoExtra = NonNullable<ExpoConfig['extra']>;
type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];

function getAppVariant(): AppVariant {
  const value = process.env.APP_VARIANT ?? process.env.EXPO_PUBLIC_APP_VARIANT;
  return value === 'parent' ? 'parent' : 'teen';
}

function getBaseExtra(base: ExpoConfig): ExpoExtra {
  return base.extra && typeof base.extra === 'object' ? base.extra : {};
}

function isSplashPlugin(plugin: ExpoPlugin): boolean {
  return plugin === 'expo-splash-screen' ||
    (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getAppVariant();
  const isParent = variant === 'parent';
  const base = appJson.expo as LegacyExpoConfig;
  const baseExtra = getBaseExtra(base);
  const splashImage = isParent
    ? './assets/images/parent-space-splash.png'
    : './assets/images/A2EB8B5A-0109-4A02-927A-FA7080B5F501.png';

  const easProjectId = isParent ? PARENT_EAS_PROJECT_ID : TEEN_EAS_PROJECT_ID;
  const plugins = (base.plugins ?? []).filter((plugin) => !isSplashPlugin(plugin));

  return ({
    ...config,
    ...base,
    owner: EXPO_OWNER,
    name: isParent ? "Se'kret Bip Parent" : "Se'kret Bip",
    slug: isParent ? 'sekret-bip-parents-' : 'sekret-bip',
    scheme: isParent ? 'sekretbipparent' : 'sekretbip',
    icon: isParent
      ? './assets/images/parent-icon.png'
      : './assets/images/icon.png',
    plugins: [
      ...plugins,
      [
        'expo-splash-screen',
        {
          image: splashImage,
          resizeMode: 'contain',
          backgroundColor: '#160028',
        },
      ],
    ],
    ios: {
      ...base.ios,
      bundleIdentifier: isParent ? 'com.sekretbip.parent' : 'com.sekretbip.app',
      infoPlist: {
        ...base.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
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
  }) as unknown as ExpoConfig;
};
