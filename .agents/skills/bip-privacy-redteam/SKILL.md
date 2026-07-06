# bip-privacy-redteam

## Trigger
Any PR touching: Supabase migrations, RLS policies, Edge Functions, API routes
that query user or circle data.

## Core Rule — The Privacy Contract
`author_user_id` must never reach anonymous, public, parent-summary, or other
untrusted clients unless the contract explicitly authorizes identity disclosure.
Any SELECT, JOIN, RPC, Edge Function, or response mapper that exposes identity
outside that contract is a critical violation.

## Review Protocol (run in order)

### 1. Column Audit
Grep every changed migration and query for identity-bearing columns such as:
- `author_user_id`, `user_id`, `created_by`, `owner_id`

For each use, identify the intended audience and authorization contract.
- Owner-only reads must enforce `auth.uid() = <owner column>`.
- Circle/member reads must enforce membership without leaking identity fields.
- Parent reads must flow through explicit active-link and consent records.
- Server-only identifiers must be removed or masked before the response crosses the wire.

Flag any identity column that appears in a response without an explicit, tested reason.

### 2. RLS Operation Matrix
For every touched table, list SELECT, INSERT, UPDATE, and DELETE and classify each as:
- ALLOWED — requires an explicit policy with the correct ownership, membership, or consent check.
- DENIED — must remain impossible; absence of a policy may be the intended control.
- SERVER-ONLY — must not be reachable through an end-user JWT.

Do not require policies for operations clients must never perform. A table passes only when
every allowed operation is explicitly protected and every denied operation remains denied.

For user-authored inserts, prefer a `WITH CHECK` that binds the ownership column to
`auth.uid()`. For updates and deletes, verify both row visibility and ownership constraints.

### 3. Teen/Parent Boundary Check
The primary privacy boundary in this app is the `(teen)` / `(parent)` route split.
Any data query that can return teen-authored content to a parent context without
explicit consent linkage is a violation — even if RLS technically allows it.
- Verify teen content queries are scoped to the teen's own `auth.uid()`.
- Verify parent Bridge queries go through the active link and consent/request tables.
- Verify parent responses contain generated summaries only, never raw source content.
- Anonymous post rows must be indistinguishable from identified post rows at the wire level.

### 4. Circle Anon/Cross-Leak Test
- Can Member A query content authored by Member B and retrieve `author_user_id` or an equivalent stable identifier? It must be absent or masked unless identity disclosure is an explicit feature.
- Does the circle membership join leak identity through a side channel such as `profiles`, email, username, avatar ownership, or stable internal IDs?
- Can response shape, nullability, ordering, or metadata distinguish anonymous posts from identified posts?

### 5. Edge Function Auth Boundary
Any Edge Function calling Supabase must use the SERVICE_ROLE key only for narrowly scoped
admin operations. User-scoped reads must preserve and validate the user's JWT or perform an
equivalent explicit authorization check before using elevated credentials.

Flag any `supabaseAdmin.from(...)` call that returns user-authored content without a verified
audience check and response minimization.

### 6. Eval Case (known bug baseline)
The known `author_user_id` leak: a SELECT on circle posts joined `profiles` and returned
`author_user_id` in the response payload without a safe disclosure contract.

The durable fix is layered:
- membership/visibility enforced by RLS or an equivalent server authorization boundary;
- identity-bearing columns excluded or masked for anonymous/untrusted audiences;
- response contract tests proving the field cannot cross the wire.

If new code would re-introduce this pattern, it fails.

## Pass Criteria
- No identity-bearing column reaches an unauthorized audience.
- Every allowed table operation has an explicit correct policy.
- Every denied or server-only operation remains unreachable to end-user JWTs.
- No service-role key is used for unbounded user-scoped reads.
- Teen/parent access is enforced at the data/query layer, not only the UI layer.
- Parent Bridge responses remain summary-only.
- Anonymous content has no identity bleed path.

## Output Format
Return: PASS | FAIL | NEEDS REVIEW
- FAIL: exact file + line + violation type + affected audience.
- NEEDS REVIEW: ambiguous authorization contract or behavior requiring a migration/integration test.
