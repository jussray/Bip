import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function reservePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : null;
  await new Promise(resolve => probe.close(resolve));
  if (!port) throw new Error('Unable to reserve a loopback port.');
  return port;
}

async function waitFor(check, timeoutMs = 4_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for Control Room server state.');
}

function buildPlan(id = '20260718-integrated-control-room') {
  const prefix = `reports/control-room/founder-operator/${id}`;
  return {
    schemaVersion: 1,
    id,
    createdAt: '2026-07-18T01:30:00.000Z',
    mission: 'Verify integrated Founder Operator persistence.',
    constraints: 'Preserve truth gates and existing work.',
    modes: ['ultrathink', 'billgates-artifacts', 'elonmusk-execution'],
    lanes: [
      { id: 'founder', label: 'Founder', purpose: 'Own final decisions and approvals.', authority: 'decision' },
      { id: 'chatgpt', label: 'ChatGPT', purpose: 'Build the bounded operating plan.', authority: 'execution' },
      { id: 'codex', label: 'Codex', purpose: 'Integrate repository code and proof.', authority: 'execution' },
      { id: 'playwright', label: 'Playwright', purpose: 'Retain browser verification evidence.', authority: 'evidence' },
    ],
    phases: [
      {
        id: 'observe', title: 'Observe mission', objective: 'Lock the current evidence and constraints.',
        operatingQuestion: 'What is true before implementation begins?', ownerLane: 'chatgpt', supportLanes: ['founder'],
        artifactIds: ['mission-brief'], exitGate: 'The founder mission and boundary are explicit.', status: 'planned',
      },
      {
        id: 'orient', title: 'Orient system', objective: 'Map dependencies and the smallest safe slice.',
        operatingQuestion: 'Which dependency can invalidate the obvious plan?', ownerLane: 'chatgpt', supportLanes: ['codex'],
        artifactIds: ['system-map'], exitGate: 'Dependencies and rollback are documented.', status: 'planned',
      },
      {
        id: 'verify', title: 'Verify behavior', objective: 'Execute and retain local evidence.',
        operatingQuestion: 'What actually ran and what remains unproven?', ownerLane: 'playwright', supportLanes: ['codex'],
        artifactIds: ['verification-report'], safeMissionId: 'verify-local', exitGate: 'Executed evidence is retained.', status: 'planned',
      },
      {
        id: 'decide', title: 'Founder decision', objective: 'Keep the external action behind founder authority.',
        operatingQuestion: 'Does evidence justify the next external action?', ownerLane: 'founder', supportLanes: ['chatgpt'],
        artifactIds: ['founder-decision-pack'], exitGate: 'The founder records a bounded decision.', status: 'human-required',
      },
    ],
    artifacts: [
      {
        id: 'mission-brief', title: 'Mission brief', kind: 'mission-brief', ownerLane: 'chatgpt', supportLanes: ['founder'],
        pathHint: `${prefix}/mission-brief.md`, evidenceRequired: ['5W1H scope'], status: 'planned',
      },
      {
        id: 'system-map', title: 'System map', kind: 'architecture', ownerLane: 'codex', supportLanes: ['chatgpt'],
        pathHint: `${prefix}/system-map.md`, evidenceRequired: ['Dependency map'], status: 'planned',
      },
      {
        id: 'verification-report', title: 'Verification report', kind: 'verification', ownerLane: 'playwright', supportLanes: ['codex'],
        pathHint: `${prefix}/verification-report.json`, evidenceRequired: ['Executed checks'], status: 'planned',
      },
      {
        id: 'founder-decision-pack', title: 'Founder decision pack', kind: 'release', ownerLane: 'founder', supportLanes: ['chatgpt'],
        pathHint: `${prefix}/founder-decision-pack.md`, evidenceRequired: ['Founder decision'],
        approvalGate: 'Founder approval is required before any external action.', status: 'human-required',
      },
    ],
    approvalGates: ['Founder approval is required before any external action.'],
    nonClaims: ['A local plan is not deployment proof.'],
    evidenceLevel: 'plan-only',
  };
}

test('Founder Operator endpoint persists valid plans and rejects false or unsafe evidence', { timeout: 15_000 }, async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bip-founder-operator-server-'));
  const scriptsDir = path.join(tempRoot, 'scripts');
  fs.mkdirSync(scriptsDir);
  fs.copyFileSync(path.join(sourceRoot, 'scripts', 'control-room-server.mjs'), path.join(scriptsDir, 'control-room-server.mjs'));
  fs.writeFileSync(path.join(scriptsDir, 'control-room-agent.mjs'), 'process.exit(0);\n');
  const token = 'f'.repeat(32);
  const port = await reservePort();
  const origin = `http://127.0.0.1:${port}`;
  const endpoint = `${origin}/founder-operator/plans`;
  const server = spawn(process.execPath, ['scripts/control-room-server.mjs'], {
    cwd: tempRoot,
    env: { ...process.env, CONTROL_ROOM_LOCAL_TOKEN: token, CONTROL_ROOM_LOCAL_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const post = (plan, overrides = {}) => fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Origin: origin, 'Content-Type': 'application/json', ...(overrides.headers || {}) },
    body: JSON.stringify(plan),
    ...overrides,
  });

  try {
    server.stdout.setEncoding('utf8');
    let output = '';
    server.stdout.on('data', chunk => { output += chunk; });
    await waitFor(() => output.includes('Control Room local agent ready'));

    const unauthorized = await fetch(endpoint, { method: 'POST', headers: { Origin: origin }, body: '{}' });
    assert.equal(unauthorized.status, 401);

    const disallowedOrigin = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Origin: 'https://example.com' },
      body: JSON.stringify(buildPlan()),
    });
    assert.equal(disallowedOrigin.status, 403);

    if (process.platform !== 'win32') {
      const outsideReports = path.join(tempRoot, 'outside-reports');
      fs.mkdirSync(outsideReports);
      fs.symlinkSync(outsideReports, path.join(tempRoot, 'reports'));
      const directorySymlinkResponse = await post(buildPlan('20260718-directory-symlink'));
      assert.equal(directorySymlinkResponse.status, 500);
      assert.equal((await directorySymlinkResponse.json()).error, 'unsafe_report_directory');
      assert.deepEqual(fs.readdirSync(outsideReports), []);
      fs.unlinkSync(path.join(tempRoot, 'reports'));
    }

    const first = await post(buildPlan());
    const firstBody = await first.json();
    assert.equal(first.status, 201, JSON.stringify(firstBody));
    assert.equal(firstBody.reportPath, 'reports/control-room/founder-operator/20260718-integrated-control-room.json');

    const second = await post(buildPlan());
    assert.equal(second.status, 201);
    assert.equal((await second.json()).reportPath, 'reports/control-room/founder-operator/20260718-integrated-control-room-v2.json');

    const reportDir = path.join(tempRoot, 'reports', 'control-room', 'founder-operator');
    assert.ok(fs.existsSync(path.join(reportDir, '20260718-integrated-control-room.json')));
    assert.ok(fs.existsSync(path.join(reportDir, '20260718-integrated-control-room-v2.json')));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(reportDir, 'latest.json'), 'utf8')), buildPlan());

    const secretPlan = buildPlan('20260718-secret-shape-rejection');
    secretPlan.artifacts[0].Access_Token = 'plain-text-value';
    const secretResponse = await post(secretPlan);
    assert.equal(secretResponse.status, 400);
    assert.equal((await secretResponse.json()).error, 'private_or_secret_plan_field');

    const falseExternalProof = buildPlan('20260718-false-external-proof');
    falseExternalProof.artifacts.at(-1).status = 'verified';
    const falseExternalResponse = await post(falseExternalProof);
    assert.equal(falseExternalResponse.status, 400);
    assert.equal((await falseExternalResponse.json()).error, 'external_action_evidence_required');

    const falseHostedProof = buildPlan('20260718-false-hosted-proof');
    falseHostedProof.evidenceLevel = 'exact-head';
    const falseHostedResponse = await post(falseHostedProof);
    assert.equal(falseHostedResponse.status, 400);
    assert.equal((await falseHostedResponse.json()).error, 'unverified_evidence_level');

    const traversalPlan = buildPlan('20260718-traversal-rejection');
    traversalPlan.artifacts[0].pathHint = 'reports/control-room/founder-operator/20260718-traversal-rejection/../outside.md';
    const traversalResponse = await post(traversalPlan);
    assert.equal(traversalResponse.status, 400);
    assert.equal((await traversalResponse.json()).error, 'invalid_plan_artifact_path');

    if (process.platform !== 'win32') {
      const latestPath = path.join(reportDir, 'latest.json');
      const sentinelPath = path.join(tempRoot, 'outside-sentinel.txt');
      fs.writeFileSync(sentinelPath, 'preserve-me');
      fs.unlinkSync(latestPath);
      fs.symlinkSync(sentinelPath, latestPath);
      const symlinkResponse = await post(buildPlan('20260718-symlink-rejection'));
      assert.equal(symlinkResponse.status, 500);
      assert.equal((await symlinkResponse.json()).error, 'unsafe_latest_path');
      assert.equal(fs.readFileSync(sentinelPath, 'utf8'), 'preserve-me');
    }
  } finally {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => server.once('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 1_000)),
    ]);
    if (server.exitCode === null) server.kill('SIGKILL');
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
