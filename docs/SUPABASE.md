# Se'kret Bip — Supabase setup

Phase 2 backend. Wires real cloud sync for mood, journal, voice, circle,
comfort sessions, bip crew, and crew check-ins.

The app **already works without Supabase** — every cloud call is a safe
no-op when env vars are missing, and all state stays in AsyncStorage. Add
Supabase to get cross-device sync, durable history, and (eventually) real
crew invites.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Project Settings → API → copy:
   - `Project URL` → goes in `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → goes in `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. **NEVER** copy or commit the `service_role` key. It bypasses RLS and
   stays server-side only.

## 2. Apply the schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the contents of [`db/schema.sql`](../db/schema.sql) and run.
3. This creates every table, enables Row Level Security, and adds
   owner-only policies — each row is scoped to `auth.uid()`.

## 3. Enable anonymous auth

1. Authentication → Providers → enable **Anonymous Sign-Ins**.
2. The app calls `supabase.auth.signInAnonymously()` on boot
   (`utils/sync.ts → ensureAnonymousSession`) so each user gets a stable
   `auth.uid()` without giving up an email. They can upgrade later.

## 4. Add env vars

Copy `.env.example` → `.env.local` and fill in the two values.

```bash
cp .env.example .env.local
# edit .env.local with your real URL + anon key
```

Then restart Expo with cache cleared:

```bash
npx expo start --clear
```

`.env.local` is gitignored — never commit it.

## 5. Verify

Open the app. On first boot you should see a row appear in `auth.users`
in your Supabase dashboard. After tapping a mood, you should see a row in
`mood_history`. After writing a journal, a row in `journal_entries`.

If nothing appears, check the **Logs** tab in Supabase — RLS denials show
there. The most common issue is forgetting to enable anonymous sign-ins.

## What gets synced

| Local state         | Cloud table         | Helper                  |
|---------------------|---------------------|-------------------------|
| `moodHistory`       | `mood_history`      | `syncMood`              |
| `journalEntries`    | `journal_entries`   | `syncJournal`           |
| `circlePosts`       | `circle_posts`      | `syncCirclePost`        |
| `voiceNotes`        | `voice_notes`       | `syncVoiceNote`         |
| `comfortSessions`   | `comfort_sessions`  | `syncComfortSession`    |
| `crewMembers`       | `crew_members`      | `syncCrewMember`        |
| `crewCheckIns`      | `crew_check_ins`    | `syncCrewCheckIn`       |

Each helper is a fire-and-forget call from the existing local-write paths
in `app/index.tsx` and `screens/BipCrewScreen.tsx`. Local writes happen
first and never wait on the network — if the cloud call fails, the local
copy is still saved to AsyncStorage and the user sees no error.

## Boot-time cloud restore

On every app boot, after the local AsyncStorage restore finishes, the app:

1. Calls `ensureAnonymousSession()` to get a stable `auth.uid()`.
2. Calls `pullAll()` to fetch every owned row from the cloud.
3. **Merges** cloud + local: cloud rows win on `id` collision, any
   local-only rows survive and sync up on the next write.
4. Merged state is persisted back to AsyncStorage via the existing save
   effect — so the next launch is instant and offline-safe.

This means a fresh install on a second device hydrates with the user's
full history once they sign in (anon today, email later).

## What's NOT synced yet

- `roomMemory` — the table exists (`room_memory`) but the helper isn't
  wired into `updateRoomMemory` yet. Will land in the next pass.
- Realtime subscriptions — Crew check-ins are local-only right now. The
  next pass adds `supabase.channel('crew').on('postgres_changes', ...)`
  so check-ins from another device appear in real time.
- Period tracker — `period_days` table exists, wiring is pending.

## Notes on safety

- Every table has RLS enabled with owner-only policies. A user cannot read
  or write another user's rows, even with the anon key.
- Composite primary key `(user_id, id)` lets device-generated ids
  round-trip cleanly through AsyncStorage and the cloud.
- All sync helpers swallow errors so a broken cloud never breaks the local
  experience. Errors only surface in dev logs.

## Running in GitHub Codespaces

For the full step-by-step (open Codespace, install, env vars, start, smoke
tests), see [`docs/CODESPACES.md`](./CODESPACES.md). The short version:

1. Open the repo on GitHub → **Code** → **Codespaces** → **Create codespace on main**.
2. In the Codespace terminal:
   ```bash
   npm install --legacy-peer-deps
   cp .env.example .env.local
   ```
3. Fill `.env.local` with your `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Supabase → Settings → API.
4. Run [`db/schema.sql`](../db/schema.sql) once in the Supabase SQL Editor.
5. Start the app:
   ```bash
   npx expo start --web
   ```
6. Click the forwarded-port toast to open the app in a new tab. Watch
   the DevTools console for `[sync] pullAll hydrated { ... }` to confirm
   cloud restore fired on boot.

Without `.env.local` the app still runs — it just stays offline-only and
`pullAll` short-circuits silently. That's intentional so contributors can
demo the UI without a Supabase project.
