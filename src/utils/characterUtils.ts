/**
 * characterUtils
 * Helpers for resolving the active Se'kret character from a theme/sekret key.
 *
 * Previously inlined in app/index.tsx as getActiveCharacter().
 * AppContent.tsx imports this directly:
 *   import { getActiveCharacter } from './utils/characterUtils';
 */

export type ActiveCharacter = 'raylene' | 'rylane' | 'cloud' | 'night' | null;

/**
 * Maps any stored sekret/theme key to a typed character identity.
 * 'soft' is the legacy AsyncStorage key for Raylene — kept for backwards compat.
 */
export function getActiveCharacter(themeKey: string): ActiveCharacter {
  if (themeKey === 'raylene' || themeKey === 'soft') return 'raylene';
  if (themeKey === 'rylane') return 'rylane';
  if (themeKey === 'cloud') return 'cloud';
  if (themeKey === 'night') return 'night';
  return null;
}

/**
 * Returns true if the given key resolves to a known character.
 * Useful for guarding character-specific UI branches.
 */
export function isKnownCharacter(key: string): key is ActiveCharacter {
  return getActiveCharacter(key) !== null;
}
