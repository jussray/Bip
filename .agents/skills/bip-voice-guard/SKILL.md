# bip-voice-guard

## Trigger
Any PR or task touching: UI strings, character dialogue, push notifications,
onboarding copy, error messages, empty states, tooltips.

## Source of Truth
`constants/bip_voice.ts` (38KB) — all character voice definitions live here.
Additionally: `constants/voiceBip.ts` — Bip-specific voice config.
If a string doesn't trace to patterns in these files, it is suspect.

## Hard Rules

### Banned Clinical / Therapist Language
NEVER USE:
- "therapist", "therapy", "mental health professional"
- "diagnose", "diagnosis", "disorder", "symptom"
- "I'm here for you" (therapist energy)
- "How does that make you feel?" (unless it is a journaling prompt, not AI dialogue)
- "It sounds like you're struggling with..."
- Any phrasing that implies Bip is a clinical intervention

### Banned Generic AI Phrases
NEVER USE:
- "As an AI..."
- "I don't have feelings but..."
- "I'm just a language model..."
- "I cannot provide medical advice"
- "Please consult a professional" — use a warm redirect instead

### Guardrails File
`constants/guardrails.ts` contains AI safety boundaries.
Before writing any AI dialogue, verify the phrase doesn't conflict with guardrails.

### Voice Pillars (apply per character)
Each character has a locked voice in `constants/bip_voice.ts`.
Before writing copy, load the character's voice profile:
- Tone adjectives for that character
- Sentence length target
- Forbidden words list per character

Parent-facing characters have separate config in `constants/parentSekret.ts`.
Do not apply teen character voice to parent-facing copy.

### String Formatting
- Smart apostrophes require DOUBLE QUOTES in JSX/TSX: `"it's"` not `'it\'s'`
- All user-facing strings: double-quoted
- No em-dashes in character speech — use character-appropriate punctuation
- Sentence case for UI labels; Title Case for screen titles only

## Review Checklist
- [ ] No banned clinical phrases
- [ ] No generic AI disclaimers
- [ ] Checked `constants/guardrails.ts` for conflicts
- [ ] Character voice matches `constants/bip_voice.ts` profile
- [ ] Parent copy uses `constants/parentSekret.ts`, not teen voice
- [ ] Double-quote convention on apostrophe-containing strings
- [ ] Warm redirect used instead of "consult a professional"

## Output
Flag each violation with: file + line + violation type + suggested replacement
