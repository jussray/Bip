# Se'kret Bip — Architecture

> Living document. Update when boundaries change.

## Directory Structure (Current — post Step 3)

```
bip/
├── app/                          ← Expo Router file-based routing ONLY
│   ├── _layout.tsx               ← Root layout + AppProvider
│   ├── index.tsx                 ← Redirect → /(main)/home
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             ← placeholder
│   │   └── signup.tsx            ← placeholder
│   ├── (main)/
│   │   ├── _layout.tsx           ← Tabs: Home/Pages/Calm/Circle/Se'kret
│   │   ├── home.tsx              ← real HomeScreen + router shim
│   │   ├── pages.tsx             ← real JournalScreen + router shim
│   │   ├── calm.tsx              ← real CalmScreen + router shim
│   │   ├── sekret.tsx            ← personality picker → chat/[id]
│   │   ├── circle.tsx            ← placeholder (Step 4)
│   │   ├── bridge.tsx            ← placeholder (Step 4)
│   │   ├── discover.tsx          ← placeholder (Step 4)
│   │   ├── profile.tsx           ← placeholder (Step 4)
│   │   ├── settings.tsx          ← placeholder (Step 4)
│   │   └── chat/
│   │       ├── index.tsx         ← chat hub
│   │       └── [personalityId].tsx ← raylene/rylane/cloud/night/oracle
│   └── (modals)/
│       └── _layout.tsx
│
├── src/                          ← ALL non-routing source code (canonical)
│   ├── components/
│   │   ├── layout/
│   │   │   └── BottomNav.tsx     ← router-native, no setScreen prop
│   │   ├── ai/                   ← Step 4: OracleDiscoveryPanel etc.
│   │   ├── chat/                 ← Step 4: BipEmptyState etc.
│   │   ├── safety/               ← Step 4: AgeGate, SleepGate etc.
│   │   └── shared/               ← Step 4: SafeAsset, SyncBadge etc.
│   ├── context/
│   │   └── AppContext.tsx        ← theme, mood, breatheAnim, journal state
│   ├── hooks/
│   │   └── useSekretState.ts     ← AsyncStorage persistence
│   ├── services/
│   │   ├── ai/                   ← Step 4: per-personality AI calls
│   │   └── worker/               ← Cloudflare Worker helpers
│   ├── store/                    ← Step 4: Zustand stores (if needed)
│   ├── types/
│   │   └── index.ts              ← JournalEntry, MoodEntry, Theme, PersonalityId…
│   ├── constants/
│   │   └── theme.ts              ← THEME_PACKS, MOODS, HOME_MESSAGES…
│   └── utils/
│       ├── storage.ts            ← AsyncStorage helpers
│       └── api.ts                ← fetchSekretReply (→ src/services/ai in Step 4)
│
├── screens/                      ← LEGACY — retire in Step 5
│   ├── HomeScreen.tsx            ← still uses setScreen prop (shim satisfies it)
│   ├── JournalScreen.tsx
│   └── CalmScreen.tsx
│
├── hooks/            ← LEGACY SHIMS — re-export from src/hooks
├── utils/            ← LEGACY SHIMS — re-export from src/utils
├── types/            ← LEGACY SHIMS — re-export from src/types
├── constants/        ← LEGACY SHIMS — re-export from src/constants
├── components/       ← LEGACY SHIMS — re-export from src/components
│
├── supabase/         ← Migrations + Edge Functions
├── worker/           ← Cloudflare Worker source
├── assets/
├── docs/
├── scripts/
├── app.json
├── tsconfig.json
├── package.json
├── babel.config.js
├── metro.config.js
├── wrangler.jsonc
└── .env.example
```

## Import Alias Convention

| Alias | Points to | Status |
|-------|-----------|--------|
| `@/*` | `src/*` | ✅ Canonical — use for ALL new code |
| `@hooks/*` | `src/hooks/*` | ⚠️ Legacy — migrate to `@/hooks` |
| `@utils/*` | `src/utils/*` | ⚠️ Legacy — migrate to `@/utils` |
| `@components/*` | `src/components/*` | ⚠️ Legacy — migrate to `@/components/*` |
| `@constants/*` | `src/constants/*` | ⚠️ Legacy — migrate to `@/constants` |
| `@types/*` | `src/types/*` | ⚠️ Legacy — migrate to `@/types` |
| `@screens/*` | `screens/*` | 🔴 Retire in Step 5 |

## Navigation Model (Active)

```tsx
import { router } from 'expo-router';

router.push('/(main)/home');
router.push('/(main)/pages');
router.push('/(main)/calm');
router.push('/(main)/circle');
router.push('/(main)/sekret');
router.push('/(main)/chat/raylene');
router.push('/(main)/settings');
router.push('/(main)/discover');
```

## State Architecture

```
AppProvider (app/_layout.tsx)
  └── useSekretState()          ← AsyncStorage persistence
       theme, mood, userSide, selectedSekret,
       entries, moodHistory, circlePosts
  └── local state in provider
       journalText, homeMessageIndex, breatheAnim
  └── useAppContext()            ← consumed by all tab screens
```

## Deployment Boundaries

| Layer | Platform | Responsibility |
|-------|----------|----------------|
| Frontend | Vercel | `expo export -p web` |
| Mobile | Expo Go / EAS | React Native bundle |
| Backend | Cloudflare Workers | AI relay, Supabase proxy |
| Database | Supabase | PostgreSQL + Auth + RLS |

`OPENAI_API_KEY` lives ONLY in Cloudflare Worker secrets.

## Migration Checklist

| Step | Description | Status |
|------|-------------|--------|
| 1 | Component domain barrel files | ✅ Done |
| 2a | `src/` skeleton + `app/` route groups | ✅ Done |
| 2b | Replace string router with `router.push()` | ✅ Done |
| **3** | **Move physical files into `src/`** | ✅ Done |
| 4 | Wire `src/services/ai/` per-personality + fill placeholder screens | 🔜 Next |
| 5 | Retire `screens/`, `hooks/`, `utils/`, `types/`, `constants/` legacy dirs | 🔜 After 4 |
