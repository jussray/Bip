## What changed and why

<!-- Describe the change and why it exists. -->

## Architecture check

- [ ] No direct Supabase calls from client-side components
- [ ] No new tables without RLS enabled and documented
- [ ] Memory writes go through the canonical worker path
- [ ] No secrets in source code

## If this touches teen-facing flows

- [ ] Safety escalation paths are unaffected or explicitly updated
- [ ] Safety review gate passed

## If this touches companion behavior or reply pools

- [ ] Change matches the relevant companion voice document
- [ ] Product sign-off obtained
- [ ] AI conversation review gate passed

## If this touches parent-facing systems

- [ ] Parent visibility rules reviewed
- [ ] Parent-bridge review passed

## Testing

- [ ] Unit tests added or updated
- [ ] Manually tested where appropriate
- [ ] Feature flag added if rollout is staged
