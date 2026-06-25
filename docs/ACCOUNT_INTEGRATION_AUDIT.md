# Account integration audit

This audit tracks the privacy/account goals for the Se'kret Bip account flow.
Status words:

- **Covered** — code/schema has the required guardrail now.
- **Partial** — base ownership exists, but the feature still needs deeper product work.
- **Gap** — not implemented yet.

## Audit results

| Area | Status | Notes |
|---|---:|---|
| Journal ownership | Covered | `journal_entries.user_id` references `auth.users(id)` and has owner-only RLS. App cloud restore waits for age gate + account readiness before pull/sync. |
| Voice Bip ownership | Partial | `voice_notes.user_id` is owner-scoped. Metadata sync exists; raw recordings/transcripts still need user-scoped Storage buckets and transcript tables. |
| Circle identity | Partial | New posts use `public_circle` identity (`anonymous_handle`). Friends-only/private Circle visibility still needs a visibility field and trusted-audience enforcement. |
| Bip Crew discovery | Partial | UI now invites by Bip ID/QR instead of real-name search, and pending invites show Bip ID. Accepted friendship, blocking, and permission tables still need backend workflows. |
| Parent Window | Gap | Parent/teen linking and explicit teen share permissions still need tables, RLS, and UI enforcement. |
| Rewards & streaks | Partial | Streak state persists locally; `bip_points` exists, but full rewards/streak cloud restore still needs a dedicated owned streak/rewards model. |
| Room profile | Covered | Account profile is loaded before entry; Room can greet by private first name, and preferences continue to hydrate before cloud restore. |
| AI Memory | Partial | Journal/voice/oracle memory is local/account-scoped through app state and owned tables where synced, but companion-specific cloud memory tables are not fully modeled yet. |
| Storage uploads | Gap | Image, voice, and upload Storage buckets/folder policies are not defined yet. Required pattern: `${auth.uid()}/...` with Storage RLS. |
| Notifications | Gap | No authenticated notification-token preference model is present yet. |
| Delete account | Gap | No delete/anonymize workflow or retention policy executor is implemented yet. |
| Logout/Login isolation | Partial | Account gate blocks app entry and cloud restore waits for account readiness. A real sign-out action must also clear AsyncStorage slices before another user enters on the same device. |

## Device sync test scenario

Added `scripts/test-device-sync.mjs` as a contract test for the account/sync guardrails that make the Phone A → Phone B → sign-out → second-user scenario safe:

1. App flow remains `AgeGate → AccountGate → app gates`.
2. Cloud restore waits for both age-gate resolution and account/profile readiness.
3. Private account schema keeps real identity owner-only and stores public `anonymous_handle`/`bip_id` separately.
4. Core owned tables are tied to `auth.uid()` via `user_id` and RLS.
5. Circle and Bip Crew identity surfaces use anonymous/public identity until trusted acceptance.

## Remaining implementation checklist

- Add real sign-out that calls Supabase sign out and clears all local AsyncStorage state before returning to Splash/AgeGate.
- Add Storage buckets and RLS policies for user-specific folders (`${auth.uid()}/images`, `${auth.uid()}/voice`, `${auth.uid()}/uploads`).
- Add visibility fields to Circle posts (`public_circle`, `trusted_friend`, `guardian`) and enforce audience-specific identity display.
- Add parent/teen link tables with teen-approved shared-content permissions.
- Add friend request, acceptance, blocking, and permission tables for Bip Crew.
- Add delete-account/anonymize workflow and retention policy docs.
- Add authenticated notification preferences and device-token scoping.
