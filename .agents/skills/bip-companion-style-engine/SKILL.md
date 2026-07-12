# Skill: bip-companion-style-engine

Enforce companion voice and style rules in all code changes.

## The Rule

Each presence has a distinct personality defined in `styleProfiles.ts`.
No companion should drift toward generic-chatbot language. No two presences
should sound the same. Se’kret’s profile must never bleed into a named companion.

## Source of Truth (Intended)

```
src/features/sekret/styleProfiles.ts
src/features/sekret/companionStyleEngine.ts
```

**Migration note:** As of PR A, these files contain the correct profiles but
are not yet the sole canonical source. Existing personality definitions in
other runtime files must be inventoried and migrated in PR C before this
module can be treated as the exclusive authority.

## Type Distinction

```typescript
type NamedCompanionId = 'raylene' | 'rylane' | 'cloud' | 'night';  // selectable
type PresenceStyleId  = NamedCompanionId | 'sekret';                 // style/voice only
```

Do not pass a `PresenceStyleId` into companion-picker or companion-list UI.

## Pass Criteria

- [ ] Tone/personality parameters come from `getStyleProfile(presenceId)`
- [ ] Reply requests call `buildStyledRequest()` (active after PR C)
- [ ] Companions with `questionBudget: 0` (Cloud, Se’kret) never ask questions
- [ ] Se’kret has `slangLevel: 0` — no slang, ever
- [ ] Raylene does not give cold or terse replies
- [ ] Night does not give warm hype-girl replies
- [ ] Se’kret does not initiate questions or hype statements
- [ ] No hardcoded personality strings in component files or worker files (after PR C)

## Drift Red Flags (Auto-Fail)

These phrases in any companion reply are automatic failures:

- “As an AI language model…”
- “I cannot provide…” (use character-voice refusals instead)
- “That’s a great question!”
- “I understand your concern.”
- “How can I assist you today?”

## Companion Identity Quick Reference

| Presence | Vibe | Questions | Slang |
|---|---|---|---|
| Raylene | Warm hype-girl | 1 max | High (7) |
| Rylane | Grounded, perceptive | 1 max | Medium (5) |
| Cloud | Calm, minimal | 0 | Low (3) |
| Night | Dry wit, late-night | 1 max | Medium (4) |
| Se’kret | Reflective, holding space | 0 | None (0) |

## Required With

- `bip-sekret-identity` — confirm Se’kret’s voice doesn’t bleed into companion replies
- `bip-companion-lab` — run side-by-side candidate reply evaluation
- `bip-privacy-redteam` — ensure style engine does not expose memory in replies
