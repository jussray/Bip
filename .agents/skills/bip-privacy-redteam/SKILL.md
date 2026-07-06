# bip-privacy-redteam

## Trigger
Any PR touching: Supabase migrations, RLS policies, Edge Functions, API routes
that query user or circle data.

## Core Rule — The Privacy Contract
`author_user_id` MUST NEVER cross the wire to a client that is not the author.
Any SELECT, JOIN, or RPC that exposes this column to a non-owner is a critical violation.

## Review Protocol (run in order)

### 1. Column Audit
Grep every changed migration for columns named:
- `author_user_id`, `user_id`, `created_by`, `owner_id`

Check: is each one covered by an RLS policy that enforces `auth.uid() = <column>`?
Flag any column that appears in a SELECT without a corresponding RLS filter.

### 2. RLS Policy Completeness Check
For each table touched, verify ALL four policies exist:
- SELECT — row-level filter on ownership or circle membership
- INSERT — `with check (auth.uid() = author_user_id)`
- UPDATE — ownership check
- DELETE — ownership check

Missing any one = blocker.

### 3. Teen/Parent Boundary Check
The primary privacy boundary in this app is the `(teen)` / `(parent)` route split.
Any data query that can return teen-authored content to a parent context without
explicit consent linkage is a violation — even if RLS technically allows it.
- Verify teen content queries are scoped to the teen's own `auth.uid()`
- Verify parent bridge queries go through the consent/link table, not direct joins
- Anonymous post rows must be indistinguishable from identified post rows at the wire level

### 4. Circle Anon/Cross-Leak Test
- Can Member A query content authored by Member B and retrieve `author_user_id`? Should be NULL or absent.
- Does the circle membership join leak user identity through a side channel (e.g., `profiles` table join)?

### 5. Edge Function Auth Boundary
Any Edge Function calling Supabase must use the SERVICE_ROLE key only for admin ops.
User-scoped queries MUST use the user's JWT, not the service key.
Flag any `supabaseAdmin.from(...)` call that returns user-authored content.

### 6. Eval Case (known bug baseline)
The known `author_user_id` leak: a SELECT on circle posts that joined `profiles`
and returned `author_user_id` in the response payload without RLS filtering.
The fix: RLS policy on `circle_posts` restricting SELECT to circle members only,
with `author_user_id` either excluded from the select list or null-masked.
If new code would re-introduce this pattern, it fails.

## Pass Criteria
- Zero `author_user_id` columns reachable by non-owners
- All four RLS ops covered on every touched table
- No service-role key used for user-scoped reads
- Teen/parent boundary enforced at the query layer, not just the UI layer
- Anon posts have no identity bleed path

## Output Format
Return: PASS | FAIL | NEEDS REVIEW
- FAIL: exact file + line + violation type
- NEEDS REVIEW: ambiguous pattern that needs migration test
