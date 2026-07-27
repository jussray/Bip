# Voice Provider Rollout

Status: implementation contract, not deployment proof.

## Runtime target

`/api/sekret/voice` remains the single app-facing endpoint. Provider-specific logic must stay behind the Worker boundary.

## Routing

| Request | Primary | One fallback |
|---|---|---|
| Suhana, Sy, Cloud, or Night without precise timing | Cloudflare Aura-2 | Cloudflare Aura-1 |
| Suhana, Sy, Cloud, or Night with precise lip-sync | ElevenLabs Flash | Cloudflare Aura-2 |
| Se'kret or Parent Coach | Cloudflare Aura-1 | none |

Legacy input identifiers `raylene` and `rylane` may be accepted only at the compatibility boundary. Responses, telemetry, errors, and AI-facing data must return `suhana` and `sy`.

## Required Worker bindings and secrets

- Workers AI binding: `AI`
- `ELEVENLABS_API_KEY` as a Wrangler secret
- Character-specific ElevenLabs voice IDs as Wrangler secrets only when the premium lane is enabled
- `VOICE_PROVIDER_MODE`: `cloudflare-only` or `hybrid`

Do not put secret values in `wrangler.toml`, committed env examples, logs, issue comments, or client bundles.

## Response contract

The endpoint should return:

- `audioBase64`
- `contentType`
- canonical `characterId`
- `provider`
- `model`
- `fallbackUsed`
- `timing` only when the selected provider returns alignment data
- `aiGenerated: true`

It must never return raw provider credentials, legacy display names, or raw user audio in telemetry.

## Failure behavior

1. Call the selected primary provider.
2. If it fails and one fallback is configured, call that fallback once.
3. If both fail, return a visible typed error with a trace ID.
4. Never report success with empty or synthetic audio.

## Verification gates

- [ ] `worker/sekret-reply.ts` imports and calls the routing seam.
- [ ] Cloudflare Workers AI adapter is implemented.
- [ ] ElevenLabs timestamp adapter is implemented.
- [ ] Canonical IDs are returned on every success and error path.
- [ ] Focused tests cover routing, fallback, and retired-name non-leakage.
- [ ] Typecheck and test suite pass on the exact PR head.
- [ ] Wrangler dry-run succeeds on the exact PR head.
- [ ] Deployed canary proves Cloudflare success, premium timing success, one fallback, and typed failure.
- [ ] Targeted Playwright proves the real mobile voice and Rive lip-sync flow.

## Rollback

Set `VOICE_PROVIDER_MODE=cloudflare-only` to disable the premium lane. If the Worker change itself is unhealthy, revert the focused PR and redeploy the previous Worker commit.
