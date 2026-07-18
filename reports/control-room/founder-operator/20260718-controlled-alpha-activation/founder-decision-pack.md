# Controlled-Alpha Founder Decision Pack

## Recommended posture

**Continue isolated verification. Hold live migration application and alpha distribution.**

## Evidence available

- PR #495 is open, mergeable, and draft.
- Public production remains closed.
- Bridge and Crew are beta-only; Scrapbook remains internal; L4/L5 remain disabled.
- Catalog probe v2 ran against live metadata with temporary rows and rollback.
- Live before-state result: **2 of 12 checks pass**; the other 10 are the unapplied migration boundaries.
- Aggregate drift is zero for malformed active Crew shares, blocked-direction active shares, unsupported Bridge source rows, and nonterminal unsupported-source requests.
- The final Bridge RPC, Crew owner trigger, Crew revoke RPC, and caller-bound Crew helper compile against the live schema in rollback-only temporary form.
- Hosted GitHub jobs still contain no executed steps or logs.
- A truthful complete checkout is unavailable in the current container because GitHub clone/archive hosts do not resolve.

## Decision 1: isolated database validation

A Supabase development branch currently costs **$0.01344 per hour**. Retrieving this price created no branch and incurred no charge.

Recommended choice: create an isolated branch only after explicit cost confirmation, then:

1. apply the three ordered relationship migrations;
2. run catalog probe v2 expecting 12 of 12;
3. run security advisors;
4. run synthetic denial checks;
5. retain rollback evidence;
6. remove or retain the branch according to the approved cost plan.

Alternative: wait for a complete local or hosted checkout and use a local Supabase reset. This avoids branch cost but remains blocked by repository networking and hosted-runner startup.

Direct live application is not recommended before one of those validation paths succeeds.

## Decision 2: authentication protection

Supabase reports compromised-password protection disabled.

Recommended choice: enable it before password-based controlled-alpha invitations. If it remains disabled, Founder Room must record a concrete alternative authentication control and accepted risk before accounts are created.

## Decision 3: public database RPC posture

Retain only narrowly scoped app RPCs that:

- bind authority to the current user;
- deny anonymous sessions where permanent identity is required;
- use a fixed search path;
- validate ownership and relationship state;
- grant execution explicitly;
- remove direct-table mutation alternatives;
- pass negative authorization probes.

## Hard holds

Do not apply live migrations, change authentication settings, deploy, use secrets, consume paid build capacity, distribute builds, create controlled accounts, merge, or open the alpha without the corresponding founder approval and retained evidence.

## Recommended founder record

- Isolated database branch: **approve after cost confirmation**
- Compromised-password protection: **enable before invitations**
- Live migration application: **hold until isolated proof passes**
- Controlled-alpha distribution: **hold**

This pack records recommendations only. It executes nothing.
