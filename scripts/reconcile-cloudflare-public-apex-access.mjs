import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';
export const DEFAULT_TARGET_HOSTNAME = 'sekretbip.net';
export const DEFAULT_TARGET_URL = 'https://sekretbip.net/';
export const DEFAULT_APPLICATION_NAME = 'sekretbip.net - public apex bypass';
export const DEFAULT_EVIDENCE_PATH = 'artifacts/cloudflare-public-apex-access.json';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function configFromEnv(env = process.env) {
  return {
    token: clean(env.CLOUDFLARE_ACCESS_API_TOKEN),
    accountId: clean(env.CLOUDFLARE_ACCOUNT_ID),
    targetHostname: clean(env.BIP_PUBLIC_HOSTNAME) || DEFAULT_TARGET_HOSTNAME,
    targetUrl: clean(env.BIP_PUBLIC_URL) || DEFAULT_TARGET_URL,
    applicationName: clean(env.BIP_PUBLIC_ACCESS_APP_NAME) || DEFAULT_APPLICATION_NAME,
    blockingAud: clean(env.BIP_PUBLIC_ACCESS_BLOCKING_AUD),
    evidencePath: clean(env.BIP_PUBLIC_ACCESS_EVIDENCE_PATH) || DEFAULT_EVIDENCE_PATH,
  };
}

function providerError(payload, fallback = 'Cloudflare request failed') {
  const messages = Array.isArray(payload?.errors)
    ? payload.errors.map((item) => clean(item?.message)).filter(Boolean).slice(0, 5)
    : [];
  const codes = Array.isArray(payload?.errors)
    ? payload.errors.map((item) => item?.code).filter((code) => Number.isInteger(code))
    : [];
  return { messages, codes, fallback: clean(fallback) || 'Cloudflare request failed' };
}

async function cfRequest(config, requestPath, options = {}) {
  const response = await fetch(`${API_BASE}${requestPath}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const detail = providerError(payload, response.statusText);
    const error = new Error(
      `Cloudflare ${options.method || 'GET'} ${requestPath} failed (${response.status}): ${detail.messages.join('; ') || detail.fallback}`,
    );
    error.providerStatus = response.status;
    error.providerCodes = detail.codes;
    throw error;
  }
  return payload;
}

function normalizePublicUri(value) {
  return clean(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export function publicDestinationTargetsHost(destination, hostname) {
  if (clean(destination?.type).toLowerCase() !== 'public') return false;
  const uri = normalizePublicUri(destination?.uri);
  const target = clean(hostname).toLowerCase();
  return uri === target || uri === `${target}/*` || uri.startsWith(`${target}/`);
}

export function appHasExactPublicDestination(app, hostname) {
  return (Array.isArray(app?.destinations) ? app.destinations : []).some((destination) =>
    publicDestinationTargetsHost(destination, hostname),
  );
}

export function isCloudflareAccessUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return (
      url.hostname === 'cloudflareaccess.com'
      || url.hostname.endsWith('.cloudflareaccess.com')
      || url.pathname.toLowerCase().startsWith('/cdn-cgi/access/')
    );
  } catch {
    return false;
  }
}

export function isEveryoneBypassPolicy(policy) {
  if (clean(policy?.decision).toLowerCase() !== 'bypass') return false;
  const include = Array.isArray(policy?.include) ? policy.include : [];
  return include.some((rule) => rule && typeof rule === 'object' && rule.everyone && typeof rule.everyone === 'object');
}

export function selectBlockingApplication(apps, blockingAud) {
  const aud = clean(blockingAud);
  if (!aud) return null;
  const matches = (Array.isArray(apps) ? apps : []).filter((app) => clean(app?.aud) === aud);
  if (matches.length > 1) throw new Error('BLOCKING_AUD_NOT_UNIQUE');
  return matches[0] || null;
}

async function listApplications(config) {
  const payload = await cfRequest(config, `/accounts/${config.accountId}/access/apps?per_page=1000`);
  return Array.isArray(payload?.result) ? payload.result : [];
}

async function listPolicies(config, appId) {
  const payload = await cfRequest(
    config,
    `/accounts/${config.accountId}/access/apps/${encodeURIComponent(appId)}/policies?per_page=1000`,
  );
  return Array.isArray(payload?.result) ? payload.result : [];
}

async function createPublicBypassApplication(config) {
  const payload = await cfRequest(config, `/accounts/${config.accountId}/access/apps`, {
    method: 'POST',
    body: {
      name: config.applicationName,
      type: 'self_hosted',
      domain: config.targetHostname,
      session_duration: '24h',
      destinations: [
        {
          type: 'public',
          uri: `${config.targetHostname}/*`,
        },
      ],
      policies: [
        {
          name: 'Bypass public Se’kret apex',
          decision: 'bypass',
          include: [{ everyone: {} }],
          precedence: 1,
        },
      ],
    },
  });
  if (!payload?.result?.id) throw new Error('CREATED_ACCESS_APP_ID_MISSING');
  return payload.result;
}

async function deleteApplication(config, appId) {
  await cfRequest(config, `/accounts/${config.accountId}/access/apps/${encodeURIComponent(appId)}`, {
    method: 'DELETE',
  });
}

async function runtimeProbe(url) {
  const response = await fetch(url, { redirect: 'follow' });
  return {
    requestedUrl: url,
    finalUrl: response.url || url,
    status: response.status,
    redirected: response.redirected === true,
    accessIntercepted: isCloudflareAccessUrl(response.url || url),
    contentType: response.headers.get('content-type') || '',
  };
}

async function waitForPublicRuntime(config, attempts = 12, delayMs = 5000) {
  let lastProbe = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastProbe = await runtimeProbe(config.targetUrl);
    console.log(
      `PUBLIC_APEX_PROBE attempt=${attempt} status=${lastProbe.status} access_intercepted=${lastProbe.accessIntercepted} final_url=${lastProbe.finalUrl}`,
    );
    if (!lastProbe.accessIntercepted && lastProbe.status >= 200 && lastProbe.status < 400) {
      return lastProbe;
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw Object.assign(new Error('PUBLIC_APEX_STILL_ACCESS_INTERCEPTED_OR_UNHEALTHY'), { lastProbe });
}

function summarizeApp(app) {
  return app
    ? {
        id: clean(app.id) || null,
        name: clean(app.name) || null,
        type: clean(app.type) || null,
        aud: clean(app.aud) || null,
        domain: clean(app.domain) || null,
        destinationTypes: (Array.isArray(app.destinations) ? app.destinations : [])
          .map((destination) => clean(destination?.type).toLowerCase())
          .filter(Boolean),
      }
    : null;
}

async function writeEvidence(config, payload) {
  await mkdir(new URL('.', `file://${process.cwd()}/${config.evidencePath}`).pathname, { recursive: true }).catch(() => {});
  const slash = config.evidencePath.lastIndexOf('/');
  if (slash > 0) await mkdir(config.evidencePath.slice(0, slash), { recursive: true });
  await writeFile(
    config.evidencePath,
    `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), ...payload }, null, 2)}\n`,
    'utf8',
  );
}

export async function reconcilePublicApexAccess({
  env = process.env,
  apply = false,
} = {}) {
  const config = configFromEnv(env);
  const baseEvidence = {
    targetHostname: config.targetHostname,
    targetUrl: config.targetUrl,
    applicationName: config.applicationName,
    blockingAudConfigured: Boolean(config.blockingAud),
    applyRequested: apply === true,
    mutationPerformed: false,
    rollbackPerformed: false,
  };

  if (!config.token || !config.accountId) {
    const error = new Error('CLOUDFLARE_ACCESS_CONFIGURATION_MISSING');
    await writeEvidence(config, { ...baseEvidence, status: 'configuration-missing' });
    throw error;
  }

  const runtimeBefore = await runtimeProbe(config.targetUrl);
  const apps = await listApplications(config);
  const blockingApp = selectBlockingApplication(apps, config.blockingAud);
  const exactPublicApps = apps.filter((app) => appHasExactPublicDestination(app, config.targetHostname));
  const managedApps = exactPublicApps.filter((app) => clean(app?.name) === config.applicationName);

  const existingManaged = managedApps.length === 1 ? managedApps[0] : null;
  if (managedApps.length > 1) {
    await writeEvidence(config, {
      ...baseEvidence,
      status: 'blocked-duplicate-managed-apps',
      runtimeBefore,
      blockingApplication: summarizeApp(blockingApp),
      managedApplicationCount: managedApps.length,
    });
    throw new Error('DUPLICATE_MANAGED_PUBLIC_BYPASS_APPS');
  }

  if (existingManaged) {
    const policies = await listPolicies(config, existingManaged.id);
    const bypassReady = policies.some(isEveryoneBypassPolicy);
    if (!bypassReady) {
      await writeEvidence(config, {
        ...baseEvidence,
        status: 'blocked-managed-app-policy-drift',
        runtimeBefore,
        blockingApplication: summarizeApp(blockingApp),
        managedApplication: summarizeApp(existingManaged),
      });
      throw new Error('MANAGED_PUBLIC_BYPASS_POLICY_DRIFT');
    }

    if (!apply) {
      await writeEvidence(config, {
        ...baseEvidence,
        status: 'planned-existing-bypass',
        runtimeBefore,
        blockingApplication: summarizeApp(blockingApp),
        managedApplication: summarizeApp(existingManaged),
      });
      return { status: 'planned-existing-bypass', runtimeBefore };
    }

    const runtimeAfter = await waitForPublicRuntime(config);
    await writeEvidence(config, {
      ...baseEvidence,
      status: 'already-reconciled',
      runtimeBefore,
      runtimeAfter,
      blockingApplication: summarizeApp(blockingApp),
      managedApplication: summarizeApp(existingManaged),
    });
    return { status: 'already-reconciled', runtimeAfter };
  }

  const foreignExactPublicApps = exactPublicApps.filter((app) => clean(app?.name) !== config.applicationName);
  if (foreignExactPublicApps.length > 0) {
    await writeEvidence(config, {
      ...baseEvidence,
      status: 'blocked-existing-public-app',
      runtimeBefore,
      blockingApplication: summarizeApp(blockingApp),
      foreignPublicApplications: foreignExactPublicApps.map(summarizeApp),
    });
    throw new Error('EXISTING_PUBLIC_ACCESS_APP_REQUIRES_MANUAL_REVIEW');
  }

  await writeEvidence(config, {
    ...baseEvidence,
    status: apply ? 'pre-apply' : 'planned-create-public-bypass',
    runtimeBefore,
    blockingApplication: summarizeApp(blockingApp),
    plannedDestination: `${config.targetHostname}/*`,
    plannedPolicy: 'bypass:everyone',
  });

  if (!apply) return { status: 'planned-create-public-bypass', runtimeBefore };

  let createdApp = null;
  try {
    createdApp = await createPublicBypassApplication(config);
    const policies = await listPolicies(config, createdApp.id);
    if (!appHasExactPublicDestination(createdApp, config.targetHostname)) {
      throw new Error('CREATED_APP_DESTINATION_MISMATCH');
    }
    if (!policies.some(isEveryoneBypassPolicy)) {
      throw new Error('CREATED_APP_BYPASS_POLICY_MISSING');
    }

    const runtimeAfter = await waitForPublicRuntime(config);
    await writeEvidence(config, {
      ...baseEvidence,
      status: 'reconciled',
      mutationPerformed: true,
      runtimeBefore,
      runtimeAfter,
      blockingApplication: summarizeApp(blockingApp),
      managedApplication: summarizeApp(createdApp),
    });
    return { status: 'reconciled', runtimeAfter, appId: createdApp.id };
  } catch (error) {
    let rollbackPerformed = false;
    if (createdApp?.id) {
      try {
        await deleteApplication(config, createdApp.id);
        rollbackPerformed = true;
      } catch {
        rollbackPerformed = false;
      }
    }
    await writeEvidence(config, {
      ...baseEvidence,
      status: 'apply-failed',
      mutationPerformed: Boolean(createdApp?.id),
      rollbackPerformed,
      runtimeBefore,
      blockingApplication: summarizeApp(blockingApp),
      managedApplication: summarizeApp(createdApp),
      failure: {
        message: error instanceof Error ? error.message : String(error),
        status: Number.isInteger(error?.providerStatus) ? error.providerStatus : null,
        providerCodes: Array.isArray(error?.providerCodes) ? error.providerCodes : [],
      },
    });
    throw error;
  }
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  const apply = process.argv.includes('--apply');
  reconcilePublicApexAccess({ apply })
    .then((result) => console.log(`PUBLIC_APEX_ACCESS_RECONCILE status=${result.status}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
