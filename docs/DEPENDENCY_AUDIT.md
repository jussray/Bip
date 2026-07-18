# Dependency Audit

This document tracks the version pins for all major dependencies and explains how they are enforced.

## Core Version Pins

| Package | Pinned Version | Why pinned |
|---|---|---|
| `expo` | `~51.0.28` | Expo SDK 51 — stable release for React Native 0.74 |
| `react-native` | `0.74.5` | Matches Expo SDK 51 compatibility matrix |
| `react` | `18.2.0` | Required by RN 0.74 |
| `expo-router` | `~3.5.23` | File-based routing — tied to SDK 51 |
| `@supabase/supabase-js` | `2.74.0` | Phase 2 backend — pinned to avoid breaking API changes |
| `typescript` | `~5.3.3` | Matched to `@types/react` 18.2.x |
| `eslint` | `^8.57.1` | ESLint 8 — `eslint-config-expo` not yet compatible with ESLint 9 |
| `wrangler` | `^4.100.0` | Cloudflare Workers deployment |

## Audit Commands

```bash
# Check for outdated packages
npm outdated

# Check for known vulnerabilities
npm audit

# Full pre-push verification (includes asset and type checks)
npm run verify:prepush
```

## Update Policy

- **Expo SDK upgrades** require a dedicated branch and full QA pass across iOS, Android, and web.
- **React Native upgrades** must match the Expo SDK compatibility matrix exactly. Do not upgrade RN independently.
- **Supabase JS upgrades** require testing all Phase 2 data paths (journal, bridge, circle) before merging.
- **ESLint upgrades** to v9+ are blocked until `eslint-config-expo` publishes a compatible version.
- **Patch-level upgrades** (`~` range) are low-risk and may be applied in bulk after `npm audit` confirms no vulnerabilities.

## Adding New Dependencies

Before adding any new package:

1. Confirm it supports Expo SDK 51 / React Native 0.74.
2. Check bundle size impact — run `npm run verify:bundle` after installing.
3. If it requires native modules, confirm it works in Expo Go and in the bare workflow.
4. Add it to this table with its pin reason.

## Automated Enforcement

`npm run verify:prepush` runs `type-check` and `lint` on every push, catching dependency-related type errors and import issues before they reach main.
