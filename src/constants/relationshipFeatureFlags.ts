import type { RelationshipFeature, RelationshipFeatureState } from '@/types/relationshipLayer';

export type RelationshipFeatureFlagMap = Record<RelationshipFeature, RelationshipFeatureState>;

export const RELATIONSHIP_FEATURE_FLAGS: Readonly<RelationshipFeatureFlagMap> = Object.freeze({
  bridgeSummaries: 'enabled',
  crewAccountability: 'disabled',
  emotionalScrapbook: 'disabled',
  companionMemory: 'disabled',
});

export function isRelationshipFeatureAvailable(
  feature: RelationshipFeature,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
  flags: Readonly<RelationshipFeatureFlagMap> = RELATIONSHIP_FEATURE_FLAGS,
): boolean {
  const state = flags[feature];

  if (state === 'enabled') return true;
  if (state === 'beta') return audience === 'founder' || audience === 'internal' || audience === 'beta';
  if (state === 'internal') return audience === 'founder' || audience === 'internal';
  return false;
}
