import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const CURRENT_BASELINE = '9cd5d6d4641160b9425320e31482a4bd05eb25c2';

test('launch roadmap is visual, phased, current, evidence-based, and privacy-safe', async () => {
  const roadmap = await read('docs/LAUNCH_ROADMAP.md');

  assert.match(roadmap, /```mermaid/);
  assert.match(roadmap, /Repository baseline:.*9cd5d6d4641160b9425320e31482a4bd05eb25c2/);
  assert.match(roadmap, /Phase 0 — Foundation integrated/);
  assert.match(roadmap, /Phase 1 — Launch trust spine/);
  assert.match(roadmap, /Phase 2 — Relationship and privacy lifecycle proof/);
  assert.match(roadmap, /Phase 3 — Device quality, accessibility, and safety/);
  assert.match(roadmap, /Phase 4 — Controlled alpha/);
  assert.match(roadmap, /Phase 5 — Launch clearance/);
  assert.match(roadmap, /Phase 6 — Public launch and learning loop/);

  assert.match(roadmap, /Resolve the onboarding-state split/);
  assert.match(roadmap, /Founder Access Recovery Gate issue #563/);
  assert.match(roadmap, /A green PR proves only reviewed integration/);
  assert.match(roadmap, /Launch is not blocked on L4 or L5/);
  assert.match(roadmap, /L5 synthesis \| Blocked/);
  assert.match(roadmap, /Raw teen journals, private messages, voice transcripts, safety evidence/);
  assert.match(roadmap, /Dates may be added only when capacity, dependency, and evidence owners are known/);
});

test('current sprint is a bounded launch execution handoff tied to current main', async () => {
  const sprint = await read('SPRINT.md');

  assert.match(sprint, /Sprint theme:.*Restore one current truth layer/);
  assert.match(sprint, /Verified repository baseline reviewed/);
  assert.match(sprint, new RegExp(CURRENT_BASELINE));
  assert.match(sprint, /Move Se'kret Bip.*controlled-alpha readiness/s);
  assert.match(sprint, /PR #595 — canonical onboarding-state path/);
  assert.match(sprint, /PR #596 — Crew invite RPC behavior contract/);
  assert.match(sprint, /Immediate execution order/);
  assert.match(sprint, /Explicit non-goals/);
  assert.match(sprint, /Definition of done/);
  assert.match(sprint, /Only after launch-critical work is complete, design the smallest safe L4 schema/);
  assert.match(sprint, /Only after L4 reaches `verified`, consider an L5 consent contract/);
  assert.match(sprint, /A green PR proves only the scope and evidence that actually ran against its exact head/);
});

test('documentation map defines external evidence, repository authority, and stale-document handling', async () => {
  const map = await read('docs/DOCUMENTATION_MAP.md');

  assert.match(map, /Level 0 — inspected external truth/);
  assert.match(map, /Level 1 — live operating truth/);
  assert.match(map, /Level 2 — architecture and product contracts/);
  assert.match(map, /Level 3 — runbooks, audits, and evidence/);
  assert.match(map, /Level 4 — strategy, research, and future options/);
  assert.match(map, /Historical snapshot\. Do not use this file as current implementation/);
  assert.match(map, /ROADMAP_NEW/);
  assert.match(map, /One topic should have one canonical active owner document/);
  assert.match(map, /A PR body is the author's proposed scope and self-reported evidence, not independent proof/);
});

test('founder and agent entry points use the same current-truth system', async () => {
  const [readme, status, sprint, wiring, refresh, agents, strategy] = await Promise.all([
    read('README.md'),
    read('docs/CURRENT_STATUS.md'),
    read('SPRINT.md'),
    read('docs/WIRING_STATUS.md'),
    read('docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md'),
    read('AGENTS.md'),
    read('docs/strategy/README.md'),
  ]);

  for (const document of [readme, status, sprint]) {
    assert.match(document, /docs\/LAUNCH_ROADMAP\.md/);
  }

  for (const document of [readme, status, sprint, wiring, refresh, agents]) {
    assert.match(document, new RegExp(CURRENT_BASELINE));
  }

  assert.match(readme, /docs\/DOCUMENTATION_MAP\.md/);
  assert.match(readme, /SPRINT\.md/);
  assert.match(readme, /Suhana, Sy, Cloud, and Night/);
  assert.match(status, /Privacy-safe Daily Intentions/);
  assert.match(status, /L5 remains blocked until L4 reaches `verified`/);
  assert.match(refresh, /Draft PR #595/);
  assert.match(refresh, /Draft PR #596/);
  assert.match(strategy, /Signal or idea/);
  assert.match(strategy, /Launch-roadmap placement/);
});

test('ledger extension records the documentation contract', async () => {
  const extension = JSON.parse(await read('implementation-ledger.extensions/launch-documentation-system.json'));

  assert.equal(extension.id, 'launch-documentation-system');
  assert.equal(extension.status, 'contract');
  assert.equal(extension.ownerIssue, 'https://github.com/jussray/Sekret-Bip/issues/456');
  assert.equal(extension.verification.state, 'passed');
  assert.equal(extension.verification.evidence, 'https://github.com/jussray/Sekret-Bip/pull/457');
  assert.ok(extension.contractPaths.includes('docs/LAUNCH_ROADMAP.md'));
  assert.ok(extension.contractPaths.includes('docs/DOCUMENTATION_MAP.md'));
  assert.ok(extension.testPaths.includes('test/launch-documentation-contract.test.mjs'));
});
