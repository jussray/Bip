/**
 * types/identity.ts
 *
 * Core identity models for Se'kret Bip.
 *
 * PRIVACY RULES (enforced here at the type layer):
 * - AccountIdentity is the auth-layer record. It is NEVER exposed in social surfaces.
 * - CircleIdentity is the per-circle presentation. Real name must never fall back
 *   to AccountIdentity.displayName in public or friends circles.
 * - ProfileMemory.visibility controls parent access at the data layer.
 *   'journal' | 'voice' | 'ai_chat' types are permanently private — not screen-gated.
 *
 * Do not add parent-readable fields directly to AccountIdentity or CircleIdentity.
 * Parent visibility is mediated exclusively through DoorbellEvent (types/doorbell.ts).
 */

import type { VerificationState, ParentLinkState } from './verification';

// ─── Enums / literal unions ────────────────────────────────────────────────

export type AccountRole = 'teen' | 'parent' | 'helper';

/** Age band used for feature gating — never used as a social label. */
export type AgeBand = 'under13' | '13-15' | '16-17' | '18plus';

export type CircleType = 'public' | 'friends' | 'crew' | 'parent';

export type VisibilityRule =
  | 'anonymous'      // Public circle — no identity exposed
  | 'nickname_only'  // Friends circle — chosen name/avatar only
  | 'circle_visible' // Crew circle — real-ish identity visible to crew members only
  | 'parent_visible'; // Parent circle — visible within parent connection only

export type MoodStatus =
  | 'good'
  | 'okay'
  | 'tired'
  | 'anxious'
  | 'sad'
  | 'excited'
  | 'none';

export type CompanionPreference =
  | 'sekret' // default AI companion
  | 'oracle'
  | 'none';

export type ThemePreference =
  | 'night_default'
  | 'cosmic'
  | 'paper_tape'
  | 'forest'
  | 'ocean';

/**
 * Memory types that are PERMANENTLY private (never parent-visible).
 * This is enforced in services/doorbellEvents.ts canParentViewEvent().
 */
export const PRIVATE_MEMORY_TYPES = [
  'journal',
  'voice',
  'ai_chat',
] as const;

export type PrivateMemoryType = (typeof PRIVATE_MEMORY_TYPES)[number];

export type MemoryType =
  | PrivateMemoryType
  | 'image'
  | 'milestone'
  | 'prompt'
  | 'mood';

export type MemoryVisibility =
  | 'private'       // Visible only to the teen — NEVER to parents
  | 'profile'       // Visible in teen profile highlights
  | 'parent_shared'; // Explicitly shared by teen via Parent Circle only

export type SourceSurface =
  | 'journal'
  | 'voice_bip'
  | 'sekret_companion'
  | 'pages'
  | 'circle_post'
  | 'check_in'
  | 'milestone';

export type SupportPreference =
  | 'encouragement'
  | 'advice'
  | 'just_listen'
  | 'check_ins';

export type CrewRole = 'member' | 'lead' | 'invited';

// ─── Core models ──────────────────────────────────────────────────────────

/**
 * AccountIdentity
 * The root auth-layer identity. Stored server-side, never surfaced directly in
 * social UI. Screen components must read from CircleIdentity for any social display.
 */
export interface AccountIdentity {
  userId: string;
  role: AccountRole;
  ageBand: AgeBand;
  verificationState: VerificationState;
  parentLinkState: ParentLinkState;
  companionPreference: CompanionPreference;
  themePreference: ThemePreference;
  /** ISO 8601 timestamp of account creation */
  createdAt: string;
  /** ISO 8601 timestamp of last verification check */
  lastVerifiedAt?: string;
}

/**
 * CircleIdentity
 * The per-circle presentation layer. One per (accountId × circle) pair.
 *
 * SAFETY: displayName must never fall back to AccountIdentity's real name
 * in 'public' or 'friends' circles. Use a safe default like 'Anonymous Bip' instead.
 */
export interface CircleIdentity {
  id: string;
  accountId: string;
  circle: CircleType;
  /** Chosen display name for this circle. Must not reveal real name in public/friends. */
  displayName: string;
  avatar: AvatarConfig;
  moodStatus?: MoodStatus;
  visibility: VisibilityRule;
  discoverable: boolean;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * AvatarConfig
 * Composable avatar definition used in CircleIdentity and profile screens.
 */
export interface AvatarConfig {
  baseId: string;
  skinTone?: string;
  hairStyleId?: string;
  accessoryIds?: string[];
  stickerIds?: string[];
  /** Optional background color in hex */
  bgColor?: string;
}

/**
 * CrewIdentity
 * Extension for the trusted-crew context (circle === 'crew').
 * Linked to a CircleIdentity via circleIdentityId.
 */
export interface CrewIdentity {
  id: string;
  circleIdentityId: string;
  accountId: string;
  supportPreferences: SupportPreference[];
  crewRole: CrewRole;
  /** References to shared goals — IDs only, no content stored here */
  sharedGoalIds: string[];
}

/**
 * ProfileMemory
 * A single memory item in a teen's private scrapbook/memory space.
 *
 * PRIVACY: Types in PRIVATE_MEMORY_TYPES are permanently visibility: 'private'.
 * The service layer (services/doorbellEvents.ts) enforces this.
 * Screen components must NOT override visibility for private types.
 */
export interface ProfileMemory {
  memoryId: string;
  accountId: string;
  type: MemoryType;
  /** ISO 8601 */
  timestamp: string;
  sourceSurface: SourceSurface;
  visibility: MemoryVisibility;
  /** Short non-sensitive label for UI display (no private content) */
  label?: string;
}

/**
 * ParentVisibilityEvent
 * A parent-safe representation of a teen activity signal.
 * NEVER contains raw text from journals, voice transcripts, AI chats, or private memories.
 * See types/doorbell.ts for the full Doorbell event model.
 */
export interface ParentVisibilityEvent {
  eventId: string;
  teenAccountId: string;
  /** ISO 8601 */
  timestamp: string;
  /** Human-readable summary only — no private content */
  summary: string;
  severity: 'info' | 'watch' | 'urgent';
  /** Optional guidance for parents on how to respond */
  recommendedAction?: string;
}
