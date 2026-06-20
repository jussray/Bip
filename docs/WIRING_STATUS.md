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
**Status: ✅ DONE**

- `syncParentCirclePost()` writes to `parent_circle_posts` → `src/utils/sync.ts`
- `pullAll()` pulls `parent_circle_posts` on launch
- `loadParentCircleFeed()` called on mount in both route wrappers
  (`app/(main)/parent-circle.tsx` and `app/parent/circle.tsx`)
- Cloud posts merged additively — no local posts are lost

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
**Status: ✅ DONE**

- `snapshotPoints(total)` inserts a timestamped row → `bip_points` table
- `PointsScreen.tsx` computes points from all activity logs (no separate stored total)
- `snapshotPoints(breakdown.total)` called via `useEffect` on every change

---

## 7. Voice Bip AI Speaking Pipeline
**Status: ✅ DONE**

- `VoiceBipScreen.startRecording()` — requests mic permission, calls `Audio.Recording.createAsync(HIGH_QUALITY)`
- `VoiceBipScreen.stopRecording()` — stops recording, converts URI to base64 via `FileReader`
- Worker `POST /api/sekret/transcribe` — receives base64 audio, calls Whisper, returns transcript
- `fetchSekretTranscribe()` in `src/utils/api.ts` — client helper (OPENAI_API_KEY in Worker secrets only)
- Real transcript fed to `fetchSekretReply()` then `fetchSekretVoice()` → TTS playback via `expo-av`

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
**Status: ✅ DONE**

- Migration `0003_*` creates `parent_links` table with invite flow columns
- RLS: teen creates invite, parent redeems by code, both can read their link
- `createParentLink()` → `src/utils/sync.ts`: teen generates/retrieves pending code
- `redeemParentLink(code)` → `src/utils/sync.ts`: parent activates link by code
- `SettingsScreen.tsx` teen side: "Connect to a Parent" — generate + copy 6-char code
- `SettingsScreen.tsx` parent side: "Connect to Your Teen" — enter code + link button

---

## 10. Safety System
**Status: ✅ DONE (deploy pending)**

- Migration `0003_*` creates `safety_alerts` table with severity, source tracking, RLS
- Migration `20260619_safety_scan.sql` — adds `safety_flagged` columns, `trigger_safety_scan()`,
  and attaches triggers to `journal_entries`, `circle_posts`, `public_circle_posts`
- Edge Function `supabase/functions/safety-scan/index.ts` — keyword + OpenAI moderation scan,
  inserts `safety_alerts`, notifies linked parent (no content in notification)
- **Deploy steps** (manual, one-time):
  1. `supabase functions deploy safety-scan --no-verify-jwt`
  2. `supabase secrets set SAFETY_SCAN_SECRET=<random> OPENAI_API_KEY=<key>`
  3. Run `20260619_safety_scan.sql` in Supabase SQL editor

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

All 12 wiring items are now done in code. Item 10 requires a one-time manual deploy (see Section 10 above).

---

## Phase 5 Constraint — Se'kret Into Pages

See `docs/PHASE5_SEKRET_INTO_PAGES.md` for the full specification.

**One-line rule:** Hiding the Se'kret tab is only valid if Se'kret's full
functionality is relocated inside Pages. If companion interaction is unreachable
after the tab is hidden, Phase 5 fails.
