import { readFileSync, existsSync } from 'node:fs';

const fail = (message) => {
  console.error(`[github-actions-policy] ${message}`);
  process.exitCode = 1;
};

const read = (path) => {
  if (!existsSync(path)) {
    fail(`Missing required file: ${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
};

const hasAutomaticTrigger = (content) => /^\s{0,2}(push|pull_request):\s*$/m.test(content);

const manualOnlyWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/prepush.yml',
  '.github/workflows/typecheck.yml',
  '.github/workflows/regression-tests.yml',
  '.github/workflows/implementation-evidence.yml',
  '.github/workflows/playwright.yml',
  '.github/workflows/companion-lab.yml',
];

const ci = read('.github/workflows/ci.yml');
const policy = read('docs/GITHUB_ACTIONS_CONTROL_ROOM_POLICY.md');
const cloudflare = read('.github/workflows/deploy-cloudflare.yml');
const qualityGate = read('.github/workflows/quality-gate.yml');

if (!ci.includes('Control Room handoff')) {
  fail('CI must identify itself as a Control Room handoff, not a full duplicate test brain.');
}

for (const forbidden of [
  'npm ci',
  'npm run lint',
  'npm run type-check',
  'npm test',
  'npm run verify:bundle',
  './.github/workflows/quality-gate.yml',
]) {
  if (ci.includes(forbidden)) {
    fail(`CI should not run duplicated heavy gate command: ${forbidden}`);
  }
}

for (const workflowPath of manualOnlyWorkflows) {
  const content = read(workflowPath);
  if (hasAutomaticTrigger(content)) {
    fail(`${workflowPath} must stay manual-only while Cloudflare and Control Rooms are the active truth path.`);
  }
}

if (hasAutomaticTrigger(qualityGate)) {
  fail('quality-gate.yml must remain reusable/manual, not a second automatic PR runner.');
}

if (!/workflow_call:\s*/m.test(qualityGate) || !/workflow_dispatch:\s*/m.test(qualityGate)) {
  fail('quality-gate.yml must stay callable by an explicit Control Room decision and manually dispatchable.');
}

if (!cloudflare.includes('Verify Cloudflare Native Deployment')) {
  fail('deploy-cloudflare.yml must remain the canonical Cloudflare release verification workflow.');
}

for (const phrase of [
  'Cloudflare = deployment truth',
  'Sekret-Bip Control Room = repo-local evidence',
  'Founder Control Room = final authority',
  'GitHub Actions = lightweight sensor',
  'Actions budget mode',
]) {
  if (!policy.includes(phrase)) {
    fail(`Policy document is missing required declaration: ${phrase}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('[github-actions-policy] GitHub Actions is aligned to Cloudflare + Control Room truth.');
