# Codespaces Setup

This project runs in GitHub Codespaces with zero local setup required.

## Quick Start

1. Click **Open in GitHub Codespaces** in the README (or open [https://codespaces.new/jussray/Bip?quickstart=1](https://codespaces.new/jussray/Bip?quickstart=1)).
2. Wait ~1 minute — the devcontainer auto-installs dependencies and seeds `.env.local`.
3. Start the dev server:
   ```bash
   npx expo start --web -c
   ```
4. Port 8081 opens automatically in the browser preview.

## Git LFS in Codespaces

All room background PNGs (`assets/images/bg-*.png`) and companion art are stored in **Git LFS**. The devcontainer pre-installs `git-lfs`, but you must explicitly pull the binary files after cloning:

```bash
git lfs pull
```

**Always run `git lfs pull` before:**
- Copying any `bg-*.png` to `assets/images/archive/`
- Running `npm run verify:room-archives`
- Starting Phase 2 room compositing work

### Confirm LFS hydration

```bash
ls -lh assets/images/bg-raylene-room-day.png
```

- ✅ `2.7M` — LFS hydrated. Safe to proceed.
- ❌ `134B` — LFS pointer only. Run `git lfs pull` and wait for it to finish.

## Pre-push Checks

Run this before every push:

```bash
npm run verify:prepush
```

This runs in order:
1. `audit:runtime-assets` — confirms all image keys in `constants/theme.ts` resolve to real files
2. `type-check` — TypeScript compile check (no emit)
3. `lint` — ESLint across the codebase
4. `verify:bundle` — Expo web export (confirms the app builds)
5. `verify:room-archives` — confirms all 28 room archive backups are real MB-sized PNGs matching live SHAs

If any step fails, fix it before pushing.

## Environment Variables

The devcontainer seeds `.env.local` from `.env.example`. Fill in Supabase keys when wiring Phase 2:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Never commit `.env.local`. Never put a `service_role` key on the device.
