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
├── Se'kret continuity
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
├── enforce Se'kret identity rules
├── enforce companion voice/style rules
└── enforce L4 memory and privacy rules
```

---

## What Lives Where

### Inside Control Room  (`src/features/control-room/`)

| Panel | Purpose |
|---|---|
| `SekretIdentityAuditPanel` | Verifies Oracle never appears onscreen; checks all identity surfaces |
| `CompanionStyleLabPanel` | Shows style profiles, drift failures, candidate reply comparisons |
| `VoiceLabPanel` | Tracks TTS health, latency, cost, identity leak in speech |
| `L4RelationshipDashboard` | Memory counts, contradictions, goals, expiry, delete status |
| `McpHealthPanel` | Tool availability, permissions, last call, stale-data warnings |

### Outside Control Room (runtime modules)

```
src/features/sekret/
  identityContract.ts       — canonical Se'kret ↔ Oracle mapping rules
  companionStyleEngine.ts   — builds reply requests per companion personality
  styleProfiles.ts          — Raylene / Rylane / Cloud / Night / Se'kret profiles
  relationshipPhase.ts      — derives current phase from memory state

src/services/ai/
  buildReplyRequest.ts      — assembles the prompt sent to Oracle
  outputPolicy.ts           — strips, redacts, or blocks unsafe output
  agentMemory.ts            — reads / writes L4 memories
  agentGoals.ts             — reads / writes active goals

worker/
  sekret-reply.ts           — Cloudflare Worker: reply pipeline
  sekret-voice.ts           — Cloudflare Worker: TTS pipeline
  reflection-worker.ts      — Cloudflare Worker: nightly reflection

supabase/migrations/
  agent_memories
  agent_goals
  reflection_runs
```

Control Room **reads their status** and creates fix missions. It never becomes
the reply engine itself.

---

## Control Room Mission — Required Skills

Every mission type declares which agent skills must pass before it can be marked
**verified**. Example:

```
Mission: Add Se'kret visible identity adapter
Required skills:
  ✓ bip-repo-truth
  ✓ bip-sekret-identity
  ✓ bip-companion-lab
  ✓ bip-privacy-redteam
  ✓ bip-release-gate
```

Control Room refuses to mark a mission verified until the required tests and
evidence exist.

---

## New Control Room Mission Types

### Se'kret Identity Audit
Checks:
- Oracle never appears onscreen
- `oracle` maps to visible Se'kret, not Raylene
- Se'kret is not shown as a fifth selectable companion
- Accessibility labels, reply headers, archives, TTS, and loading states use the correct identity
- Companion personalities remain distinct

### Companion Style Lab
Shows per companion (Raylene, Rylane, Cloud, Night, Se'kret):
- Text-style and speech-style versions
- Question budget, slang level, warmth score, brevity score
- Generic-chatbot drift failures
- Side-by-side candidate replies

Builds on the existing Companion Lab — does not replace it.

### Voice Lab
Tracks:
- Voice provider and voice ID
- TTS health and generation latency
- Audio playback failures
- Cost per voice response
- Text-versus-spoken consistency
- Oracle identity leak in speech
- Emotional appropriateness per character

### L4 Relationship Dashboard
Shows:
- Number of durable memories and their provenance
- Memory contradictions
- Last reflection run
- Active goals
- Relationship phase
- Memories approaching expiration
- Delete / forget request status
- Cross-companion sharing status (should be zero unless explicitly allowed)

### MCP Health
Shows per connector (GitHub, Supabase, Figma, Cloudflare, Companion Lab, Control Room):
- Tool availability
- Permissions
- Last successful call
- Stale-data warnings

---

## The Intended End State

```
Teen talks
   ↓
Oracle understands privately
   ↓
Se'kret carries safe continuity
   ↓
Raylene / Rylane / Cloud / Night shapes the response
   ↓
Style engine writes it in character
   ↓
Voice engine speaks the same response
   ↓
Control Room observes and tests the entire chain
```
