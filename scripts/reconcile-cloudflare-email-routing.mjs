import { pathToFileURL } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';

export const EMAIL_ALIASES = Object.freeze([
  'hello',
  'founder',
  'partnerships',
  'support',
  'parents',
  'safety',
  'privacy',
  'legal',
  'security',
]);

export function configFromEnv(env = process.env) {
  return {
    token: env.CLOUDFLARE_API_TOKEN || '',
    zoneName: env.BIP_EMAIL_ZONE || 'sekretbip.net',
    workerName: env.BIP_EMAIL_WORKER || 'sekret-backend',
    destinationEmail: env.BIP_EMAIL_DESTINATION || 'sekretbip@gmail.com',
    zoneId: env.CLOUDFLARE_ZONE_ID || '',
    accountId: env.CLOUDFLARE_ACCOUNT_ID || '',
  };
}

export function buildWorkerRule(alias, config = configFromEnv({})) {
  const address = `${alias}@${config.zoneName}`;
  return {
    name: `Route ${address} to ${config.workerName}`,
    enabled: true,
    matchers: [{ type: 'literal', field: 'to', value: address }],
    actions: [{ type: 'worker', value: [config.workerName] }],
  };
}

function errorText(payload, fallback) {
  const messages = payload?.errors?.map((error) => error?.message).filter(Boolean);
  return messages?.length ? messages.join('; ') : fallback;
}

async function cfRequest(config, path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
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
      `Cloudflare ${options.method || 'GET'} ${path} failed: ${errorText(payload, response.statusText)}`,
    );
  }
  return payload;
}

async function discoverZone(config) {
  if (config.zoneId && config.accountId) return config;

  const payload = await cfRequest(
    config,
    `/zones?name=${encodeURIComponent(config.zoneName)}&status=active&per_page=50`,
  );
  const zone = payload?.result?.find((candidate) => candidate?.name === config.zoneName);
  if (!zone?.id) {
    throw new Error(`ZONE_NOT_FOUND: active Cloudflare zone ${config.zoneName} was not found.`);
  }

  const accountId = config.accountId || zone.account?.id;
  if (!accountId) {
    throw new Error('ACCOUNT_ID_NOT_FOUND: set CLOUDFLARE_ACCOUNT_ID or grant Zone Read access.');
  }

  return { ...config, zoneId: config.zoneId || zone.id, accountId };
}

async function ensureRoutingDns(config) {
  const settings = await cfRequest(config, `/zones/${config.zoneId}/email/routing`);
  const current = settings?.result;
  if (current?.enabled === true && current?.status === 'ready') {
    console.log(`EMAIL_ROUTING_DNS_OK zone=${config.zoneName}`);
    return;
  }

  const enabled = await cfRequest(config, `/zones/${config.zoneId}/email/routing/dns`, {
    method: 'POST',
    body: { name: config.zoneName },
  });

  if (enabled?.result?.enabled !== true) {
    throw new Error(`EMAIL_ROUTING_DNS_NOT_READY: ${config.zoneName}`);
  }
  console.log(`EMAIL_ROUTING_DNS_ENABLED zone=${config.zoneName}`);
}

async function ensureVerifiedDestination(config) {
  const payload = await cfRequest(
    config,
    `/accounts/${config.accountId}/email/routing/addresses?per_page=100`,
  );
  let destination = payload?.result?.find(
    (candidate) => candidate?.email?.toLowerCase() === config.destinationEmail.toLowerCase(),
  );

  if (!destination) {
    const created = await cfRequest(config, `/accounts/${config.accountId}/email/routing/addresses`, {
      method: 'POST',
      body: { email: config.destinationEmail },
    });
    destination = created?.result;
    console.log(`DESTINATION_CREATED email=${config.destinationEmail}`);
  }

  if (!destination?.verified) {
    throw new Error(
      `DESTINATION_VERIFICATION_REQUIRED: open ${config.destinationEmail} and approve Cloudflare's verification email, then rerun this workflow.`,
    );
  }

  console.log(`DESTINATION_VERIFIED email=${config.destinationEmail}`);
}

function recipientForRule(rule) {
  return rule?.matchers?.find(
    (matcher) => matcher?.type === 'literal' && matcher?.field === 'to',
  )?.value;
}

function workerForRule(rule) {
  return rule?.actions?.find((action) => action?.type === 'worker')?.value?.[0];
}

function ruleMatchesDesired(rule, desired) {
  return (
    rule?.enabled === true &&
    recipientForRule(rule)?.toLowerCase() === recipientForRule(desired)?.toLowerCase() &&
    workerForRule(rule) === workerForRule(desired)
  );
}

async function listRules(config) {
  const payload = await cfRequest(
    config,
    `/zones/${config.zoneId}/email/routing/rules?per_page=100`,
  );
  return payload?.result || [];
}

async function ensureWorkerRules(config) {
  let rules = await listRules(config);

  for (const alias of EMAIL_ALIASES) {
    const desired = buildWorkerRule(alias, config);
    const address = recipientForRule(desired);
    const existing = rules.find(
      (rule) => recipientForRule(rule)?.toLowerCase() === address.toLowerCase(),
    );

    if (!existing) {
      const created = await cfRequest(config, `/zones/${config.zoneId}/email/routing/rules`, {
        method: 'POST',
        body: desired,
      });
      rules.push(created?.result);
      console.log(`ROUTE_CREATED address=${address} worker=${config.workerName}`);
      continue;
    }

    if (ruleMatchesDesired(existing, desired)) {
      console.log(`ROUTE_OK address=${address} worker=${config.workerName}`);
      continue;
    }

    if (!existing.id) {
      throw new Error(`ROUTE_ID_MISSING: cannot safely repair ${address}.`);
    }

    const repaired = await cfRequest(
      config,
      `/zones/${config.zoneId}/email/routing/rules/${existing.id}`,
      { method: 'PUT', body: desired },
    );
    rules = rules.map((rule) => (rule?.id === existing.id ? repaired?.result : rule));
    console.log(`ROUTE_REPAIRED address=${address} worker=${config.workerName}`);
  }

  const finalRules = await listRules(config);
  for (const alias of EMAIL_ALIASES) {
    const desired = buildWorkerRule(alias, config);
    const address = recipientForRule(desired);
    const actual = finalRules.find(
      (rule) => recipientForRule(rule)?.toLowerCase() === address.toLowerCase(),
    );
    if (!actual || !ruleMatchesDesired(actual, desired)) {
      throw new Error(`ROUTE_VERIFICATION_FAILED: ${address}`);
    }
  }
}

export async function reconcileCloudflareEmailRouting(config = configFromEnv()) {
  if (!config.token) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN_MISSING: add a GitHub Actions secret with Zone Read, Zone Settings Write, Email Routing Rules Write, and Email Routing Addresses Write.',
    );
  }

  const resolved = await discoverZone(config);
  await ensureRoutingDns(resolved);
  await ensureVerifiedDestination(resolved);
  await ensureWorkerRules(resolved);

  console.log(
    `EMAIL_ROUTING_RECONCILED zone=${resolved.zoneName} worker=${resolved.workerName} aliases=${EMAIL_ALIASES.length}`,
  );
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const config = configFromEnv(env);
  const apply = argv.includes('--apply');

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'plan',
        zone: config.zoneName,
        worker: config.workerName,
        destination: config.destinationEmail,
        aliases: EMAIL_ALIASES.map((alias) => `${alias}@${config.zoneName}`),
        deletes: false,
        catchAll: false,
      },
      null,
      2,
    ),
  );

  if (!apply) return;
  await reconcileCloudflareEmailRouting(config);
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
