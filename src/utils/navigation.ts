/**
 * src/utils/navigation.ts
 *
 * Centralised navigation helper — single source of truth for all
 * legacy setScreen() → Expo Router path mappings.
 *
 * Usage:
 *   import { navigateTo } from '@/utils/navigation';
 *   navigateTo('circle');   // router.push('/(main)/circle')
 */
import { router } from 'expo-router';
import type { ScreenKey } from '@/types';

export const SCREEN_MAP: Record<ScreenKey | string, string> = {
  home:          '/(main)/home',
  pages:         '/(main)/pages',
  calm:          '/(main)/calm',
  circle:        '/(main)/circle',
  sekret:        '/(main)/sekret',
  voiceBip:      '/(main)/discover',
  bridge:        '/(main)/bridge',
  parentBridge:  '/(main)/bridge',
  cloudThoughts: '/(main)/discover',
  discover:      '/(main)/discover',
  settings:      '/(main)/settings',
  profile:       '/(main)/profile',
};

/**
 * Navigate to a screen by its legacy string key.
 * Falls back to home if the key is not in the map.
 */
export function navigateTo(screen: string): void {
  const path = SCREEN_MAP[screen] ?? '/(main)/home';
  // router.push accepts Href; the cast is intentional here because the
  // SCREEN_MAP values are all valid static routes but TypeScript cannot
  // narrow a runtime string to the Href union.
  router.push(path as Parameters<typeof router.push>[0]);
}
