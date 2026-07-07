# Parent Parity OODA Ledger

Tracks [Goal #283](https://github.com/jussray/Bip/issues/283).

Baseline: `main` at `0190919b5d18d11db7d1d1e4a16f74fd5b423421`.

## Product rule

Parent parity means equal production readiness, not equal access. Teen-private data remains deny-by-default and must be protected by backend authorization/RLS rather than UI hiding.

## Status legend

- **Confirmed**: traced in current code.
- **Partial**: route/UI exists but the full state → service → backend → return path is not yet proven.
- **Unknown**: requires deeper trace or live verification.
- **P0**: privacy/security boundary.
- **P1**: broken core journey.
- **P2**: incomplete production parity.
- **P3**: enhancement.

## Canonical route inventory

### Teen

Bottom navigation: Room, Pages, Calm, Circle, More.

Hidden/in-flow routes currently declared by `app/(teen)/_layout.tsx`:

- calm/breathe
- circle/feed, circle/[id], circle/weather
- user-room
- sekret, companion-chat, chat/index, chat/[personalityId]
- voicebip
- cloud, cloudThoughts, comfort
- crew
- settings, profile
- points, chores, history
- bridge, s2tell
- period-calendar
- discover
- bippin2, bippin2/womanhood, bippin2/manhood
- growth, mind-body-reset
- pages/[id], pages/history, pages/new
- resources

Teen layout currently performs:

- app-context loading guard;
- side enforcement and parent redirect;
- non-teen redirect to root;
- teen onboarding completion check;
- session-start analytics;
- safety experience sheet;
- global mood action.

### Parent

Bottom navigation: Room, Pages, Calm, Circle, More.

Hidden/in-flow routes currently declared by `app/(parent)/_layout.tsx`:

- dashboard (currently an alias redirect to Bridge signals)
- circle/[id], circle/weather
- bridge
- voicebip, voicereflect
- settings, profile
- s2tell, repair
- period-calendar
- sekret
- growth
- resources
- approvals

Parent route constants also exist in `src/parent/routes.ts` for the canonical route set.

## Capability ledger

| Domain | Teen capability | Parent counterpart | Current implementation | Data source / service | Consent / RLS boundary | Gap | Priority | Verification |
|---|---|---|---|---|---|---|---|---|
| Role and route protection | Teen layout blocks parent/non-teen access and requires onboarding completion | Parent layout should block teen/non-parent access and enforce parent readiness | Teen: confirmed. Parent: tabs mount directly with no equivalent guard in `app/(parent)/_layout.tsx` | `AppContext`, local onboarding state, router | Wrong-role access must be denied before parent surfaces render; backend remains authoritative | Add canonical parent role/session/onboarding guard and tests. Confirm root/deep-link behavior. | **P0/P1** | Code trace confirmed; runtime test pending |
| Primary navigation | Room, Pages, Calm, Circle, More | Same five parent destinations | Both layouts declare matching bottom-nav structure | Expo Router | Role-scoped routes only | Confirm every tab has complete back/deep-link behavior and no cross-side escape | P1/P2 | Partial |
| Parent route registry | Teen routes declared in layout/shared routes | Parent constants in `src/parent/routes.ts` | Parent constants cover core destinations but layout additionally declares `dashboard` and Circle child routes | `src/parent/routes.ts`, `shared/routes` | Route generation must preserve side | Reconcile one canonical route map; detect missing/unused aliases | P2 | Partial |
| Dashboard / home | Teen Room is a real destination | Parent Room plus Dashboard alias | `room.tsx` adapts `ParentRoomScreen`; `dashboard.tsx` redirects to `bridge?tab=signals` | `AppContext`, ParentRoomScreen, Bridge summary | Only authorized shared/summary data | Decide whether dashboard is intentionally retired alias or missing product surface; remove ambiguity | P1/P2 | Confirmed route behavior; product intent pending |
| Parent linking | Teen approval/link flow | Parent setup/link/verify flow | Files and migrations exist for parent setup, parent link verification, limited mode and reconciled link contract | `parentLink` utilities + Supabase migrations | Teen consent and relationship state authoritative | Trace valid/pending/expired/rejected/blocked/removed/relink flows end to end | P0/P1 | Unknown |
| Bridge / S2Tell | Teen explicitly shares supported items | Parent reads summaries/signals and responds where allowed | Parent Bridge route uses `ParentBridgeSummaryScreen`; S2Tell and repair routes exist | Bridge services, Supabase views/tables | Parent sees only explicit shares, approved aggregates or safety contract data | Trace read/write/idempotency/read-state and verify no raw private reconstruction | **P0/P1** | Partial |
| Pages / reflection | Teen journals/pages/history/new/detail | Parent Pages and Voice Reflect | Parent routes/screens exist | Local state and/or Supabase not yet fully traced | Parent-owned entries isolated from teen-private entries | Prove save/reload/edit/delete, account partitioning, failure states and sync | P1/P2 | Unknown |
| Se’kret / AI | Teen companion chat and character flows | Parent Se’kret route | Parent route exists | AI/worker/service path not yet traced | Parent conversations are parent-owned; no leakage from teen memory/history | Trace prompt context, persistence, history isolation and error handling | P0/P2 | Unknown |
| Voice | Teen Voice Bip | Parent Voice Bip / Voice Reflect | Routes exist | Recording/storage/transcription/TTS paths not yet traced | Private media bucket ownership and explicit sharing | Trace permissions, upload, retry, playback, cleanup and account switching | P0/P1 | Unknown |
| Calm | Teen Calm and breathe flow | Parent Calm | Routes exist | Feature implementation not yet traced | Parent-local data | Compare completion, empty/error states and accessibility | P2 | Unknown |
| Circle | Teen Circle/feed/detail/weather | Parent Circle/feed/detail/weather/community | Parent route tree and parent community migration exist | Supabase Circle tables/services | Parent and teen communities/identities must remain correctly scoped | Trace pagination, moderation, identity, reporting and RLS | P0/P1/P2 | Unknown |
| Growth | Teen Growth | Parent Growth | Route exists | Snapshot/summary services not yet traced | Aggregates must not reveal private raw content | Verify source, explanations, empty/stale state and RLS | P0/P2 | Unknown |
| Approvals / safety | Teen requests/consent and safety experience | Parent approval queue/actions | Parent approvals route/screen/utilities and verification migrations exist | Supabase functions/tables | Actions permission-checked, auditable and idempotent | Trace both-side state propagation and retry/duplicate behavior | P0/P1 | Unknown |
| Period calendar | Teen-owned period data | Parent access route exists | Both sides declare a route | Data contract not yet traced | Must be explicitly shared/authorized; never implied by linkage alone | Establish exact product contract and verify RLS/UI wording | **P0** | Unknown |
| Settings / lifecycle | Teen profile/settings/logout/cache clear | Parent profile/settings/logout/cache clear | Routes exist | AppContext, AsyncStorage, Supabase auth | Cross-account cache isolation | Verify logout, account switch, unlink, deletion and stale snapshot clearing | **P0/P1** | Unknown |
| Analytics / observability | Teen logs session start | Parent equivalent not visible in parent layout | Teen confirmed; parent unproven | `logEvent` | Avoid sensitive raw-content telemetry | Add role-safe parent journey telemetry and error visibility where absent | P2 | Partial |
| Route smoke coverage | Expanded frontend smoke coverage recently landed | Parent canonical routes should be included | Recent commit says frontend route smoke coverage expanded | Test suite | No privacy implication alone | Inspect exact coverage and add missing role/deep-link assertions | P1/P2 | Unknown |
| Visual/accessibility parity | Teen has safety sheet and global mood affordance integrated at layout level | Parent tabs currently only add side-safe back control | Parent route/screens exist | React Native UI | Adult-specific design; no need for identical widgets | Audit small-screen layout, keyboard, focus, labels, contrast, loading/empty/error states | P2 | Unknown |

## First confirmed finding

### PP-001 — Parent route group lacks the equivalent role/session guard

**Classification:** P0 privacy boundary + P1 broken journey risk.

**Evidence:**

- `app/(teen)/_layout.tsx` waits for context/profile checks, redirects parent users to the parent route group, redirects unknown roles to root, and blocks incomplete teen onboarding.
- `app/(parent)/_layout.tsx` currently returns the parent tab navigator directly and does not read `userSide`, auth/session readiness or parent onboarding/link readiness.

**Why it matters:**

A parent route deep link can render the parent navigation shell without the same client-side side enforcement used by the teen route group. Backend RLS must still prevent data access, but the inconsistent shell behavior can cause wrong-role UI exposure, broken navigation, misleading empty states and unsafe future assumptions.

**Required fix contract:**

1. Introduce one canonical parent route-group guard using authenticated role/profile state—not only a mutable local side preference.
2. Preserve development split-view behavior only behind an explicit development gate.
3. Redirect teen users to `/(teen)/room` and unauthenticated/unknown users to the correct entry flow.
4. Define and enforce parent onboarding/link readiness separately from relationship approval; an unlinked parent may still require a legitimate limited-mode surface.
5. Add deep-link tests for parent, teen, unauthenticated, unknown-role and loading states.
6. Prove backend RLS denies unauthorized reads even if UI routing is bypassed.

## Next Observe pass

Trace these vertical paths before implementation broadens:

1. Root/auth role resolution → parent onboarding → parent-link verification → parent room.
2. Parent room/dashboard → Bridge summary/signals → response write → teen receipt.
3. Parent Pages/Voice Reflect → storage/database → reload → logout/account switch.
4. Parent approvals → backend action → teen-side state update.
5. Parent Circle feed/detail/weather → community tables/RLS/moderation.
6. Settings/logout/unlink → local cache purge and subscription teardown.

For each path capture:

- route entry and guard;
- screen/component owner;
- hook/service owner;
- table/view/RPC/storage bucket;
- RLS policy or authorization check;
- loading/empty/error/retry behavior;
- automated tests;
- live verification evidence.

## Definition of Observe complete

Observe is complete when every parent route is assigned a canonical owner, every network-backed surface has a traced backend contract and RLS boundary, every core journey has a reproducible test path, and all findings are classified P0–P3 without relying on file presence as proof of completion.
