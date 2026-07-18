# Se'kret Bip 💜

A private emotional wellness and self-expression app built with React Native and Expo.

> Cool cousin, teen-safe, private, soft, scrapbook, purple-night.
> Raylene / Rylane / Cloud / Night companion energy.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/jussray/Bip?quickstart=1)

## Features

- **Room (home)** — your personalized space; companion + day/night background
- **Journal** — private pages for your thoughts
- **Calm** — breathing / grounding space
- **Sekret** — chat-style talk with your chosen companion
- **Comfort** — soft messages and presence
- **MindBody Reset** — quick reset flow
- **Bippin2** — secondary expressive space
- **Voice Bip** — record 30–60s voice notes
- **Cloud Thoughts** — thought-cloud space (Cloud mascot)
- **Circle** — anonymous community posts with soft reactions
- **Period Calendar** — private cycle tracking
- **Bridge** — teen ↔ trusted adult soft-share (no full explanation required)
- **Parent Bridge** — adult-side view of incoming bridge shares
- **Five theme packs** — Night Purple, Golden Moon, Soft Pink, Rain Blue, Galaxy Night

## Roadmap

1. **Phase 1 — Polish.** Tighten each screen one by one (Room → Journal → Calm → Sekret → …). Replace placeholder image fallbacks in `constants/theme.ts` with real PNGs as they land.
2. **Phase 2 — Wire Supabase.** Move journal entries, mood history, circle posts, bridge shares, voice notes, and room memory off AsyncStorage onto the real backend. Scaffold lives in [`utils/supabase.ts`](utils/supabase.ts) — it's a safe no-op while env vars are unset so Phase 1 isn't blocked.

## Project Structure

```
sekret-bip/
├── app/                    # Expo Router screens
│   ├── _layout.tsx
│   ├── index.tsx           # IMAGES re-export lives near the top
│   └── ...                 # route entry points per screen
├── components/             # Reusable UI (BackgroundLayer, BottomNav)
├── screens/                # Full-page screens
├── hooks/                  # useSekretState etc.
├── constants/              # theme.ts (IMAGES map + design tokens), styles.ts, bip_voice.ts
├── utils/                  # api.ts, storage.ts, moodEngine.js, supabase.ts (Phase 2 scaffold)
├── types/                  # index.ts (BridgePayload + entry types), bridge.ts (re-export shim)
├── assets/images/          # All companion + room + screen artwork
├── .devcontainer/          # Codespaces config — auto-installs deps on first boot
├── .env.example            # Environment template — copy to .env.local
└── app.json                # Expo config
```

## Setup

### Option A — GitHub Codespaces (recommended)

1. Click **Open in GitHub Codespaces** above (or [open directly](https://codespaces.new/jussray/Bip?quickstart=1)).
2. Wait ~1 min — the devcontainer auto-installs deps and seeds `.env.local`.
3. Run:
   ```bash
   npx expo start --web -c
   ```
4. The forwarded port 8081 opens automatically in the browser preview.

### Option B — Local machine

Prerequisites: Node 20+, npm.

```bash
gh repo clone jussray/Bip
cd Bip
npm install --legacy-peer-deps
cp .env.example .env.local            # fill in keys when ready
npx expo start --web -c               # web
npm run ios                           # iOS simulator
npm run android                       # Android emulator
```

## Environment Variables

Create `.env.local` from `.env.example`. Only `EXPO_PUBLIC_*` vars ship to the client.

```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:8001
EXPO_PUBLIC_APP_ENV=development

# Phase 2 — fill in when wiring Supabase:
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

**Never commit `.env.local`. Never put a Supabase `service_role` key on the device.**

## Architecture

- **State (Phase 1)**: AsyncStorage via `utils/storage.ts`, React hooks for local state
- **State (Phase 2)**: Supabase via `utils/supabase.ts`, AsyncStorage as offline cache
- **Navigation**: Expo Router (file-based)
- **Styling**: React Native StyleSheet + theme packs in `constants/theme.ts`
- **Voice / personality**: `constants/bip_voice.ts` + `SEKRET_PROFILES`

## Tech Stack

- React Native 0.74
- Expo 56
- TypeScript 5
- Expo Router
- AsyncStorage + Supabase (scaffold)

## Guides

- [Codespaces setup](docs/CODESPACES.md) — running the app in GitHub Codespaces
- [Dependency audit](docs/DEPENDENCY_AUDIT.md) — version pins and how they're enforced
- [Room art guide](docs/ROOM_ART_GUIDE.md) — naming, format, and fallback rules for room backgrounds
- [Phase 2 room integration](docs/PHASE_2_ROOM_INTEGRATION.md) — the gate before Phase 2 touches room art
- [Asset backup rules](docs/ASSET_BACKUP_RULES.md) — backup requirements for room background PNGs

Run `npm run verify:prepush` before pushing — it runs the asset audit,
type-check, lint, bundle export, and room-archive verification together.

## License

Private project.
