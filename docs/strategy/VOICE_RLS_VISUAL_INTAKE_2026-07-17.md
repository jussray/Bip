# Voice, RLS, and Visual Concept Intake — 2026-07-17

**Original audit:** 2026-07-17  
**Re-audited:** 2026-08-13  
**Current repository baseline reviewed:** `506dd4aa517b6b76ff850cf56a8846425858042d`  
**Original owner issue:** [#464](https://github.com/jussray/Sekret-Bip/issues/464)  
**Re-audit issue:** [#810](https://github.com/jussray/Sekret-Bip/issues/810)  
**Authority:** strategy and design intake only

This document reconciles the uploaded architecture and concept pack against current repository and read-only live Supabase truth. It does **not** authorize runtime, database, deployment, sprint, launch-scope, or implementation-ledger changes.

## Source pack reviewed

- `bip-engineering-audit-dashboard(1).html`
- `bip-voice-architecture-pack.html`
- `bip-sql-migration-dashboard.html`
- `bip-rls-policy-map-template.csv`
- uploaded Bridge, Pages, Room, Bippin 2, insights, growth, and dashboard concept boards

The source pack remains useful as a hypothesis generator. It is not implementation evidence.

## 2026-08-13 re-audit delta

The July privacy conclusions remain directionally correct, but repository state has advanced.

1. **The privacy-safe voice telemetry schema now exists in repository migrations.** PR #479 merged ordered migrations for `voice_sessions`, `voice_turns`, `voice_events`, and `voice_latency_metrics`, plus strict operational-payload and error-code boundaries. The implementation ledger still marks the feature `contract`, not `integrated` or `verified`.
2. **Those four tables are not present in the observed live Supabase project as of this re-audit.** Read-only catalog inspection of project `tbsevonvegdnlyjgplmm` returned `journal_entries` and `bridge_summaries`, but none of the four `voice_*` telemetry tables. Repository definition and live application therefore remain separate states.
3. **Cloudflare-first voice provider routing has been merged.** PR #663 preserved `/api/sekret/voice` as the single app-facing endpoint while routing provider logic behind the canonical Worker boundary. Its PR head had Cloudflare Worker deployment evidence. That historical proof does not identify the current production Worker or current production Pages SHA.
4. **Voice Bip itself is still full-clip request/response.** The current screen records a complete clip, converts it to base64, requests transcription, then a reply, then synthesis. No current client implementation proves streaming STT/TTS, VAD endpointing, or barge-in.
5. **The shared voice hook is still a lightweight session/status abstraction.** `hooks/useVoiceCompanion.ts` and `src/utils/voiceCompanion.ts` do not own recording, VAD, transport, playback, persistence, or recovery.
6. **Reduced-motion behavior has materially improved.** PR #807 merged a Voice Bip room repair that stops avatar, Cloud, and presence-pill ambient motion when reduced motion is requested and added exact-head Playwright coverage on mobile and desktop. This is accessibility progress, not physical-device launch proof.
7. **The live Bridge privacy boundary is stronger than the original manual RLS audit described.** Live `journal_entries` policies are owner-only for permanent authenticated users. Parents read generated `bridge_summaries` only through an active, unrevoked, unexpired Bridge request and active parent link.
8. **L4 and L5 remain unchanged.** Durable L4 continuity memory is still planned only; L5 remains blocked until L4 reaches `verified` and a separate consent contract exists.

## Executive verdict

The strongest idea in the pack remains **one shared voice runtime instead of feature-by-feature audio behavior**.

The implementation path is now clearer:

- keep the canonical Cloudflare Worker as the AI/backend authority;
- preserve the existing request/response app path while consolidating client lifecycle and playback behavior;
- treat the merged privacy-safe telemetry migrations as a repository contract, not a live database fact;
- do not introduce raw transcript or raw-audio retention by default;
- do not add a second Supabase WebSocket backend merely because the draft architecture proposed one;
- treat VAD, endpointing, barge-in, and realtime streaming as measured experiments until device evidence exists;
- preserve Bridge summary-only parent visibility and the L4/L5 gates;
- use the visual boards as north-star design references rather than proof of implemented or safe product behavior.

## Current repository and environment truth

### Voice Bip client path

`screens/VoiceBipScreen.tsx` currently wires this sequence:

1. request microphone permission;
2. record with Expo AV;
3. stop and unload the complete recording;
4. convert the local recording to base64;
5. request transcription;
6. request a companion reply;
7. request voice synthesis;
8. present the reply and generated audio.

This is a repository-integrated request/response pipeline. It is not a low-latency conversational stream.

### Canonical backend boundary

`/api/sekret/voice` remains the single app-facing synthesis endpoint. Provider routing is implemented behind the canonical Cloudflare Worker through `worker/voice-entry.ts` and the voice provider/routing modules merged by PR #663.

Current provider architecture includes Cloudflare Workers AI lanes and an optional premium timing lane behind the Worker. Provider credentials remain server-side. A provider implementation or old deployment receipt does not by itself prove the current production release.

### Shared voice client abstraction

`hooks/useVoiceCompanion.ts` and `src/utils/voiceCompanion.ts` currently expose session identity and readiness state. The phrase `Voice-ready architecture` must not be interpreted as proof of:

- a shared recorder;
- VAD or endpointing;
- streaming transport;
- interruption-safe playback;
- reconnect;
- durable session persistence;
- production realtime voice.

### Voice telemetry database contract

Repository migrations now define:

| Table | Repository purpose | Content boundary | Current live observation |
|---|---|---|---|
| `voice_sessions` | Session lifecycle and coarse transport metadata | Opaque UUID correlation; no conversation content | Not present in observed live project on 2026-08-13 |
| `voice_turns` | Speaker, order, duration, language, end reason | Transcript character count only; no transcript text | Not present in observed live project on 2026-08-13 |
| `voice_events` | Allowlisted operational events | Primitive, bounded operational metadata only | Not present in observed live project on 2026-08-13 |
| `voice_latency_metrics` | VAD/STT/LLM/TTS/playback/total timing slices | Integer timing values only | Not present in observed live project on 2026-08-13 |

The corresponding implementation-ledger extension remains `contract`, verification `partial`, rollout `disabled`.

### Voice storage

No voice Storage bucket is part of the approved telemetry foundation. A future bucket remains gated on uploader/consumer purpose, ownership, MIME/size limits, retention, expiry, deletion, account-switch isolation, device proof, and rollback.

### Bridge and journal privacy

The active Bridge contract removed legacy raw-content parent-read policies. Current repository and live policy evidence support this boundary:

- `journal_entries`: permanent authenticated owner-only access;
- Bridge source references: teen-only;
- `bridge_summaries`: teen-readable; parent-readable only through an active parent link and a ready/viewed, unrevoked, unexpired request;
- parent access is to the generated summary, not the raw journal row.

## Adopt

These ideas are compatible with current architecture when promoted through separate founder-approved work.

### 1. One shared client voice runtime boundary

Consolidate approved voice surfaces around one lifecycle contract for:

- permission state;
- capture state;
- recording state;
- transcription state;
- reply state;
- synthesis state;
- playback state;
- cancellation and cleanup;
- recoverable failures;
- metadata-safe timing.

The smallest safe first implementation should wrap the existing request/response flow rather than replace it with realtime transport.

### 2. Interruption-safe playback

One playback controller should be able to stop immediately when a user cancels, navigates away, starts a new recording, or a later approved barge-in experiment detects speech.

### 3. Metadata-only performance evidence

The merged telemetry contract correctly limits durable voice evidence to operational metadata. Useful slices include:

- capture-ready latency;
- transcription latency;
- reply latency;
- synthesis latency;
- playback-ready latency;
- total turn duration;
- timeout, cancellation, fallback, and unavailable outcomes.

Do not place raw audio, transcript text, private prompts, replies, names, emails, journal content, or broad identifiers in voice telemetry.

### 4. Client-side endpointing as an experiment

Local VAD may reduce turn latency and enable interruption behavior. It should remain behind a controlled experiment with manual-stop fallback and physical-device evidence.

### 5. Visual north-star qualities

The uploaded boards continue to reinforce useful visual qualities:

- character-led emotional worlds rather than generic utility screens;
- dark purple nighttime atmosphere with warm light sources;
- modular cards with strong grouping;
- clear private-space cues;
- companion presence embedded in the room;
- growth represented through gentle rituals instead of clinical dashboards.

PR #807 adds concrete evidence for one part of this direction: the Voice Bip room now has a reduced-motion contract for ambient presence on web. The broader boards remain references, not pixel specifications or device proof.

## Reframe

### VAD timing values

The source pack's 20 ms analysis cadence and roughly 450 ms silence threshold remain tuning hypotheses, not product requirements. Evaluate them across:

- iOS and Android devices;
- quiet and noisy environments;
- accents, speech rates, pauses, and soft speech;
- Bluetooth and wired routes;
- accessibility needs;
- accidental activation and early-cutoff rates.

### Realtime transport

The question is not `How do we add a Supabase WebSocket proxy?`

The correct question is:

> What is the smallest realtime extension that preserves the canonical Cloudflare Worker authority, authenticated contracts, observability, rollback, and teen privacy?

A second relay is not justified merely because the original pack includes one.

### SQL-first voice work

The original SQL-first idea has now been **partially adopted in a narrower privacy-safe form**:

- four telemetry tables are defined in repository migrations;
- raw transcript text was removed;
- raw audio was excluded;
- the private Storage bucket was not created;
- writes are server-owned;
- public client access is constrained by RLS and explicit grants;
- event payloads and error codes fail closed outside approved vocabularies.

What has **not** happened is equally important: the observed live project does not contain those tables, and no shared client realtime runtime consumes them.

### Streaming as launch scope

Realtime streaming voice is not a public-launch dependency by default. It becomes launch-critical only if the founder explicitly includes conversational realtime voice in the launch promise.

### Long-term memory

The engineering dashboard correctly identified continuity as a strategic gap. Its generic embedding store and nightly compression design is not current authority.

L4 still requires, together:

- teen ownership;
- provenance;
- correction and deletion;
- expiration and retention;
- RLS and cross-user/parent/anonymous denial proof;
- no raw transcript-as-memory default;
- one real user-visible consumer;
- rollout, telemetry, and rollback.

## Reject

### 1. Supabase Edge Function as the default voice relay

The source pack's authenticated Supabase WebSocket proxy is not current architecture. It would create a second backend authority unless deliberately designed as a subordinate transport component under an approved architecture change.

### 2. Raw transcript persistence by default

The original `voice_turns.transcript` concept is not approved. The merged repository migration stores `transcript_chars`, not transcript text.

### 3. Raw-audio or public voice storage by default

The SQL dashboard's proposed voice Storage phase was not adopted. The approved contract intentionally creates no voice bucket.

### 4. Generic transcript-derived memory blobs

Do not store transcript-derived `content` plus embeddings as a default memory object. That would bypass current L4 provenance, correction, retention, deletion, consent, and denial gates.

### 5. Bridge screens that expose raw teen source text to parents

Visual concepts that display a direct teen quote and then offer `what they might mean` conflict with the active Bridge privacy model. Parent guidance may help a parent respond gently; it must not expose unshared source content or claim certainty about a teen's hidden internal state.

### 6. Health or puberty guidance as launch scope

Bippin 2 concepts covering puberty, body changes, hygiene, sleep, and health-adjacent guidance remain future work requiring age-appropriate content ownership, legal and safeguarding review, source quality, accessibility, crisis/medical boundaries, and non-diagnostic language.

### 7. Dense concept boards as verified mobile layouts

The emotional richness is useful. The density is not verified. Launch UI still requires physical-device readability, touch-target, screen-reader order, motion, small-screen, orientation, and cognitive-load evidence.

## Visual privacy red-team

### Bridge

Keep:

- warm parent-side room;
- `bridge, not a window` framing;
- response suggestions centered on listening and low pressure;
- relationship progress framed as shared effort rather than surveillance.

Change before implementation:

- use a teen-approved privacy-safe generated summary rather than raw source text;
- remove authoritative `what they might mean` translation;
- do not expose source history without a specific share/revocation contract;
- avoid connection scores that imply emotional surveillance or false certainty.

### Pages and companion replies

Keep:

- private-space framing;
- multimodal entry choices;
- companion presence after the teen chooses to engage;
- clear entry organization.

Change before implementation:

- avoid absolute privacy claims unless server, support, safety, retention, and deletion boundaries make them literally true;
- do not turn optional mood or reply choices into hidden durable profiling;
- reduce simultaneous controls on small devices;
- keep output language aligned with the active Se'kret/companion identity contracts.

### Voice Bip

Keep:

- character presence and atmospheric room treatment;
- visible listening/thinking/responding state;
- reduced-motion support;
- explicit unavailable/failure states.

Change before realtime promotion:

- centralize recorder and playback cleanup;
- define cancellation and navigation-away behavior;
- measure actual device latency before selecting VAD thresholds;
- preserve manual stop as a fallback;
- do not infer realtime capability from telemetry schema or provider routing alone.

### Bippin 2 and growth dashboards

Keep:

- age-relevant identity and growth rituals;
- private journals and confidence-building language;
- progress that rewards showing up rather than perfection.

Change before implementation:

- separate identity support from medical/developmental guidance;
- avoid gender-essentialist assumptions;
- do not infer health state from self-checks;
- require an evidence owner for health-adjacent claims;
- keep this outside launch scope until separately approved.

## Recommended promotion sequence

### Issue A — shared request/response client runtime

1. inventory current recorder, transcription, reply, synthesis, and playback paths;
2. define one typed client state machine around the existing Cloudflare endpoints;
3. centralize cancellation, navigation cleanup, and playback ownership;
4. consume metadata-only timing locally first;
5. prove current request/response behavior does not regress;
6. do not add WebSockets or VAD in the same first slice.

### Issue B — voice telemetry environment application

The repository contract already exists. Any environment application remains separate work:

1. separate founder approval for the target Supabase project;
2. apply the reviewed ordered migrations;
3. execute rollback-contained owner/cross-user/anonymous and payload-denial probes;
4. run Supabase security and performance advisors;
5. inspect live grants, policies, indexes, and migration history;
6. promote ledger state only when the resulting live evidence supports it.

### Issue C — generated current RLS policy map

Replace the uploaded manual CSV's `unknown`/historical cells with a generated artifact that distinguishes:

- repository migration contract;
- live catalog observation;
- executable behavior proof;
- unresolved evidence.

Do not treat retired `db/schema.sql` fields as current authority.

### Issue D — VAD and barge-in experiment

Only after client runtime consolidation and telemetry application are justified:

1. define manual-stop baseline;
2. test candidate endpointing thresholds on physical devices;
3. measure early cutoff, false-open, late-close, and barge-in behavior;
4. keep rollout controlled and reversible.

### Issue E — visual design gap matrix

For each selected concept board, record:

- intended user and route;
- emotional goal;
- current implementation owner;
- reusable visual primitives;
- privacy and consent risks;
- accessibility and density risks;
- legal or health-content risks;
- launch phase and whether the idea is in scope.

## Roadmap placement — re-audited 2026-08-13

| Proposal | Current repository state | Live/device state | Placement |
|---|---|---|---|
| Cloudflare voice provider routing | Merged via PR #663 | Historical PR-head Worker deploy evidence; current release truth separate | Integrated backend capability |
| Shared request/response client runtime | Not consolidated; screen still owns full-clip flow | Not proven as shared device runtime | Strategy candidate supporting voice quality |
| Voice telemetry tables | Defined in merged migrations; ledger `contract` | Absent from observed live project on 2026-08-13 | Environment application separately gated |
| VAD and barge-in | Event vocabulary exists; client behavior not implemented | No physical-device proof | Controlled experiment after consolidation |
| Realtime streaming voice | No shared client streaming implementation | Not proven | Future option; not launch dependency by default |
| Voice Storage bucket | Explicitly omitted from approved contract | Not observed | Blocked pending retention/deletion/storage contract |
| Reduced-motion Voice Bip ambience | Merged via PR #807 | Web mobile/desktop Playwright evidence; physical device separate | Accessibility progress |
| Generated RLS policy map | Not yet generated | Live read-only observations available for sampled tables | Supports launch trust work |
| Visual concept gap matrix | Strategy-only | No device proof implied | Supports design/accessibility review |
| Bippin 2 health/puberty modules | Future concept | Not launch-proven | Future product lane |
| L4 continuity memory | Planned only | Not implemented | Separate gated lane |
| L5 cross-companion synthesis | Blocked | Not implemented | Requires verified L4 + separate consent contract |

## Decision rule

Nothing in this intake enters `SPRINT.md`, `docs/LAUNCH_ROADMAP.md`, live schema, runtime, or deployment merely because it looks polished or technically plausible.

Promotion requires:

1. a founder decision;
2. a numbered issue;
3. an implementation owner;
4. privacy, consent, safety, and deletion boundaries;
5. dependencies and launch placement;
6. measurable acceptance criteria;
7. rollout, rollback, and the correct evidence witness.
