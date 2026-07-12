# Control Room Architecture

> Control Room is the cockpit. It is not the wings, the fuel tank, the engine,
> or the mildly concerned flight attendant. 🧠🛠️

## The Principle

Control Room **observes, tests, scores, creates missions, approves rollouts, and
reports failures.** It does not contain the reply engine, the style engine, the
memory system, or the voice pipeline. Those live as clean runtime modules that
Control Room *reads from* and *runs audits against*.

---

## Layer Map

```
Control Room
├── observes
├── tests
├── scores
├── creates missions
├── approves rollouts
└── reports failures

Runtime AI  (src/features/sekret/, src/services/ai/, worker/)
├── Oracle reasoning
├── Se’kret continuity
├── companion style engine
├── safety pipeline
├── memory retrieval
└── voice generation

MCP layer  (.agents/mcp/)
├── exposes Control Room data to coding agents
├── runs Companion Lab tools
├── reads GitHub / Supabase / Cloudflare state
└── does NOT sit inside teen conversations

Agent skills  (.agents/skills/)
├── tell coding agents how to build safely
├── enforce Se’kret identity rules
├── enforce companion voice/style rules
└── enforce L4 memory and privacy rules
```

---

## Type Hierarchy: Companions vs. Presence

Se’kret is NOT a companion. This distinction is enforced in code.

```typescript
// Named companions — selectable in the companion picker
type NamedCompanionId = 'raylene' | 'rylane' | 'cloud' | 'night';

// Presence style — includes Se’kret for style/voice purposes ONLY
// Se’kret must never appear in companion picker or companion list UI
type PresenceStyleId = NamedCompanionId | 'sekret';
```

---

## What Lives Where

### Inside Control Room  (`src/features/control-room/`) — PR B

| Panel | Purpose |
|---|---|
| `SekretIdentityAuditPanel` | Verifies Oracle never appears onscreen; checks all identity surfaces |
| `CompanionStyleLabPanel` | Shows style profiles, drift failures, candidate reply comparisons |
| `VoiceLabPanel` | Tracks TTS health, latency, cost, identity leak in speech |
| `L4RelationshipDashboard` | Memory counts, contradictions, goals, expiry, delete status |
| `McpHealthPanel` | Tool availability, permissions, last call, stale-data warnings |

These are **observer-only panels**. They receive data from read-only adapters.
They do not contain reply, memory, or voice logic.

### Outside Control Room — Runtime modules

```
src/features/sekret/
  identityContract.ts       — Oracle ↔ Se’kret mapping contract (PR A ✓)
  styleProfiles.ts          — canonical style profiles, all 5 presences (PR A ✓)
  companionStyleEngine.ts   — builds reply request per presence (PR A ✓)
  relationshipPhase.ts      — derives phase from memory state (PR A ✓)

src/services/ai/            — PR C
  buildReplyRequest.ts      — assembles prompt for Oracle
  outputPolicy.ts           — strips/redacts/blocks unsafe output
  agentMemory.ts            — L4 read/write
  agentGoals.ts             — goal read/write

worker/                     — PR C
  sekret-reply.ts           — reply pipeline (must call buildStyledRequest)
  sekret-voice.ts           — TTS pipeline
  reflection-worker.ts      — nightly reflection

supabase/migrations/        — PR D
  agent_memories
  agent_goals
  reflection_runs
```

---

## Style Profiles — Migration Note

`styleProfiles.ts` is the **intended** canonical source of truth for companion
personality parameters. As of PR A it contains the correct profiles.

Existing personality definitions and system-prompt snippets scattered across
other runtime files must be inventoried and migrated to this file deliberately
as part of PR C. They are not automatically superseded by this file’s existence.

---

## Control Room Mission — Required Skills

Every mission type declares which agent skills must pass before it can be marked
**verified**. Example:

```
Mission: Add Se’kret visible identity adapter
Required skills:
  ✓ bip-repo-truth
  ✓ bip-sekret-identity
  ✓ bip-companion-lab
  ✓ bip-privacy-redteam
  ✓ bip-release-gate
```

---

## The Intended End State

```
Teen talks
   ↓
Oracle understands privately
   ↓
Se’kret carries safe continuity
   ↓
Raylene / Rylane / Cloud / Night shapes the response
   ↓
Style engine writes it in character
   ↓
Voice engine speaks the same response
   ↓
Control Room observes and tests the entire chain
```

---

## PR Roadmap

| PR | Contents | Status |
|---|---|---|
| **A** | Contracts, skills, types, unit tests | ✓ This PR |
| **B** | Control Room observer panels + founder route + read-only adapters | Next |
| **C** | Worker style integration, output-policy, Se’kret mapping across screens/TTS, Companion Lab evals | After B |
| **D** | Supabase L4 memory/goal schema, RLS, deletion, reflection, provenance, cross-user denial tests | Separate campaign |
