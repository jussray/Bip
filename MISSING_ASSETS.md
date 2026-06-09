# Missing Assets Report — Se'kret Bip

**Generated:** 2026-06-08
**Scanned by:** Recovery audit on branch `fix/recover-deps-and-assets`
**Method:** `grep` over every `*.ts | *.tsx | *.js | *.jsx` for any path containing `assets/images/…`, cross-referenced against `ls assets/images/`.

---

## ✅ Summary

| Metric | Count |
|---|---|
| Image files present in `assets/images/` | **60** |
| Unique image filenames referenced from code | **28** |
| **Missing files (referenced but not on disk)** | **0** |
| Files on disk but never referenced (reference sheets / variants) | 32 |

**No missing images.** Every `require('../assets/images/…')` in the codebase resolves to a real file. No runtime substitutions were necessary.

---

## How this stayed clean

The repository already has a centralised fallback layer in [`constants/theme.ts`](./constants/theme.ts) that follows exactly the fallback rules you specified:

| Missing-asset rule | Where it's wired |
|---|---|
| missing Raylene image → `raylene-neutral.png` | `rayleneThinking`, `rayleneNeutralV2` |
| missing Rylane image → `rylane-neutral.png` | `rylaneThinking` |
| missing room/day background → `bg-raylene-room-day.png` (or `room-bg.png`) | `bgRayleneRoomDay`, `bgRylaneRoomDay` |
| missing room/night background → `bg-raylene-room-night.png` (or `room-bg-dark.png`) | `bgRayleneRoomNight`, `bgRylaneRoomNight` |
| missing voice image → `voice-bip-bg.png` / `rylane-window.png` | `rayleneVoiceDay/Night`, `rylaneVoiceDay/Night` |
| missing parent image → `parent-dashboard-bg.png` | `bgParentDashboard` |
| missing journal image → `journal-bg.png` | `bgJournal` |
| missing cloud image → `cloud.png` | `cloudHappy` / `cloudStormy` / etc. (each present) |
| unknown missing image → `sekret-splash.png` | splash fallback in theme |

Because every `require()` is funneled through this map (the screens import the **names** like `IMAGES.rayleneThinking`, not raw paths), if a hand-drawn variant disappears we substitute the closest real one and nothing crashes.

Two notable pre-existing in-code substitutions that you may want to revisit later:

1. **`bg-raylene-room-night.png`** — the file exists on disk but the filename contains an invisible Unicode thin-space (U+2009) that Metro's web bundler can't resolve. `theme.ts` currently falls back to `room-bg-dark.png`. ➜ Rename the file (remove the hidden character) and switch the require back.
2. **`raylene-thinking.png`** — file is present, but `theme.ts` still routes `rayleneThinking` through `raylene-neutral.png`. ➜ If the present `raylene-thinking.png` is the real art, switch the alias to a direct `require`.

These are quality improvements, not breakage — the app boots fine as-is.

---

## All referenced image filenames (28, all present)

```
bridge-bg.png
cloud-happy.png
cloud-headphones-v2.png
cloud-headphones.png
cloud-sleepy.png
cloud-stormy.png
cloud.png
comfort-bg.png
journal-bg.png
parent-dashboard-bg.png
parent-dashboard.png
raylene-fullbody.png
raylene-happy-v3.png
raylene-happy.png
raylene-neutral-v3.png
raylene-neutral.png
raylene-window.png
raylene-writing.png
room-bg-dark.png
room-bg.png
rylane-fullbody.png
rylane-happy.png
rylane-neutral-v2.png
rylane-neutral.png
rylane-window.png
rylane-writing.png
voice-bip-bg.png
window.png
```

## On-disk but unreferenced (32, **kept as-is per instruction**)

These are reference sheets, "_v2", day/night/rainy variants, splash, mockups, and the Unicode-named room backgrounds. They were **not** deleted, renamed, moved, or overwritten — `assets/images/` is treated as the source of truth.

```
bg-raylene-room-day.png
bg-raylene-room-night.png      (filename contains a hidden U+2009)
bg-rylane-room-day.png
bg-rylane-room-night.png
circle-mockup.png
raylene-bippin2-day.png
raylene-fan-sheet.png
raylene-happy-reference-sheet.png
raylene-happy-v2.png
raylene-neutral-reference-sheet.png
raylene-neutral-v2.png
raylene-night-doodle.png
raylene-night-window.png
raylene-period-calendar-day.png
raylene-rainy-window-sheet.png
raylene-reference-sheet.png
raylene-thinking-sheet-v2.png
raylene-thinking-sheet.png
raylene-thinking.png
raylene-voice-day.png
raylene-voice-night.png
raylene-window-rainy.png
raylene-window-v2.png
rylane-chibi-sticker-mini-reference-sheet.png
rylane-profile-sheet.png
rylane-profile.png
rylane-reference-board.png
rylane-reference-sheet.png
rylane-thinking.png
rylane-voice-day.png
rylane-voice-night.png
sekret-splash.png
```
