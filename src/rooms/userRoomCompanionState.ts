import type { Character } from '../../constants/theme';

const CHARACTERS: readonly Character[] = ['raylene', 'rylane', 'cloud', 'night'];

export function isCharacter(value: unknown): value is Character {
  return typeof value === 'string' && CHARACTERS.includes(value as Character);
}

export function normalizeCompanionKey(value: unknown, fallback: Character = 'raylene'): Character {
  return isCharacter(value) ? value : fallback;
}

/**
 * The user-owned persisted Room choice is authoritative once it exists.
 * Session/app selection is only a bootstrap fallback for a Room that has not
 * persisted a companion yet.
 */
export function resolveUserRoomCompanion(input: {
  persistedCompanion?: unknown;
  appSelectedCompanion?: unknown;
  fallback?: Character;
}): Character {
  const fallback = input.fallback ?? 'raylene';

  if (isCharacter(input.persistedCompanion)) {
    return input.persistedCompanion;
  }

  return normalizeCompanionKey(input.appSelectedCompanion, fallback);
}

export function shouldSyncAppCompanion(
  appSelectedCompanion: unknown,
  roomCompanion: Character,
): boolean {
  return normalizeCompanionKey(appSelectedCompanion) !== roomCompanion;
}
