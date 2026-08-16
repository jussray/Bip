import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { reconcileWorkersBuildTrigger } from '../scripts/reconcile-cloudflare-workers-build-trigger.mjs';

const ACCOUNT_ID = '0123456789abcdef0123456789abcdef';
const WORKER_TAG = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TRIGGER_UUID = '11111111-2222-3333-4444-555555555555';
const COMMIT_SHA = 'abcdef0123456789abcdef0123456789abcdef01';
const DESIRED_DEPLOY = 'npm run deploy:api:production';

function response(result, { ok = true, statusText = 'OK' } = {}) {
  return {
    ok,
    statusText,
    async json() {
      return ok
        ? { success: true, result }
        : { success: false, errors: [{ code: 1000, message: statusText }] };
    },
  };
}

function trigger({ buildCommand = '', deployCommand = '' } = {}) {
  return {
    trigger_uuid: TRIGGER_UUID,
    trigger_name: 'Deploy production',
    branch_includes: ['main'],
    branch_excludes: [],
    build_command: buildCommand,
    deploy_command: deployCommand,
    deleted_on: null,
  };
}

test('automatic pushes validate the contract while provider control remains explicit workflow_dispatch', () => {
  const workflow = fs.readFileSync(
    new URL('../.github/workflows/cloudflare-workers-build-trigger.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /push:\n\s+branches: \[main\]/);
  assert.match(workflow, /pull_request:\n\s+branches: \[main\]/);
  assert.match(workflow, /if: github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /if: inputs\.apply == true/);
  assert.doesNotMatch(workflow, /if: github\.event_name != 'pull_request'/);
  assert.doesNotMatch(workflow, /Require provider trigger to already be safe on main push/);
  assert.doesNotMatch(workflow, /github\.event_name == 'push' \|\| inputs\.apply == true/);
});

test('rollback restores an originally absent deploy command after failed readback', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-workers-trigger-rollback-'));
  const evidencePath = path.join(dir, 'evidence.json');
  let state = trigger();
  const patches = [];
  let readsAfterMutation = 0;

  const fetchImpl = async (url, options = {}) => {
    if (url.endsWith('/user/tokens/verify')) return response({ status: 'active' });
    if (url.includes('/workers/scripts?')) return response([{ id: 'sekret-backend', tag: WORKER_TAG }]);
    if (url.endsWith(`/builds/workers/${WORKER_TAG}/triggers`)) {
      if (patches.length === 1) {
        readsAfterMutation += 1;
        return response([trigger({ deployCommand: 'unexpected-provider-value' })]);
      }
      return response([state]);
    }
    if (url.endsWith(`/builds/triggers/${TRIGGER_UUID}`) && options.method === 'PATCH') {
      const patch = JSON.parse(options.body);
      patches.push(patch);
      state = { ...state, ...patch };
      return response(state);
    }
    throw new Error(`Unexpected request: ${options.method || 'GET'} ${url}`);
  };

  await assert.rejects(
    () => reconcileWorkersBuildTrigger({
      env: {
        CLOUDFLARE_WORKERS_BUILDS_API_TOKEN: 'token',
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        BIP_WORKER_NAME: 'sekret-backend',
        BIP_WORKER_DEPLOY_COMMAND: DESIRED_DEPLOY,
        BIP_WORKER_BUILD_COMMIT: COMMIT_SHA,
        CLOUDFLARE_BUILD_EVIDENCE_PATH: evidencePath,
      },
      apply: true,
      fetchImpl,
    }),
    /DEPLOY_COMMAND_READBACK_MISMATCH/,
  );

  assert.equal(readsAfterMutation, 1);
  assert.deepEqual(patches[0], { deploy_command: DESIRED_DEPLOY });
  assert.deepEqual(patches[1], { deploy_command: '' });

  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.equal(evidence.rollback.attempted, true);
  assert.equal(evidence.rollback.succeeded, true);
});
