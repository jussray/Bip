# bip-privacy-redteam

## Trigger
Any PR touching: Supabase migrations, RLS policies, Edge Functions, API routes
that query user or circle data.

## Core Rule — The Privacy Contract
`author_user_id` must never reach anonymous, public, parent-summary, or
untrusted-member clients unless the contract explicitly authorizes that identity
disclosure. This rule is scoped to untrusted surfaces — there may be future
trusted server-side or private-connection contexts where an identifier is
intentionally available. When in doubt, treat the surface as untrusted.

## Review Protocol (run in order)

### 1. Column Audit
Grep every changed migration for columns named:
- `author_user_id`, `user_id`, `created_by`, `owner_id`

For each: identify who the client is and whether that surface is trusted.
Flag any column that reaches an anonymous, public, parent-summary, or
untrusted-member client without an explicit authorization in the contract.

### 2. RLS Policy Intent Check
For each table touched, identify the intended access model:
- Who is allowed to SELECT? INSERT? UPDATE? DELETE?
- Every **allowed** operation must have an explicit policy.
- Every **disallowed** operation must remain impossible (no policy = blocked by default in Supabase with RLS enabled — confirm RLS is ON).

Do NOT require all four policies on every table. Instead:
- Append-only audit/event tables: INSERT policy only — no UPDATE or DELETE required.
- Server-written tables (written via service role only): no client policies needed — confirm service-role-only write path.
- Immutable reference tables: SELECT policy only if clients read them; no write policies needed.
- Tables clients must never touch: RLS enabled + no policy = correct security control.

Flag: any table where RLS is **disabled** and client access is assumed safe.
Flag: any allowed operation that lacks an explicit policy.
Do NOT flag: absent policies for operations the client must never perform.

### 3. Teen/Parent Boundary Check
The primary privacy boundary is the `(teen)` / `(parent)` route split.
Any data query that can return teen-authored content to a parent context without
explicit consent linkage is a violation — even if RLS technically allows it.
- Teen content queries must be scoped to the teen's own `auth.uid()`
- Parent bridge queries must go through the consent/link table, not direct joins
- Anonymous post rows must be indistinguishable from identified post rows at the wire level

### 4. Circle Anon/Cross-Leak Test
- Can Member A query content authored by Member B and retrieve `author_user_id`? Should be NULL or absent on this untrusted surface.
- Does the circle membership join leak user identity through a side channel (e.g., `profiles` table join)?

### 5. Edge Function Auth Boundary
The service-role key is for admin operations only.
User-scoped queries MUST use the user's JWT, not the service key.
Flag any `supabaseAdmin.from(...)` call that returns user-authored content
without a server-side business justification.

### 6. Eval Case (known bug baseline)
The known `author_user_id` leak: a SELECT on circle posts that joined `profiles`
and returned `author_user_id` in the response payload without RLS filtering.
The fix: RLS policy on `circle_posts` restricting SELECT to circle members only,
with `author_user_id` either excluded from the select list or null-masked.
If new code would re-introduce this pattern on an untrusted surface, it fails.

## Pass Criteria
- No `author_user_id` reachable by anonymous, public, parent-summary, or untrusted-member clients without explicit contract authorization
- Every allowed client operation has an explicit RLS policy
- RLS is enabled on every table that clients touch
- No service-role key used for user-scoped reads without business justification
- Teen/parent boundary enforced at the query layer, not just the UI layer
- Anon posts have no identity bleed path

## Output Format
Return: PASS | FAIL | NEEDS REVIEW
- FAIL: exact file + line + violation type + which surface is exposed
- NEEDS REVIEW: ambiguous pattern that needs migration test or contract clarification
