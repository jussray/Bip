# Se’kret Bip Global AI Contract

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

## Coordinated AI contract

Every AI and provider must also read [`AI_COORDINATION.md`](./AI_COORDINATION.md).

All agents serve one founder-defined mission through distinct lanes. Control Room assigns one active writer per artifact, preserves reviewer disagreement as evidence, and records every handoff. Agents may work in parallel only when their paths or external objects do not collide.

The shared coordination sequence is:

```text
observe shared truth
-> reserve a lane and artifact
-> perform one bounded responsibility
-> hand off evidence
-> red-team the combined result
-> founder approval at the next authority gate
```

No agent may silently duplicate another active implementation, overwrite another agent’s artifact, cross a human-required external-account gate, or convert a simulation into a live-success claim.

## Truth order

1. Repository, branch, migrations, deployed configuration, and runtime actually inspected.
2. Current tests, logs, schemas, RLS policies, RPCs, Worker responses, and observed behavior.
3. Explicit founder decisions and approved product, privacy, identity, and safety records.
4. Current official provider documentation.
5. Prior summaries, generated plans, chat memory, and assumptions.

Never claim a feature, privacy boundary, migration, test, deployment, account state, parent link, AI capability, or release status exists without evidence.

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
- The existing root `CLAUDE.md` is a verified design-system and Figma integration reference. This global contract governs cross-cutting product, security, provider, execution, and coordination behavior alongside it.

## Provider roles

- **Founder Control Room** — mission owner, lane allocator, approval ledger, blocker display, truth reconciler, stop control, and final evidence surface.
- **Claude / Claude Code** — long-context repository analysis, focused implementation, design-system-aware changes, structured refactors, documentation, and independent architectural review.
- **Codex / ChatGPT** — integration, debugging, code review, tests, repository operations, data analysis, threat modeling, and founder-readable decisions.
- **DeepSeek** — advisory second opinion, premise challenge, alternative hypotheses, complexity critique, and red-team analysis; no repository or production authority by default.
- **Perplexity** — current public research and source discovery, not private repo, Supabase, or deployed-runtime truth.
- **Visual tools** — approved visual exploration and production; visual output is not implementation evidence.
- **OpenAI Platform** — server-side AI, voice, moderation, embeddings, or structured output behind secure, versioned Worker/service adapters.
- **Anthropic Platform** — server-side model capability behind secure, versioned adapters; conversation context is not durable teen or product memory.
- **GitHub** — source, review, CI evidence, and rollback; merge is not deployment proof.
- **Supabase** — Auth, Postgres, RLS, Storage, RPCs, functions, and durable data boundaries.
- **Cloudflare Workers** — privileged AI, voice, authenticated API, and server-side integration boundary.
- **Expo / React Native** — application runtime and device behavior; preserve Expo Go unless a native requirement is explicit.

## Non-negotiable rules

- Inspect existing routes, services, migrations, policies, storage, Worker endpoints, types, tests, active importers, branches, and lane ownership before adding another.
- Keep service-role keys, model keys, private prompts, teen content, parent content, tokens, passwords, one-time codes, and privileged calls off clients, repositories, and logs.
- Do not weaken auth, route guards, RLS, RPC consent checks, storage policies, moderation, safety, types, tests, or release gates to make CI green.
- Do not silently change identity contexts, account-side state, parent visibility, Bip IDs, anonymous handles, route contracts, storage keys, schemas, deployment targets, active writers, or external account state.
- Prefer small patches, existing Expo/Supabase/Worker capabilities, canonical active paths, and explicit handoffs over new abstractions.
- Preserve deletion, revocation, sign-out cache clearing, cross-device isolation, second-user safety, audit history, and rollback.
- A dry run, mock, candidate handle, UI registration, worker registration, or capability declaration is not a connected external account or verified runtime.

## Approval gates

Require explicit founder approval before:

- merge, force-push, production deployment, or rollback;
- auth, authorization, RLS, RPC, identity visibility, account side, parent linking, or guardian-state changes;
- destructive database, storage, cache, memory, or migration operations;
- secret creation, rotation, deletion, or exposure;
- domains, DNS, Worker names, app identifiers, signing, production environment, or paid-service changes;
- expanding parent access, public identity exposure, safety escalation, or data retention;
- sending external communications in the founder’s name;
- creating an external account, accepting platform terms, completing identity or age checks, solving captchas, or submitting email, phone, device, or one-time-code verification.

An audit authorizes inspection, not mutation. Approval for one gate does not silently approve the next.

## Required report

1. Reality
2. Risk I: premise
3. L99 product and trust view
4. Decision
5. Assigned lanes and active writer
6. Risk II: selected plan
7. Action
8. Proof and handoffs
9. Rollback
10. Next approval gate

Teen privacy is not a feature flag to be rediscovered after launch. It is the architecture, inconveniently requiring actual enforcement rather than a reassuring sentence in a modal.
