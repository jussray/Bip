export type ParentAccountStage = 'local' | 'account' | 'family-linked' | 'premium';

export interface ParentPermissionSet {
  bridgeMessages: boolean;
  sharedMilestones: boolean;
  teenPrivatePages: false;
  teenPrivateVoiceBips: false;
}

export interface ParentAccountArchitecture {
  stage: ParentAccountStage;
  parentOwnsSubscription: true;
  teenCanUseFreeModeWithoutAccount: true;
  permissions: ParentPermissionSet;
}

/**
 * Product boundary for future auth and billing work. Keeping this explicit
 * prevents subscription ownership from becoming coupled to teen-private data.
 */
export const DEFAULT_PARENT_ACCOUNT: ParentAccountArchitecture = {
  stage: 'local',
  parentOwnsSubscription: true,
  teenCanUseFreeModeWithoutAccount: true,
  permissions: {
    bridgeMessages: true,
    sharedMilestones: false,
    teenPrivatePages: false,
    teenPrivateVoiceBips: false,
  },
};
