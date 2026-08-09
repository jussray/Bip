import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const CURRENT_APPLICATION_BASELINE = '824b4dcffb9e0ffc7468a002f0390cbba98d79ae';
const CURRENT_GATE = 'docs/LAUNCH_GATE_STATUS_2026-07-31.md';

test('launch-gate status distinguishes repository, deployment, browser, and device evidence', async () => {
  const gate = await read(CURRENT_GATE);

  assert.match(gate, new RegExp(CURRENT_APPLICATION_BASELINE));
  assert.match(gate, /Do not declare public launch ready/);
  assert.match(gate, /P0 blocker/);
  assert.match(gate, /\.well-known\/sekret-release\.json/);
  assert.match(gate, /prior unauthenticated Wrangler observations are not current provider truth/);
  assert.match(gate, /PR #698 is merged/);
  assert.match(gate, /PR #690 is closed/);
  assert.match(gate, /PR #692.*closed/);
  assert.match(gate, /PR #700/);
  assert.match(gate, /#646/);
});

test('launch roadmap is visual, phased, current, evidence-based, and privacy-safe', async () => {
  const roadmap = await read('docs/LAUNCH_ROADMAP.md');

  assert.match(roadmap, /```mermaid/);
  assert.match(roadmap, new RegExp(CURRENT_APPLICATION_BASELINE));
  assert.match(roadmap, /Current 2026-07-31 checkpoint/);
  assert.match(roadmap, /P0 #696/);
  assert.match(roadmap, /Phase 0 — Foundation integrated/);
  assert.match(roadmap, /Phase 1 — Launch trust spine/);
  assert.match(roadmap, /Phase 2 — Relationship and privacy lifecycle proof/);
  assert.match(roadmap, /Phase 3 — Device quality, accessibility, and safety/);
  assert.match(roadmap, /Phase 4 — Controlled alpha/);
  assert.match(roadmap, /Phase 5 — Launch clearance/);
  assert.match(roadmap, /Phase 6 — Public launch and learning loop/);
  assert.match(roadmap, /\.well-known\/sekret-release\.json/);
  assert.match(roadmap, /Launch is not blocked on L4 or L5/);
  assert.match(roadmap, /Raw teen journals, private messages, voice transcripts, safety evidence/);
  assert.match(roadmap, /Dates may be added only when capacity, dependency, and evidence owners are known/);
});

test('current sprint is a bounded launch execution handoff tied to current main', async () => {
  const sprint = await read('SPRINT.md');

  assert.match(sprint, /Sprint theme/);
  assert.match(sprint, new RegExp(CURRENT_APPLICATION_BASELINE));
  assert.match(sprint, /Restore one current truth layer and remove false launch signals/);
  assert.match(sprint, /P0 release blocker/);
  assert.match(sprint, /Immediate execution order/);
  assert.match(sprint, /Explicit non-goals/);
  assert.match(sprint, /Definition of done/);
  assert.match(sprint, /Only after launch-critical work is complete, design the smallest safe L4 schema/);
  assert.match(sprint, /Only after L4 reaches `verified`, consider an L5 consent contract/);
  assert.match(sprint, /A green PR proves only the scope and evidence that actually ran against its exact head/);
});

test('documentation map defines current authority and stale-document handling', async () => {
  const map = await read('docs/DOCUMENTATION_MAP.md');

  assert.match(map, /LAUNCH_GATE_STATUS_2026-07-31/);
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
  const [readme, status, sprint, wiring, refresh, agents, deployment, architectureSkill] = await Promise.all([
    read('README.md'),
    read('docs/CURRENT_STATUS.md'),
    read('SPRINT.md'),
    read('docs/WIRING_STATUS.md'),
    read('docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md'),
    read('AGENTS.md'),
    read('DEPLOYMENT.md'),
    read('.agents/skills/bip-architecture/SKILL.md'),
  ]);

  for (const document of [readme, status, sprint, wiring, refresh, agents]) {
    assert.match(document, new RegExp(CURRENT_APPLICATION_BASELINE));
  }

  for (const document of [readme, status, sprint, refresh, agents]) {
    assert.match(document, /LAUNCH_GATE_STATUS_2026-07-31/);
  }

  assert.match(readme, /Suhana, Sy, Cloud, and Night/);
  assert.match(status, /Privacy-safe Daily Intentions/);
  assert.match(deployment, /\.well-known\/sekret-release\.json/);
  assert.match(deployment, /P0 release gate/);
  assert.match(architectureSkill, /worker\/voice-entry\.ts/);
  assert.match(architectureSkill, /P0 #696/);
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
