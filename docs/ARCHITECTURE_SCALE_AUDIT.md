# Se'kret Bip — Architecture Audit for 1K to 100K Users

Status: **Audit, per issue #141. No code changes bundled with this document**
other than the point-ledger schema fix in
`20260703_reconcile_point_ledger_schema.sql`, which was a correctness bug
found during this audit, not a scale change.

Baseline: `docs/ARCHITECTURE.md`, `docs/CURRENT_STATUS.md`,
`docs/WIRING_STATUS.md`, `docs/AGENT_L4_ARCHITECTURE.md`.

## Matters now (before 1K users)

### Duplicate table generations — point ledger (fixed this audit)

`20260627_point_ledger.sql` and `20260627193000_phase_2_tasks_approvals_rewards.sql`
both write to `point_transactions` with incompatible schemas, and the second
migration reads a `point_balances` table that was never created. Every
point-awarding task approval and every reward redemption would fail at
runtime. Fixed in `20260703_reconcile_point_ledger_schema.sql`. This class
of bug — two migrations from the same work session defining incompatible
shapes for the same table — is worth a pre-merge check (a CI step that
diffs `information_schema` column expectations against RPC bodies would
have caught this).

### RLS on `point_transactions` is broader than the write paths need

Current policy is `FOR ALL USING/WITH CHECK (auth.uid() = user_id)`,
meaning a client can insert arbitrary rows directly, including a fabricated
large positive `amount`. In practice only `emitEvent()` and the
`SECURITY DEFINER` task/reward RPCs write here today, but RLS is the actual
control, not client discipline. Before this ledger is spendable against
real Shopify inventory, narrow the policy to `INSERT`-only with a `CHECK`
that the row's shape matches one of the known writer patterns, or move
writes fully behind RPCs and drop direct table grants. Tracked in
`docs/POINTS_ECONOMY_DESIGN.md`.

### No server-side rate limiting on point-earning events

`emitEvent()` is callable an unbounded number of times per event type per
day. This doesn't matter at low user counts (abuse is manual and visible),
but it's a correctness gap that becomes a real cost/fraud exposure once
points convert to Shopify merch. Needs a daily-cap check server-side
before rewards go live — see `docs/POINTS_ECONOMY_DESIGN.md`.

### Route/layout ownership: legacy `(main)` references

PR #135 (merged 2026-06-28) eliminated hardcoded `/(main)/` navigation from
route wrappers. `docs/WIRING_STATUS.md` confirms `(teen)`/`(parent)` are
now canonical. Residual risk: any *new* screen copy-pasted from an old
branch (there are 100+ stale branches in this repo, several pre-dating that
fix) could reintroduce a `/(main)/` push. Worth a lint rule or CI grep
(`grep -r "(main)/" app/ src/ screens/`) rather than relying on review
alone, since this exact bug has already shipped once.

### Local vs Supabase state: last-write-wins, not merge

`src/utils/sync.ts` upserts with `onConflict: 'id,user_id'` — the last
write physically wins, there is no vector clock, version column, or merge
strategy. At today's usage (one device per teen, mostly) this is invisible.
It stops being invisible the moment a teen uses Bip on two devices
(phone + a browser tab via the real `react-native-web` target) and edits
the same journal entry offline on both — one edit silently disappears with
no conflict surfaced to the user. Not urgent to fix before 1K users, but
worth a tracked follow-up (`updated_at`-based last-write-wins with a
visible "this was edited elsewhere" notice is a reasonable v1, full CRDT
merge is not warranted at this scale).

## Matters at growth scale (10K–100K), not now

### AI request and cost controls

No token/message caps exist yet (see `docs/BUSINESS_MODEL.md` cost
ceilings). At 1K users this is a monitoring problem (watch the bill); at
100K it's a design requirement (per-user caps, cached companion responses
for repeatable prompts, and degrade-before-drop behavior). Build the
Founder Control Room Infrastructure module (issue #186) before this
becomes urgent, so the signal exists before the cost does.

### Voice/TTS cost and worker responsibilities

`worker/sekret-reply.ts` (1,742 lines) is the single largest worker file
and owns AI reply generation; `worker/piper-tts.ts` is small (44 lines) and
likely a thin relay. Voice is the most expensive per-unit cost in this
stack (per `docs/BUSINESS_MODEL.md`). At current scale, one Worker handling
both reply generation and voice relay is fine. At 100K concurrent users,
revisit whether voice needs its own scaling/queueing path separate from
text replies — not before there's traffic data to justify it.

### Media storage growth

No retention-window policy exists for voice notes/images in Supabase
Storage. Irrelevant at 1K users; becomes a real storage-cost line item at
100K. Design a default retention window now (see `docs/BUSINESS_MODEL.md`
storage cost ceiling) so it ships before it's expensive to retrofit against
a large existing corpus of "keep forever" media.

### Companion memory persistence

Current state is L2 (stateless + client-passed history), fully documented
in `docs/AGENT_L4_ARCHITECTURE.md` with a concrete L3 recommendation
(Supabase `pgvector`, not a third-party memory vendor, per the COPPA
subprocessor constraint). This is a product-quality gap more than a
scale risk — L2 works at any user count, it just doesn't remember. Treat
as a roadmap item, not a scale blocker.

### Offline sync and conflict handling

Covered above under "matters now" for the correctness gap; the *scale*
dimension (sync throughput, batching) is not a concern until well past
100K concurrent devices — Supabase's upsert path handles today's write
volume without any special-casing needed.

### Observability, retries, and failure states

`worker/telemetry.ts` and the Founder Control Room's ingestion
(`docs/WIRING_STATUS.md`: "Founder Control Room ingestion and
release-health systems" — implemented) already give metadata-only
observability. Missing: systematic retry/backoff policy for Supabase
writes from the client — `sync.ts` swallows errors by design (never throw,
never break the local experience), which is correct for UX but means a
failed sync is currently invisible rather than retried. At 1K users this is
acceptable (rare, low blast radius); at 100K a silent, permanently-failed
sync becomes a real data-loss-on-device-loss risk. A lightweight retry
queue (exponential backoff, capped attempts, then surface to Control Room
as a Sync module signal) is the right scale-triggered addition — not
needed today.

### Moderation and safety processing

Safety tables/triggers/Edge Function scaffolding already exist
(`docs/WIRING_STATUS.md`). Per `docs/BUSINESS_MODEL.md`, moderation is the
one cost category that must never be capped for cost reasons regardless of
scale — flagging this here so a future cost-cutting pass doesn't
accidentally throttle it.

## Event and ledger consistency (cross-cutting)

`bip_events` (activity log) and `point_transactions` (point ledger) are
two separate append-only tables fed by the same `emitEvent()` call
(`src/features/activity/events.ts` inserts into `bip_events`;
`src/features/activity/ledger.ts` subscribes and inserts into
`point_transactions`). They can drift: a `bip_events` write can succeed
while the corresponding `point_transactions` write fails (separate network
calls, no transaction spanning both). At 1K users this is a rare, low-
stakes discrepancy (a teen's point total is off by one). Not worth a
distributed-transaction fix at any scale Bip is likely to hit — a periodic
reconciliation job (recompute `point_transactions` from `bip_events` for
mismatched users) is the right-sized fix if drift is ever observed, and it
doesn't need to exist before it's observed.

## Recommended order

1. Ship the point ledger schema fix (done — `20260703_reconcile_point_ledger_schema.sql`).
2. Add the `(main)/` regression grep to CI (cheap, prevents a repeat of a
   bug that already shipped once).
3. Add daily point-earning caps server-side before Shopify redemption goes
   live (blocks issue #139/#138 launch, not urgent otherwise).
4. Everything under "growth scale" — revisit when usage data exists to
   prioritize among them, not on a fixed calendar date.
