import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('Worker surface requires an audit-visible admin or founder with management capability', () => {
  const src = read('src/screens/DevControlRoomScreen.tsx');

  assert.match(src, /getCurrentFounderProfile/);
  assert.match(src, /isFounderProfile\(profile\)/);
  assert.match(src, /profile\.can_manage_app/);
  assert.match(src, /WORKER_MANAGER_ROLES\.has\(profile\.role\)/);
  assert.match(src, /new Set\(\['admin', 'founder'\]\)/);
  assert.match(src, /!canManageWorker/);
  assert.match(src, /Founder or admin management access is required for live Worker operations\./);

  const lockedIndex = src.indexOf('Founder or admin management access is required for live Worker operations.');
  const panelIndex = src.indexOf('return <WorkerPanel />;');
  assert.ok(lockedIndex > -1, 'the Worker surface should render fail-closed copy');
  assert.ok(panelIndex > lockedIndex, 'the management gate must be evaluated before WorkerPanel renders');
});

test('Founder-facing Worker adapter rechecks management capability before paid operations', () => {
  const src = read('src/services/ai/workerClient.ts');

  assert.match(src, /async function assertWorkerManagementAccess/);
  assert.match(src, /isFounderProfile\(profile\)/);
  assert.match(src, /profile\.can_manage_app/);
  assert.match(src, /WORKER_MANAGER_ROLES\.has\(profile\.role\)/);
  assert.match(src, /'ACCESS_DENIED'/);

  for (const call of [
    'sekretClient.sendReply(params)',
    'sekretClient.synthesizeVoice(params)',
    'sekretClient.transcribeAudio(params)',
  ]) {
    const callIndex = src.indexOf(call);
    assert.ok(callIndex > -1, `${call} should remain wired`);
    const gateIndex = src.lastIndexOf('await assertWorkerManagementAccess();', callIndex);
    assert.ok(gateIndex > -1 && gateIndex < callIndex, `${call} must be preceded by the management gate`);
  }
});
