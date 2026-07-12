# Skill: bip-sekret-identity

Enforce the Oracle ↔ Se'kret identity split in all code changes.

## The Rule

Oracle is the internal reasoning layer. It must **never appear onscreen**.
Se'kret is the visible emotional presence. She is **not** Raylene and is **not**
a fifth selectable companion.

## Surfaces to Check

Every code change touching the following must be reviewed:

- Reply headers and message bubbles
- Accessibility labels (`accessibilityLabel`, `aria-label`)
- Archive and history screens
- TTS strings (text passed to voice engine)
- Loading and typing-indicator states
- Companion picker / companion list
- Notification payloads
- Analytics event names and properties
- Error messages visible to the user

## Pass Criteria

- [ ] No surface renders "Oracle" to the user
- [ ] `getVisibleIdentity()` is used wherever the AI name appears onscreen
- [ ] `assertNoOracleLeak()` is called in dev paths that construct display names
- [ ] Se'kret does not appear in the companion selection array
- [ ] Se'kret's `id` is `'sekret'` — no alias, no fallback to a companion id
- [ ] TTS input never contains the word "Oracle"
- [ ] Accessibility labels read "Se'kret" not "AI assistant" or any companion name

## Fail Examples

```tsx
// ✗ Leaks internal name
<Text>Oracle is typing…</Text>

// ✗ Maps to wrong identity
const aiName = companions[0].name; // "Raylene"

// ✗ Se'kret in companion picker
const companionList = ['raylene', 'rylane', 'cloud', 'night', 'sekret'];
```

## Pass Examples

```tsx
import { getVisibleIdentity } from '@/features/sekret/identityContract';

// ✓ Always uses the contract
<Text>{getVisibleIdentity()} is here for you.</Text>

// ✓ Companion list excludes Se'kret
const companionList = ['raylene', 'rylane', 'cloud', 'night'];
```

## Required with

- `bip-repo-truth` — confirm the canonical file is the source of truth
- `bip-privacy-redteam` — check for identity leak in logs or analytics
- `bip-companion-lab` — ensure style profiles don't cross-pollinate identity
