# AGENT_LOG.md
# Se'kret Bip — Append-Only Agent Feedback Log
#
# PURPOSE
# Agents write to this file after every significant action.
# Future agents read this file before acting.
# This closes the OODA loop by giving agents memory of past decisions.
#
# RULES
# - Append only. Never delete or edit past entries.
# - No secrets, tokens, keys, or private user data. Ever.
# - No file paths to private content or internal URLs.
# - One entry per meaningful action or correction.
# - Be specific about what was wrong — vague entries have no value.
#
# FORMAT
# ---
# DATE: YYYY-MM-DD
# AGENT: [agent name or "human"]
# TRACK: [Control Room OS | Bip Room UI | Shared]
# ACTION: [one sentence — what was done]
# WHY: [one sentence — why this was the right move]
# WRONG: [one sentence — what assumption was incorrect, or "none"]
# PRESERVED: [what existing work was kept intact]
# REMAINS: [what is still unfinished, if anything]
# ---

---
DATE: 2026-07-07
AGENT: Perplexity (external AI assistant)
TRACK: Control Room OS
ACTION: Created AGENT_LOG.md at repo root as an append-only agent feedback file.
WHY: The OODA loop in AGENTS.md had no feedback mechanism — agents acted but had no way to record corrections for future agents. This file closes that loop.
WRONG: In prior session, "Control Room OS" and "Bip Room UI" were conflated into a single mental bucket called "control room." These are two distinct tracks and must never be merged.
PRESERVED: All existing files untouched. This is a purely additive change.
REMAINS: Item 2 (Supabase → Worker → AI reply contract test) and Item 3 (Raylene room hotspot extraction) are queued but not yet started.
---

---
## TRACK DEFINITIONS (locked — do not change without human approval)

### Control Room OS
The founder operating system that builds and operates Bip.
Scope: missions, workers, connectors, local agent behavior, fallback logic, OODA loop infrastructure.
Location: repo root, .agents/, worker/, AGENTS.md, CLAUDE.md, this file.

### Bip Room UI
The in-app teen room experience inside the Bip product.
Scope: room backgrounds, hotspots, stickers, characters, room serialization, RoomScreen.tsx.
Location: assets/, screens/RoomScreen.tsx, ROOM_ASSET_MAP.md.

### Rule
One is the workshop. One is the product.
An agent working on Control Room OS does not touch Bip Room UI files, and vice versa, unless the task explicitly crosses tracks and a human has confirmed the crossing.
---
---
DATE: 2026-07-07
AGENT: Codex
TRACK: Control Room OS
ACTION: Added Verification Registry (.agents/verification-registry.json) and verify-local orchestrator (scripts/verify-local.mjs) with 11 named checks, skip logic, and machine-readable last-run output.
WHY: GitHub Actions was the first place problems were discovered. This inverts the loop — local verification is now primary, CI becomes confirmation.
WRONG: none
PRESERVED: All existing scripts, tests, and worker files untouched. Registry calls existing npm scripts only.
REMAINS: Control Room OS UI to surface .agents/verification-last-run.json as a visual dashboard. verify:release guard not yet wired to Ship Release button flow.
---
---
DATE: 2026-07-07
AGENT: Codex
TRACK: Control Room OS
ACTION: Moved Verification Registry source of truth from .agents into src/config/controlRoomVerificationRegistry.ts and updated verify-local to consume the Control Room OS config registry while keeping .agents/verification-last-run.json as generated runtime state.
WHY: The registry is product architecture for Control Room OS, not agent-private metadata; missions, workers, connectors, UI, and local verification should share one authoritative config source.
WRONG: Initial registry location under .agents made it look agent-owned instead of Control Room-owned.
PRESERVED: Existing verification units, commands, skip semantics, local defaults, and generated last-run report path.
REMAINS: Control Room OS UI still needs to render .agents/verification-last-run.json.
---
---
DATE: 2026-07-07
AGENT: Codex
TRACK: Control Room OS
ACTION: Added Verification Engine boundary markers: scripts/verify-local.mjs now declares kernel ownership rules, and .agents/verification-registry.json now wraps verifications with owner/rule metadata for engine-only access.
WHY: Architectural ownership needed to be explicit before merge: the Local Agent executes, the Mission Engine decides, and the Verification Engine is the only reader of the registry.
WRONG: Previous revision moved the registry into src/config, conflicting with the requested engine-owned registry boundary.
PRESERVED: Verification entries, commands, skip semantics, generated last-run report, and orchestrator behavior.
REMAINS: none
---
