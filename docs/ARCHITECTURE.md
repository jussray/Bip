# Se'kret Bip — Architecture

> Living document. Update when boundaries change.

## Directory Structure (Target)

```
bip/
├── app/                        ← Expo Router file-based routing ONLY
│   ├── _layout.tsx             ← Root layout + providers (Analytics, etc.)
│   ├── index.tsx               ← Entry redirect only (tiny) — Step 2b goal
│   ├── (auth)/
│   │   ├── _layout.tsx         ← Stack layout
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (main)/
│   │   ├── _layout.tsx         ← Bottom tab bar layout
│   │   ├── chat/
│   │   │   ├── index.tsx       ← Bip chat hub (personality selector)
│   │   │   └── [personalityId].tsx  ← Dynamic: raylene/rylane/cloud/night/oracle
│   │   ├── discover.tsx        ← Oracle discovery + voice bip
│   │   ├── profile.tsx         ← Se'kret identity / sekret screen
│   │   └── settings.tsx
│   └── (modals)/
│       └── _layout.tsx         ← Modal presentation group
│
├── src/                        ← ALL non-routing source code
│   ├── components/
│   │   ├── ai/                 ← OracleDiscoveryPanel, SekretCompanionCard, MiniAvatarSticker
│   │   ├── chat/               ← BipEmptyState, MiniReactionSticker
│   │   ├── layout/             ← BottomNav, BackgroundLayer, PresenceAvatar
│   │   ├── safety/             ← AgeGate, SleepGate, ContentSafetyBlock, PrivacyLabel
│   │   └── shared/             ← SafeAsset, SyncBadge, Analytics
│   ├── hooks/
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── ai/                 ← raylene.ts, rylane.ts, cloud.ts, night.ts, oracle.ts
│   │   └── worker/             ← Cloudflare Worker calls
│   ├── store/                  ← usePersonalityStore, useChatStore, useAuthStore
│   ├── types/
│   ├── constants/
│   └── utils/
│
├── supabase/                   ← Migrations + Edge Functions
├── worker/                     ← Cloudflare Worker source
├── assets/                     ← Static assets
├── docs/                       ← All markdown documentation
├── scripts/                    ← Dev/CI utility scripts
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
| `@/*` | `src/*` | ✅ Active — use for all new code |
| `@components/*` | `components/*` | ⚠️ Legacy — migrate to `@/components/*` |
| `@hooks/*` | `hooks/*` | ⚠️ Legacy |
| `@utils/*` | `utils/*` | ⚠️ Legacy |
| `@constants/*` | `constants/*` | ⚠️ Legacy |
| `@screens/*` | `screens/*` | ⚠️ Legacy — retire when Step 2b complete |
| `@types/*` | `types/*` | ⚠️ Legacy |

## Navigation Model

### Current (string router — active)
```tsx
// app/index.tsx
if (state.screen === 'home') return <HomeScreen ... />;
```

### Target (Expo Router — Step 2b)
```tsx
// any screen
import { router } from 'expo-router';
router.push('/(main)/chat');
router.push('/(main)/chat/raylene');
router.push('/(main)/settings');
```

## Deployment Boundaries

| Layer | Platform | Responsibility |
|-------|----------|----------------|
| Frontend | Vercel | Expo web build (`expo export -p web`) |
| Mobile | Expo Go / EAS | React Native bundle |
| Backend | Cloudflare Workers | AI relay, Supabase proxy |
| Database | Supabase | PostgreSQL + Auth + RLS |

`OPENAI_API_KEY` lives ONLY in Cloudflare Worker secrets. Never in Vercel or the repo.

## Migration Checklist

| Step | Description | Status |
|------|-------------|--------|
| 1 | Group `components/` into domain barrel files | ✅ Done |
| 2a | Create `src/` skeleton + `app/` route groups | ✅ Done |
| 2b | Replace string router with `router.push()` — dedicated PR | 🔜 Next |
| 3 | Move physical files into `src/` | 🔜 After 2b |
| 4 | Shrink `app/index.tsx` to a redirect only | 🔜 After 3 |
| 5 | Retire `screens/` directory | 🔜 Last |
