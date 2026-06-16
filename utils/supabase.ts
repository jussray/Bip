// utils/supabase.ts
// Se'kret Bip — Supabase client
//
// Env vars are sourced from utils/env.ts (single source of truth).
// If SUPABASE_URL or SUPABASE_ANON are blank, getSupabase() returns null
// and every caller falls back gracefully to local AsyncStorage.
//
// IMPORTANT: only EXPO_PUBLIC_* vars are used here.
// NEVER reference service_role keys in client code.

import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON, isSupabaseReady } from './env';

/** True when both Supabase env vars are present and non-empty. */
export const isSupabaseConfigured = isSupabaseReady;

let _client: SupabaseClient | null = null;

/**
 * Returns the configured Supabase client, or null if env vars are missing.
 * Screen code should treat null as "offline mode" — fall back to AsyncStorage
 * via utils/storage.ts and continue without errors.
 *
 * Usage:
 *   const sb = getSupabase();
 *   if (!sb) return; // offline mode — skip cloud sync
 *   await sb.from('journal_entries').insert(payload);
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (_client) return _client;

  _client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage:            AsyncStorage,
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: false, // RN / Expo — no URL session detection
    },
  });

  return _client;
}

// ── Table name constants ─────────────────────────────────────────────────────────
// Centralized so schema renames touch one file.
// These match supabase/migrations/sekret_bip_full_bootstrap.sql
export const TABLES = {
  // Core tables
  journalEntries:     'journal_entries',
  moodHistory:        'mood_history',
  voiceNotes:         'voice_notes',
  bridgeShares:       'bridge_shares',
  roomMemory:         'room_memory',
  periodDays:         'period_days',
  comfortSessions:    'comfort_sessions',
  crewMembers:        'crew_members',
  crewCheckIns:       'crew_check_ins',
  bipPoints:          'bip_points',

  // Legacy circle (pullAll drain path only — do not use for new writes)
  circlePosts:        'circle_posts',
  parentCirclePosts:  'parent_circle_posts',

  // Circle V1 — unified schema
  circles:              'circles',
  posts:                'posts',
  circleMembers:        'circle_members',
  crews:                'crews',
  friendships:          'friendships',
  parentLinks:          'parent_links',
  postReactions:        'post_reactions',
  postComments:         'post_comments',
  moods:                'moods',
  parentMoodSummaries:  'parent_mood_summaries',
  safetyAlerts:         'safety_alerts',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
