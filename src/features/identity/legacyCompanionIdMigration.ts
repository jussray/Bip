import { isNamedCompanionId, type NamedCompanionId } from './companionIds';

const LEGACY_COMPANION_IDS: Readonly<Record<string, NamedCompanionId>> = {
  raylene: 'suhana',
  rylane: 'sy',
};

/**
 * Read-boundary migration for persisted companion IDs created before the
 * canonical Suhana/Sy cutover. New writes must never use these legacy keys.
 */
export function migratePersistedCompanionId(value: unknown): NamedCompanionId | null {
  if (isNamedCompanionId(value)) return value;
  if (typeof value !== 'string') return null;

  return LEGACY_COMPANION_IDS[value.trim().toLowerCase()] ?? null;
}
