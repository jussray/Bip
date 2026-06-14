// ─────────────────────────────────────────────────────────────────────────────
// Oracle Memory Service — Phase 1A
// Handles loading, saving, merging, and building briefs from
// HumanUnderstandingProfile. Works with AsyncStorage (local) and
// Supabase (cloud sync). No transcripts stored — only understanding.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import type {
  HumanUnderstandingProfile,
  HumanUnderstanding,
  HumanUnderstandingDimension,
  SelfTrustEvidence,
  SelfTrustEvidenceType,
  SekretName,
  SekretUnderstandingBrief,
  ProfileOwner,
} from '../types/oracleMemory';

const STORAGE_KEY = (owner: ProfileOwner) => `oracle_profile_${owner}_v2`;
const SCHEMA_VERSION = 2 as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function emptyProfile(owner: ProfileOwner, userId: string): HumanUnderstandingProfile {
  return {
    id: uuid(),
    owner,
    userId,
    understandings: [],
    selfTrustEvidence: [],
    conversationCount: 0,
    lastActiveAt: now(),
    createdAt: now(),
    schemaVersion: SCHEMA_VERSION,
  };
}

// ── Load / Save ───────────────────────────────────────────────────────────────

/**
 * Load the Oracle profile for a given owner from AsyncStorage.
 * Returns null if no profile exists yet.
 */
export async function loadOracleProfile(
  owner: ProfileOwner,
): Promise<HumanUnderstandingProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY(owner));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HumanUnderstandingProfile;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null; // stale schema
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save the Oracle profile to AsyncStorage.
 */
export async function saveOracleProfile(
  profile: HumanUnderstandingProfile,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY(profile.owner), JSON.stringify(profile));
  } catch {
    // Silent — local save failing should not crash the app
  }
}

/**
 * Ensure a profile exists for this user. Creates and saves one if absent.
 */
export async function ensureOracleProfile(
  owner: ProfileOwner,
  userId: string,
): Promise<HumanUnderstandingProfile> {
  const existing = await loadOracleProfile(owner);
  if (existing) return existing;
  const fresh = emptyProfile(owner, userId);
  await saveOracleProfile(fresh);
  return fresh;
}

// ── Merge understandings ──────────────────────────────────────────────────────

/**
 * Merge new understandings into an existing profile.
 * - If a dimension already exists, the newest theory wins.
 * - New dimensions are appended.
 * - Max 10 understandings kept (oldest by updatedAt pruned first).
 */
export function mergeOracleInsights(
  profile: HumanUnderstandingProfile,
  incoming: HumanUnderstanding[],
): HumanUnderstandingProfile {
  const map = new Map<HumanUnderstandingDimension, HumanUnderstanding>();

  for (const u of profile.understandings) {
    map.set(u.dimension, u);
  }
  for (const u of incoming) {
    const existing = map.get(u.dimension);
    if (!existing || u.updatedAt > existing.updatedAt) {
      map.set(u.dimension, u);
    }
  }

  const merged = Array.from(map.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10);

  return {
    ...profile,
    understandings: merged,
    lastActiveAt: now(),
  };
}

/**
 * Record a new self-trust evidence item.
 * Keeps only the 30 most recent items to bound storage.
 */
export function recordSelfTrustEvidence(
  profile: HumanUnderstandingProfile,
  type: SelfTrustEvidenceType,
  sekretWitness: SekretName,
  note: string,
): HumanUnderstandingProfile {
  const item: SelfTrustEvidence = {
    id: uuid(),
    type,
    observedAt: now(),
    sekretWitness,
    note,
  };

  const evidence = [item, ...profile.selfTrustEvidence].slice(0, 30);

  return {
    ...profile,
    selfTrustEvidence: evidence,
    lastActiveAt: now(),
  };
}

/**
 * Increment the conversation count after a session ends.
 */
export function incrementConversationCount(
  profile: HumanUnderstandingProfile,
): HumanUnderstandingProfile {
  return {
    ...profile,
    conversationCount: profile.conversationCount + 1,
    lastActiveAt: now(),
  };
}

// ── Per-Se'kret dimensions ────────────────────────────────────────────────────

const SEKRET_DIMENSIONS: Record<SekretName, HumanUnderstandingDimension[]> = {
  raylene: [
    'strength-signature',
    'identity-anchor',
    'emotional-pattern',
    'growth-observation',
  ],
  rylane: [
    'motivation-source',
    'avoidance-pattern',
    'resilience-indicator',
    'growth-observation',
  ],
  cloud: [
    'emotional-pattern',
    'communication-style',
    'fear-landscape',
    'identity-anchor',
  ],
  night: [
    'resilience-indicator',
    'support-system',
    'emotional-pattern',
    'fear-landscape',
  ],
  oracle: [
    'emotional-pattern',
    'strength-signature',
    'avoidance-pattern',
    'growth-observation',
    'resilience-indicator',
    'identity-anchor',
    'motivation-source',
    'communication-style',
    'fear-landscape',
    'support-system',
  ],
};

// ── buildSekretBrief ──────────────────────────────────────────────────────────

/**
 * Build a per-character brief from a HumanUnderstandingProfile.
 * Each Se'kret only receives the dimensions relevant to their mission.
 * hasHistory is false until enough signal exists to feel natural.
 */
export function buildSekretBrief(
  profile: HumanUnderstandingProfile,
  sekret: SekretName,
): SekretUnderstandingBrief {
  const relevantDimensions = SEKRET_DIMENSIONS[sekret];

  const relevant = profile.understandings
    .filter((u) => relevantDimensions.includes(u.dimension))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const recentEvidence = profile.selfTrustEvidence
    .slice()
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
    .slice(0, 3);

  const hasHistory =
    profile.conversationCount >= 3 || profile.selfTrustEvidence.length >= 1;

  const contextLines: string[] = hasHistory
    ? relevant.slice(0, 6).map((u) => u.theory)
    : [];

  return {
    sekret,
    hasHistory,
    contextLines,
    selfTrustEvidenceCount: profile.selfTrustEvidence.length,
    recentEvidence,
    dominantDimensions: relevant.map((u) => u.dimension),
  };
}

// ── Supabase sync ─────────────────────────────────────────────────────────────

/**
 * Sync local profile to Supabase.
 * Uses upsert on the profile id.
 * Fails silently — local is source of truth, cloud is backup.
 */
export async function syncOracleProfileToCloud(
  profile: HumanUnderstandingProfile,
): Promise<void> {
  try {
    await supabase.from('oracle_profiles').upsert({
      id: profile.id,
      user_id: profile.userId,
      owner: profile.owner,
      understandings: profile.understandings,
      self_trust_evidence: profile.selfTrustEvidence,
      conversation_count: profile.conversationCount,
      last_active_at: profile.lastActiveAt,
      schema_version: profile.schemaVersion,
    });
  } catch {
    // Silent — sync failure should never interrupt the app
  }
}

/**
 * Pull latest profile from Supabase and merge with local.
 * Local wins on conflict (more recent lastActiveAt).
 */
export async function pullOracleProfileFromCloud(
  owner: ProfileOwner,
  userId: string,
): Promise<HumanUnderstandingProfile | null> {
  try {
    const { data, error } = await supabase
      .from('oracle_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('owner', owner)
      .single();

    if (error || !data) return null;

    const cloud: HumanUnderstandingProfile = {
      id: data.id,
      owner: data.owner,
      userId: data.user_id,
      understandings: data.understandings ?? [],
      selfTrustEvidence: data.self_trust_evidence ?? [],
      conversationCount: data.conversation_count ?? 0,
      lastActiveAt: data.last_active_at,
      createdAt: data.created_at,
      schemaVersion: SCHEMA_VERSION,
    };

    return cloud;
  } catch {
    return null;
  }
}

// ── buildOracleMemoryContext ──────────────────────────────────────────────────
/**
 * Produce a flat string[] of context lines for a given Se'kret from a
 * HumanUnderstandingProfile. This is the Phase 1B -> Phase 3 bridge:
 * it slots into the existing buildSekretAdaptationInstruction() path
 * in utils/api.ts without changing the worker.
 *
 * Returns [] when:
 *  - profile is null
 *  - not enough history yet (< 3 conversations AND no evidence)
 *  - brief has no context lines
 *
 * Safe to call on every message. Only produces lines when Oracle has
 * real evidence to offer.
 */
export function buildOracleMemoryContext(
  profile: HumanUnderstandingProfile | null,
  sekret: SekretUnderstandingBrief['sekret'],
): string[] {
  if (!profile) return [];
  const brief = buildSekretBrief(profile, sekret);
  if (!brief.hasHistory) return [];
  if (!brief.contextLines.length) return [];

  const lines: string[] = [...brief.contextLines];

  if (brief.selfTrustEvidenceCount >= 2) {
    lines.push(
      `Has shown real self-trust in ${brief.selfTrustEvidenceCount} observed moment${
        brief.selfTrustEvidenceCount === 1 ? '' : 's'
      }.`,
    );
  }

  return lines.slice(0, 8);
}
