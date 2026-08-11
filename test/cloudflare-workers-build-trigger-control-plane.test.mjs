import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  DESIRED_DEPLOY_COMMAND,
  buildTriggerPlan,
  reconcileWorkersBuildTrigger,
  selectProductionTrigger,
  selectWorkerScript,
} from '../scripts/reconcile-cloudflare-workers-build-trigger.mjs';

const ACCOUNT_ID = '0123456789abcdef0123456789abcdef';
const WORKER_TAG = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TRIGGER_UUID = '11111111-2222-3333-4444-555555555555';

function response(result, { ok = true, statusText = 'OK' } = {}) {
  return {
    ok,
    statusText,
    async json() {
      return ok ? { success: true, result } : { success: false, errors: [{ code: 1000, message: statusText }] };
    },
  };
}

function productionTrigger(deployCommand = 'npx wrangler deploy') {
  return {
    trigger_uuid: TRIGGER_UUID,
    trigger_name: 'Deploy production',
    branch_includes: ['main'],
    branch_excludes: [],
    deploy_command: deployCommand,
    deleted_on: null,
  };
}

test('selects only the canonical Worker and requires its immutable script tag', () => {
  assert.deepEqual(
    selectWorkerScript([
      { id: 'sekret', tag: 'legacy-tag' },
      { id: 'sekret-backend', tag: WORKER_TAG },
    ], 'sekret-backend'),
    { name: 'sekret-backend', tag: WORKER_TAG },
  );

  assert.throws(
    () => selectWorkerScript([{ id: 'sekret-backend', tag: null }], 'sekret-backend'),
    /WORKER_TAG_MISSING/,
  );
});

test('selects the explicit main production trigger and ignores preview triggers', () => {
  const selected = selectProductionTrigger([
    {
      trigger_uuid: 'preview',
      trigger_name: 'Preview',
      branch_includes: ['*'],
      branch_excludes: ['main'],
      deploy_command: 'npx wrangler versions upload',
    },
    productionTrigger(),
  ]);

  assert.equal(selected.trigger_uuid, TRIGGER_UUID);
  assert.throws(
    () => selectProductionTrigger([productionTrigger(), { ...productionTrigger(), trigger_uuid: 'other' }]),
    /expected one explicit main trigger, found 2/,
  );
});

test('plans only the deploy-command mutation and is idempotent when already correct', () => {
  const change = buildTriggerPlan(productionTrigger(), DESIRED_DEPLOY_COMMAND);
  assert.equal(change.changeRequired, true);
  assert.deepEqual(change.patch, { deploy_command: DESIRED_DEPLOY_COMMAND });
  assert.equal(change.previousDeployCommand, 'npx wrangler deploy');

  const noop = buildTriggerPlan(productionTrigger(DESIRED_DEPLOY_COMMAND), DESIRED_DEPLOY_COMMAND);
  assert.equal(noop.changeRequired, false);
  assert.equal(noop.patch, null);
});

test('applies only the repo-owned deploy command, verifies readback, and retains non-secret evidence', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-workers-build-trigger-'));
  const evidencePath = path.join(dir, 'evidence.json');
  const calls = [];
  let patched = false;

  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET', body: options.body ?? null });
    if (url.endsWith('/user/tokens/verify')) return response({ status: 'active' });
    if (url.includes('/workers/scripts?')) {
      return response([{ id: 'sekret-backend', tag: WORKER_TAG }]);
    }
    if (url.endsWith(`/builds/workers/${WORKER_TAG}/triggers`)) {
      return response([productionTrigger(patched ? DESIRED_DEPLOY_COMMAND : 'npx wrangler deploy')]);
    }
    if (url.endsWith(`/builds/triggers/${TRIGGER_UUID}`) && options.method === 'PATCH') {
      assert.deepEqual(JSON.parse(options.body), { deploy_command: DESIRED_DEPLOY_COMMAND });
      patched = true;
      return response({ ...productionTrigger(DESIRED_DEPLOY_COMMAND) });
    }
    throw new Error(`Unexpected request: ${options.method || 'GET'} ${url}`);
  };

  const evidence = await reconcileWorkersBuildTrigger({
    env: {
      CLOUDFLARE_API_TOKEN: 'secret-token-must-not-leak',
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
      BIP_WORKER_NAME: 'sekret-backend',
      CLOUDFLARE_BUILD_EVIDENCE_PATH: evidencePath,
    },
    apply: true,
    fetchImpl,
    now: () => new Date('2026-08-11T16:00:00.000Z'),
  });

  assert.equal(evidence.status, 'applied');
  assert.equal(evidence.applied, true);
  assert.equal(evidence.verified, true);
  assert.equal(evidence.before.deployCommand, 'npx wrangler deploy');
  assert.equal(evidence.after.deployCommand, DESIRED_DEPLOY_COMMAND);
  assert.equal(calls.filter((call) => call.method === 'PATCH').length, 1);

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.match(retained, new RegExp(DESIRED_DEPLOY_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(retained, /secret-token-must-not-leak/);
});

test('does not mutate Cloudflare when the production trigger is already correct', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-workers-build-trigger-noop-'));
  let patchCalls = 0;

  const fetchImpl = async (url, options = {}) => {
    if (url.endsWith('/user/tokens/verify')) return response({ status: 'active' });
    if (url.includes('/workers/scripts?')) return response([{ id: 'sekret-backend', tag: WORKER_TAG }]);
    if (url.endsWith(`/builds/workers/${WORKER_TAG}/triggers`)) {
      return response([productionTrigger(DESIRED_DEPLOY_COMMAND)]);
    }
    if (options.method === 'PATCH') {
      patchCalls += 1;
      return response({});
    }
    throw new Error(`Unexpected request: ${options.method || 'GET'} ${url}`);
  };

  const evidence = await reconcileWorkersBuildTrigger({
    env: {
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
      CLOUDFLARE_BUILD_EVIDENCE_PATH: path.join(dir, 'evidence.json'),
    },
    apply: true,
    fetchImpl,
  });

  assert.equal(evidence.status, 'already-correct');
  assert.equal(evidence.verified, true);
  assert.equal(patchCalls, 0);
});
