# Bip Engineering OS

## Purpose

This document defines the non-negotiable architecture rules and default engineering standards for Se'kret Bip. Every implementation, reviewer, automation, and release check should derive from this constitution.

## Invariants

### Safety

- Every teen-facing flow must pass safety review before merge.
- Companion output must not deliver medical, legal, or crisis-intervention advice without explicit safety escalation handling.
- Parent-bridge changes require a dedicated parent-facing review.

### Data and privacy

- All Supabase tables containing teen data must have Row Level Security enabled.
- Memory writes must flow through the canonical worker write path.
- Auth tokens, refresh tokens, and secret keys must never be logged.

### Companion identity

- Raylene, Rylane, Cloud, Night, Se'kret, and Parent Coach each have a canonical voice document in `docs/companions/`.
- Any change to `worker/companion-replies.ts` requires product sign-off.
- Engineering may optimize delivery, but may not silently change personality, tone, or safety posture.

### Infrastructure

- Cloudflare Workers are the primary service boundary between the app and privileged backend behavior.
- New Worker endpoints require at least one automated test before release.
- No secrets in source control.

## Defaults

- TypeScript strict mode by default.
- Expo Router file-based routing for new screens.
- React Query for async server-state fetching.
- Typed Supabase helpers for data access.
- Feature flags for incomplete or staged features.
