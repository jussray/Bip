import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const expectedProjectServerNames = [
  'cloudflare-builds',
  'cloudflare-docs',
  'cloudflare-observability',
  'figma',
  'github',
  'microsoft-learn',
  'playwright',
  'supabase',
];
const expectedCredentialedServerNames = [
  'bright-data',
  'cloudflare-builds',
  'cloudflare-docs',
  'cloudflare-observability',
  'figma',
  'github',
  'microsoft-learn',
  'playwright',
  'supabase',
];

const expectedRemoteUrls = {
  github: 'https://api.githubcopilot.com/mcp/',
  'microsoft-learn': 'https://learn.microsoft.com/api/mcp',
  figma: 'https://mcp.figma.com/mcp',
  'cloudflare-docs': 'https://docs.mcp.cloudflare.com/mcp',
  'cloudflare-builds': 'https://builds.mcp.cloudflare.com/mcp',
  'cloudflare-observability': 'https://observability.mcp.cloudflare.com/mcp',
};

const expectedGithubToolsets =
  'repos,issues,pull_requests,actions,code_security,secret_protection';
const pinnedPlaywrightPackage = '@playwright/mcp@0.0.78';
const pinnedBrightDataPackage = '@brightdata/mcp';

function fail(message) {
  throw new Error(`[verify:mcp] ${message}`);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${relativePath} is missing or invalid JSON: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sortedKeys(value) {
  return Object.keys(value ?? {}).sort();
}

function validateServerSet(relativePath, servers, expectedServerNames) {
  assert(
    JSON.stringify(sortedKeys(servers)) === JSON.stringify(expectedServerNames),
    `${relativePath} must contain exactly: ${expectedServerNames.join(', ')}`,
  );
}

function validateRemoteServers(relativePath, servers) {
  for (const [name, url] of Object.entries(expectedRemoteUrls)) {
    assert(servers[name]?.type === 'http', `${relativePath}:${name} must use HTTP`);
    assert(servers[name]?.url === url, `${relativePath}:${name} URL drifted`);
  }

  const githubHeaders = servers.github?.headers ?? {};
  assert(
    githubHeaders['X-MCP-Toolsets'] === expectedGithubToolsets,
    `${relativePath}:github toolsets drifted`,
  );
  assert(
    githubHeaders['X-MCP-Lockdown'] === 'true',
    `${relativePath}:github lockdown mode must remain enabled`,
  );
}

function validateSupabase(relativePath, server, expectedProjectRef) {
  const url = new URL(server?.url ?? '');
  assert(server?.type === 'http', `${relativePath}:supabase must use HTTP`);
  assert(url.origin === 'https://mcp.supabase.com', `${relativePath}:supabase host drifted`);
  assert(url.pathname === '/mcp', `${relativePath}:supabase path drifted`);
  assert(
    url.searchParams.get('project_ref') === expectedProjectRef,
    `${relativePath}:supabase project scope drifted`,
  );
  assert(
    url.searchParams.get('read_only') === 'true',
    `${relativePath}:supabase must remain read-only`,
  );
  assert(
    url.searchParams.get('features') === 'database,docs',
    `${relativePath}:supabase features must remain database,docs`,
  );
}

function validatePlaywright(relativePath, server, requireStdioType = false) {
  if (requireStdioType) {
    assert(server?.type === 'stdio', `${relativePath}:playwright must use stdio`);
  }
  assert(server?.command === 'npx', `${relativePath}:playwright command must be npx`);
  assert(Array.isArray(server?.args), `${relativePath}:playwright args are missing`);
  assert(
    server.args.includes(pinnedPlaywrightPackage),
    `${relativePath}:playwright must stay pinned to ${pinnedPlaywrightPackage}`,
  );
  assert(!server.args.some((arg) => String(arg).includes('@latest')), `${relativePath}:playwright cannot use @latest`);
  assert(server.args.includes('--isolated'), `${relativePath}:playwright must use an isolated profile`);
  const browserIndex = server.args.indexOf('--browser');
  assert(
    browserIndex >= 0 && server.args[browserIndex + 1] === 'chromium',
    `${relativePath}:playwright browser must be chromium`,
  );
}

function validateBrightData(relativePath, server, expectedApiToken, requireStdioType = false) {
  if (requireStdioType) {
    assert(server?.type === 'stdio', `${relativePath}:bright-data must use stdio`);
  }
  assert(server?.command === 'npx', `${relativePath}:bright-data command must be npx`);
  assert(Array.isArray(server?.args), `${relativePath}:bright-data args are missing`);
  assert(server.args.includes('-y'), `${relativePath}:bright-data must use non-interactive npx`);
  assert(
    server.args.includes(pinnedBrightDataPackage),
    `${relativePath}:bright-data must use ${pinnedBrightDataPackage}`,
  );
  assert(
    server?.env?.API_TOKEN === expectedApiToken,
    `${relativePath}:bright-data API token reference drifted`,
  );
  assert(
    server?.env?.GROUPS === 'code',
    `${relativePath}:bright-data must remain restricted to GROUPS=code`,
  );
  assert(!('PRO_MODE' in (server?.env ?? {})), `${relativePath}:bright-data Pro Mode is forbidden`);
  assert(!('TOOLS' in (server?.env ?? {})), `${relativePath}:bright-data explicit tools are forbidden`);
}

function validateVscodeInput(config) {
  const input = (config.inputs ?? []).find((entry) => entry.id === 'brightdata_api_token');
  assert(input?.type === 'promptString', '.vscode/mcp.json Bright Data input must be promptString');
  assert(input?.password === true, '.vscode/mcp.json Bright Data input must be masked');
  assert(
    input?.description === 'Bright Data API Token',
    '.vscode/mcp.json Bright Data input description drifted',
  );
}

function assertNoCommittedSecrets(relativePath, parsed) {
  const serialized = JSON.stringify(parsed);
  const secretPatterns = [
    /github_pat_/i,
    /ghp_[A-Za-z0-9]{20,}/,
    /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]{12,}/i,
    /SUPABASE_ACCESS_TOKEN/,
    /CLOUDFLARE_API_TOKEN/,
  ];

  for (const pattern of secretPatterns) {
    assert(!pattern.test(serialized), `${relativePath} appears to contain a committed credential`);
  }
}

const projectConfig = readJson('.mcp.json');
const exampleConfig = readJson('.mcp.example.json');
const vscodeConfig = readJson('.vscode/mcp.json');

const projectServers = projectConfig.mcpServers;
const exampleServers = exampleConfig.mcpServers;
const vscodeServers = vscodeConfig.servers;

validateServerSet('.mcp.json', projectServers, expectedProjectServerNames);
validateServerSet('.mcp.example.json', exampleServers, expectedCredentialedServerNames);
validateServerSet('.vscode/mcp.json', vscodeServers, expectedCredentialedServerNames);

validateRemoteServers('.mcp.json', projectServers);
validateRemoteServers('.mcp.example.json', exampleServers);
validateRemoteServers('.vscode/mcp.json', vscodeServers);

validateSupabase('.mcp.json', projectServers.supabase, 'tbsevonvegdnlyjgplmm');
validateSupabase('.mcp.example.json', exampleServers.supabase, 'YOUR_PROJECT_REF');
validateSupabase('.vscode/mcp.json', vscodeServers.supabase, 'tbsevonvegdnlyjgplmm');

validatePlaywright('.mcp.json', projectServers.playwright);
validatePlaywright('.mcp.example.json', exampleServers.playwright);
validatePlaywright('.vscode/mcp.json', vscodeServers.playwright, true);

assert(!projectServers['bright-data'], '.mcp.json must remain credential-free and omit bright-data');
validateBrightData(
  '.mcp.example.json',
  exampleServers['bright-data'],
  '<YOUR_BRIGHT_DATA_API_TOKEN>',
);
validateBrightData(
  '.vscode/mcp.json',
  vscodeServers['bright-data'],
  '${input:brightdata_api_token}',
  true,
);
validateVscodeInput(vscodeConfig);

assert(!projectServers['cloudflare-api'], '.mcp.json must not enable the broad Cloudflare API server');
assert(!vscodeServers['cloudflare-api'], '.vscode/mcp.json must not enable the broad Cloudflare API server');

assertNoCommittedSecrets('.mcp.json', projectConfig);
assertNoCommittedSecrets('.mcp.example.json', exampleConfig);
assertNoCommittedSecrets('.vscode/mcp.json', vscodeConfig);

console.log('[verify:mcp] MCP configuration is valid, scoped, pinned, and credential-free.');
