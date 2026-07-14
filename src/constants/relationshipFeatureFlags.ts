import { isFounderPreviewEnabled } from '@/constants/founderPreview';
import type { RelationshipFeature, RelationshipFeatureState } from '@/types/relationshipLayer';

export type RelationshipFeatureFlagMap = Record<RelationshipFeature, RelationshipFeatureState>;

export const RELATIONSHIP_FEATURE_FLAGS: Readonly<RelationshipFeatureFlagMap> = Object.freeze({
  // Public behavior remains fail-closed. Founder Preview may open only the
  // implemented features below inside Expo Go/development.
  bridgeSummaries: 'internal',
  crewAccountability: 'disabled',
  emotionalScrapbook: 'disabled',
  companionMemory: 'disabled',
});

const FOUNDER_PREVIEWABLE_FEATURES = new Set<RelationshipFeature>([
  'bridgeSummaries',
  'crewAccountability',
]);

export function isRelationshipFeatureAvailable(
  feature: RelationshipFeature,
  audience: 'founder' | 'internal' | 'beta' | 'public' = 'public',
  flags: Readonly<RelationshipFeatureFlagMap> = RELATIONSHIP_FEATURE_FLAGS,
): boolean {
  // Development-only override. This does not claim unimplemented scrapbook or
  // full companion-memory features are ready, and it does not alter release
  // build behavior unless the founder preview environment is explicitly set.
  if (isFounderPreviewEnabled() && FOUNDER_PREVIEWABLE_FEATURES.has(feature)) {
    return true;
  }

  const state = flags[feature];
  if (state === 'enabled') return true;
  if (state === 'beta') return audience === 'founder' || audience === 'internal' || audience === 'beta';
  if (state === 'internal') return audience === 'founder' || audience === 'internal';
  return false;
}
