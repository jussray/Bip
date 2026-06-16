# Codespaces — running Se'kret Bip in the cloud

This is the fastest way to run the app without setting anything up on your laptop. Everything runs in a browser tab.

---

## 1. Open the Codespace

1. Go to [github.com/jussray/Bip](https://github.com/jussray/Bip)
2. Click the green **Code** button → **Codespaces** tab
3. **Create codespace on main** (or reopen the existing one if you've used it before)

The first boot takes ~2 minutes while it installs Node, npm, and the repo dependencies.

---

## 2. Install dependencies

In the Codespace terminal:

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag matters. Without it, Expo's peer dependency ranges fight with Supabase and the install fails. Always include it.

---

## 3. Add Supabase env vars (REQUIRED for cloud sync)

Without these, the app still runs — it just stays offline-only (AsyncStorage), and `pullAll` short-circuits silently on boot.

```bash
cp .env.example .env.local
```

Open `.env.local` (it's in `.gitignore` and will NEVER be committed) and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Find both values in your Supabase dashboard → **Settings → API**.

---

## 4. Run the schema (one-time per Supabase project)

In the Supabase dashboard → **SQL Editor** → paste the entire contents of [`db/schema.sql`](../db/schema.sql) → **Run**.

This creates every table (`moods`, `journal_entries`, `circle_posts`, `voice_notes`, `comfort_sessions`, `crew_members`, `crew_check_ins`, `room_memory`, `period_days`) with RLS policies so each anon user can only see their own rows.

You only need to do this once per Supabase project. Skip this step if your project already has the schema.

---

## 5. Start the app

```bash
npx expo start --web
```

Codespaces will pop up a "Open in Browser" toast for the forwarded port. Click it. The app opens in a new tab.

If the toast disappeared, find the port in the **Ports** panel at the bottom of the Codespaces UI and click the globe icon.

---

## 6. Verify pullAll fires on boot

With Supabase configured, open the browser DevTools console. On app launch you should see:

```
[sync] pullAll hydrated { moodHistory: N, journalEntries: N, circlePosts: N, voiceNotes: N, comfortSessions: N, crewMembers: N, crewCheckIns: N }
```

If you see nothing, `isSupabaseConfigured` is likely false — double-check `.env.local`. The app will still work offline; cloud sync just won't happen.

---

## 7. Smoke tests

Quick checks that cloud sync is round-tripping correctly:

- **Mood persistence**: drop a mood → hard-reload the page → mood should reappear (it came back from the cloud, not AsyncStorage)
- **Crew persistence**: open Crew screen → add a member → hard-reload → member persists
- **Database check**: Supabase dashboard → **Table Editor** → `moods`, `crew_members`, etc. should each have rows tagged with your anon `user_id`

If a row is in AsyncStorage but not Supabase, sync helpers are fire-and-forget — check the console for `[sync] … failed` warnings.

---

## 8. Bundle-verify before pushing changes

Whenever you change `package.json`, `app/index.tsx`, or anything in `constants/theme.ts` / `types/`, run this before pushing:

```bash
npm run verify:bundle
```

Success looks like `Exported: dist` at the end. This is exactly what the pre-standup cron checks every weekday at 8am EDT — if it bundles here, the cron stays silent.

For a full pre-push gate (asset audit, type-check, lint, bundle, and room
art backup verification all in one command), run:

```bash
npm run verify:prepush
```

See [`DEPENDENCY_AUDIT.md`](./DEPENDENCY_AUDIT.md),
[`ROOM_ART_GUIDE.md`](./ROOM_ART_GUIDE.md), and
[`ASSET_BACKUP_RULES.md`](./ASSET_BACKUP_RULES.md) for what each check in
that gate enforces and why.

---

## 9. Stopping the Codespace

Codespaces auto-suspend after 30 minutes of inactivity. To stop manually:

- In the bottom-left of VS Code → **Codespaces: Stop Current Codespace**
- Or close the tab — it'll suspend on its own

You're not billed for stopped Codespaces (storage only).

---

## Common gotchas

| Symptom | Fix |
|---|---|
| `npm install` errors about peer deps | Always use `--legacy-peer-deps` |
| App boots but no cloud sync | `.env.local` missing or `EXPO_PUBLIC_` prefix dropped |
| `pullAll` returns null in console | RLS policies blocking — run `db/schema.sql` again |
| Bundle fails with "Unable to resolve module X" | Missing peer dep, run `npm install X --legacy-peer-deps` |
| Port forwarding link 404s | Codespace went to sleep — restart the `npx expo start --web` command |
| AsyncStorage data lost on reload | Web AsyncStorage = localStorage; cleared with hard reload + clear-site-data |

---

## What's wired vs deferred

**Cloud-synced on every mutation:** moods, journal entries, circle posts, voice notes, comfort sessions, crew members, crew check-ins.

**Cloud-restored on boot:** all of the above, via `pullAll` in [`app/index.tsx`](../app/index.tsx).

**Not synced yet (deferred):**
- `room_memory` table exists, helper not wired into `updateRoomMemory` yet
- Realtime subscriptions for Crew (next pass: `supabase.channel('crew').on('postgres_changes')`)
- Period tracker — `period_days` table exists, wiring pending
- Email upgrade path from anonymous to email+OTP

See [`SUPABASE.md`](./SUPABASE.md) for full backend architecture.
