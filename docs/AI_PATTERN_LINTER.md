# Se'kret Bip AI Pattern Linter v1.1

AI-writing pattern detector and voice-seed system for Se'kret Bip avatars. Based on humanizer v2.8.2 (blader/humanizer), MIT License.

## Personas in this release

| Persona | Tag | Status | Primary risk patterns |
|---|---|---|---|
| Redteam | `redteam` | Primary build | P33 fake candor, P31 staccato drama, P32 aphorisms, P7 AI vocab |
| Cool cousin | `cool-cousin` | Highest traction, formerly soft-therapist | P22 sycophancy, P201 therapy-script, P25 pep-talk closers, P14 em dashes |
| Caveman | `caveman` | Next build | P7 AI vocab, P24 hedging, P3 -ing analyses, P10 rule of three |
| Hype queen | `hype-queen` | Background | P4 promotional language, P10 rule of three |
| Ghostwriter | `ghostwriter` | Background | P7 AI vocab, P14 em dashes |

## Library location

```text
src/services/ai/aiPatternLinter.ts
```

The library intentionally has no CLI demo. Use the Control Room Redteam tab for local founder checks.

## Usage

```typescript
import {
  lintAvatarResponse,
  buildAvatarSystemPrompt,
  composeAvatarPrompt,
  VOICE_SEEDS,
} from '@/services/ai/aiPatternLinter';

const result = lintAvatarResponse(draftText, 'redteam');

if (result.severity === 'block') {
  // Hard-ban pattern hit. Do not send, log internally, optionally retry.
} else {
  // Clean or soft-warn. Send to user.
}

const systemPrompt = composeAvatarPrompt(myBasePrompt, 'redteam');
const customSeedPrompt = composeAvatarPrompt(myBasePrompt, 'redteam', VOICE_SEEDS.redteam);
const promptRulesOnly = buildAvatarSystemPrompt('cool-cousin');
```

## Control Room workflow

1. Open the existing founder Control Room.
2. Choose the Redteam tab.
3. Select a persona.
4. Paste an avatar draft.
5. Review the score, severity, and pattern hits before shipping or copying prompt rules.

## Adding a new avatar

1. Add the tag to the `AvatarPersona` union type.
2. Add a voice seed to `VOICE_SEEDS`.
3. Add prompt parts to `AVATAR_PROMPT_PARTS`.
4. Add the persona to `AVATAR_PERSONAS` only if it shares every global hard ban.
5. Update this document with the persona status and primary risk patterns.
6. Verify TypeScript and the Control Room lint flow.
