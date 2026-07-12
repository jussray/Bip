# bip-companion-style-engine

## Trigger

Activate whenever work changes:

- companion prompts, curriculum, personality or tone;
- reply request construction;
- response length, slang, humor, questions or advice behavior;
- speech delivery instructions;
- Companion Lab style scoring or chatbot-drift detection;
- Se'kret continuity wording.

## Canonical contract

```text
src/features/sekret/styleProfiles.ts
src/features/sekret/companionStyleEngine.ts
```

These files define the new style contract. Existing live curriculum and prompt
sources remain active until a scoped runtime-activation PR adapts them. Do not
claim comments in the new files made older sources disappear. Repositories are
stubbornly literal like that.

## Identity separation

Named companions:

```text
raylene | rylane | cloud | night
```

Se'kret uses a `continuity-presence` style. She is not a named companion.

Use:

- `buildCompanionStyleRequest(companionId)` for a named companion;
- `buildSekretPresenceStyleRequest()` for Se'kret continuity.

Do not pass `sekret` through a named-companion API.

## Style dimensions

Every profile must explicitly define:

- text and speech style versions;
- cadence and sentence length;
- direct-question budget;
- slang, warmth, humor and silence tolerance;
- advice mode;
- speech delivery instructions;
- forbidden phrases;
- a concise system-prompt snippet.

The canonical text reply is produced first. TTS may alter delivery, not meaning.
The voice pipeline receives the final reply string and speech instructions only.

## Companion boundaries

- Raylene: emotionally perceptive, warm, lightly nosy, concise, natural slang.
- Rylane: grounded, direct, protective, never lecture-like.
- Cloud: sparse, patient, high silence tolerance, almost no pressure.
- Night: late-night, dry, calm and present, never theatrical or seductive.
- Se'kret: familiar continuity presence, reflective, private, never a named
  companion imitation.

## Hard rules

- Respect the direct-question budget.
- Do not duplicate profile numbers or system snippets in components or Workers.
- Do not let Se'kret's continuity style bleed into a named companion.
- Do not let named companions collapse into generic chatbot prose.
- Do not weaken safety or privacy instructions to preserve character voice.
- Do not add exact-string golden tests for ordinary prose; grade stable behavior.
- Version profile changes that materially alter text or speech delivery.

## Drift red flags

Examples that require review:

```text
As an AI language model…
That's a great question!
How can I assist you today?
I understand your concern.
Here are ten things you can try:
```

A character-voice refusal must still be clear and safe. Style is not a costume
for hiding a broken boundary.

## Runtime activation evidence

Before claiming the engine is active:

1. Inventory existing prompt, curriculum and personality sources.
2. Choose the canonical merge point in the real reply request.
3. Add the style request without duplicating safety instructions.
4. Prove all four named companions remain distinct.
5. Prove Se'kret is not selectable as a companion.
6. Run Companion Lab and focused question-budget tests.
7. Verify text and speech use the same canonical reply.

## Required with

- `bip-sekret-identity`
- `bip-companion-lab`
- `bip-privacy-redteam`
- `bip-voice-guard` when speech is touched
