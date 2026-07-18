# Se'kret Bip — UX/UI Audit & Redesign Sprint

> Scope: UX/UI quality only. No new major features, no new systems, no new
> screens were added as part of this audit. This document is research +
> recommendations; implementation is a separate, follow-up effort.
>
> Method: full read of `app/index.tsx` (the app's single router), every file
> in `screens/`, `components/`, `constants/theme.ts`, `constants/styles.ts`,
> `constants/bip_voice.ts`, and supporting hooks/utils. All findings below
> are cited `file:line` and were verified against the actual code, not the
> docs — per `docs/VISION.md`'s own rule, code that contradicts the vision
> is a bug, and vision that doesn't match the code is noted as a gap.

---

## Architecture note (read this first)

Se'kret Bip is **not** routed the way Expo Router normally works. The
entire app is one component, `app/index.tsx` (~1,500 lines), holding a
single `screen: string` state value. Every "screen" is an
`if (screen === 'xyz') return (<XyzScreen .../>)` branch, and navigation is
just calling `setScreen('xyz')`. There is no URL per screen, no native back
gesture/back-button support, no deep linking, no browser history on web.
This is a **legitimate architecture for an MVP**, but it has real UX
consequences documented throughout this audit:

- "Back" only exists where a screen author manually added a button that
  calls `setScreen('home')`. It is not systemic.
- Web back/forward browser buttons cannot navigate the app.
- Nothing can be deep-linked (e.g. you can't send a teen a link straight to
  Comfort Mode).

This single fact explains a large share of the navigation findings in
Phase 1 below, and is the #1 structural reason the app "feels like a
collection of screens" rather than one product — there is no shared
navigation chrome (e.g. a header with a consistent back affordance)
because the architecture never grew one.

---

## 1. UX Audit Report

### 1.1 Screen inventory

26 screens are wired into the router (`app/index.tsx`). Two notable findings
on dead/buried code:

| Finding | Detail |
|---|---|
| **Dead file** | `screens/JournalScreen.tsx` (24KB) is never imported by anything in the app. `PagesScreen.tsx` is what actually renders for `screen === 'pages'`. JournalScreen is fully orphaned — either a superseded earlier version of Pages, or a planned merge that never happened. |
| **Deeply buried, not dead** | `S2TellScreen.tsx` (`screen === 's2tell'`) **is** reachable, but only via one quick-action tile labeled "S2 Tell" inside `HomeScreen.tsx:166`, which itself is the `dashboard` screen — itself only reachable via More → Dashboard or the Room's "Mood Check-In" window hotspot. That's a real feature (a 17KB screen) sitting 3 taps deep with zero presence in BottomNav, Room hotspots, or More's menu list. |

Full screen list and where each lives:

| Screen ID | Renders | Reachable from |
|---|---|---|
| `splash` | SplashScreen.tsx | Cold start only |
| `home` | RoomScreen.tsx (teen) / ParentRoomScreen.tsx (parent) | BottomNav (always visible) |
| `pages` | PagesScreen.tsx / ParentPagesScreen.tsx | BottomNav |
| `calm` | CalmScreen.tsx | BottomNav (teen) |
| `circle` | CircleScreen.tsx / ParentCircleScreen.tsx | BottomNav |
| `parentBridge` | ParentBridgeScreen.tsx | BottomNav (parent) |
| `more` | MoreScreen.tsx | BottomNav |
| `dashboard` | HomeScreen.tsx | More menu; Room "Mood Check-In" hotspot |
| `sekret` | SekretScreen.tsx | Room "summon" hotspot; More; Bippin2; Manhood |
| `comfort` | ComfortScreen.tsx | Room "bed" hotspot; Calm; Bippin2; MindBodyReset; SleepGate redirect |
| `cloudThoughts` | CloudThoughtsScreen.tsx | Room "cloud lamp" hotspot; More; VoiceBip |
| `bridge` | BridgeScreen.tsx | Room "bridge" hotspot; More; Circle; Sekret |
| `voiceBip` | VoiceBipScreen.tsx | More; Splash shortcut; Pages |
| `bippin2` | Bippin2Screen.tsx | More; Pages; Room "growth board" hotspot |
| `womanhood` | WomanhoodScreen.tsx | More (teen only) |
| `manhood` | ManhoodScreen.tsx | More (teen only) |
| `periodCalendar` | PeriodCalendarScreen.tsx | More (teen only); Bippin2; Womanhood |
| `growth` | GrowthScreen.tsx | More; Bippin2; Womanhood; Manhood |
| `history` | HistoryScreen.tsx | More only |
| `comfortStreaks` | ComfortStreaksScreen.tsx | More only |
| `crew` | BipCrewScreen.tsx | More only |
| `points` | PointsScreen.tsx | More only |
| `settings` | SettingsScreen.tsx | More only |
| `s2tell` | S2TellScreen.tsx | Dashboard quick action only |
| `mindReset` / `bodyReset` | MindBodyResetScreen.tsx | Calm only |

### 1.2 Where users get lost / disconnected screens

**The "More" tab is a junk drawer holding 14 of the app's 24 real screens.**
`screens/MoreScreen.tsx:89-138` is a flat, unweighted vertical list of 14
buttons in equal-weight pill style — Settings, Cloud Thoughts, Voice Bip,
Bippin2, Womanhood, Manhood, Period Calendar, Growth, History, Comfort
Streaks, Crew, Points, Bridge — with no grouping, no hierarchy, no icons
beyond a leading emoji, and no description of what's inside each. A new
teen has no way to predict that "Bippin2 / Insights" and "History" and
"Comfort Streaks" are three different progress views, or that "Growth" and
"Bippin2" are different from each other.

This single screen is the biggest UX problem in the app: more than half
its real content is functionally invisible unless a user already knows to
go looking for it.

**Two competing "home" concepts.** `RoomScreen.tsx` (`screen === 'home'`,
the BottomNav's Home tab) and `HomeScreen.tsx` (`screen === 'dashboard'`,
buried in More) both do mood display, companion presence, and quick
actions to the same destinations (Pages, Voice Bip, Calm, Circle, Comfort).
A teen who lands on Dashboard via the Room's "Mood Check-In" hotspot will
see a second, differently-styled version of the thing they just left. The
app doesn't pick a single home; it has two, and neither is positioned as
primary in the UI itself (only a code comment at `app/index.tsx:6-7`
clarifies "the Room IS the home" — a decision invisible to the user).

**Hotspots are invisible until discovered.** Room hotspots
(`RoomScreen.tsx:86-312`) are mostly bare `TouchableOpacity` hit-zones laid
over background art with no persistent visual affordance — no icon glow,
no outline. A one-time sticky-note hint appears on the Pages hotspot for
800ms on first load (`RoomScreen.tsx:794-807`) and then never again. Every
other hotspot (Cloud Lamp, Bed, Growth Board, Bridge, Mood Check-In) has no
onboarding hint at all. This means the room's main promise — "tap things in
your space to go places" — is only taught once, for one of nine hotspots.

**No systemic back affordance.** Per the architecture note above, "back"
exists only where a screen author remembered to add a button to `home`.
Settings, History, Growth, Points, ComfortStreaks, and PeriodCalendar
(`PeriodCalendarScreen.tsx:198`, via a `backTarget` prop) each have one;
Womanhood and Manhood do not have an explicit back control and rely on the
user remembering BottomNav exists.

### 1.3 Room UX pass (Phase 6)

- Room is genuinely the most "alive" surface in the app: 4 characters
  (Raylene/Rylane/Cloud/Night) each have their own hotspot map, the
  companion's pose changes by mood + time (`RoomScreen.tsx:362-444`,
  40+ greeting combinations), and a remembered-topics "I REMEMBER" tag
  surfaces continuity (`RoomScreen.tsx:516-539`). This is a strong, on-brand
  piece of design and should be the template the rest of the app is pulled
  toward, not the other way around.
- The functional cost: hit-zones aren't self-evident. A pulse-ring
  animation exists on 3 of 9 hotspots (Pages, Cloud Thoughts, Mood
  Check-In) but not the rest (Comfort/bed, Bippin2/growth board, Circle,
  Bridge, Sekret summon) — so discoverability is inconsistent even within
  the Room itself.
- Room and Dashboard overlap (see 1.2) muddies what the Room is *for*:
  is it the place you act from, or the place you admire and then go act
  somewhere else? Right now it's both, redundantly.

### 1.4 First 5 minutes (Phase 4) — see Section 4 for the full walkthrough and redesign.

### 1.5 Empty / loading / error / offline states (Phase 5)

A shared, well-written component already exists —
`components/BipEmptyState.tsx` — with four on-brand variants:

| Type | Copy |
|---|---|
| loading | "Just a second… Getting things ready for you." |
| empty | "Nothing here yet. This is your space. It's waiting for you." |
| error | "Something got stuck. It's not you. Try again whenever you're ready." + **Try again** |
| saveError | "Couldn't save right now. Your entry is still here. Tap to try saving again." + **Save again** |

But it's used in **1 of 12 screens that need it** (`PagesScreen.tsx:619`).
Everywhere else, empty states are hand-rolled per-screen plain `<Text>`
(Circle, ParentCircle, Points, Crew, History, ComfortStreaks, VoiceBip,
ParentBridge each wrote their own). The good news: the hand-rolled copy is
*also* on-voice ("circle's quiet. drop something real.",
"no crew yet. pick your 2–6.") — so the writing is consistent even though
the component isn't. This is a maintenance/consistency risk, not a tone
problem: an update to empty-state language today requires touching 11
files instead of 1.

**Error states are mostly invisible, not just unstyled.** Cloud sync
failures in `utils/sync.ts` and local storage failures in `utils/storage.ts`
only `console.warn`/`console.error` — nothing reaches the teen. Two screens
(`ParentBridgeScreen.tsx:120`, `SettingsScreen.tsx:129`) use native
`Alert.alert` with generic copy ("Please try again in a moment.",
"Something blocked the clear — try again in a bit."), which works but
breaks voice (BipEmptyState's `error` copy is warmer and already written —
it's just not being called).

**Loading states barely exist at all.** No screen outside
`BipEmptyState` shows a spinner or skeleton; nothing calls
`<BipEmptyState type="loading" />` anywhere in the codebase today.

**Offline/sync status is the one place this is actually solved well.**
`components/SyncBadge.tsx` + `hooks/useSyncStatus.ts` gives a clear,
on-brand, color-coded badge (📱 Saved on this device / ☁️ Syncing… /
✓ Synced / ⚠️ Sync failed — saved locally) and the offline-first model
(local save always succeeds, cloud is best-effort) means data loss isn't a
real risk. This pattern should be the model for error/loading states
elsewhere, not just sync.

**`ContentSafetyBlock.tsx`** (shown when a Circle post fails the safety
filter) deserves a callout for doing the hard thing well: "This one didn't
go through. Something in this post flagged our safety check. You can edit
it and try posting again — no worries." → **Edit and try again**. No shame,
no clinical language, a clear next step. This is exactly the tone the rest
of the app's error states should copy.

### 1.6 Emotional UX pass (Phase 7)

`constants/bip_voice.ts` (844 lines) is genuinely strong and consistent
with the "cool cousin" mandate in `docs/VISION.md`:

- Comfort: *"Nah come here. You don't have to hold all of that by
  yourself."* / *"You've been so strong for so long. It's okay to put it
  down for a second."*
- Encouragement: *"You didn't quit. That's the whole thing right there."*
- Crisis/emergency comfort (`bip_voice.ts:241-249`): *"Hey. Stay with me.
  I mean it."* … *"Please reach out to someone you trust tonight. That's
  not weakness. That's the bravest thing."* — warm, first-person,
  non-clinical, no diagnostic language. One real gap: **no crisis resource
  (e.g. a hotline/text line) is surfaced anywhere in this copy file or in
  `ContentSafetyBlock`.** `services/sekretVoice.ts:160` regex-detects
  serious self-harm language, but what happens downstream wasn't found in
  this audit — that's worth a dedicated, separate safety-engineering pass
  outside this UX sprint, since it's a safety-critical gap, not a polish
  item.
- Parent transparency is the standout: `ParentBridgeScreen.tsx:322-331`
  states explicitly, twice, in plain language: *"You can't read their
  journal or conversations… This is one-way warmth"* and *"they choose
  what to share back."* This directly and successfully delivers on
  VISION.md's "parents cannot spy" mandate, in copy a parent will actually
  read.
- Save confirmations are character-voiced where they exist (Bridge:
  *"sent to your person. they'll see it as a gentle note. you did
  something brave 💜"*) but are inconsistent in *existing at all* — Journal/
  Pages appears to autosave silently with no confirmation, which is fine
  for low-stakes saves but means the app never tells a teen "we got it."

---

## 2. UI Audit Report

### 2.1 What the design system actually contains today

`constants/theme.ts` defines 5 complete theme/character packs (Raylene,
Rylane, Cloud, Night, Rain/Sunset variants), each a flat object of
`background / card / accent / soft` hex colors + a room background image +
a 3-stop overlay gradient. That's it — **there is no spacing scale and no
typography scale anywhere in the codebase.** `constants/styles.ts` exports
a `createStyles(theme)` factory with reasonable shared primitives (`card`,
`button`, `journalInput`, `sectionTitle`, `moodBubble`), but it is used by
**1 of 29 screen files** (`S2TellScreen.tsx`). Every other screen defines
its own local `StyleSheet.create` from scratch.

### 2.2 Consequences of that: duplicated, drifting styles

Because nothing is shared, the same handful of UI ideas get re-invented
per screen with small, meaningless variations:

| Pattern | Re-implemented in | Drift |
|---|---|---|
| Card | HomeScreen, JournalScreen, CalmScreen, SekretScreen, + 20 more | borderRadius 18 / 20 / 22 across screens for the "same" card |
| Button | HomeScreen, JournalScreen, CalmScreen, GrowthScreen, + more | borderRadius 16-18, padding 12-16, no shared spec |
| Hero header (image + gradient + time badge) | Calm, Journal, Sekret, Growth | Same idea, 4 independent implementations |
| Mood→color map (`MOOD_GLOW`) | HomeScreen, JournalScreen, CalmScreen, SekretScreen, ComfortScreen, GrowthScreen | 6 separate hardcoded copies of "what color is sad" — already drifted (5 entries in one screen, 34 in another) |
| TextInput placeholder color | Journal (`#4a3d6b`), Sekret (`#94A3B8`), Pages (`#736c82`) | Three different "muted purple-gray" values for what should be one token |
| `SettingsScreen` VIBE_CONFIG | SettingsScreen.tsx:19-53 | Re-hardcodes per-character accent colors that already exist in `THEME_PACKS`, instead of reading them |

None of this is visually catastrophic on any single screen — it's why the
app doesn't feel *broken*. But it's exactly why it feels like "a collection
of screens" rather than one system: every screen is *almost* the same as
its neighbor, never *exactly* the same.

### 2.3 Color usage

Most screens lean on `theme`/`t` props for primary surface colors (strong:
HomeScreen ~95%, JournalScreen ~90%), but nearly every screen drops to
hardcoded hex for two specific things: the mood-color map (above) and
semi-transparent overlay backgrounds (e.g. `rgba(30,18,55,0.85)` typed
fresh in `SekretScreen.tsx:278`). These hardcoded overlays aren't wrong,
they're just untracked — nobody could grep "all overlay opacities" today
and get a clean answer.

### 2.4 Icons

100% emoji, zero vector icons (no `@expo/vector-icons`, no `Ionicons`
anywhere). This is consistent at least — it's a real, if unconventional,
icon system, and emoji fit the "scrapbook/sticker" visual brief in
VISION.md. The cost is that BottomNav, hotspots, and buttons can't get a
selected/active or disabled visual state beyond color/weight changes,
because you can't restyle an emoji glyph.

### 2.5 Modals & inputs

Modals are rare (only Circle's safety-reply modal and ParentCircle's
reactions modal) and each is bespoke — there's no shared `<Modal>`
wrapper, so any third modal added later will invent its own dimming/
animation/dismiss behavior again. TextInputs are inconsistent on
`borderRadius` (12/14/16/18/20 across 10 screens using them) and
`placeholderTextColor` (3 different grays, see 2.2).

---

## 3. Design System Recommendations

This is the fix for nearly every finding in Section 2. None of it requires
new screens or features — it's extracting what already (informally) exists
into one place, then pointing screens at it.

### Typography

| Token | Use | Spec (from observed values) |
|---|---|---|
| `type.screenTitle` | "Journal", "Calm Me" page headers | 28px, bold, white |
| `type.sectionTitle` | In-page section headers | 20px, bold, white |
| `type.body` | Card copy, paragraph text | 15px, regular, `#E2E8F0` |
| `type.caption` | Subtitle/meta text | 13px, `#CBD5E1` |

### Spacing scale

| Token | Value |
|---|---|
| `space.xs` | 4 |
| `space.s` | 8 |
| `space.m` | 16 |
| `space.l` | 20 |
| `space.xl` | 32 |

(Matches the values already in informal use across screens — this is
codifying the existing intent, not inventing new numbers.)

### Cards

One base `card` (borderRadius 20, padding 18 — already `styles.ts`'s
default) with named variants instead of one-off redefinitions:

- `card.standard` — current `createStyles().card`
- `card.memory` — Cloud Thoughts / memory-tile use (rounder, sticker-like)
- `card.sekret` — companion dialogue bubble (already exists ad hoc in
  SekretScreen/RoomScreen greeting bubbles — promote to a shared variant)
- `card.crew` — BipCrewScreen member tiles
- `card.comfort` — ComfortScreen's softer, lower-contrast surface

### Buttons

`button.primary` (filled, accent bg, white text — current default),
`button.secondary` (outline, accent border, accent text),
`button.ghost` (text-only, no border/fill — for low-emphasis actions like
"skip" or "not now"), `button.danger` (used today only in Settings'
"clear my data" flow, which currently looks identical to every other
button — a real safety/clarity gap for a destructive action).

### Colors

- **Core Se'kret palette**: promote the existing 5 `THEME_PACKS` as-is —
  they're good. Just make `SettingsScreen.tsx` read from them instead of
  maintaining its own `VIBE_CONFIG` copy.
- **Parent palette**: there isn't a distinct one today — Parent screens
  reuse teen theme packs. Worth a deliberately calmer/more neutral
  accent (the green badge tones already ad hoc in `HomeScreen.tsx:691-694`
  hint at what this could be) so a parent glancing at the screen
  immediately registers "this is the adult side," not just via copy.
- **Mood palette**: consolidate the 6 duplicated `MOOD_GLOW` maps into one
  exported `constants/moodGlow.ts`, single source of truth, imported
  everywhere.

### Net effect

If `constants/styles.ts` (already written, already reasonable) became the
actual default — instead of being used by 1 of 29 screens — most of
Section 2's findings disappear without touching a single pixel of the
app's actual visual identity, since the values being standardized are the
values already in majority use.

---

## 4. First-Time User Journey

### Current path (verified against code)

1. **App opens → Splash** (`screens/SplashScreen.tsx`). Branded full-bleed
   art, "ENTER SE'KRET BIP" CTA, plus 4 shortcut icons (Write It Out, Voice
   Bip, Calm Me, Circle) that skip straight past Home on first launch.
2. **Age Gate** (`components/AgeGate.tsx:25-83`): "Quick check before we
   start. How old are you?" → 13–17 / parent-guardian / under 13. This is
   the first words-on-screen moment for a brand-new teen, and it's a
   compliance gate, not a welcome. There is no "what is this app" framing
   before this question — VISION.md's own brief for the Opening Screen
   ("Purpose: Immediately create emotional safety… Feeling: Entering your
   safe space, not opening an app") is not yet what's in code: a teen sees
   an age-verification form before they see Raylene, Rylane, or Cloud say
   anything to them.
3. **Lands on Room** (`RoomScreen.tsx`). First-ever visit triggers a
   "fullbody" companion pose and (only on the Pages hotspot) an 800ms hint
   bubble. No other onboarding — the teen is in a fully-built room with 9
   tappable zones and no map.

### Does VISION.md's bar get met?

| Question | Verdict |
|---|---|
| Do they understand what this is? | **Not yet.** Splash's CTA is "ENTER SE'KRET BIP," not an explanation. The app's actual one-line identity ("a trusted older cousin in your pocket") never appears in onboarding copy anywhere in the code reviewed. |
| Do they understand who the Se'krets are? | **Partially.** Splash shows the characters visually; nothing in code introduces them by name/role before the user is expected to pick or interact with one. |
| Do they know what to do first? | **No.** Room hands them 9 hotspots with one hint shown once. |
| Do they get a fast win? | **No explicit one.** There's no "do this one small thing and get a streak/point/acknowledgment" moment in the first session — Points/Streaks exist but are buried in More, invisible during onboarding. |

### Recommended fix (UX only, no new screens)

This can be solved with **copy and sequencing changes to screens that
already exist** — no new screen needed, per the sprint's own constraint:

1. Before the Age Gate, or merged into the same beat, give Splash one
   added line of voice copy that names the experience ("This is your
   space. Raylene, Rylane, and Cloud are here whenever you need them.")
   so the very first thing a teen reads is in-voice, not a form.
2. On first Room visit, extend the existing hint pattern (already built —
   `RoomScreen.tsx:794-807`) from 1 hotspot to a short, skippable sequence
   across the 3-4 most important hotspots (Pages, Comfort, Sekret summon),
   reusing the same sticky-note component instead of building anything new.
3. Give the first journal entry, first mood check-in, or first companion
   chat an explicit, small celebratory acknowledgment (a toast/sticker
   reusing `MiniReactionSticker.tsx`, which already exists) so "first win"
   isn't buried behind a trip to Points in More.

---

## 5. Returning User Journey

A returning teen's experience is, by contrast, one of the app's genuine
strengths and worth protecting through any redesign:

- Room remembers mood, time of day, and recent topics
  (`RoomScreen.tsx:516-539`, the "I REMEMBER" tag), so day 2 already feels
  different from day 1 — this is "my space, my pace" working as intended.
- `SyncBadge` quietly confirms "your stuff is safe" without ceremony.
- Comfort Streaks / Points exist to reward return visits with non-punitive
  language ("we see you," per VISION.md) — but because they live only in
  More, a returning teen has to *go looking* for the reward instead of
  being shown it. The Room (the one screen they always land on) currently
  says nothing about streaks/points at all.

**The fix is exposure, not invention**: surface a small, optional streak/
points indicator inside the Room or its greeting bubble (which already
renders dynamic text) rather than requiring a trip to More to see "you've
been showing up."

---

## 6. Top 10 Quick Wins

Ranked by impact-to-effort; all are copy/wiring changes to existing
components, no new screens:

1. **Use `BipEmptyState` everywhere instead of hand-rolled empty text** —
   component already exists and is on-voice; just swap 11 screens to call
   it (`Circle`, `ParentCircle`, `Points`, `Crew`, `History`,
   `ComfortStreaks`, `VoiceBip`, `ParentBridge`, etc.).
2. **Route sync/save failures through `BipEmptyState`'s `error`/`saveError`
   copy instead of `console.warn` or generic `Alert.alert`** — the warm
   copy is already written, it's just not being called from
   `utils/sync.ts` / `utils/storage.ts` failure paths.
3. **Make `SettingsScreen.tsx` read accent colors from `THEME_PACKS`
   instead of its own hardcoded `VIBE_CONFIG`** — removes one whole class
   of color drift in one file.
4. **Consolidate the 6 duplicated `MOOD_GLOW` maps into one exported
   constant** and import it everywhere — stops "what color is sad" from
   silently drifting screen to screen.
5. **Unify the 3 different `placeholderTextColor` grays** across
   TextInputs into one token.
6. **Add the missing hint bubbles to the Room's other hotspots** (Comfort/
   bed, Growth Board, Bridge, Sekret summon) using the sticky-note
   component that already exists for the Pages hotspot — fixes
   inconsistent discoverability with no new UI.
7. **Add a visible back affordance to Womanhood and Manhood** (they
   currently have none) — one line of code each, matching the back chip
   already used in Growth/Settings/History/PeriodCalendar.
8. **Extend `SettingsScreen`'s existing danger-button treatment (red
   border/background, already used on "Clear data on this device",
   `SettingsScreen.tsx:400-404`) to any other destructive action** added in
   the future, and use it as the house style for `button.danger` in the
   design system (Section 3) instead of letting each screen invent its own.
9. **Surface points/streaks inside the Room greeting** instead of only in
   More — the greeting text is already dynamic, this is one more
   conditional line.
10. **Delete or revive `screens/JournalScreen.tsx`** — it's dead code
    (24KB, unused, unreachable). If `PagesScreen.tsx` fully supersedes it,
    remove it; if it has logic Pages is missing, decide and merge. Either
    way it shouldn't sit unreferenced.

---

## 7. Top 10 High-Impact Redesigns

Ranked by impact; these are structural/cross-cutting, still UX-only (no
new screens, no new systems), but bigger lifts than Section 6:

1. **Reorganize the "More" tab into grouped sections** (e.g. "Talk to
   someone," "Track your growth," "Just for you") instead of one flat list
   of 14 equal-weight buttons. This is the single highest-impact change in
   the app — it's where most of the app's actual content currently goes to
   die.
2. **Resolve Room vs. Dashboard into one home.** Decide whether Dashboard
   is a "stats" sub-view of Room or should be retired in favor of folding
   its unique content (Bip Wins, mood history) into Room itself. Today they
   silently compete for the same job.
3. **Adopt `createStyles()`/a real design-system file as the default for
   new and touched screens**, retiring the pattern of every screen
   defining its own card/button/header from scratch. (Section 3 above is
   the spec; this is the execution.)
4. **Give the app one shared navigation chrome primitive** — even a simple
   reusable header component with a consistent back affordance — so "can I
   get back" stops being a per-screen decision.
5. **Promote the Room's hint/discovery pattern to a first-session guided
   tour** across all 9 hotspots (still inside the existing Room screen,
   no new screen), so the room's core promise ("tap things to go places")
   is taught once, completely, instead of partially.
6. **Build one shared Modal wrapper** so Circle's and ParentCircle's modals
   (and any future one) share consistent dimming/animation/dismiss
   behavior instead of each being bespoke.
7. **Give Parent-side screens a visually distinct accent treatment**
   (not just different copy) so "I am in Parent Space" is legible at a
   glance, not just from text.
8. **Make S2Tell discoverable from somewhere a teen will actually find it**
   — today it's a real, finished screen sitting behind Dashboard's quick
   actions, itself buried in More. Either give it a Room hotspot or a More
   entry; right now it might as well not exist for most users.
9. **Standardize loading state across async actions** (saving an entry,
   sending a Bridge message, posting to Circle) using `BipEmptyState`'s
   `loading` variant, so "did this work?" never has to be guessed from a
   blank moment.
10. **Add a crisis-resource surfacing path** alongside the existing warm
    `EMERGENCY_COMFORT` copy — this is flagged as high-impact but it's a
    safety decision, not a pure UX one, and should go through whoever owns
    safety/legal review before implementation, not be designed solo in a
    UX sprint.

---

## 8. Product Cohesion Score

Scored 1-5 (5 = fully cohesive) across four axes, based on direct
inspection of each screen's code. Screens marked "sampled" were read in
full; others are scored from the patterns confirmed to apply codebase-wide
(no `createStyles` usage, emoji-only icons, no spacing scale) plus a
direct check of their navigation wiring.

| Screen | Visual consistency | Emotional consistency | Navigation consistency | Se'kret Bip identity | Notes |
|---|---|---|---|---|---|
| Room (Home) | 4 | 5 | 3 | 5 | Strongest identity in the app; nav consistency dinged only for inconsistent hotspot affordance |
| Splash | 4 | 3 | 3 | 4 | Good art, but identity-first copy arrives after the age gate, not before |
| Pages/Journal | 4 | 5 | 4 | 5 | Uses shared empty state; on-voice; clear purpose |
| Calm | 3 | 4 | 4 | 4 | Own hero-header reimplementation, otherwise solid |
| Comfort | 3 | 5 | 3 | 5 | Best-in-class tone; gated by SleepGate in a way that can feel restrictive without explanation |
| Sekret | 3 | 5 | 3 | 5 | Companion chat is strong; local hardcoded overlay colors hurt visual consistency |
| Circle | 3 | 4 | 4 | 4 | Modal is bespoke; safety-block copy is excellent |
| Bridge | 3 | 5 | 4 | 5 | Parent-transparency copy is a model for the rest of the app |
| Parent Bridge | 3 | 5 | 4 | 4 | Same strength as Bridge; parent visual identity not distinct |
| More | 2 | 3 | 2 | 3 | Flat, unweighted list; biggest single cohesion problem in the app |
| Dashboard | 2 | 3 | 2 | 3 | Redundant with Room; unclear purpose |
| Settings | 2 | 3 | 4 | 3 | Own hardcoded `VIBE_CONFIG` instead of theme tokens |
| Bippin2 / Growth / Womanhood / Manhood / PeriodCalendar | 3 | 4 | 3 | 4 | Consistent voice, inconsistent back affordance, own style blocks |
| History / Points / ComfortStreaks / Crew | 3 | 4 | 2 | 3 | On-voice empty states, but invisible unless a user already knows to dig into More |
| S2Tell | 3 | 4 | 1 | 4 | Functionally complete, navigationally almost unreachable |

**Overall product cohesion: ~3.2 / 5.**

The app is emotionally cohesive (the writing voice is consistently strong
everywhere it was sampled) and has one genuinely excellent flagship surface
(Room). It is held back from feeling like "one product" mainly by **(a)**
a navigation structure that hides most of its content behind one
undifferentiated list, and **(b)** a styling layer that was clearly
designed once (`constants/styles.ts`) and then bypassed almost everywhere,
so every screen is a close-but-not-quite cousin of every other screen
instead of a sibling.

---

## Summary

Nothing here requires new screens, new systems, or new major features —
consistent with this sprint's mandate. The single highest-leverage move
available is making the design system and empty/error-state components
that **already exist** (`constants/styles.ts`, `BipEmptyState`) the actual
default everywhere, and reorganizing the More tab so the app's real content
stops being invisible. Both are UX/UI-only changes that would move the
cohesion score meaningfully without touching what already works: the
voice, the Room, and the parent-trust messaging.
