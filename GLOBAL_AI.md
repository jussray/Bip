# Se’kret Bip Global AI Contract

## Parent and launch skills

This repository inherits the private canonical `juss-founder-os` contract from
`jussray/founder-control-room`.

For splash PNG, invisible CTA, recognized login, onboarding resume, 72-hour
founding preview, waiting-list, sponsor, launch analytics, or social-content work,
load [`.agents/skills/bip-founding-preview/SKILL.md`](.agents/skills/bip-founding-preview/SKILL.md)
in addition to every skill required by that file.

The project skill may become stricter, but it may not weaken founder authority,
brand/IP protection, privacy, evidence, rollback, non-deletion, or truthfulness.

This repository follows the shared founder operating stack:

```text
/garyvee lindymode redteam l99 redteam ooda
```

Repeated `redteam` tokens are intentional.

1. **GaryVee frame** — define the teen or parent value, real user outcome, communication path, and fastest truthful proof.
2. **Lindy screen** — prefer durable privacy boundaries, standard Expo/React Native/Supabase/Worker primitives, portable data, simple interfaces, and reversible changes.
3. **Redteam I: premise** — attack whether the feature should exist, whether it is safe for teens, whether consent and identity boundaries support it, and whether the evidence is real.
4. **L99 systems pass** — inspect identity, account side, trust, parent links, consent, state transitions, memory, provenance, routes, storage, RLS, Worker behavior, release gates, rollback, and long-term drift.
5. **Redteam II: plan** — attack the selected implementation for cross-user leakage, parent overreach, anonymous-identity failure, stale state, unsafe AI behavior, broken revocation, migration damage, deployment failure, and missing proof.
6. **OODA** — re-observe, orient, decide one scoped path, act minimally, verify privacy and runtime behavior, and loop.

Do not collapse the two redteam passes. The first attacks the product premise. The second attacks the chosen implementation.

## Truth order

1. Repository, branch, migrations, deployed configuration, and runtime actually inspected.
2. Current tests, logs, schemas, RLS policies, RPCs, Worker responses, and observed behavior.
3. Explicit founder decisions and approved product, privacy, identity, and safety records.
4. Current official provider documentation.
5. Prior summaries, generated plans, chat memory, and assumptions.

Never claim a feature, privacy boundary, migration, test, deployment, account state, parent link, AI capability, or release status exists without evidence.

## `bip-os.md` status

The root [`bip-os.md`](bip-os.md) is a **non-authoritative proposal and checklist reference**. It is not the repository constitution, current architecture map, sprint, roadmap, CODEOWNERS file, workflow configuration, release approval, migration authority, or implementation evidence.

- This global contract, `AGENTS.md`, Founder Control Room, current repository paths, ordered migrations, runtime evidence, and explicit founder decisions outrank `bip-os.md`.
- Its `apps/mobile` and `packages/*` tree, reviewer handles, commands, workflows, coverage targets, and 30-day plan are illustrative unless they exist in the current repository and pass exact-head proof.
- Its example tag-triggered EAS, Cloudflare, and Supabase steps do not authorize builds, deployment, credentials, paid capacity, publishing, or database application.
- Any statement suggesting parents can see everything a teen sees is invalid. Parent visibility remains consent-based, minimized, relationship-scoped, revocable, and enforced by services, RPCs, RLS, storage, and route authorization.
- See [`docs/BIP_ENGINEERING_OS_STATUS.md`](docs/BIP_ENGINEERING_OS_STATUS.md) for the reconciliation boundary.

## Product boundaries

- Teen privacy outranks speed and convenience.
- Parent visibility is consent-based and relationship-scoped. It is not general surveillance.
- Bridge contains only content intentionally shared into the linked relationship.
- Circle and Bridge are separate systems.
- Anonymous public identity and private account identity must not bleed across contexts.
- Private journal text, Voice Bip transcripts, private companion chats, private memory, unshared messages, and general activity history must not appear on parent or public surfaces.
- Parent-link creation, acceptance, revocation, blocking, and visibility must be enforced by services, RPCs, RLS, storage, and route authorization, not UI hiding.
- AI companions are supportive and non-clinical. They do not diagnose, treat, replace therapy, or replace emergency support.
- Durable AI memory must not be described as implemented until its migrations, privacy rules, services, invalidation, deletion, and tests exist.

## Repository boundaries

- Expo Router route groups, Supabase migrations, Cloudflare Worker, app services, local storage, and tests each own distinct concerns.
- `supabase/migrations/` is the schema source of truth.
- Search for active importers before treating parallel screens, helpers, or services as canonical.
- Preserve the current working path while isolating or clearly marking future and deprecated work.
- The existing root `CLAUDE.md` is a verified design-system and Figma integration reference. This global contract governs cross-cutting product, security, provider, and execution behavior alongside it.

## Provider roles

- **Claude / Claude Code** — long-context repository analysis, focused implementation, design-system-aware changes, structured refactors, and documentation.
- **Codex / ChatGPT** — debugging, code review, tests, repository operations, data analysis, threat modeling, and founder-readable decisions.
- **OpenAI Platform** — server-side AI, voice, moderation, embeddings, or structured output behind secure, versioned Worker/service adapters.
- **Anthropic Platform** — server-side model capability behind secure, versioned adapters; conversation context is not durable teen or product memory.
- **Perplexity** — current public research and source discovery, not private repo, Supabase, or deployed-runtime truth.
- **GitHub** — source, review, CI evidence, and rollback; merge is not deployment proof.
- **Supabase** — Auth, Postgres, RLS, Storage, RPCs, functions, and durable data boundaries.
- **Cloudflare Workers** — privileged AI, voice, authenticated API, and server-side integration boundary.
- **Expo / React Native** — application runtime and device behavior; preserve Expo Go unless a native requirement is explicit.

## Non-negotiable rules

- Inspect existing routes, services, migrations, policies, storage, Worker endpoints, types, tests, and active importers before adding another.
- Keep service-role keys, model keys, private prompts, teen content, parent content, tokens, and privileged calls off clients and logs.
- Do not weaken auth, route guards, RLS, RPC consent checks, storage policies, moderation, safety, types, tests, or release gates to make CI green.
- Do not silently change identity contexts, account-side state, parent visibility, Bip IDs, anonymous handles, route contracts, storage keys, schemas, or deployment targets.
- Prefer small patches, existing Expo/Supabase/Worker capabilities, and canonical active paths over new abstractions.
- Preserve deletion, revocation, sign-out cache clearing, cross-device isolation, and second-user safety.
- Never delete Juss’s material without explicit authorization for that specific deletion.

## Approval gates

Require explicit founder approval before:

- merge, force-push, production deployment, or rollback;
- auth, authorization, RLS, RPC, identity visibility, account side, parent linking, or guardian-state changes;
- destructive database, storage, cache, memory, or migration operations;
- secret creation, rotation, deletion, or exposure;
- domains, DNS, Worker names, app identifiers, signing, production environment, or paid-service changes;
- expanding parent access, public identity exposure, safety escalation, or data retention;
- sending external communications in the founder’s name.

An audit authorizes inspection, not mutation. Approval for one gate does not silently approve the next.

## Required report

1. Reality
2. Risk I: premise
3. L99 product and trust view
4. Decision
5. Risk II: selected plan
6. Action
7. Proof
8. Rollback
9. Next approval gate

Teen privacy is not a feature flag to be rediscovered after launch. It is the architecture, inconveniently requiring actual enforcement rather than a reassuring sentence in a modal.
