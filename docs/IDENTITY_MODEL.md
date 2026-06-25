# Se'kret Bip identity model

Se'kret Bip supports two identities for every account: a private real identity
and a public anonymous identity. The app must choose which identity to show by
context, not by convenience.

## Private real identity

Stored only on the private `accounts` profile row:

- `first_name`
- `email`
- `side` (`teen` or `guardian`)
- `age_gate_status`

Real identity exists for login, safety, billing, recovery, and connected
parent/guardian setup. It may be shown only in these contexts:

- `private_self` — the user's own Room, private profile, and settings.
- `trusted_friend` — accepted Bip Crew friends after a mutual/accepted
  connection exists.
- `guardian` — connected parent/guardian views, and only for information the
  teen/family permissions allow.

## Public anonymous identity

Stored beside the private profile, but used for public or wider community UI:

- `anonymous_handle`
- `avatar_key` / selected Se'kret visual identity

Use the anonymous identity in these contexts:

- `public_circle` — public/community Circle posts.
- Shared emotional posts outside trusted friends/family.
- Wider community surfaces.
- Rewards leaderboards, if any.
- Fallback UI whenever the audience is unclear.

Public/community Circle must never show real email, full real name, or private
first name. Circle defaults to `anonymous_handle` and avatar. A post may show a
real first name only when it is explicitly limited to trusted Bip Crew/private
friends.

## Data ownership

Journal entries, voice notes, moods, streaks, rewards, comfort sessions, Circle
posts, and parent/teen data are scoped to `auth.uid()` through row-level security.
No app data should be created before both the age gate and account/profile setup
resolve.

## UI selection rule

Use `profileIdentity(profile, context)` from `utils/account.ts`:

- `private_self` → `first_name`
- `trusted_friend` → `first_name`
- `guardian` → allowed real info
- `public_circle` → `anonymous_handle`
- `fallback` → `anonymous_handle`
