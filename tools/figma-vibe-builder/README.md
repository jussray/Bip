# Bip Vibe Frame Builder

## Current front-door authority

The public Se’kret Bip front door uses the current GitHub implementation as behavior authority and the approved world/character references as visual canon.

Current Figma entry handoff:

- entry: `57:2`
- Teen: `57:4`
- Bip Jr: `57:44`
- shared Sign In: `57:84`

Historical frame `18:2` is not the current entry authority.

## Family-first rule

The welcome screen introduces the **world before the names**.

- The family artwork is the emotional center.
- Cloud stays visually unobstructed.
- Do not add a visible `Night · Suhana · Sy` name pill to the first screen.
- Canonical names stay available to accessibility text and belong on later character/profile/Family/Voice surfaces.
- Do not turn reference sticker sheets into the production UI. Extract their expression, pose, handwritten warmth, night-world motifs, and emotional readability while preserving the canonical Bip Companion Style.

## Caveman visual grammar

The first interaction should be understandable before a visitor reads explanatory copy:

`◉ YOU → ☾ YOUR SPACE → ✦ ENTER`

Implementation rules:

1. The primer is temporary, visual-first, and pointer-safe.
2. The three beats reveal in order and disappear before normal interaction becomes the focus.
3. The entire arrival beat stays under one second when motion is allowed.
4. Reduced-motion visitors do not receive a forced animation.
5. The primer may not create horizontal overflow at the 320px phone boundary.
6. Motion teaches hierarchy. It does not decorate every object.

## Audience worlds

Teen and Bip Jr remain separate public-entry worlds.

### Teen

- preserve the approved family composition and dark cosmic atmosphere;
- preserve Night-left / Suhana-center / Sy-right identity internally and accessibly;
- do not expose character-name labels on the welcome art;
- CTA continues into the existing Teen age/onboarding authority.

### Bip Jr + Family

- preserve the family/grown-up framing;
- keep the entry explicitly parent-controlled;
- CTA continues into the existing family setup authority;
- do not inherit Teen social complexity merely for visual symmetry.

## Visual style boundary

Bip Companion Style remains an original stylized cinematic 3D family-animation language: soft appealing shapes, expressive readable emotion, simplified believable anatomy, clean materials, gentle cinematic lighting, and emotionally safe warmth.

The 2D pose/expression references are grammar donors, not replacement rendering authority.

## Verification

Any front-door change must prove, on the exact candidate:

- Teen and Bip Jr render one world at a time;
- the family art remains visually primary;
- no visible character-name pill returns;
- returning-user Sign In still routes correctly;
- the visual primer is caught in-flight by Playwright, remains contained, then clears;
- desktop/mobile have no horizontal overflow;
- reduced motion stays physically still;
- production truth is verified separately after merge/deployment.
