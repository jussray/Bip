# Image Asset Audit — Se'kret Bip

**Audited:** 2026-06-10
**Scope:** every file in `assets/images`, every image reference in `constants/theme.ts`, `screens/*.tsx`, `components/*.tsx`, `app/index.tsx`, and the requested `app/_layout.tsx` path.

## Runtime policy

Only files listed as **loadable** below may be passed to React Native's image loader. The two-byte placeholders remain in the repository as requested, but `constants/theme.ts` maps their logical roles to loadable existing fallbacks. No image was generated, deleted, or overwritten.

`app/_layout.tsx` does not exist in this checkout. The active root is `app/index.tsx`.

## Asset map used by the app

| Role | Logical mapping | File actually loaded | Notes |
|---|---|---|---|
| Splash | `IMAGES.sekretSplash` | `bg-raylene-room-night.png` | `sekret-splash.png` is an exact duplicate of the parent dashboard mockup and is intentionally not loaded. |
| Raylene room — day | `IMAGES.bgRayleneRoomDay` | `bg-raylene-room-night.png` | Dedicated day file is corrupt; valid dedicated room artwork fallback. |
| Raylene room — evening | `IMAGES.bgRayleneRoomEvening` | `bg-raylene-room-night.png` | Valid dedicated room artwork fallback. |
| Raylene room — rain | `IMAGES.bgRayleneRoomRain` | `bg-raylene-room-night.png` | Rain/window candidates are corrupt; valid dedicated room artwork fallback. |
| Raylene room — night/deep night | `IMAGES.bgRayleneRoomNight` / `DeepNight` | `bg-raylene-room-night.png` | Valid dedicated room artwork. |
| Rylane room — day/evening/rain/night | `IMAGES.bgRylaneRoom*` | `bg-raylene-room-night.png` | All dedicated Rylane room files are corrupt; valid room-art fallback. |
| Raylene avatars | `IMAGES.rayleneNeutral`, `Happy`, `Writing`, `Window`, `Fullbody` | matching loadable files | Thinking/voice/rain/night variants use the closest loadable Raylene avatar. |
| Rylane avatars | `IMAGES.rylaneNeutral`, `Happy`, `Writing`, `Window`, `Fullbody` | matching loadable files | Thinking/profile/voice variants use the closest loadable Rylane avatar. |
| Clouds | `IMAGES.cloud*` | matching `cloud*.png` files | All six cloud files are loadable. |
| Circle background | `IMAGES.bgCircle` | `room-bg-dark.png` | Circle no longer borrows companion room art; corrupt `circle-mockup.png` is not loaded. |
| Circle preview | `IMAGES.circleMockup` | `cloud-happy.png` | Safe existing preview fallback for corrupt mockup. |
| Parent dashboard | `IMAGES.parentDashboard` / `bgParentDashboard` | `parent-dashboard.png` / `parent-dashboard-bg.png` | Restricted to parent dashboard surfaces. |

## Corrupt / unloadable files

Each file below is exactly two bytes (`CRLF`) and fails image decoding:

- `bg-raylene-room-day.png`
- `bg-rylane-room-day.png`
- `bg-rylane-room-night.png`
- `circle-mockup.png`
- `raylene-bippin2-day.png`
- `raylene-fan-sheet.png`
- `raylene-happy-reference-sheet.png`
- `raylene-happy-v2.png`
- `raylene-neutral-reference-sheet.png`
- `raylene-neutral-v2.png`
- `raylene-night-doodle.png`
- `raylene-night-window.png`
- `raylene-period-calendar-day.png`
- `raylene-rainy-window-sheet.png`
- `raylene-reference-sheet.png`
- `raylene-thinking-sheet-v2.png`
- `raylene-thinking-sheet.png`
- `raylene-thinking.png`
- `raylene-voice-day.png`
- `raylene-voice-night.png`
- `raylene-window-rainy.png`
- `raylene-window-v2.png`
- `rylane-profile.png`
- `rylane-thinking.png`
- `rylane-voice-day.png`
- `rylane-voice-night.png`

## Loadable image files

The following 34 files fully decode. Several contain JPEG data despite a `.png` filename; React Native/Expo accepts them by signature, and they were not renamed because no casing or hidden-character defect exists.

- `bg-raylene-room-night.png` — JPEG, 960×251
- `bridge-bg.png` — JPEG, 1024×1536
- `cloud-happy.png` — PNG, 960×854
- `cloud-headphones-v2.png` — PNG, 960×845
- `cloud-headphones.png` — JPEG, 960×845
- `cloud-sleepy.png` — PNG, 1363×1154
- `cloud-stormy.png` — PNG, 960×850
- `cloud.png` — JPEG, 960×854
- `comfort-bg.png` — JPEG, 960×259
- `journal-bg.png` — JPEG, 960×291
- `parent-dashboard-bg.png` — JPEG, 1024×1536
- `parent-dashboard.png` — JPEG, 1024×1536
- `raylene-fullbody.png` — JPEG, 352×444
- `raylene-happy-v3.png` — PNG, 351×439
- `raylene-happy.png` — JPEG, 408×374
- `raylene-neutral-v3.png` — PNG, 1167×1348
- `raylene-neutral.png` — JPEG, 352×444
- `raylene-window.png` — JPEG, 352×444
- `raylene-writing.png` — JPEG, 354×443
- `room-bg-dark.png` — JPEG, 960×251
- `room-bg.png` — JPEG, 960×261
- `rylane-chibi-sticker-mini-reference-sheet.png` — PNG, 1129×1393
- `rylane-fullbody.png` — JPEG, 1086×1448
- `rylane-happy.png` — PNG, 1295×1215
- `rylane-neutral-v2.png` — JPEG, 1122×1402
- `rylane-neutral.png` — JPEG, 1086×1448
- `rylane-profile-sheet.png` — PNG, 960×581
- `rylane-reference-board.png` — JPEG, 960×581
- `rylane-reference-sheet.png` — JPEG, 1024×1536
- `rylane-window.png` — JPEG, 942×1536
- `rylane-writing.png` — JPEG, 1122×1402
- `sekret-splash.png` — JPEG, 1024×1536 (wrong role: duplicate parent dashboard)
- `voice-bip-bg.png` — JPEG, 960×291
- `window.png` — JPEG, 306×499

## Exact duplicate / renamed-content groups

- `parent-dashboard.png` = `sekret-splash.png` (byte-for-byte identical). This is why the latter must not be used for splash.
- `raylene-fullbody.png` = `raylene-neutral.png` = `raylene-window.png`.
- `rylane-fullbody.png` = `rylane-neutral.png`.
- All 26 corrupt placeholders are byte-for-byte identical CRLF files.

## Missing references and filename safety

- No referenced path is absent from disk after this fix.
- No `require()` points to a corrupt placeholder after this fix.
- No current asset filename contains hidden Unicode, trailing whitespace, or a casing mismatch. Historical commits contained a thin-space variant of the Raylene night room name, but the current filename is clean; therefore no rename was performed.

## Navigation verification

- Splash CTA routes to `home`, which renders `RoomScreen`.
- Bottom navigation contains both **Room** (`home`) and **More** (`more`).
