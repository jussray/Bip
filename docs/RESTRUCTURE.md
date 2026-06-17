# Project Restructure — June 2026

## What Changed

### `app/index.tsx` Split (47 KB → ~200 lines)

The original monolithic file has been decomposed into focused modules:

| New File | What It Contains |
|---|---|
| `app/_layout.tsx` | Expo Router root layout, Analytics, env validation |
| `src/store/useAppStore.ts` | `AppState` type + `useAppStore()` hook (all useState) |
| `src/hooks/useAppEffects.ts` | All 6 useEffect blocks (load, sync, save, streak, message) |
| `src/handlers/actionHandlers.ts` | Mood, journal, circle, oracle, crew mutations |
| `app/index.tsx` | Thin shell — mounts state, effects, handlers, renders route |

### Path Aliases

Update `tsconfig.json` and `babel.config.js` to add:

```json
{
  "paths": {
    "@/store/*":    ["src/store/*"],
    "@/handlers/*": ["src/handlers/*"]
  }
}
```

## Next Steps

1. **Migrate `screens/` into `app/(main)/`** — one route file per screen
2. **Group `components/`** into `ai/`, `safety/`, `layout/`, `chat/`, `shared/`
3. **Move root-level docs** to `docs/` folder
4. **Zustand migration** — swap `useAppStore` (currently `useState`) for a real store
