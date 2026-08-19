import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NamedCompanionId } from '@/features/sekret/identityContract';

export const COMPANION_PRESENTATION_STORAGE_KEY = 'bip_companion_presentation_v1';

export type CompanionPresentationVariant = 'girl' | 'boy';
export type CompanionPresentationMode = CompanionPresentationVariant | 'mixed';
export type CompanionPresentationMap = Record<NamedCompanionId, CompanionPresentationVariant>;

export interface CompanionPresentationSelection {
  mode: CompanionPresentationMode;
  variants: CompanionPresentationMap;
}

export const CANONICAL_COMPANION_IDS: readonly NamedCompanionId[] = [
  'suhana',
  'sy',
  'night',
  'cloud',
];

export function uniformCompanionPresentation(
  variant: CompanionPresentationVariant,
): CompanionPresentationMap {
  return {
    suhana: variant,
    sy: variant,
    night: variant,
    cloud: variant,
  };
}

export function presentationModeForProfileGender(
  gender: 'girl' | 'boy' | 'other',
): CompanionPresentationMode {
  if (gender === 'girl' || gender === 'boy') return gender;
  return 'mixed';
}

export function presentationForMode(
  mode: CompanionPresentationMode,
  current: CompanionPresentationMap = uniformCompanionPresentation('girl'),
): CompanionPresentationMap {
  return mode === 'mixed' ? current : uniformCompanionPresentation(mode);
}

function isVariant(value: unknown): value is CompanionPresentationVariant {
  return value === 'girl' || value === 'boy';
}

function isMode(value: unknown): value is CompanionPresentationMode {
  return value === 'girl' || value === 'boy' || value === 'mixed';
}

export function parseCompanionPresentation(
  raw: string | null,
): CompanionPresentationSelection | null {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<CompanionPresentationSelection>;
    if (!isMode(value.mode) || !value.variants) return null;

    const variants = value.variants as Partial<CompanionPresentationMap>;
    if (!CANONICAL_COMPANION_IDS.every(id => isVariant(variants[id]))) return null;

    return {
      mode: value.mode,
      variants: variants as CompanionPresentationMap,
    };
  } catch {
    return null;
  }
}

export async function saveCompanionPresentation(
  selection: CompanionPresentationSelection,
): Promise<void> {
  await AsyncStorage.setItem(
    COMPANION_PRESENTATION_STORAGE_KEY,
    JSON.stringify(selection),
  );
}

export async function loadCompanionPresentation(): Promise<CompanionPresentationSelection | null> {
  return parseCompanionPresentation(
    await AsyncStorage.getItem(COMPANION_PRESENTATION_STORAGE_KEY),
  );
}
