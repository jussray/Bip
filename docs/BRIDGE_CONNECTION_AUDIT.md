# Bridge / S2Tell / Doorbell Audit

## Original product intent

Bridge is the private teen-parent connection system.

- **Doorbell** is the lightweight signal layer inside Bridge.
- **S2Tell** is the vulnerable share composer inside Bridge.
- **Parent Bridge** is the parent-side view of the same linked relationship.
- **Circle is unrelated** and remains community-only.

## Drift found

1. Doorbell became a standalone parent dashboard route.
2. Parent More listed Doorbell and Bridge as separate products.
3. S2Tell had its own screen implementation even though its route already aliases into Bridge.
4. Bridge signals were cloud-synced, but message content still depended on local side switching and local storage paths.
5. Teen and parent side switching in More made one account imitate both people instead of exercising a linked-account relationship.
6. Parent Bridge exposed an activity pulse that risks turning the connection layer into monitoring; Bridge should prioritize intentionally shared content.

## Refactor completed

- Doorbell is now defined as `signals` owned by Bridge.
- The former parent Doorbell route redirects into Parent Bridge signals.
- S2Tell continues to enter Teen Bridge through the Bridge route.
- Added `bridge_messages`, a linked-account message model for S2Tell shares, parent replies, notes, and shared moments.
- Added RLS that permits only the active linked teen and parent to read or write the shared Bridge thread.
- Added a Bridge client service that resolves the active parent link instead of relying on side-switch state.
- Removed Doorbell as a separate item from Parent More.
- Kept all Circle tables and routes outside the Bridge service.
- Side-switch controls are hidden unless `EXPO_PUBLIC_ENABLE_SIDE_SWITCH=true` is explicitly set for internal testing.

## Canonical structure

### Teen Bridge

- Signals / Doorbell
- S2Tell composer
- Parent replies
- Shared moments
- Connection history

### Parent Bridge

- Teen signals
- S2Tell shares
- Parent reply composer
- Shared moments
- Connection history

## Privacy boundary

Bridge may contain only content a participant intentionally sends into the linked relationship. It must never read teen journals, companion chats, private voice notes, Circle posts, or general activity history.

## Remaining UI pass

The legacy `BridgeScreen` and `ParentBridgeScreen` still contain older presentation sections. The next UI pass should render the canonical tabs above using `bridge_signals` and `bridge_messages`, then remove the legacy activity-pulse and duplicate advice/dashboard sections without changing the linked-account data contract.
