# bip-sekret-identity

## 5W1H operating contract

Before planning, editing, or claiming completion, establish and state:

- **Who** — the requester, decision owner, affected users, data subjects, and execution authority.
- **What** — the requested outcome, concrete deliverable, non-goals, and existing work that must be preserved.
- **Where** — the exact repository, branch, environment, runtime, route, service, table, or provider boundary involved.
- **When** — the current lifecycle or release state, required ordering, timing constraint, and rollback window.
- **Why** — the user problem and verified evidence that justify the work.
- **How** — the smallest safe implementation, required permissions, verification evidence, rollout, and rollback.

Inspect repository and runtime truth for unknowns. Ask the user only when a missing answer would materially change the safe solution or authority. Re-run 5W1H after red-team/OODA findings change the plan. Finish by mapping the result, evidence, remaining blocker, and next owner back to these six questions.


## Trigger

Activate whenever work touches:

- visible AI or companion names;
- reply headers, bubbles, loading states, notifications or archives;
- accessibility labels;
- companion pickers or avatar grids;
- companion presentation variants;
- Oracle discovery, reasoning or continuity context;
- TTS input, voice labels or spoken introductions;
- analytics or logs that contain identity labels.

## Identity contract

```text
Oracle = internal reasoning only
Se'kret = visible continuity and relationship presence
Suhana / Sy / Cloud / Night = named companions
Raylene / Rylane = legacy compatibility aliases only
```

Oracle must never appear to a teen or parent. Se'kret is not Suhana and is not
a fifth selectable companion. Raylene and Rylane must not be reintroduced as
canonical user-facing companion names.

The canonical contract is:

```text
src/features/sekret/identityContract.ts
```

## Required type separation

Use:

```text
NamedCompanionId = suhana | sy | cloud | night
PresenceStyleId  = NamedCompanionId | sekret
Internal reasoner = oracle
```

Legacy normalization may accept `raylene`, `rylane`, `oracle` or `sekret`, but
visible Raylene/Rylane output must resolve to Suhana/Sy and visible Oracle output
must resolve to Se'kret. Unknown internal identity must fail closed to Se'kret,
not silently fall back to Suhana.

## Presentation variant contract

A companion's presentation is not its identity.

```text
CompanionPresentationVariant = girl | boy
CompanionPresentationMode = girl | boy | mixed
```

- Suhana remains Suhana in every presentation variant.
- Sy remains Sy in every presentation variant.
- Night remains Night in every presentation variant.
- Cloud remains Cloud in every presentation variant.
- `mixed` means the user may choose the girl or boy presentation independently for each named companion.
- Presentation changes must not rename companions, fork memory, change TTS identity, create a new analytics identity, or replace relationship continuity.
- New named companions require explicit founder-approved identity and naming; do not invent names to satisfy visual symmetry.

The presentation contract is:

```text
src/features/identity/companionPresentation.ts
```

## Required checks

- Use `resolveVisibleIdentity()` when an internal identity becomes visible.
- Use `getVisibleIdentity()` for a direct Se'kret label.
- Use `assertNoOracleLeak()` in tests and development validation paths.
- Use `isSekretVisibleSurface()` only for surfaces where Se'kret should appear.
- Use `shouldSuppressSekretIdentity()` for companion-selection surfaces.
- Keep `sekret` out of named companion picker arrays.
- Keep `oracle` out of screen text, accessibility, TTS, notifications and errors.
- Preserve the named companion's own canonical label when that companion is speaking.
- Resolve legacy `raylene` / `rylane` keys before rendering labels.
- Keep presentation state separate from companion identity and private profile gender.

## Current migration warning

Existing runtime files may still use broad legacy types or persisted compatibility
keys. Do not claim the repository is fully migrated until the actual screens,
reply path, archives, accessibility labels and TTS use the canonical contract and
the identity audit passes.

Do not delete legacy compatibility code inside an unrelated contract PR. Inventory
and adapt it in a scoped runtime-activation PR.

## Automatic failure examples

```text
Oracle is typing…
Talk to Oracle
const fallbackName = 'Raylene'
const picker = ['raylene', 'rylane', 'cloud', 'night'] // when rendered without canonical label resolution
const boyCompanionId = 'boy-suhana' // presentation variant incorrectly forked into identity
```

## Required evidence

- focused identity contract tests;
- repository search showing no newly introduced visible `Oracle`, `Raylene`, or `Rylane` strings on canonical surfaces;
- Companion Lab or equivalent candidate-reply check;
- text and TTS identity consistency proof when voice is touched;
- presentation variant proof when onboarding or room rendering is touched;
- privacy review for logs and analytics.

## Required with

- `bip-repo-truth`
- `bip-companion-lab`
- `bip-privacy-redteam`
- `bip-release-gate`
