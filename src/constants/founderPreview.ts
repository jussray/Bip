export type PreviewFeatureStatus = 'live' | 'needs_setup' | 'ui_preview' | 'not_built';

/**
 * Founder Preview defaults ON only inside development clients such as Expo Go.
 * Production builds stay closed unless an explicit build environment enables it.
 *
 * Set EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW=false to test normal locked behavior
 * inside development. Set it to true only for a controlled founder build.
 */
export function isFounderPreviewEnabled(): boolean {
  const explicit = process.env.EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function founderPreviewAudience(): 'founder' | 'public' {
  return isFounderPreviewEnabled() ? 'founder' : 'public';
}

/**
 * Preview points are display-only. They unlock local UI gates without writing
 * a fake wallet balance, point transaction, reward purchase, or Supabase row.
 */
export const FOUNDER_PREVIEW_POINTS = 999;

export const FOUNDER_PREVIEW_FEATURES = [
  {
    key: 'companions',
    title: 'All Se’kret companions',
    status: 'live' as PreviewFeatureStatus,
    detail: 'Raylene, Rylane, Cloud, and Night open without waiting for point thresholds.',
    route: '/(teen)/discover',
  },
  {
    key: 'retention',
    title: 'Room return loop',
    status: 'live' as PreviewFeatureStatus,
    detail: 'Bip Story receipts, active-day History, and the intentional Bip Energy fade.',
    route: '/(teen)/room',
  },
  {
    key: 'circle',
    title: 'Circle privacy flow',
    status: 'live' as PreviewFeatureStatus,
    detail: 'Support reactions work while totals remain visible only to the post owner.',
    route: '/(teen)/circle',
  },
  {
    key: 'crew',
    title: 'Bip Crew accountability',
    status: 'needs_setup' as PreviewFeatureStatus,
    detail: 'The screen and database flow are open. Real use still requires accepted Bip-ID connections.',
    route: '/(teen)/crew',
  },
  {
    key: 'bridge',
    title: 'Teen Bridge',
    status: 'needs_setup' as PreviewFeatureStatus,
    detail: 'Signals and requested response types are live. Sharing requires a linked parent account.',
    route: '/(teen)/bridge',
  },
  {
    key: 'parent_bridge',
    title: 'Parent Bridge',
    status: 'needs_setup' as PreviewFeatureStatus,
    detail: 'The parent inbox and response-request card are open. AI summary generation remains server-rollout controlled.',
    route: '/(parent)/bridge',
  },
  {
    key: 'memory',
    title: 'Memory & Continuity',
    status: 'ui_preview' as PreviewFeatureStatus,
    detail: 'Current memory controls and boundaries are visible. The full approved long-term memory engine is not released.',
    route: '/(teen)/continuity',
  },
  {
    key: 'scrapbook',
    title: 'Emotional Scrapbook',
    status: 'not_built' as PreviewFeatureStatus,
    detail: 'The data contract exists, but there is no complete product screen to honestly unlock yet.',
    route: null,
  },
] as const;
