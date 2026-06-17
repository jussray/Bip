# Project Restructure — In Progress

## Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Group `components/` into domain subfolders with barrel exports | ✅ Done |
| 2 | Migrate `screens/` into `app/` Expo Router file structure | 🔜 Next |
| 3 | Split `app/index.tsx` (47KB) into modular screen files | 🔜 Pending |
| 4 | Move root docs (`DEPLOYMENT.md`, `SETUP_GUIDE.md`, etc.) into `docs/` | 🔜 Pending |
| 5 | Move `fix-aliases.py` into `scripts/` | 🔜 Pending |
| 6 | Update `tsconfig.json` path aliases for `src/` layout | 🔜 Pending |

## Component Domain Map

```
components/
├── ai/        → OracleDiscoveryPanel, SekretCompanionCard, MiniAvatarSticker
├── chat/      → BipEmptyState, MiniReactionSticker
├── layout/    → BottomNav, BackgroundLayer, PresenceAvatar
├── safety/    → AgeGate, SleepGate, ContentSafetyBlock, PrivacyLabel
└── shared/    → SafeAsset, SyncBadge, Analytics
```

## Screen → Route Map (Step 2)

| Screen file | Target Expo Router path |
|-------------|-------------------------|
| `HomeScreen.tsx` | `app/(main)/index.tsx` |
| `BipCrewScreen.tsx` | `app/(main)/crew.tsx` |
| `Bippin2Screen.tsx` | `app/(main)/bippin.tsx` |
| `BridgeScreen.tsx` | `app/(main)/bridge.tsx` |
| `CalmScreen.tsx` | `app/(main)/calm.tsx` |
| `CircleScreen.tsx` | `app/(main)/circle.tsx` |
| `CloudThoughtsScreen.tsx` | `app/(main)/cloud.tsx` |
| `ComfortScreen.tsx` | `app/(main)/comfort.tsx` |
| `ComfortStreaksScreen.tsx` | `app/(main)/comfort-streaks.tsx` |
| `GrowthScreen.tsx` | `app/(main)/growth.tsx` |
| `HistoryScreen.tsx` | `app/(main)/history.tsx` |
| `JournalScreen.tsx` | `app/(main)/journal.tsx` |
| `ManhoodScreen.tsx` | `app/(main)/manhood.tsx` |
| `MindBodyResetScreen.tsx` | `app/(main)/mind-body-reset.tsx` |
| `MoreScreen.tsx` | `app/(main)/more.tsx` |
| `PagesScreen.tsx` | `app/(main)/pages.tsx` |
| `ParentBridgeScreen.tsx` | `app/(main)/parent/bridge.tsx` |
| `ParentCircleScreen.tsx` | `app/(main)/parent/circle.tsx` |
| `ParentPagesScreen.tsx` | `app/(main)/parent/pages.tsx` |
| `ParentRoomScreen.tsx` | `app/(main)/parent/room.tsx` |
| `PeriodCalendarScreen.tsx` | `app/(main)/period-calendar.tsx` |

## Notes
- Physical component files stay in `components/` root until Step 2 is complete — **zero breaking changes** at Step 1.
- All new imports should use the group barrel: `import { AgeGate } from '@/components/safety'`
- Old flat imports (`import { AgeGate } from '@/components/AgeGate'`) still work during transition.
