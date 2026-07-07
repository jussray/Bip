# Parent Entry and Linking Trace

Tracks the first Observe path from [Goal #283](https://github.com/jussray/Bip/issues/283):

> Root/auth role resolution → parent onboarding → parent-link verification → parent room.

Baseline reviewed from `main` after `0190919b5d18d11db7d1d1e4a16f74fd5b423421`.

## Current route flow

```text
app/index.tsx
  ├─ Supabase configured + no session → /(auth)/login
  ├─ effective side = parent
  │    ├─ parent_profile_done = true → /(parent)/room
  │    └─ otherwise → /(onboarding)/parent-welcome
  └─ effective side = teen
       ├─ teen_profile_done != true → /(onboarding)/welcome
       ├─ VERIFIED_TEEN → /(teen)/room
       └─ otherwise → /(auth)/limited-mode

/(onboarding)/parent-welcome
  → /(onboarding)/parent-setup

/(onboarding)/parent-setup
  ├─ writes local parent_profile_data
  ├─ sets local userSide = parent
  ├─ removes parent_profile_done
  └─ /(onboarding)/parent-link

/(onboarding)/parent-link
  ├─ calls redeem_parent_link_invite RPC
  ├─ on success writes parent_profile_done = true
  ├─ writes linked_teen_id from RPC result
  └─ /(parent)/room
```

## What is confirmed

### Root session check

`app/index.tsx` checks the Supabase session only when Supabase is configured. A missing session redirects to `/(auth)/login`.

### Side resolution

The root route computes the effective side from:

1. `EXPO_PUBLIC_APP_VARIANT`, when set;
2. otherwise `AppContext.userSide`;
3. otherwise a default of `teen`.

A build variant also writes its selected side back into app context.

### Parent onboarding readiness

Root routing treats the local AsyncStorage key `parent_profile_done` as the deciding readiness flag for entering `/(parent)/room`.

### Parent profile setup

`parent-setup.tsx` collects a display name, mom/dad room style and focus. It stores these only in AsyncStorage as `parent_profile_data`, sets the local side to parent, removes `parent_profile_done`, and advances to the invite-code screen.

### Invite redemption

`parent-link.tsx` normalizes an eight-character code and calls `redeemInviteCodeResult`.

`redeemInviteCodeResult`:

- requires a configured Supabase client;
- requires an authenticated user;
- calls the `redeem_parent_link_invite` RPC;
- extracts and returns `teen_user_id` from the RPC response;
- maps any RPC error to the same `expired_or_used` user-facing result.

On success, the screen writes:

- `parent_profile_done = true`;
- `linked_teen_id = <teen id from RPC>`;

and routes to `/(parent)/room`.

## Findings

### PP-002 — Parent entry authorization relies on mutable local side and completion flags

**Classification:** P0 privacy boundary + P1 journey integrity.

The root route does not derive the parent role from an authoritative authenticated profile before routing. `effectiveSide` can come from local `AppContext.userSide`, and parent readiness is decided by the local `parent_profile_done` key.

This does not itself bypass Supabase RLS, but it means UI role and onboarding access can drift from the authenticated account's actual role and relationship state.

**Required fix contract:**

1. Resolve authenticated account role from the canonical backend profile/claims contract.
2. Treat `EXPO_PUBLIC_APP_VARIANT` as packaging/navigation intent, not authorization.
3. Use local flags only as cached UX hints after backend role validation.
4. Partition or clear side/profile flags on sign-out and account change.
5. Add tests for stale parent flags under teen, unknown and unauthenticated accounts.

### PP-003 — Parent completion becomes true immediately after redemption without a post-write authoritative read

**Classification:** P0 relationship-state boundary + P1 recovery risk.

After the RPC returns a teen ID, the onboarding screen immediately writes `parent_profile_done = true` and routes into the parent app. It does not re-fetch the canonical parent-link record or authenticated parent profile before completion.

If the RPC response shape, transaction state, account role, or later relationship status is inconsistent, the local app can present the parent shell as complete until another screen discovers the mismatch.

**Required fix contract:**

1. After redemption, fetch the canonical active relationship using the authenticated parent ID.
2. Verify `status = active`, `is_active = true`, the expected parent ID, and returned teen ID.
3. Confirm or establish the authenticated user's parent role/profile.
4. Write local cache keys only after successful authoritative verification.
5. Provide deterministic recovery when redemption succeeded server-side but the verification read or local write failed.

### PP-004 — Local `linked_teen_id` is duplicated state and is not authoritative

**Classification:** P0 cross-account isolation + P2 architecture drift.

`parent-link.tsx` stores the linked teen ID in AsyncStorage, while `fetchLinkedTeenId()` separately queries active `parent_links` by the current authenticated user.

The duplicate local identifier can become stale after unlink, relink, account switch, revocation, blocked state, or multi-teen support.

**Required fix contract:**

1. Make the active backend relationship the source of truth.
2. Scope any cache by authenticated parent user ID and relationship/link ID.
3. Invalidate it on auth changes, revoke/unlink, relationship updates and sign-out.
4. Never use the local teen ID as proof of authorization or as the only query constraint.
5. Decide and document whether one or multiple active teen relationships are supported.

### PP-005 — Invite redemption collapses distinct server failures into “invalid, expired, or used”

**Classification:** P1 diagnosability/recovery + P2 UX parity.

Every RPC error is mapped to `expired_or_used`, including possible authentication, authorization, role, database, rate-limit and transient service failures.

This prevents accurate recovery behavior and can cause users to generate unnecessary codes after a temporary backend problem.

**Required fix contract:**

1. Establish typed server error codes for invalid, expired, consumed, wrong-role, self-link, already-linked, blocked, rate-limited and server/transient failures.
2. Preserve privacy-safe user messages while retaining diagnostic detail in logs/telemetry.
3. Make retry behavior depend on error class.
4. Add contract tests for each RPC outcome.

### PP-006 — “I do not have a code yet” loops back to the welcome screen

**Classification:** P1 broken journey.

The no-code action routes back to `parent-welcome`, which only routes forward to setup again. No useful waiting, invite instructions, sign-out, switch-side, limited parent mode, or recovery path is provided.

**Required fix contract:**

1. Add a real no-code state explaining how the teen creates a code.
2. Provide refresh/retry and a safe sign-out or account-switch path.
3. Decide whether unlinked parents receive a legitimate limited parent experience.
4. Avoid navigation loops that discard context or imply setup can complete without a relationship.

### PP-007 — Parent profile data is local-only at setup completion

**Classification:** P1 persistence + P2 parity.

The parent display name, room style and focus are written to `parent_profile_data` in AsyncStorage. No backend profile write is performed in the traced setup path.

This can cause loss across reinstall/device change, cross-account leakage on shared devices, and disagreement between local UI and authenticated profile data.

**Required fix contract:**

1. Define the canonical parent profile table/fields.
2. Upsert profile data under the authenticated user ID.
3. Cache only after backend success or maintain an explicit retryable pending state.
4. Load profile data from backend on a new device/session.
5. Clear or partition local profile data by account.

## State model required before implementation

Parent app entry should be driven by an explicit state machine rather than a single local completion flag.

Recommended minimum states:

```text
AUTH_LOADING
SIGNED_OUT
ROLE_UNKNOWN
WRONG_ROLE
PARENT_PROFILE_REQUIRED
PARENT_UNLINKED
PARENT_LINK_PENDING
PARENT_LINK_ACTIVE
PARENT_LINK_BLOCKED
PARENT_LINK_REMOVED
PARENT_RECOVERY_REQUIRED
```

The relationship state must come from the backend. Local storage may cache the last resolved state but cannot grant access.

## Tests required

### Route/deep-link matrix

- Signed out → any parent deep link.
- Authenticated teen → any parent deep link.
- Authenticated account with unknown role → parent deep link.
- Parent with no profile → parent room deep link.
- Parent profile complete but unlinked → parent room deep link.
- Parent with pending/expired/blocked/removed relationship → parent room deep link.
- Parent with active relationship → parent room.
- Parent account A signs out, parent/teen account B signs in on same device.

### Invite RPC contract

- valid code;
- invalid format;
- nonexistent code;
- expired code;
- already consumed code;
- self-link attempt;
- wrong-role account;
- already-linked parent;
- blocked/removed relationship;
- transient backend failure;
- server success followed by client verification-read failure.

### Cache and lifecycle

- logout clears or partitions `parent_profile_done`, `parent_profile_data` and `linked_teen_id`;
- revoke/unlink invalidates local relationship state;
- account switching cannot display the previous account's parent room or linked teen data;
- reinstall/new device restores the parent profile and active relationship from the backend.

## Decision gate

Do not implement only a cosmetic redirect in `app/(parent)/_layout.tsx` and call PP-001 complete.

The route guard must consume one canonical authenticated parent-entry state resolver that:

- verifies auth;
- verifies backend role/profile;
- resolves active relationship state;
- emits a deterministic route destination;
- exposes loading/recovery/error states;
- clears stale account-scoped cache;
- remains compatible with a deliberate unlinked-parent limited mode if the product keeps one.
