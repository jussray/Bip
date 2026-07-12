# Skill: bip-sekret-identity

Enforce the Oracle ↔ Se’kret identity split in all code changes.

## The Rule

Oracle is the internal reasoning layer. It must **never appear onscreen**.
Se’kret is the visible emotional presence. She is **not** Raylene and is **not**
a selectable companion.

## Type Hierarchy

```typescript
// Four selectable companions — the only IDs valid in companion-picker UI
type NamedCompanionId = 'raylene' | 'rylane' | 'cloud' | 'night';

// Used for style/voice shaping only — never for UI selection
type PresenceStyleId = NamedCompanionId | 'sekret';
```

If a PR introduces `CompanionId` that includes `'sekret'`, flag it immediately.

## Surfaces to Audit

Every code change touching the following must be reviewed:

- Reply headers and message bubbles
- Accessibility labels (`accessibilityLabel`, `aria-label`)
- Archive and history screens
- TTS strings (text passed to the voice engine)
- Loading and typing-indicator states
- Companion picker and companion list UI
- Notification payloads
- Analytics event names and properties
- Error messages visible to the user

## Pass Criteria

- [ ] No surface renders “Oracle” to the user
- [ ] `getVisibleIdentity()` is used wherever the AI name appears onscreen
- [ ] `assertNoOracleLeak()` is called in dev paths that construct display names
- [ ] Se’kret does not appear in the companion selection array or picker UI
- [ ] Se’kret’s type is `PresenceStyleId`, not `NamedCompanionId`
- [ ] TTS input never contains the word “Oracle”
- [ ] Accessibility labels read “Se’kret” — not “AI assistant” or a companion name
- [ ] `isSekretVisibleSurface()` and `shouldSuppressSekretIdentity()` are mutually exclusive for all known surfaces

## Fail Examples

```tsx
// ✗ Leaks internal reasoning name
<Text>Oracle is typing…</Text>

// ✗ Se’kret modelled as a fifth companion
type CompanionId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret';

// ✗ Maps AI identity to a companion name
const aiName = activeCompanion.name; // “Raylene”

// ✗ Se’kret in companion picker array
const companionList = ['raylene', 'rylane', 'cloud', 'night', 'sekret'];
```

## Pass Examples

```tsx
import { getVisibleIdentity, shouldSuppressSekretIdentity } from '@/features/sekret/identityContract';
import { getNamedCompanionProfiles } from '@/features/sekret/styleProfiles';

// ✓ Always uses the contract for display
<Text accessibilityLabel={getVisibleIdentity()}>{getVisibleIdentity()} is here for you.</Text>

// ✓ Companion list built from safe getter (Se’kret excluded)
const companionList = getNamedCompanionProfiles();

// ✓ Picker guards against Se’kret
{!shouldSuppressSekretIdentity(currentSurface) && <SekretPresence />}
```

## Required With

- `bip-repo-truth` — confirm identity contract is the source of truth
- `bip-privacy-redteam` — check for identity leak in logs or analytics
- `bip-companion-lab` — ensure style profiles don’t cross-pollinate identity
