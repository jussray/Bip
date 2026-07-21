# AI Companion Fallback Product Design Contract

Status: draft for founder review  
Branch: `agent/fallback-batch-1-current`  
Pack: `fallback-natural-v1.0.0`

## User experience goal

When OpenAI or the Worker path is unavailable, Se'kret Bip should still feel stable, kind, and teen-native without pretending the companions are human.

The fallback path is not a second secret personality engine. It is a local, versioned safety net that keeps the chat moving while preserving trust.

## Product rules

1. Every companion remains an AI companion.
2. The app must not imply a companion has a body, school, home, parents, offline memories, hidden feelings, or human consciousness.
3. If the teen asks whether a companion is real, human, sentient, or a robot, the reply must clearly say the companion is AI.
4. Fallback replies should still sound natural, warm, and character-specific.
5. Fallback replies must avoid silent learning from teen conversations.
6. Fallback packs must be versioned and auditable before they are approved for production.
7. Founder review is required before new fallback packs are treated as approved.

## Companion lanes

- Suhana: caring, emotionally clear, steady.
- Sy: direct, protective, honest.
- Cloud: soft comfort, lower pressure, grounding.
- Night: late-night honesty, quiet steadiness, hidden-thought support.
- Se'kret: pattern reflection, uncertainty-aware interpretation.

## Interaction behavior

- The API helper now routes app fallback replies through the natural fallback pack.
- Selection is deterministic from pack version, companion, surface, mood, and user text.
- Recent assistant fallback replies are avoided when possible.
- Identity probes use explicit AI-disclosure replies.
- Safety fallback remains separate from normal character style.

## Control Room implications

Control Room should eventually surface:

- active fallback pack version,
- fallback use count,
- fallback rate by companion,
- fallback rate by surface,
- identity-disclosure trigger count,
- safety fallback trigger count,
- founder approval state.

This branch does not yet implement Control Room telemetry. That belongs in the next batch.
