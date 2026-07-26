// src/utils/supabase.ts
// Se'kret Bip — Supabase client
//
// Env vars are sourced from utils/env.ts (single source of truth).
// If SUPABASE_URL or SUPABASE_ANON are blank, getSupabase() returns null
// and every caller falls back gracefully to local AsyncStorage.
//
// IMPORTANT: only EXPO_PUBLIC_* vars are used here.
// NEVER reference service_role keys in client code.

import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON, isSupabaseReady } from './env';

export const isSupabaseConfigured = isSupabaseReady;

let _client: SupabaseClient | null = null;
let _autoRefreshListenerInstalled = false;

function installNativeAutoRefresh(client: SupabaseClient) {
  if (Platform.OS === 'web' || _autoRefreshListenerInstalled) return;
  _autoRefreshListenerInstalled = true;

  AppState.addEventListener('change', (state) => {
    if (state === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage:            AsyncStorage,
      autoRefreshToken:   true,
      persistSession:     true,
      // Web confirmation/recovery links return with auth parameters in the URL.
      // Supabase must consume those parameters so a brand-new external user gets
      // a durable session instead of landing back on the public screen unsigned.
      detectSessionInUrl: Platform.OS === 'web',
      lock:               processLock,
    },
  });
  installNativeAutoRefresh(_client);
  return _client;
}

export const TABLES = {
  // ── Account identity + verification ────────────────────────────────────────
  appProfiles:         'app_profiles',
  accountVerification: 'account_verification',
  // ── Private per-user tables (0001_init.sql) ─────────────────────────────
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
  circlePosts:        'circle_posts',
  parentCirclePosts:  'parent_circle_posts',
  dailyIntentions:    'daily_intentions',
  // ── Shared Circle V1 tables (0002_circle_v1.sql) ────────────────────────
  publicCirclePosts:   'public_circle_posts',
  friendsCirclePosts:  'friends_circle_posts',
  crewCirclePosts:     'crew_circle_posts',
  circleReactions:     'circle_reactions',
  circleProfiles:      'circle_profiles',
  circleFriendships:   'circle_friendships',
  crewMemberships:     'crew_memberships',
  // ── Supplemental tables (0003_supplemental_tables.sql) ──────────────────
  circles:             'circles',
  posts:               'posts',
  circleMembers:       'circle_members',
  parentLinks:         'parent_links',
  postReactions:       'post_reactions',
  postComments:        'post_comments',
  moods:               'moods',
  parentMoodSummaries: 'parent_mood_summaries',
  safetyAlerts:        'safety_alerts',
  crews:               'crews',
  friendships:         'friendships',
  // ── Oracle tables (0003_oracle_parentlinks_period_safety.sql) ───────────
  oracleSessions:      'oracle_sessions',
  // ── Bridge tables (20260618 + 20260621 migrations) ───────────────────────
  bridgeSignals:       'bridge_signals',
  parentNotes:         'parent_notes',
  // ── Teen activity summary (20260626) ─────────────────────────────────────────
  teenActivitySummary: 'teen_activity_summary',
  // ── Activity event ledger (20260627) ─────────────────────────────────────────
  bipEvents:           'bip_events',
  // ── Point transaction ledger (20260627) ──────────────────────────────────────
  pointTransactions:   'point_transactions',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

// Legacy nullable singleton export for older screens. Prefer getSupabase() in new code.
export const supabase = getSupabase();
