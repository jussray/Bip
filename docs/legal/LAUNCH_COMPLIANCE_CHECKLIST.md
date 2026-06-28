# Se'kret Bip — Launch Compliance Checklist

**Version 1.0 — June 2026**

This checklist is a release gate for any public production launch. A checked box must be backed by code, configuration, test evidence, or a signed operational/legal record.

## Age and Eligibility

- [ ] UI asks for date of birth or another approved age-eligibility signal before account creation.
- [ ] Users under 13 are blocked before non-essential personal information is collected.
- [ ] Server/API enforces the same minimum-age rule.
- [ ] Direct API and replay tests prove the UI gate cannot be bypassed.
- [ ] Demo environment warns users not to enter real personal or crisis information.

## Public Legal Documents

- [ ] Privacy Policy reviewed by counsel and published at a stable URL.
- [ ] Terms of Service reviewed by counsel and published at a stable URL.
- [ ] Privacy and Terms links appear during onboarding and in Settings.
- [ ] Material policy changes use age-appropriate notice.
- [ ] Legal business name, mailing address, and monitored contact addresses are present.

## Data Inventory and Minimization

- [ ] Deployed database schema matches the documented data inventory.
- [ ] Every storage bucket and object path is documented.
- [ ] Analytics, crash reporting, push notification, email, and moderation vendors are inventoried.
- [ ] No behavioral advertising or sale of teen personal information.
- [ ] No unnecessary collection of location, contacts, or persistent advertising identifiers.
- [ ] Retention periods are documented for every category.

## Teen and Parent Separation

- [ ] Parent routes do not directly query private teen journals.
- [ ] Parent routes do not directly query private teen voice recordings.
- [ ] Parent routes do not access private companion or Oracle memory.
- [ ] Parent routes do not access period data.
- [ ] Parent-visible teen data is limited to explicit shares, authorized summaries, or safe aggregates.
- [ ] RLS tests cover linked, unlinked, pending, blocked, removed, and deleted relationships.
- [ ] Sign-out clears private local caches on both sides.

## Circle and Crew

- [ ] Circle identity is separate from private account identity.
- [ ] Bip ID discovery does not expose real names or private profile fields.
- [ ] Pending or blocked Crew relationships reveal no trusted profile details.
- [ ] Accepted Crew visibility is limited to user-selected social/support fields.
- [ ] Community reporting, blocking, and moderation flows are documented and tested.

## AI and Safety

- [ ] AI system prompts prohibit diagnosis, treatment claims, sexualized minor content, coercive dependency, and harmful instructions.
- [ ] Server-side safety controls fail safely.
- [ ] Saved AI responses are disclosed accurately in policy text.
- [ ] Vendor settings confirm API content is not used for model training unless explicitly opted in.
- [ ] Prompt/response retention and logging are documented.
- [ ] Crisis resources are localized by region.
- [ ] Imminent-danger copy directs users to local emergency services and a trusted nearby person.

## Security

- [ ] Supabase service-role key never ships to the client.
- [ ] OpenAI and internal shared secrets exist only in server-side secret storage.
- [ ] Repository and build logs contain no production secrets.
- [ ] RLS is enabled and tested on every user-data table.
- [ ] Private storage buckets use owner-scoped policies.
- [ ] Incident-response and breach-notification procedures are approved.
- [ ] Dependency, secret, and configuration scans pass.

## Access, Correction, and Deletion

- [ ] Users can review core account information.
- [ ] Users can correct editable profile information.
- [ ] Teen account deletion removes teen-owned database rows and storage objects.
- [ ] Parent account deletion preserves teen-private content.
- [ ] Teen deletion immediately revokes parent access.
- [ ] Deleted accounts cannot restore private content through sync.
- [ ] Deletion retries are idempotent.
- [ ] Legally required retention is documented, restricted, and time-limited.

## Memories

- [ ] Profile Memories contain safe markers, not copied private content.
- [ ] Pages remains the owner of raw private journal content.
- [ ] Circle remains the owner of community and Crew content.
- [ ] Bippin 2 remains the owner of growth, points, rewards, and milestones.
- [ ] Bridge remains the owner of consent and support history.
- [ ] Parent Memories describe parent-authored support activity, not teen-private activity.

## Store and Launch Operations

- [ ] Apple age rating and content descriptors are reviewed.
- [ ] Google Play Teen rating and Data Safety form are reviewed.
- [ ] Support and privacy inboxes are monitored.
- [ ] Data-access and deletion request procedures are staffed.
- [ ] Vendor agreements and data-processing terms are archived.
- [ ] Final legal review covers COPPA and applicable state/international teen privacy rules.

## Release Decision

- [ ] Engineering sign-off
- [ ] Security sign-off
- [ ] Product/privacy sign-off
- [ ] Legal sign-off
- [ ] Founder release approval
