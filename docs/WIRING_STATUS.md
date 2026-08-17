<!-- truth-mode: historical -->
# Se’kret Bip — Backend Wiring Status

> **Historical snapshot.** This former current-status document is retained so old links keep working. Its detailed prior contents remain preserved in Git history. Do not use it to determine current repository, provider, database, browser, issue, or device state.

For current structural contracts, use `README.md`, `docs/CURRENT_STATUS.md`, `DEPLOYMENT.md`, and the source code. For volatile state, resolve the owning system live and apply `docs/TRUTH_AUTHORITY.md`.

The durable wiring invariants are:

- Expo Router owns auth, onboarding, Teen, Parent, and founder/internal route groups.
- Supabase owns Auth, Postgres, RLS, Storage, Edge Functions, and ordered migrations.
- `supabase/migrations/` is the schema source of truth.
- `sekret-backend` is the canonical Cloudflare Worker API.
- `sekret-bip` is the canonical Cloudflare Pages project.
- Shared typed frontend-to-Worker contracts should remain the transport spine.
- Repository presence, deployment, live database state, production browser behavior, controlled-account behavior, and physical-device behavior are separate evidence classes.

Use Git history when a past wiring diagnosis or exact historical observation is needed.
