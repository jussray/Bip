# Skill: bip-companion-style-engine

Enforce companion voice and style rules in all code changes.

## The Rule

Each companion has a distinct personality defined in `styleProfiles.ts`.
No companion should drift toward generic-chatbot language. No two companions
should sound the same. Se'kret's profile must never bleed into a named companion.

## Source of Truth

```
src/features/sekret/styleProfiles.ts
src/features/sekret/companionStyleEngine.ts
```

Profiles are defined **only** in `styleProfiles.ts`. Any code that hardcodes
companion tone, slang, or question budget outside this file is a violation.

## Pass Criteria

- [ ] All tone/personality parameters come from `getStyleProfile(companionId)`
- [ ] No companion reply is built without calling `buildStyledRequest()`
- [ ] Question budget is respected: companions with `questionBudget: 0` never ask questions
- [ ] Slang does not appear in Cloud or Se'kret replies
- [ ] Raylene does not give cold/terse replies
- [ ] Night does not give warm/hype-girl replies
- [ ] Se'kret does not initiate questions or hype statements
- [ ] No hardcoded personality strings in component files or worker files

## Drift Red Flags

These phrases in any companion reply are automatic failures:

- "As an AI language model…"
- "I cannot provide…" (use character-voice refusals instead)
- "That's a great question!"
- "I understand your concern."
- "How can I assist you today?"

## Companion Identity Quick Reference

| Companion | Vibe | Questions | Slang |
|---|---|---|---|
| Raylene | Warm hype-girl | 1 max | High |
| Rylane | Grounded, perceptive | 1 max | Medium |
| Cloud | Calm, minimal | 0 | Low |
| Night | Dry wit, late-night | 1 max | Medium |
| Se'kret | Reflective, holding space | 0 | None |

## Required with

- `bip-sekret-identity` — confirm Se'kret voice doesn't appear in companion replies
- `bip-companion-lab` — run side-by-side candidate reply check
- `bip-privacy-redteam` — ensure style engine doesn't expose memory in replies
