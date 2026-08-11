import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const SHA_PATTERN = /^[0-9a-f]{40}$/i;
export const DESIRED_DEPLOY_COMMAND = 'npm run deploy:api:production';
export const DEFAULT_EVIDENCE_PATH = 'artifacts/cloudflare-workers-build-trigger.json';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSha(value) {
  const sha = clean(value).toLowerCase();
  return SHA_PATTERN.test(sha) ? sha : null;
}

export function configFromEnv(env = process.env) {
  return {
    token: clean(env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN || env.CLOUDFLARE_API_TOKEN),
    accountId: clean(env.CLOUDFLARE_ACCOUNT_ID),
    workerName: clean(env.BIP_WORKER_NAME) || 'sekret-backend',
    desiredDeployCommand: clean(env.BIP_WORKER_DEPLOY_COMMAND) || DESIRED_DEPLOY_COMMAND,
    targetCommitSha: normalizeSha(env.BIP_WORKER_BUILD_COMMIT || env.GITHUB_SHA),
    evidencePath: clean(env.CLOUDFLARE_BUILD_EVIDENCE_PATH) || DEFAULT_EVIDENCE_PATH,
  };
}

function errorText(payload, fallback) {
  const messages = payload?.errors
    ?.map((error) => {
      const code = error?.code === undefined ? '' : `code=${error.code} `;
      return `${code}${error?.message || ''}`.trim();
    })
    .filter(Boolean);
  return messages?.length ? messages.join('; ') : fallback;
}

async function cfRequest(config, requestPath, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`${API_BASE}${requestPath}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(
      `Cloudflare ${options.method || 'GET'} ${requestPath} failed: ${errorText(payload, response.statusText)}`,
    );
  }
  return payload;
}

async function verifyUserScopedToken(config, fetchImpl) {
  const payload = await cfRequest(config, '/user/tokens/verify', {}, fetchImpl);
  if (payload?.result?.status !== 'active') {
    throw new Error('CLOUDFLARE_WORKERS_BUILDS_API_TOKEN_NOT_ACTIVE_OR_NOT_USER_SCOPED.');
  }
  return payload.result;
}

export function selectWorkerScript(scripts, workerName) {
  const matches = (Array.isArray(scripts) ? scripts : [])
    .filter((script) => clean(script?.id) === workerName);
  if (matches.length !== 1) {
    throw new Error(`WORKER_SELECTION_FAILED: expected one ${workerName} Worker, found ${matches.length}.`);
  }

  const worker = matches[0];
  const tag = clean(worker?.tag);
  if (!tag) {
    throw new Error(`WORKER_TAG_MISSING: ${workerName} does not expose an immutable Cloudflare script tag.`);
  }
  return { name: workerName, tag };
}

function explicitlyIncludesMain(trigger) {
  const includes = Array.isArray(trigger?.branch_includes) ? trigger.branch_includes : [];
  const excludes = Array.isArray(trigger?.branch_excludes) ? trigger.branch_excludes : [];
  return includes.includes('main') && !excludes.includes('main') && !excludes.includes('*');
}

export function selectProductionTrigger(triggers) {
  const candidates = (Array.isArray(triggers) ? triggers : [])
    .filter((trigger) => !trigger?.deleted_on && explicitlyIncludesMain(trigger));

  if (candidates.length !== 1) {
    throw new Error(
      `PRODUCTION_TRIGGER_SELECTION_FAILED: expected one explicit main trigger, found ${candidates.length}.`,
    );
  }

  const trigger = candidates[0];
  const triggerUuid = clean(trigger?.trigger_uuid);
  if (!triggerUuid) throw new Error('PRODUCTION_TRIGGER_UUID_MISSING.');
  return trigger;
}

export function buildTriggerPlan(trigger, desiredDeployCommand = DESIRED_DEPLOY_COMMAND) {
  const previousDeployCommand = clean(trigger?.deploy_command);
  const desired = clean(desiredDeployCommand);
  if (!desired) throw new Error('DESIRED_DEPLOY_COMMAND_MISSING.');

  return {
    triggerUuid: clean(trigger?.trigger_uuid),
    triggerName: clean(trigger?.trigger_name) || null,
    branchIncludes: Array.isArray(trigger?.branch_includes) ? trigger.branch_includes : [],
    branchExcludes: Array.isArray(trigger?.branch_excludes) ? trigger.branch_excludes : [],
    previousDeployCommand: previousDeployCommand || null,
    desiredDeployCommand: desired,
    changeRequired: previousDeployCommand !== desired,
    patch: previousDeployCommand === desired ? null : { deploy_command: desired },
  };
}

async function discoverWorker(config, fetchImpl) {
  const payload = await cfRequest(
    config,
    `/accounts/${config.accountId}/workers/scripts?per_page=100`,
    {},
    fetchImpl,
  );
  return selectWorkerScript(payload?.result, config.workerName);
}

async function listTriggers(config, workerTag, fetchImpl) {
  const payload = await cfRequest(
    config,
    `/accounts/${config.accountId}/builds/workers/${workerTag}/triggers`,
    {},
    fetchImpl,
  );
  return Array.isArray(payload?.result) ? payload.result : [];
}

async function patchTrigger(config, triggerUuid, deployCommand, fetchImpl) {
  return cfRequest(
    config,
    `/accounts/${config.accountId}/builds/triggers/${triggerUuid}`,
    { method: 'PATCH', body: { deploy_command: deployCommand } },
    fetchImpl,
  );
}

async function triggerExactBuild(config, triggerUuid, commitSha, fetchImpl) {
  const payload = await cfRequest(
    config,
    `/accounts/${config.accountId}/builds/triggers/${triggerUuid}/builds`,
    {
      method: 'POST',
      body: { branch: 'main', commit_hash: commitSha },
    },
    fetchImpl,
  );
  const buildUuid = clean(payload?.result?.build_uuid);
  if (!buildUuid) throw new Error('MANUAL_BUILD_UUID_MISSING.');
  return buildUuid;
}

async function writeEvidence(evidencePath, evidence) {
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

async function verifyDesiredDeployCommand(config, workerTag, plan, fetchImpl) {
  const afterTriggers = await listTriggers(config, workerTag, fetchImpl);
  const afterTrigger = selectProductionTrigger(afterTriggers);
  const observedDeployCommand = clean(afterTrigger?.deploy_command);
  if (observedDeployCommand !== plan.desiredDeployCommand) {
    throw new Error(
      `DEPLOY_COMMAND_READBACK_MISMATCH: expected ${plan.desiredDeployCommand}, observed ${observedDeployCommand || 'missing'}.`,
    );
  }
  return observedDeployCommand;
}

export async function reconcileWorkersBuildTrigger({
  env = process.env,
  apply = false,
  fetchImpl = fetch,
  now = () => new Date(),
} = {}) {
  const config = configFromEnv(env);
  if (!config.token) {
    throw new Error('CLOUDFLARE_WORKERS_BUILDS_API_TOKEN or CLOUDFLARE_API_TOKEN is required.');
  }
  if (!config.accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is required.');
  if (apply && !config.targetCommitSha) {
    throw new Error('BIP_WORKER_BUILD_COMMIT or GITHUB_SHA must be an exact 40-character Git commit SHA when applying.');
  }

  await verifyUserScopedToken(config, fetchImpl);
  const worker = await discoverWorker(config, fetchImpl);
  const triggers = await listTriggers(config, worker.tag, fetchImpl);
  const productionTrigger = selectProductionTrigger(triggers);
  const plan = buildTriggerPlan(productionTrigger, config.desiredDeployCommand);

  const evidence = {
    schemaVersion: 3,
    generatedAt: now().toISOString(),
    accountId: config.accountId,
    worker,
    productionTrigger: {
      triggerUuid: plan.triggerUuid,
      triggerName: plan.triggerName,
      branchIncludes: plan.branchIncludes,
      branchExcludes: plan.branchExcludes,
    },
    before: { deployCommand: plan.previousDeployCommand },
    desired: { deployCommand: plan.desiredDeployCommand },
    targetBuild: {
      branch: 'main',
      commitSha: config.targetCommitSha,
      requested: false,
      buildUuid: null,
    },
    applyRequested: apply,
    applied: false,
    triggerVerified: false,
    verified: false,
    status: plan.changeRequired ? 'change-required' : 'already-correct',
    rollback: { attempted: false, succeeded: null, deployCommand: plan.previousDeployCommand },
  };

  if (!apply) {
    evidence.triggerVerified = !plan.changeRequired;
    evidence.verified = !plan.changeRequired;
    await writeEvidence(config.evidencePath, evidence);
    console.log('CLOUDFLARE_WORKERS_BUILD_TRIGGER_PLAN_WRITTEN');
    return evidence;
  }

  let mutationStarted = false;
  try {
    if (plan.changeRequired) {
      mutationStarted = true;
      await patchTrigger(config, plan.triggerUuid, plan.desiredDeployCommand, fetchImpl);
    }

    const observedDeployCommand = await verifyDesiredDeployCommand(config, worker.tag, plan, fetchImpl);
    evidence.applied = plan.changeRequired;
    evidence.triggerVerified = true;
    evidence.after = { deployCommand: observedDeployCommand };
  } catch (error) {
    evidence.status = 'trigger-verification-failed';
    evidence.error = error instanceof Error ? error.message : String(error);

    if (mutationStarted && plan.previousDeployCommand) {
      evidence.rollback.attempted = true;
      try {
        await patchTrigger(config, plan.triggerUuid, plan.previousDeployCommand, fetchImpl);
        const rollbackTriggers = await listTriggers(config, worker.tag, fetchImpl);
        const rollbackTrigger = selectProductionTrigger(rollbackTriggers);
        evidence.rollback.succeeded = clean(rollbackTrigger?.deploy_command) === plan.previousDeployCommand;
      } catch (rollbackError) {
        evidence.rollback.succeeded = false;
        evidence.rollback.error = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      }
    }

    await writeEvidence(config.evidencePath, evidence);
    throw error;
  }

  try {
    evidence.targetBuild.requested = true;
    evidence.targetBuild.buildUuid = await triggerExactBuild(
      config,
      plan.triggerUuid,
      config.targetCommitSha,
      fetchImpl,
    );
    evidence.verified = true;
    evidence.status = plan.changeRequired ? 'applied-and-build-requested' : 'verified-and-build-requested';
    await writeEvidence(config.evidencePath, evidence);
    console.log('CLOUDFLARE_WORKERS_BUILD_TRIGGER_RECONCILED');
    return evidence;
  } catch (error) {
    evidence.status = 'trigger-verified-build-request-failed';
    evidence.error = error instanceof Error ? error.message : String(error);
    evidence.verified = false;
    await writeEvidence(config.evidencePath, evidence);
    throw error;
  }
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  reconcileWorkersBuildTrigger({ apply: process.argv.includes('--apply') }).catch(() => {
    console.error('Cloudflare Workers Builds trigger reconciliation failed. Inspect the retained evidence artifact.');
    process.exit(1);
  });
}
