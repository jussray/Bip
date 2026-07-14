# Canonical Character Assets

Status: **approved and active**

This pack establishes the current full-body identity for Se’kret Bip’s three human companions.

| Companion | Canonical runtime file |
|---|---|
| Raylene | `assets/images/companions/raylene/raylene-master.png` |
| Night | `assets/images/companions/night/night-master.png` |
| Rylane | `assets/images/companions/rylane/rylane-master.png` |

## Runtime rule

Until matching emotion/pose variants are regenerated, every full-size Raylene, Night, and Rylane avatar filename resolves to its approved master. This prevents the app from mixing old faces, skin tones, hair, clothes, and proportions.

Cloud and Oracle are unchanged.

## Figma handoff

Import `figma/character-canon.svg` into Figma. It contains all three transparent approved masters on one labeled reference frame. The lightweight embedded previews are for layout/reference; use the canonical runtime PNGs above for production-resolution exports.

## Canva handoff

The approved lineup was converted into the editable Canva design titled **Se’kret Bip — Canonical Character Lineup**.

## Rollback

The pre-swap artwork remains recoverable from the parent commit immediately before this character-canon change. No historical art is lost.
