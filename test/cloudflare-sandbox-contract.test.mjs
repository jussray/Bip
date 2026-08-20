import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');
const SANDBOX_VERSION = '0.13.0-next.738.2';

test('Cloudflare Sandbox stays isolated from the teen-facing production Worker', async () => {
  const [configText, packageText, dockerfile, source, tsconfigText, productionWrangler] = await Promise.all([
    read('tools/cloudflare-sandbox/wrangler.jsonc'),
    read('tools/cloudflare-sandbox/package.json'),
    read('tools/cloudflare-sandbox/Dockerfile'),
    read('tools/cloudflare-sandbox/src/index.ts'),
    read('tools/cloudflare-sandbox/tsconfig.json'),
    read('wrangler.toml'),
  ]);

  const config = JSON.parse(configText);
  const pkg = JSON.parse(packageText);
  const tsconfig = JSON.parse(tsconfigText);

  assert.equal(config.name, 'sekret-internal-sandbox');
  assert.equal(config.workers_dev, false);
  assert.equal(config.routes, undefined);
  assert.equal(config.containers?.length, 1);
  assert.equal(config.containers[0].class_name, 'InternalSandbox');
  assert.equal(config.containers[0].instance_type, 'lite');
  assert.equal(config.containers[0].max_instances, 1);
  assert.equal(config.durable_objects?.bindings?.[0]?.name, 'Sandbox');
  assert.equal(config.durable_objects?.bindings?.[0]?.class_name, 'InternalSandbox');
  assert.deepEqual(config.migrations?.[0]?.new_sqlite_classes, ['InternalSandbox']);

  assert.equal(pkg.dependencies?.['@cloudflare/sandbox'], SANDBOX_VERSION);
  assert.match(
    dockerfile,
    new RegExp(`^FROM docker\\.io/cloudflare/sandbox:${SANDBOX_VERSION.replaceAll('.', '\\.')}\\s*$`, 'm'),
  );
  assert.equal(tsconfig.extends, undefined);
  assert.equal(tsconfig.compilerOptions?.noEmit, true);

  assert.match(source, /enableInternet\s*=\s*false/);
  assert.doesNotMatch(source, /proxyToSandbox/);
  assert.doesNotMatch(source, /exposePort|tunnels\./);
  assert.doesNotMatch(source, /\['bash'|"bash"|curl|wget/);
  assert.match(source, /ALLOWED_EXECUTABLES = new Set\(\['node', 'npm', 'npx', 'git'\]\)/);
  assert.match(source, /value === '\/workspace' \|\| value\.startsWith\('\/workspace\/'\)/);

  const authIndex = source.indexOf('if (!authorized(request, env))');
  const sandboxIndex = source.indexOf('const sandbox = getSandbox');
  assert.ok(authIndex >= 0 && sandboxIndex > authIndex, 'authentication must happen before sandbox allocation');

  assert.doesNotMatch(productionWrangler, /sandbox|container/i);
  assert.match(productionWrangler, /name = "sekret-backend"/);
});

test('Sandbox execution contract is bounded and ephemeral', async () => {
  const source = await read('tools/cloudflare-sandbox/src/index.ts');

  assert.match(source, /MAX_ARGS = 16/);
  assert.match(source, /MAX_ARG_LENGTH = 512/);
  assert.match(source, /MAX_OUTPUT_LENGTH = 16_384/);
  assert.match(source, /EXEC_TIMEOUT_MS = 30_000/);
  assert.match(source, /sandbox\.destroy\(\)/);
  assert.match(source, /sandbox_not_configured/);
  assert.match(source, /invalid_execution_request/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|OPENAI_API_KEY|ELEVENLABS_API_KEY/);
});
