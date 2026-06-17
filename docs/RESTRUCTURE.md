# Project Restructure — In Progress

## Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Group `components/` into domain subfolders with barrel exports | ✅ Done |
| 2a | Add `screens/index.ts` barrel + move root docs into `docs/` | ✅ Done |
| 2b | Migrate string router → Expo Router file-based navigation | ⚠️ Requires dedicated PR (see note below) |
| 3 | Split `app/index.tsx` into screen-level files | 🔜 After 2b |
| 4 | Update `tsconfig.json` path aliases | 🔜 After 2b |

---

## ⚠️ Why Step 2b Is Separate

After auditing `app/index.tsx`, the app uses a **string-based custom router**:
```tsx
if (state.screen === 'home') return <HomeScreen ... />;
if (state.screen === 'circle') return <CircleScreen ... />;
// etc.
```

This is NOT Expo Router file-based navigation. Moving screen files into `app/(main)/`
without first replacing this routing system would break all navigation.

**The migration path for 2b:**
1. Replace `state.screen` string routing with `router.push()` / `router.replace()` from `expo-router`
2. Create `app/(main)/_layout.tsx` with a Stack or Tab navigator
3. Move each screen file to its route path (map below)
4. Remove the `screens/` directory only after all routes are verified working
5. Remove the giant switch block from `app/index.tsx`

This is a **dedicated PR** — do not combine with component reorganization.

---

## Component Domain Map

```
components/
├── ai/        → OracleDiscoveryPanel, SekretCompanionCard, MiniAvatarSticker
├── chat/      → BipEmptyState, MiniReactionSticker
├── layout/    → BottomNav, BackgroundLayer, PresenceAvatar
├── safety/    → AgeGate, SleepGate, ContentSafetyBlock, PrivacyLabel
└── shared/    → SafeAsset, SyncBadge, Analytics
```

## Screen → Future Expo Router Route Map (for Step 2b)

| `state.screen` value | Screen file | Target route |
|---|---|---|
| `splash` | `SplashScreen.tsx` | `app/splash.tsx` |
| `home` | `HomeScreen.tsx` / `ParentRoomScreen.tsx` | `app/(main)/index.tsx` |
| `dashboard` | `HomeScreen.tsx` | `app/(main)/dashboard.tsx` |
| `pages` | `PagesScreen.tsx` / `ParentPagesScreen.tsx` | `app/(main)/pages.tsx` |
| `circle` | `CircleScreen.tsx` / `ParentCircleScreen.tsx` | `app/(main)/circle.tsx` |
| `calm` | `CalmScreen.tsx` | `app/(main)/calm.tsx` |
| `sekret` | `SekretScreen.tsx` | `app/(main)/sekret.tsx` |
| `cloudThoughts` | `CloudThoughtsScreen.tsx` | `app/(main)/cloud.tsx` |
| `voiceBip` | `VoiceBipScreen.tsx` | `app/(main)/voice.tsx` |
| `periodCalendar` | `PeriodCalendarScreen.tsx` | `app/(main)/period-calendar.tsx` |
| `bippin2` | `Bippin2Screen.tsx` | `app/(main)/bippin.tsx` |
| `growth` | `GrowthScreen.tsx` | `app/(main)/growth.tsx` |
| `womanhood` | `WomanhoodScreen.tsx` | `app/(main)/womanhood.tsx` |
| `manhood` | `ManhoodScreen.tsx` | `app/(main)/manhood.tsx` |
| `comfort` | `ComfortScreen.tsx` | `app/(main)/comfort.tsx` |
| `mindReset` / `bodyReset` | `MindBodyResetScreen.tsx` | `app/(main)/mind-body-reset.tsx` |
| `bridge` | `BridgeScreen.tsx` | `app/(main)/bridge.tsx` |
| `s2tell` | `S2TellScreen.tsx` | `app/(main)/s2tell.tsx` |
| `parentBridge` | `ParentBridgeScreen.tsx` | `app/(main)/parent/bridge.tsx` |
| `crew` | `BipCrewScreen.tsx` | `app/(main)/crew.tsx` |
| `points` | `PointsScreen.tsx` | `app/(main)/points.tsx` |
| `comfortStreaks` | `ComfortStreaksScreen.tsx` | `app/(main)/comfort-streaks.tsx` |
| `history` | `HistoryScreen.tsx` | `app/(main)/history.tsx` |
| `more` | `MoreScreen.tsx` | `app/(main)/more.tsx` |
| `settings` | `SettingsScreen.tsx` | `app/(main)/settings.tsx` |
| `parentCircle` | `ParentCircleScreen.tsx` | `app/(main)/parent/circle.tsx` |
| `parentPages` | `ParentPagesScreen.tsx` | `app/(main)/parent/pages.tsx` |
| `parentRoom` | `ParentRoomScreen.tsx` | `app/(main)/parent/room.tsx` |

---

## Notes
- Physical screen files stay in `screens/` until Step 2b is complete — zero breaking changes.
- All new component imports should use the group barrel: `import { AgeGate } from '@/components/safety'`
- Old flat imports (`import { AgeGate } from '@/components/AgeGate'`) still work during transition.
