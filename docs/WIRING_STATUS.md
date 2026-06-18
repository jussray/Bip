# Se'kret Bip — Backend Wiring Status

> Last updated: 2026-06-18  
> Tracks all 12 wiring items from the Phase 2/3 audit.

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Done — wired end-to-end |
| 🔜 | Code scaffolded, needs DB table applied OR screen-level hookup |
| ⬜ | Not started |

---

## 1. Anonymous Supabase Login on App Launch
**Status: ✅ DONE**

- `ensureAnonymousSession()` → `src/utils/sync.ts`
- Called from `useAppEffects.ts` effect #3 on `isLoading` change
- Session persisted via `AsyncStorage` through Supabase client config
- All cloud writes gate on `currentUserId()` returning non-null

---

## 2. Local Persistence Autosave (`saveState`)
**Status: ✅ DONE**

- `saveState()` called in `useAppEffects.ts` effect #4
- Watches all major state slices: mood, journal, oracle, circle, crew, voice, streaks, room
- `loadState()` restores on mount (effect #1) with safe defaults
- Cloud merge via `pullAll()` runs after anon session resolves

---

## 3. Teen Circle Live Feed
**Status: ✅ DONE**

- `loadCircleFeed(tab)` — reads public / friends / crew tabs → `src/utils/sync.ts`
- `writeCirclePost(tab, text, opts)` — inserts to `posts` table via `circle_id`
- `syncCircleReaction(postId, reaction)` — upserts `post_reactions`
- All three are called in `screens/CircleScreen.tsx` via `useFeed` hook (mount +
  pull-to-refresh), post composer `handlePost`, and reaction bar `handleReact`.
- Mock fallback data shown when Supabase is unconfigured / offline.

---

## 4. Parent Circle Live Feed
**Status: ✅ Local save / 🔜 Cloud load**

- `syncParentCirclePost()` writes to `parent_circle_posts` → `src/utils/sync.ts`
- `pullAll()` pulls `parent_circle_posts` on launch
- **TODO in screen:** `screens/ParentCircleScreen.tsx` — call `pullAll` or a
  dedicated `loadParentCircleFeed()` on mount; show cloud posts merged with local

---

## 5. Bip Crew Cloud Actions
**Status: ✅ DONE**

- `syncCrewMember(m)` — upserts crew member with `invite_code` field
- `deleteCrewMember(id)` — deletes from `crew_members`
- `syncCrewCheckIn(c)` — upserts check-in with `member_id` FK
- `pullAll()` restores `crewMembers` + `crewCheckIns` on launch
- Invite code stored on `CrewMember.inviteCode`, synced to `invite_code` column

---

## 6. Points / Rewards Snapshot
**Status: ✅ Snapshot / 🔜 Drain + auto-sync**

- `snapshotPoints(total)` inserts a timestamped row → `bip_points` table
- **TODO:** Add point calculation fn + slow drain timer in `screens/PointsScreen.tsx`;
  call `snapshotPoints` whenever total changes

---

## 7. Voice Bip AI Speaking Pipeline
**Status: 🔜 IN PROGRESS**

- `services/sekretVoice.ts` — recording + local save wired
- `services/voiceBipIntelligence.ts` — intelligence scaffolding present
- **TODO pipeline:**
  1. `expo-av` record → upload blob to Supabase Storage or Worker
  2. Worker `/transcribe` → OpenAI Whisper → transcript string
  3. Worker `/chat` → companion reply via personality context
  4. Worker `/tts` → ElevenLabs or OpenAI TTS → audio URL
  5. `expo-av` play response
- Worker stub lives in `worker/` directory

---

## 8. Oracle / Companion Memory Cloud Sync
**Status: ✅ DONE**

- `services/oracleProfile.ts` owns the full cloud sync path:
  - `saveOracleRecord(record)` — upserts full profile snapshot to
    `oracle_records (user_id, mode)` on every answer processed
  - `markSessionComplete(record, questionIds)` — inserts immutable row to
    `oracle_session_log` at session end (analytics + cross-device restore)
  - Both calls use `supabase.auth.getUser()` directly; errors swallowed so
    local AsyncStorage always wins as source of truth
- `syncOracleSession` / `loadOracleSession` in `src/utils/sync.ts` exist as
  a lighter companion-memory path (`oracle_sessions` table) but are superseded
  by the richer `oracleProfile.ts` implementation above.

---

## 9. Parent / Teen Link System
**Status: 🔜 IN PROGRESS — table added**

- Migration `0003_*` creates `parent_links` table with invite flow columns
- RLS: teen creates invite, parent redeems by code, both can read their link
- **TODO:**
  1. Add invite code generator to `screens/SettingsScreen.tsx` (teen side)
  2. Add code entry field to parent settings / onboarding
  3. On redemption: `UPDATE parent_links SET status='active', parent_user_id=uid,
     linked_at=now() WHERE invite_code = ? AND status='pending'`
  4. Store linked `parent_user_id` in state so Circle + safety reads can filter

---

## 10. Safety System
**Status: 🔜 IN PROGRESS — table added**

- Migration `0003_*` creates `safety_alerts` with severity, source tracking,
  `reviewed_by_parent` flag, and parent-link-scoped RLS
- Insert policy intentionally omitted from client — alerts must be created
  server-side (Edge Function) to prevent self-suppression
- **TODO:**
  1. Create Edge Function `safety-scan` triggered on `journal_entries` + `posts` insert
  2. Keyword list in Edge Function env var
  3. On flag: insert `safety_alerts` row + send push notification to linked parent
  4. Parent UI: read `safety_alerts` in `screens/ParentBridgeScreen.tsx`

---

## 11. Period Calendar Sync
**Status: ✅ DONE**

- Migration `0003_*` creates `period_days (user_id, day DATE)` with unique key
- `syncPeriodDay(day, note?)` — upserts on toggle-on → `src/utils/sync.ts`
- `deletePeriodDay(day)` — deletes on toggle-off → `src/utils/sync.ts`
- `loadPeriodDays()` — pulls all days on mount → `src/utils/sync.ts`
- All three wired in `screens/PeriodCalendarScreen.tsx`:
  - Mount effect: loads AsyncStorage first (instant), then `loadPeriodDays()`
    and merges cloud days additively (non-destructive)
  - `toggleDay()`: calls `syncPeriodDay` on mark, `deletePeriodDay` on unmark

---

## 12. Splash / Entry Flow Control
**Status: ✅ DONE**

- `screens/SplashScreen.tsx` — no auto-timer; sole entry is `TouchableOpacity`
  CTA calling `setScreen('home')`
- Teen and parent sides both use the same gate, toggled by `userSide` prop
- Artwork is wrapped in `pointerEvents="none"` so only the CTA is tappable

---

## Quick Reference: Remaining Open Items

| Item | Primary File | Action |
|------|-------------|--------|
| 4 — Parent Circle cloud load | `screens/ParentCircleScreen.tsx` | Add `loadParentCircleFeed()` on mount; merge with local |
| 6 — Points drain | `screens/PointsScreen.tsx` | Drain timer + `snapshotPoints` call on change |
| 7 — Voice pipeline | `worker/` + `services/sekretVoice.ts` | Transcribe → chat → TTS chain |
| 9 — Parent link | `screens/SettingsScreen.tsx` | Invite code generator + redemption form |
| 10 — Safety scan | new `supabase/functions/safety-scan/` | Edge Function on insert trigger |

---

## Phase 5 Constraint — Se'kret Into Pages

See `docs/PHASE5_SEKRET_INTO_PAGES.md` for the full specification.

**One-line rule:** Hiding the Se'kret tab is only valid if Se'kret's full
functionality is relocated inside Pages. If companion interaction is unreachable
after the tab is hidden, Phase 5 fails.
