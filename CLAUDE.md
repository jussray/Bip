> **Before making any claim about current PR, deployment, migration, or backend state, read `SPRINT.md` at the repo root and verify it using `.agents/skills/bip-repo-truth/SKILL.md`.**

# Se'kret Bip — Design System Rules for Figma MCP Integration

Grounded, file-verified reference for any agent (Claude Code, Figma MCP,
Cursor, etc.) generating or syncing UI against this repo. Every claim below
was checked against the actual source, not inferred from docs — where a
doc and the code disagree, the code's behavior is what's recorded here, and
the doc drift is called out explicitly.

---

## 1. Token Definitions

**There are three token sources in this repo. Only one is live in the shipped app.**

### Canonical, live tokens: `constants/vibeColors.ts`

This is what every screen actually renders with. Re-exported through
`src/constants/vibeColors.ts` (a thin alias barrel — `export * from
'../../constants/vibeColors'` — kept so `@/constants/vibeColors` imports
resolve under the `@/* → src/*` tsconfig path).

```ts
// constants/vibeColors.ts
export const FOUNDATION = { /* raw color primitives */ };
export const SEMANTIC = { /* role-based colors: surface, textPrimary, danger, ... */ };
export const TYPE = { /* type scale */ };
export const SPACE = { /* spacing scale */ };
export const RADIUS = { /* corner radii */ };
export const SHADOW: Record<string, ShadowToken> = { /* elevation presets */ };
export const MOTION = { /* animation durations/easings */ };

export type VibePalette = { /* per-character/mood palette shape */ };
export const VIBE_PACKS: Record<VibeKey, VibePalette> = { /* raylene, rylane, cloud, night, rain, sunset, ... */ };

export function atmosphereGradient(vibe: VibeKey): string[];
export function vibeCard(vibe: VibeKey): object;
export function vibeButton(vibe: VibeKey): object;
export function vibeInput(vibe: VibeKey): object;
export function vibeBadge(vibe: VibeKey): object;

export const SAFETY_SURFACE = { /* safety/crisis UI tokens */ };
export const PRIVACY_BADGE = { /* privacy indicator tokens */ };
export const PARENT_BOUNDARY = { /* parent-side visual boundary tokens */ };
```

`constants/theme.ts` (root-level, imported almost everywhere as
`THEME_PACKS`) is the actual per-screen consumption point:

```ts
// constants/theme.ts
export const THEME_PACKS: Record<VibeKey, VibePack> = { /* ... */ };
export const IMAGES = { rayleneNeutral, rayleneHappy, ... }; // asset map, see §4
export function getRoomPhase(now: Date, override?: RoomPhase): RoomPhase;
export function getRoomScene(character: Character, phase: RoomPhase): ImageSourcePropType;
```

Screens read colors almost exclusively via `THEME_PACKS[vibe]` /
`VIBE_PACKS[vibe]`, never hardcoded hex, **except** for one-off decorative
accents (glitter/sparkle colors, mood-glow maps) which are still
hand-written per screen. `src/constants/vibeRegistry.ts` (also aliased
through `src/constants/vibeRegistry.ts` → `constants/vibeRegistry.ts`)
defines the `VibeKey`/`RoomPhase` union types these all key off.

The actual visual identity is **dark**: near-black/deep-plum backgrounds
(`#0d0820`, `#0d0518`, `#090711` show up repeatedly as screen root
`backgroundColor`), purple/lavender accents (`#c4b5fd`, `#a855f7`,
`#6d28d9`), with a distinct lighter teal/mint (`#a7f3d0`) reserved for
parent-side screens to visually separate "you are in Parent Space" from
teen surfaces.

### Dead token set: `src/constants/designTokens.ts`

```ts
export const BIP_COLORS = { night: '#120D1F', deepPlum: '#24112F', ... };
export const BIP_SPACING = { xs: 4, sm: 8, ... };
export const BIP_RADII = { chip: 12, card: 20, ... };
export const BIP_MOBILE_FRAMES = { compact: {...}, standard: {...}, large: {...} };
export const BIP_TOUCH_TARGET = 44;
```

**Not imported anywhere in `app/`, `screens/`, `src/`, or `figma/`.**
Verified via repo-wide grep — zero consumers. Looks like an earlier or
exploratory token pass that was superseded by `vibeColors.ts`. Do not use
this as a source of truth for new work; if you find it referenced from a
Figma frame or plugin, that reference is stale.

### Divergent token set: `figma/code.js` (local Figma plugin)

The repo ships a hand-rolled Figma plugin (`figma/manifest.json` +
`figma/code.js`) that generates 390×844 mockup frames per vibe:

```js
const VIBES = {
  raylene: { bg:"#FFF8EE", card:"#FFF1E6", accentA:"#FFB289", ..., isDark:false },
  night:   { bg:"#1E1A2E", card:"#2A2440", accentA:"#FFD166", ..., isDark:true  },
  // ...
};
```

**This palette does not match the shipped app.** The plugin's `raylene`,
`cloud`, `rain`, `sunset` vibes are light pastel (`isDark:false`,
cream/peach/sky-blue backgrounds); the real app is dark-mode throughout
every screen captured in manual QA this session (Room, Pages, Circle,
Calm, Profile, parent screens — all near-black/deep-plum, not cream).
Treat `figma/code.js`'s palette as **stale mockup scaffolding**, not a
design-system source. If asked to sync Figma frames against the real app,
pull colors from `constants/vibeColors.ts` / `constants/theme.ts`, not
from this plugin's `VIBES` object.

---

## 2. Component Library

No Storybook, no component catalog/docs site. Components are plain
`.tsx` files with colocated `StyleSheet.create` blocks — the file *is*
the documentation.

**Two component roots, both live, not yet fully consolidated:**

- **`components/`** (root-level) — the larger, older tree. Subfolders:
  `ai/`, `audio/`, `chat/`, `layout/`, `rooms/`, `safety/`, `sekret/`,
  `shared/`, plus flat files (`SafeAsset.tsx`, `BipEmptyState.tsx`,
  `SyncBadge.tsx`, `PresenceAvatar.tsx`, `AmbientWeatherOverlay.tsx`, ...).
  Imported via **relative paths only** (`../components/Foo`,
  `../../components/Foo`) — there is no `@` alias pointing here. Do not
  write `@/components/Foo` or `@components/Foo` expecting it to resolve to
  this tree; those aliases point at `src/components/` instead (see below).

- **`src/components/`** — newer tree, reached via both `@/components/*`
  and `@components/*` (both aliases resolve here, see §3). Subfolders:
  `ai/`, `chat/`, `layout/`, `safety/`, `shared/`, plus flat files
  (`GlobalMoodButton.tsx`, `SideSafeBackButton.tsx`, `ControlRoomEntry.tsx`).

- **`screens/`** — full-page screen implementations (`RoomScreen.tsx`,
  `VoiceBipScreen.tsx`, `CalmScreen.tsx`, ...), imported via the
  `@screens/*` alias. These are the actual visual "pages"; `app/` route
  files are thin wrappers that fetch context/state and pass props into a
  `screens/*` component. **Not every file in `screens/` is live** — e.g.
  `screens/CircleScreen.tsx` (760+ lines, a full alternate Circle
  implementation) has zero importers anywhere in the repo; the real teen
  Circle route (`app/(teen)/circle/index.tsx`) renders
  `app/(teen)/circle/feed.tsx`'s `CircleFeed`/`CircleScreen` instead.
  **Before treating any `screens/*.tsx` file as ground truth, grep for who
  imports it** — orphaned parallel implementations exist.

- **`src/parent/screens/`** and **`src/teen/screens/`** — side-specific
  screen variants that diverge meaningfully from a shared base (not just
  re-skins), e.g. `src/parent/features/voice/ParentVoiceReflectionScreen.tsx`
  is a real, distinct parent-only screen (rotating reflection prompts, text
  journal) — separate from the teen `VoiceBipScreen` (audio recording,
  companion chat).

**Route wrapper pattern** (every `app/**/*.tsx` file follows this):

```tsx
// app/(teen)/comfort.tsx
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { ComfortScreen } from '@screens/ComfortScreen';
import { navigateTo } from '@/utils/navigation';

export default function ComfortRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <ComfortScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      BottomNav={null}
      setScreen={(screen: string) => navigateTo(screen, 'teen')}
    />
  );
}
```

When adding a new screen from a Figma frame: create the visual component
under `screens/` (or `src/{teen,parent}/screens/` if it's genuinely
side-specific), then add a thin `app/(teen|parent)/<name>.tsx` wrapper
following this exact shape, then register it in the relevant
`app/(teen|parent)/_layout.tsx` `<Tabs.Screen name="..." options={{ href:
null }} />` list (unless it's one of the 5 primary tabs) so it's reachable
from `More` or in-flow navigation.

---

## 3. Frameworks & Libraries

- **UI framework:** React Native `0.85.3` + React `19.2.7`, via **Expo
  SDK 56** (`expo: ^56.0.12`).
- **Navigation:** **Expo Router** (`expo-router: ^56.2.11`) — file-based
  routing under `app/`, with route groups `(auth)`, `(onboarding)`,
  `(teen)`, `(parent)`, `(dev)`, `(modals)`. Each of `(teen)` and
  `(parent)` uses a `<Tabs>` navigator (`app/(teen)/_layout.tsx`,
  `app/(parent)/_layout.tsx`) with 5 visible tabs (Room · Pages · Calm ·
  Circle · More) and many hidden (`href: null`) sub-routes.
- **Web target:** `react-native-web ~0.21.0` — this is a real, exercised
  target (`npm run web`, `npx expo export --platform web`), not
  best-effort. Screens must render correctly under RN Web, not just
  native.
- **Styling:** `StyleSheet.create` only. **No CSS Modules, no
  styled-components, no Tailwind, no NativeWind.** Every component defines
  its own `const styles = StyleSheet.create({...})` at the bottom of the
  file (or `const s = StyleSheet.create({...})` — both conventions appear).
  Dynamic/theme-driven values are applied as inline style arrays:
  `style={[styles.card, isActive && styles.cardActive, { borderColor: accent }]}`.
- **Animation:** `Animated` API from `react-native` (not Reanimated's
  declarative hooks, despite `react-native-reanimated` being a
  dependency — it's present for library compat, not the primary animation
  idiom used in hand-written screens). Standard pattern: `useRef(new
  Animated.Value(...))`.start()` inside `useEffect`, looped via
  `Animated.loop(Animated.sequence([...]))`.
- **Icons:** primarily **emoji glyphs** as `<Text>` content (the dominant
  pattern across ~30 screens — no vector icon, just `<Text>🏠</Text>` etc.).
  `@expo/vector-icons` (`Ionicons`) is a real dependency and **is** used,
  but only in `components/chat/ChatInput.tsx` and
  `components/chat/CompanionChatHeader.tsx` — treat vector icons as the
  exception, not the house style. New screens should default to emoji
  unless matching those two chat components specifically.
- **Build/bundler:** Metro (`metro.config.js`), via `expo/metro-config`.
  Notable non-default config: `unstable_enablePackageExports = true`
  (needed for `@vercel/analytics/react` subpath imports) and an explicit
  `watchFolders: [src/]` so Metro picks up the `src/` tree correctly
  alongside legacy root-level dirs (`hooks/`, `utils/`, `screens/`, etc.
  — this repo is mid-migration from a flat root structure into `src/`,
  see `docs/RESTRUCTURE.md`).
- **Path aliases** (`tsconfig.json` + `babel.config.js`, kept in sync
  manually — if you add one, add it in both places):
  ```
  @/*              → src/*        (canonical, all new code)
  @hooks/*         → src/hooks/*
  @utils/*         → src/utils/*
  @components/*    → src/components/*
  @constants/theme → src/constants/theme.ts
  @constants/*     → src/constants/*, then constants/* (dual lookup)
  @screens/*       → screens/*    (root-level, not under src/)
  @types/*         → src/types/*
  ```
  Root-level `components/`, `hooks/`, `utils/` have **no alias** — always
  import those with relative paths.
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions) for
  persistence, Cloudflare Worker (`worker/`) for AI/voice calls. Not
  relevant to visual/design sync but relevant if a Figma flow implies new
  data — check `supabase/migrations/` before assuming a field exists.

---

## 4. Asset Management

- **Location:** `assets/images/`, flat directory (hundreds of PNGs/JPGs),
  plus `assets/images/stickers/{cloud,raylene,rylane}/` and
  `assets/images/resized-bg/` (pre-resized background variants).
- **Reference pattern:** every asset is `require()`'d **once**, into a
  named constant, inside `constants/theme.ts`, then re-exported through
  the single `IMAGES` map:
  ```ts
  // constants/theme.ts
  const rayleneNeutral = require("../assets/images/raylene-neutral-new.png");
  const rayleneHappy   = require("../assets/images/raylene-happy-new.png");
  // ...
  export const IMAGES = { rayleneNeutral, rayleneHappy, /* ~150+ more */ };
  ```
  Screens then do `<Image source={IMAGES.rayleneHappy} />` — **never**
  `require()` a new image path directly inside a screen file. If a Figma
  export needs a new asset, add the file under `assets/images/`, add one
  `const x = require(...)` line in `constants/theme.ts`, add it to the
  `IMAGES` export, then reference `IMAGES.x` from the screen.
  `constants/theme.ts` itself documents this rule in its header comment:
  *"every require() below points at a file that ACTUALLY EXISTS... when
  missing, we fall back to the closest matching real image so the bundle
  never crashes."*
- **Room/character art specifically** goes through `getRoomScene(character,
  phase)` / `getRoomPhase(now, override)` helpers (also in
  `constants/theme.ts`) rather than direct `IMAGES.x` lookup, since room
  backgrounds vary by character × time-of-day phase combinatorially.
- **Optimization:** `scripts/resize-bg.mjs` (uses `sharp`) batch-resizes
  raw background art in `assets/images/originals-bg/` down to
  `assets/images/resized-bg/` at a fixed 1080×1920. This is a one-off
  manual script, not a build-time pipeline — resized assets are committed,
  not generated on build.
- **Validation scripts** (run these after adding/renaming assets, part of
  `npm run verify:prepush`):
  - `npm run audit:runtime-assets` — checks mockup/reference art isn't
    accidentally bundled into the runtime app.
  - `npm run validate:companions` — validates the companion asset export
    contract (`scripts/validate-companion-assets.mjs`) against a versioned
    manifest; treats missing poses as `pending`, not errors, but will fail
    on assets that don't match the expected dimensions/naming for assets
    marked required.
  - `npm run verify:room-archives` — verifies pre-composite room archive
    PNGs are real (≥1MB, not corrupted/placeholder).
- **No CDN.** All assets ship in the app bundle / web export
  (`dist/assets/images/...` post `expo export`); nothing is fetched from
  a remote asset host at runtime.
- **SafeAsset component** (`components/SafeAsset.tsx`) wraps `<Image>`
  with a named fallback color + `assetName` prop for debugging — used for
  primary room/character art specifically, not universally.

---

## 5. Icon System

- **No dedicated icon component library, no SVG icon set.** The
  overwhelming majority of "icons" in this app are emoji characters
  rendered as plain `<Text>` children, e.g.:
  ```tsx
  function TabIcon({ emoji }: { emoji: string }) {
    return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
  }
  // ...
  <Tabs.Screen name="room" options={{ title: 'Room', tabBarIcon: () => <TabIcon emoji="🏠" /> }} />
  ```
  This is intentional and matches the product's "scrapbook/sticker" visual
  brief (see `docs/VISION.md`), not a placeholder waiting to be replaced.
- **Naming convention:** none needed — emoji are inline literals, chosen
  per-context (🏠 Room, 📖 Pages, 🌙 Calm, 🌐 Circle, ••• More, 🎙️ Voice,
  💜/⚡/☁️/🌙 for the four companions Raylene/Rylane/Cloud/Night
  respectively). When adding a new nav item or button, match an existing
  emoji's semantic register rather than introducing a new one ad hoc — grep
  existing screens for how a concept (e.g. "safety," "growth," "voice")
  is already represented.
- **The one exception:** `Ionicons` from `@expo/vector-icons`, used only
  in the two chat components noted in §3. If a Figma frame specifies a
  proper vector icon (not emoji), `Ionicons` is the available set — check
  https://icons.expo.fyi for the name — but confirm with the team before
  introducing vector icons to a new surface, since it's a deliberate
  deviation from the house style, not the default.
- **Companion/character "portraits"** (Raylene/Rylane/Cloud/Night art in
  various poses) are a separate concept from icons — full illustrated
  assets via `IMAGES`, not glyphs. Don't conflate the emoji icon system
  with the companion art system when translating a Figma frame; a Figma
  "avatar" element usually maps to `IMAGES.<character><pose>`, not an icon.

---

## 6. Styling Approach

- **Methodology:** inline `StyleSheet.create` per file, no CSS methodology
  in the CSS-Modules/BEM sense applies (this is React Native, not web
  CSS) — but the practical convention across the codebase is:
  - One `StyleSheet.create({...})` object per component file, named
    `styles` or `s`.
  - Style composition via array syntax:
    `style={[styles.base, condition && styles.variant, { dynamicProp }]}`.
  - Theme-driven values (colors mostly) come from `THEME_PACKS[vibe]` /
    `VIBE_PACKS[vibe]` and are spread into inline style objects at render
    time, not baked into the static `StyleSheet.create` block (since they
    vary per-user's selected companion/vibe).
- **No global stylesheet file.** There is no `global.css` or app-wide
  style reset — `constants/vibeColors.ts`'s `FOUNDATION`/`SEMANTIC`/`TYPE`/
  `SPACE`/`RADIUS` tokens are the closest thing to a global design system,
  but individual screens are **not** required to consume them uniformly
  today (many screens hardcode their own hex values, spacing, and border
  radii inline rather than referencing the shared tokens) — this is a
  known, documented gap, not a pattern to imitate. When building new UI,
  prefer the shared tokens even where existing sibling screens don't.
- **Responsive design:** primarily driven by `Dimensions.get('window')`
  read once at module load (`const { width, height } =
  Dimensions.get('window')`) rather than a responsive/breakpoint system.
  Web-specific layout constraints appear ad hoc per screen, e.g.:
  ```ts
  container: {
    ...(Platform.OS === 'web' ? { maxWidth: 520, width: '100%', alignSelf: 'center' as const } : {}),
  },
  ```
  (seen in `app/(parent)/more.tsx`). There is no shared responsive utility
  — if a Figma frame needs this treatment, replicate this `Platform.OS
  === 'web'` pattern locally rather than inventing a new breakpoint
  system.
- **Safe areas:** `react-native-safe-area-context` is a dependency;
  `SafeAreaView` is used directly in some screens (e.g. Circle), while
  others hand-roll top padding via `Platform.OS === 'ios' ? 64 : 44`
  literals. Inconsistent — check the specific screen's existing pattern
  before adding new top-of-screen chrome.

---

## 7. Project Structure

```text
Bip/
├── app/                        # Expo Router route entry points (thin wrappers)
│   ├── (auth)/                 # login, signup, limited-mode, parent-link-verify
│   ├── (onboarding)/           # welcome, age, name, identity, reflection, parent-*
│   ├── (teen)/                 # teen Tabs navigator + hidden sub-routes
│   ├── (parent)/                # parent Tabs navigator + hidden sub-routes
│   ├── (dev)/                  # founder-only Control Room (auth-gated, see below)
│   ├── (modals)/
│   ├── _layout.tsx             # root layout: AppProvider, VerificationProvider, global RouteBoundary guard
│   └── index.tsx                # splash → routes to onboarding/limited-mode/room based on state
├── screens/                    # full-page screen components (@screens/* alias)
├── components/                 # shared UI, relative-import only (no alias)
├── src/
│   ├── components/              # newer shared UI (@/components/*, @components/*)
│   ├── context/                 # AppContext (app state), VerificationContext
│   ├── constants/                # theme aliases, screenPurpose.ts (More-menu group definitions), designTokens.ts (dead)
│   ├── services/                 # routeAccess.ts, verificationState.ts, founderAudit.ts, controlRoom*.ts, etc.
│   ├── hooks/                    # useAppState, useSekretState (the ACTUAL state hook AppContext uses), useSafetyCheck, ...
│   ├── teen/ , parent/           # side-specific routes.ts, screens/, features/, assets.ts
│   ├── shared/                   # routes.ts (routeForSide() — the cross-side route resolver), shared theme/components
│   ├── features/                 # domain feature logic (identity, safety, sekret, bridge, consent, activity)
│   └── utils/                    # storage, sync, api, supabase client, navigation
├── constants/                   # ROOT-LEVEL, still canonical for theme/tokens: theme.ts, vibeColors.ts, vibeRegistry.ts
├── assets/images/                # all art, flat + stickers/ + resized-bg/
├── figma/                        # local Figma plugin (manifest.json, code.js) — palette is STALE, see §1
├── supabase/{functions,migrations}/
├── worker/                       # Cloudflare Worker (AI/voice backend)
└── docs/                         # architecture, audits, vision — several are dated; check "Last reviewed" headers
```

**Two important non-obvious facts about this structure:**

1. **The repo is mid-migration** from a flat root layout into `src/`
   (tracked in `docs/RESTRUCTURE.md`). This is why there are two
   `components/` roots, two token systems, and why some hooks
   (`useAppState.ts`) are fully superseded-but-not-deleted duplicates of
   the hook actually in use (`useSekretState.ts` — confirmed via
   `src/context/AppContext.tsx`'s `const s = useSekretState();`). **When
   in doubt about which of two similar-looking files is live, grep for
   importers** rather than assuming the newer-looking or better-named one
   wins.
2. **Feature ownership is documented, not just implied:**
   `src/constants/screenPurpose.ts` defines `TEEN_MORE_GROUPS` and
   `PARENT_MORE_GROUPS` — the canonical list of what belongs on which
   screen, with an explicit `mustNotBecome` field per entry (e.g. Voice
   Bip "mustNotBecome: ['Pages with a microphone', 'a text chat clone']").
   Check this file before adding a feature to an existing screen — it may
   already say that feature belongs somewhere else.

---

## Practical checklist for translating a Figma frame into this repo

1. Identify which side it's for (teen vs parent) and which of the 5
   primary tabs it belongs under, or whether it's a hidden sub-route.
2. Pull colors from `THEME_PACKS`/`VIBE_PACKS` (`constants/theme.ts`,
   `constants/vibeColors.ts`) — never from `figma/code.js`'s `VIBES`
   object or `src/constants/designTokens.ts` (both are stale/dead, §1).
3. Build the screen in `screens/<Name>Screen.tsx` (or
   `src/{teen,parent}/screens/` if genuinely side-specific), using
   `StyleSheet.create` and the route-wrapper pattern from §2.
4. Reference existing assets via `IMAGES.<name>` from
   `constants/theme.ts`; add new `require()` lines there if new art is
   needed, don't `require()` directly in the screen.
5. Use emoji for icons unless matching the two `Ionicons`-based chat
   components specifically (§5).
6. Register the route in the correct `app/(teen|parent)/_layout.tsx`
   `<Tabs.Screen>` list and check `src/constants/screenPurpose.ts` for
   where the feature is supposed to live before wiring navigation to it.
7. Before declaring a similar-looking existing file "the" implementation,
   grep for its importers — this repo has multiple orphaned parallel
   implementations (`screens/CircleScreen.tsx`,
   `src/hooks/useAppState.ts`, `src/constants/designTokens.ts` are three
   confirmed examples).
