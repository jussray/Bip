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
