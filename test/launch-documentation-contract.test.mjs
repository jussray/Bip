import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('launch roadmap is visual, phased, evidence-based, and privacy-safe', async () => {
  const roadmap = await read('docs/LAUNCH_ROADMAP.md');

  assert.match(roadmap, /```mermaid/);
  assert.match(roadmap, /Phase 0 — Foundation integrated/);
  assert.match(roadmap, /Phase 1 — Launch trust spine/);
  assert.match(roadmap, /Phase 2 — Relationship and privacy lifecycle proof/);
  assert.match(roadmap, /Phase 3 — Device quality, accessibility, and safety/);
  assert.match(roadmap, /Phase 4 — Controlled alpha/);
  assert.match(roadmap, /Phase 5 — Launch clearance/);
  assert.match(roadmap, /Phase 6 — Public launch and learning loop/);

  assert.match(roadmap, /A green PR proves reviewed integration, not production behavior/);
  assert.match(roadmap, /Launch is not blocked on L4 or L5/);
  assert.match(roadmap, /L5 synthesis \| Blocked/);
  assert.match(roadmap, /Raw teen journals, private messages, voice transcripts, safety evidence/);
  assert.match(roadmap, /Dates may be added only when capacity, dependency, and evidence owners are known/);
});

test('current sprint is a bounded launch execution handoff', async () => {
  const sprint = await read('SPRINT.md');

  assert.match(sprint, /Sprint theme:.*Launch trust and journey proof/);
  assert.match(sprint, /Verified implementation baseline reviewed/);
  assert.match(sprint, /ab5cf40b398e02536764b5b806b6f3aec0a9161c/);
  assert.match(sprint, /Move Se'kret Bip.*controlled-alpha readiness/s);
  assert.match(sprint, /Immediate execution order/);
  assert.match(sprint, /Explicit non-goals/);
  assert.match(sprint, /Definition of done/);
  assert.match(sprint, /L4 continuity memory \| Planned/);
  assert.match(sprint, /L5 synthesis \| Planned and blocked/);
  assert.match(sprint, /A green PR proves reviewed integration\. It does not prove production behavior/);
});

test('documentation map defines authority and stale-document handling', async () => {
  const map = await read('docs/DOCUMENTATION_MAP.md');

  assert.match(map, /Level 1 — live operating truth/);
  assert.match(map, /Level 2 — architecture and product contracts/);
  assert.match(map, /Level 3 — runbooks, audits, and evidence/);
  assert.match(map, /Level 4 — strategy, research, and future options/);
  assert.match(map, /Historical snapshot\. Do not use this file as current implementation/);
  assert.match(map, /ROADMAP_NEW/);
  assert.match(map, /One topic should have one canonical active owner document/);
});

test('founder entry points all point to the same roadmap system', async () => {
  const [readme, status, strategy] = await Promise.all([
    read('README.md'),
    read('docs/CURRENT_STATUS.md'),
    read('docs/strategy/README.md'),
  ]);

  for (const document of [readme, status, strategy]) {
    assert.match(document, /docs\/LAUNCH_ROADMAP\.md/);
  }

  assert.match(readme, /docs\/DOCUMENTATION_MAP\.md/);
  assert.match(readme, /SPRINT\.md/);
  assert.match(status, /Privacy-safe Daily Intentions/);
  assert.match(status, /L5 is \*\*planned and blocked\*\*/);
  assert.match(strategy, /Signal or idea/);
  assert.match(strategy, /Launch-roadmap placement/);
});

test('ledger extension records the verified documentation contract', async () => {
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
