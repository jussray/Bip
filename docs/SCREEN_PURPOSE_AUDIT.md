# Se'kret Bip — Two-Sided Screen Purpose Audit

## Decision

Primary screens are feature homes, not visual reskins of the same companion prompt layout.

### Teen side

| Screen | Single job | Features that belong inside |
|---|---|---|
| Room | Visual home base | companion presence, mood check-in, time/weather atmosphere, continue last activity, discoverable hotspots |
| Pages | Journal/notebook hub | typed entries, voice attachments, prompts, entry-linked Se’kret replies, saved history |
| Calm | Comfort tools | breathing, grounding, Cloud Thoughts, comfort cards, wind-down and sleep tools |
| Voice Bip | Voice/talk mode | record, playback, optional transcript, spoken companion response, save to Pages |
| Circle | Community | public anonymous Circle, friends, Crew, reactions, moderation |
| More | Feature drawer/settings | profile, rewards, Bippin 2, period calendar, parent link, safety, settings, help/legal |

### Parent side

| Screen | Single job | Features that belong inside |
|---|---|---|
| Parent Room | Parent home base | parent mood, calm presence, jump-back shortcuts, time/weather atmosphere |
| Parent Pages | Parent notebook | letters, private journal, repair notes, wins, future letters, Bridge reply drafts |
| Parent Calm | Pause-before-replying tools | breathing, grounding, response reset, wind-down, support prompts |
| Parent Voice Bip | Voice reflection | private recording, playback, transcript, spoken reply drafts, save to Parent Pages |
| Parent Circle | Parent community | parent-to-parent posts, anonymous identity, resources, reactions, moderation |
| Doorbell | Shared signal hub | teen-initiated Bridge signals, support requests, shared wins, connection status, calm reply entry point |
| Bridge | Intentional exchange | parent replies and teen-approved shared moments |
| Parent More | Feature drawer/settings | profile, connection management, settings, resources, help/legal |

## Audit findings from current code

1. `RoomScreen` and older dashboard concepts overlap. Room must remain the single home base.
2. `PagesScreen` contains companion interaction, comfort suggestions, prompts, entry history, and writing in one long workspace. Companion replies are valid only when attached to an entry; full chat belongs in companion chat.
3. Teen and parent Voice Bip currently share the same screen component. Shared recording infrastructure is good, but copy, actions, storage destination, and reply purpose need side-specific wrappers.
4. Teen and parent Calm already have separate route components, but their feature ownership must stay distinct: teen regulation versus parent pause-before-replying.
5. Teen More was an ungrouped collection of unrelated links. Parent More had the same risk. Both are now grouped feature drawers.
6. Doorbell and Parent Pages must remain separate. Doorbell is teen-shared signal metadata; Parent Pages is parent-owned private writing.
7. Parent Circle and Teen Circle must never share content identity or expose one side’s feed to the other.
8. The bottom navigation must contain only primary homes. Secondary features belong inside More or in-flow navigation.

## Implementation completed in this pass

- Added `src/constants/screenPurpose.ts` as the canonical two-sided ownership map.
- Grouped Teen More into Your Space, Growth Tools, and Account & Safety.
- Grouped Parent More into Parent Window, Your Support Space, and Account & Resources.
- Added explicit “must not become” boundaries to prevent future screen duplication.

## Next implementation order

1. **Pages separation**
   - keep entry-linked Se’kret replies
   - remove full-chat behavior from Pages
   - keep Comfort recommendations as a small handoff, not an embedded Calm experience

2. **Voice Bip separation**
   - teen: talk, hear companion, save voice note to Pages
   - parent: reflect, draft a Bridge reply, save to Parent Pages

3. **Calm separation**
   - teen: comfort and regulation
   - parent: pause before replying and relationship reset

4. **Room cleanup**
   - remove dashboard duplication
   - keep only home-base shortcuts and presence

5. **Circle separation**
   - verify distinct data sources, identity rules, and moderation for teen versus parent

6. **Mobile layout pass**
   - safe areas
   - Safari viewport height
   - floating Mood overlap
   - bottom-tab overflow
   - screen-specific header sizing

## Acceptance rule

A feature belongs on a screen only when it strengthens that screen’s single job. If the same complete interaction appears on two primary screens, one of them is wrong.
