# bip-control-room

## Trigger

Use for work involving the founder Control Room, mission execution, local verification, issue ingestion, operating dashboards, OODA, release evidence, connectors, workers, or recovery.

## 5W1H operating contract

Before planning, editing, or claiming completion, establish:

- **Who** owns the decision, execution, review, and affected data.
- **What** outcome is requested, what must be preserved, and what is explicitly out of scope.
- **Where** the exact repository, branch, runtime, route, service, or environment boundary lives.
- **When** the change may run, which dependencies come first, and when rollback remains available.
- **Why** verified evidence justifies the work.
- **How** the smallest safe implementation will be verified, released, observed, and reversed.

Inspect repository and runtime truth for unknowns. Re-run the six questions after OODA or red-team findings change the plan.

## Canonical purpose and ownership

The Control Room is the founder-only operating layer for shipping Se'kret Bip. It is not a teen or parent product surface and must never become a second standalone application.

Canonical ownership:

- entry: `app/(dev)/control-room.tsx`;
- screen: `src/screens/DevControlRoomWorkspace.tsx`;
- UI splits: `src/features/control-room/`;
- services: `src/services/controlRoom*`;
- config: `src/config/controlRoom*`;
- types: `src/types/controlRoom*`;
- local execution: `scripts/control-room-*.mjs` and `scripts/control-room-agent.mjs`;
- documentation: `docs/CONTROL_ROOM*.md`;
- verification evidence: `reports/control-room/`.

Do not create a parallel `control-room/`, `apps/control-room/`, `founder-os/`, `operations-center/`, or new dashboard route without explicit founder approval.

## Mission execution model

Start live local execution with:

```bash
npm run control-room:dev
```

This command starts Expo web and the loopback mission server with a fresh token. The UI may run only mission IDs present in both the Control Room mission registry and the server allowlist.

Current button-executable missions:

- `continue-yesterday`;
- `verify-local`;
- `verify-frontend`;
- `recover-system`.

`launch-bip` is handled by the combined startup command. `ship-release` remains manual and must never be executed from the local UI.

## Authority boundary

- The founder may open the gated UI and start an allowlisted local mission.
- The local server may invoke only the fixed local-agent command for that mission.
- Hosted or advisory workers may recommend; they do not gain shell, merge, secret, or deployment authority.
- Teen and parent accounts must not reach the route, token, output, or operational data.
- Provider-specific coordination rules remain governed by `AI_COORDINATION.md`, `GLOBAL_AI.md`, `AGENTS.md`, and `docs/PROVIDERS.md`.

## Safety boundary

Fail the change if any of these become false:

- the server binds only to `127.0.0.1`;
- each launch uses a new random token of at least 32 bytes;
- local origin and bearer authentication are enforced;
- mission IDs are allowlisted and arbitrary shell arguments are rejected;
- only one mission runs at a time, including while a timed-out process tree is terminating;
- execution has a timeout, descendant-process termination with forced escalation, and bounded output;
- tokens and secrets are never written to reports, logs, commits, or production bundles;
- raw teen or parent-private content never enters mission output, telemetry, prompts, or provider calls;
- UI success is not described as deployment or exact production proof.

## Verification

For Control Room execution changes, run at minimum:

```bash
node --check scripts/control-room-agent.mjs
node --check scripts/control-room-server.mjs
node --check scripts/control-room-dev.mjs
node --test test/control-room-os.test.mjs
npm run type-check
npm run verify:local
```

Use Playwright for browser proof when available. If it cannot run, label the fallback honestly. GitHub Actions that never start are blocked evidence, not failures in application code and not passes.

## Output

Report the exact files and mission IDs changed, local-agent health and executed evidence, privacy and authorization boundaries preserved, exact head SHA, check state, and remaining manual gate.

Never claim the Control Room works merely because cards render. Prove that an allowlisted mission can run through the authenticated loopback path and return a real result.
