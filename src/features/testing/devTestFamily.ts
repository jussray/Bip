import AsyncStorage from '@react-native-async-storage/async-storage';

const TEST_FAMILY_KEY = 'dev_test_family_v1';

export interface DevTestFamily {
  enabled: true;
  teenId: string;
  parentId: string;
  createdAt: string;
}

export function isDevTestFamilyEnabled(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_ENABLE_FOUNDER_TOOLS === 'true';
}

export async function createDevTestFamily(): Promise<DevTestFamily> {
  if (!isDevTestFamilyEnabled()) throw new Error('Developer test tools are disabled.');

  const family: DevTestFamily = {
    enabled: true,
    teenId: 'dev-test-teen',
    parentId: 'dev-test-parent',
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.multiSet([
    [TEST_FAMILY_KEY, JSON.stringify(family)],
    ['linked_teen_id', family.teenId],
    ['parent_profile_done', 'true'],
  ]);

  return family;
}

export async function getDevTestFamily(): Promise<DevTestFamily | null> {
  if (!isDevTestFamilyEnabled()) return null;
  try {
    const raw = await AsyncStorage.getItem(TEST_FAMILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DevTestFamily>;
    return parsed.enabled === true && typeof parsed.teenId === 'string'
      ? parsed as DevTestFamily
      : null;
  } catch {
    return null;
  }
}

export async function clearDevTestFamily(): Promise<void> {
  await AsyncStorage.multiRemove([TEST_FAMILY_KEY, 'linked_teen_id', 'parent_profile_done']);
}
