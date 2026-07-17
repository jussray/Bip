# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

> **Before making any claim about current PR, deployment, migration, or backend state, read `SPRINT.md` at the repo root and verify it using `.agents/skills/bip-repo-truth/SKILL.md`.**

## 5W1H operating contract

Before planning, editing, or claiming completion, every agent must establish **who, what, where, when, why, and how** as an operating method:

- who owns the decision, may execute, is affected, is a data subject, and is the active writer;
- what outcome is requested, what is out of scope, and what existing work must be preserved;
- where the exact repository, branch, environment, runtime, route, service, table, provider, artifact, and external-object boundaries are;
- when the work belongs in the lifecycle, what order is required, and what rollback window exists;
- why verified evidence justifies the work;
- how the smallest safe implementation, permissions, proof, rollout, handoff, and rollback will work.

Inspect repository and runtime truth for missing answers. Ask only when an unknown materially changes the safe solution or authority. Re-run 5W1H after red-team/OODA changes the plan, and map the final evidence and next owner back to all six questions.

For any Control Room task, also load `.agents/skills/bip-control-room/SKILL.md`.

## Coordinated multi-AI contract

Read [`AI_COORDINATION.md`](./AI_COORDINATION.md) before any task that involves more than one AI, agent, provider, branch, design tool, or external platform.

All agents work toward the same founder-defined outcome, but around one another through distinct lanes:

- Control Room owns mission state, lane assignment, approvals, truth labels, handoffs, blockers, and stop controls.
- Codex owns integration, repository operations, scoped implementation, tests, and proof unless reassigned.
- Claude owns bounded long-context analysis, design-aware implementation, structured refactors, documentation, or independent architecture review.
- DeepSeek owns adversarial second opinion and red-team critique by default, not writes.
- Research providers own current public-source discovery, not private system truth.
- Visual tools own approved visual artifacts, not runtime claims.

Apply the **one-writer rule** to every artifact or external object. Before editing, state the active writer, reviewers, branch, paths, base evidence, expected output, approval gate, and rollback owner. Do not silently duplicate or overwrite work owned by another lane.

Every handoff must include 5W1H, observed truth, assumptions, privacy classification, approval state, changed paths or external objects, proof, blockers, next owner, and rollback.

External account creation must stop at `human_required` when a platform requires founder identity, terms acceptance, credentials, captcha, email, phone, device, age, or one-time-code verification. A dry run cannot become `api_connected` or `verified_live` without external evidence.

## Global founder stack

Read [`GLOBAL_AI.md`](./GLOBAL_AI.md) before nontrivial work and preserve the full founder reasoning stack.

Every agent must follow **`/elonmusk` + `lindymode` + first-pass `redteam OODA` + `L99` + second-pass `redteam OODA` before changing code, configuration, schema, deployment, tests, documentation, or agent skills.** A plain OODA pass is not sufficient.

The canonical repository sequence remains:

```text
/garyvee lindymode redteam l99 redteam ooda
```

When `/elonmusk` is invoked, layer first-principles reduction, bottleneck identification, leverage analysis, and deletion of unnecessary complexity on top of that sequence. Do not replace, shorten, collapse, skip, or reorder the required passes.

The first redteam attacks the product premise and evidence. L99 drives implementation depth. The second redteam OODA attacks the selected implementation, privacy and security blast radius, rollback, and proof.

Provider boundaries and handoffs are documented in [`docs/PROVIDERS.md`](./docs/PROVIDERS.md). Project-local rules below may be stricter; they may not weaken privacy, security, evidence, approval, provenance, rollback, coordination, or truthfulness.

## MCP-to-skill routing

MCP connectivity and Bip skill activation are separate requirements. Before invoking any MCP server, read [`config/mcp-skill-routing.json`](./config/mcp-skill-routing.json), load every skill mapped to that server, and also load every skill in `alwaysLoad`.

- Never use an MCP merely because it is configured.
- The mapped skill defines the product boundary; the MCP supplies a scoped tool.
- If a mapped skill file is missing, stop rather than silently continuing without the guardrail.
- Use `npm run verify:mcp` to prove that configured servers, authority boundaries, and skill files remain aligned.
- Auth, login, consent, verification, parent linking, onboarding, or external-account work must activate the applicable identity and Control Room skills in addition to server-specific mappings.

## OODA Workflow

Every agent must execute the full founder stack above, then follow this repository OODA workflow before changing anything.

### 1. Observe

Inspect the real repository state before acting.

Check:

- Existing files, routes, services, hooks, types, assets, branches, and active writers.
- Current branch and recent changes when available.
- Build or TypeScript errors related to the task.
- Whether the requested feature already exists but is disconnected.
- Whether the issue is caused by stale local code, unpushed work, or actual repo state.
- Whether another agent or provider already owns the artifact or external object.

Do not assume planned architecture, provider connectivity, account state, or another agent's unverified summary exists. Verify it.

### 2. Orient

Map the task against the current app architecture and coordinated lane plan.

Ask:

- Which existing file or external object owns this behavior now?
- Who is the active writer and who reviews?
- Is this app UI, backend, database, auth, storage, AI reply, release, social account, visual, research, or shared work?
- Is this a shipping blocker, demo polish, refactor, future idea, or dry run?
- Does this interact with Expo Router, Supabase, Cloudflare Workers, OpenAI, another provider, or an external platform?

Prefer the current working structure over imaginary clean-room architecture.

### 3. Decide

Choose the smallest shipping-safe action and assign one writer.

Before coding, decide:

- Can this be fixed by wiring existing code?
- Can this be fixed in one file?
- Can existing code be preserved behind a route, flag, or compatibility boundary?
- Does this need a database migration, environment variable, backend change, provider connection, or founder-only external action?
- Does this need tests or only a verification checklist?
- Should this wait because it is not required for the next demo or release?
- Is the next state `human_required` rather than automated completion?

If there are multiple possible fixes, choose the least risky one that keeps the app shippable, preserves future product work, and avoids lane collision.

### 4. Act

Make the change with minimal blast radius.

When acting:

- Modify only the necessary files owned by the assigned lane.
- Keep naming consistent with the repo.
- Preserve existing features, routes, assets, services, branches, and approved external state unless removal is required for correctness, privacy, security, or release safety.
- Prefer feature flags, route isolation, deprecation notes, compatibility adapters, and explicit handoffs over deletion or overwrite.
- Before deleting anything, identify all references and explain why preserving it is unsafe or materially blocks shipping.
- Avoid new dependencies unless there is no native or existing option.
- Avoid broad refactors unless the task explicitly requires them.
- Stop at founder-only identity, terms, credential, verification, payment, merge, deployment, migration, or external-publication gates.
- Leave the app and mission ledger easier to understand than before.

After acting, report:

- What changed.
- Why it was the smallest safe change.
- Which lane and active writer produced it.
- How existing work was preserved.
- Which handoffs occurred.
- How it was verified.
- What remains unfinished and who owns it.

## Preservation-First Rule

Se'kret Bip is being shipped in phases, not reduced to a permanently smaller product.

- Do not delete unfinished product work merely because it is outside the current release path.
- Keep future features available for later build-out through feature flags, hidden routes, documented backlog status, or isolated modules.
- Do not merge duplicate active implementations indefinitely; select one canonical launch path while preserving the other only when it has clear future value.
- Mark deprecated or inactive code clearly so future agents do not treat it as current behavior.
- Delete only when code is unsafe, irreparably broken, legally risky, secret-bearing, truly obsolete, or proven to have no future use.
- Preserve disagreement and rejected alternatives in the handoff or decision record when they explain future risk.

## Ponytail Rule

Before adding code, pause and ask:

1. Does this already exist in the codebase or another active branch?
2. Can existing code be connected instead of replaced?
3. Can Expo do this already?
4. Can React Native do this already?
5. Can Supabase do this already?
6. Can Cloudflare Workers do this already?
7. Can an installed dependency or approved provider do this already?
8. Can this be solved with one small change instead of a new abstraction?
9. Is another AI already assigned to this artifact?
10. Is the true bottleneck human authority or platform access rather than code?

Only write new code after those checks are answered.

## Testing Strategy

Use the smallest testing tool that can prove the behavior being changed.

Current testing priority:

1. Keep unit, service, contract, and regression tests for core logic, privacy contracts, RLS assumptions, route safety, coordination invariants, and false-success prevention.
2. Add Playwright for parent/teen web flows and founder-only Control Room flows when browser behavior is the thing being proved.
3. Add Maestro for real iOS/Android device flows, especially signup, login, onboarding, teen-parent linking, Bridge share/revoke, navigation, and Expo Go or build smoke tests.
4. Only move to Detox if the app eventually needs deep native automation that Maestro cannot cover.

Do not add Playwright, Maestro, or Detox to a feature PR unless that PR specifically needs the new test layer. Prefer a dedicated testing-infrastructure PR.

A dry-run provisioning test must prove that no network account was created, no credential was collected, and the final state is `human_required`.

## Project Priorities

Se'kret Bip should stay simple, shippable, and easy to demo while preserving the larger product vision.

Prefer:

- Expo APIs over new third-party packages.
- React Native primitives over custom UI frameworks.
- Existing app services over duplicate services.
- Supabase features over custom backend code when Supabase already covers the need.
- Cloudflare Workers features over adding another backend provider.
- Small patches over sweeping refactors.
- Canonical active paths plus preserved flagged future work.
- One shared mission with distinct, evidence-backed lanes.

Avoid:

- New dependencies unless the repo truly needs them.
- Creating duplicate helpers, services, hooks, types, Control Rooms, or provider authorities.
- Large architecture rewrites without a direct shipping reason.
- Moving files just to make the structure look cleaner.
- Adding placeholder systems that are not wired into the app.
- Destructive cleanup performed only to make metrics or file counts look smaller.
- Simulated account, provider, deployment, or runtime states represented as live.

## Se'kret Bip Product Guardrails

Keep the product tone safe, teen-centered, warm, and non-clinical.

The app is not a therapy replacement. Do not add features that claim to diagnose, treat, or replace emergency support.

Preserve these boundaries:

- Teen privacy first.
- Parent visibility is optional and consent-based unless safety rules require escalation.
- Keep anonymous Circle identity protected by default.
- Do not expose private names, journal text, voice notes, or safety data across contexts.
- Do not log secrets, private user content, tokens, Supabase service keys, passwords, or verification codes.

## Development Style

When changing code:

- Make the smallest working change.
- Check existing files and active branches before creating new ones.
- Keep route names and screen names consistent with Expo Router.
- Keep TypeScript types strict and shared where they already exist.
- Do not introduce a new state system unless the existing one cannot support the task.
- Do not add new environment variables unless unavoidable.
- Document any required environment variable in the same change that uses it.
- Keep handoff and truth labels machine-readable where practical.

## Before Finishing

Before marking work complete, verify:

- The changed files are necessary and owned by the assigned lane.
- No duplicate active implementation was introduced.
- Preserved inactive work is clearly flagged or isolated.
- No unused imports or dead execution branches were added.
- The app can still run in Expo Go unless the change intentionally requires a native build.
- Any safety, privacy, parent/teen, provider, or external-account boundary touched by the change still behaves correctly.
- Every claimed completion state has the required evidence.
- The next owner and approval gate are explicit.
