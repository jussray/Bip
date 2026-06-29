import {
  TEEN_COMPANION_POSES,
  type CompanionAssetStatus,
  type TeenCompanion,
  type TeenCompanionAssetEntry,
  type TeenCompanionPose,
} from '@/types/companions';

const assetPath = <C extends TeenCompanion>(
  companion: C,
  pose: TeenCompanionPose<C>,
): string => `assets/images/companions/teen/${companion}/${pose}.png`;

const buildEntries = <C extends TeenCompanion>(
  companion: C,
  status: CompanionAssetStatus = 'missing',
): TeenCompanionAssetEntry<C>[] =>
  TEEN_COMPANION_POSES[companion].map((pose) => ({
    companion,
    pose,
    status,
    relativePath: assetPath(companion, pose),
  }));

export const TEEN_COMPANION_MANIFEST = {
  raylene: buildEntries('raylene'),
  rylane: buildEntries('rylane'),
  night: buildEntries('night'),
} as const;

export const getTeenCompanionAssetStatus = <C extends TeenCompanion>(
  companion: C,
  pose: TeenCompanionPose<C>,
): CompanionAssetStatus => {
  const entry = TEEN_COMPANION_MANIFEST[companion].find(
    (item) => item.pose === pose,
  );

  return entry?.status ?? 'missing';
};
