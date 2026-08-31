import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_ENV_NAME = 'CLOUDFLARE_API_TOKEN';

export function normalizeCloudflareTokenTransport(value) {
  const raw = String(value ?? '');
  if (!raw) return { token: '', changed: false };

  const trimmed = raw.trim();
  if (/^Bearer\s+/i.test(trimmed) || /^[A-Z_][A-Z0-9_]*\s*=/.test(trimmed) || /^['"]|['"]$/.test(trimmed)) {
    return { token: trimmed, changed: trimmed !== raw };
  }

  const token = trimmed
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[\t\n\r ]+/g, '');
  return { token, changed: token !== raw };
}

export function runWithNormalizedCloudflareToken({
  argv = process.argv.slice(2),
  env = process.env,
  spawn = spawnSync,
} = {}) {
  const [target, ...targetArgs] = argv;
  if (!target) throw new Error('NORMALIZED_CLOUDFLARE_TOKEN_TARGET_REQUIRED');

  const source = String(env[DEFAULT_ENV_NAME] ?? '');
  const { token, changed } = normalizeCloudflareTokenTransport(source);
  console.error(`CLOUDFLARE_TOKEN_TRANSPORT_READY source=${DEFAULT_ENV_NAME} configured=${Boolean(source)} normalized=${changed}`);
  const result = spawn(process.execPath, [target, ...targetArgs], {
    cwd: process.cwd(),
    env: { ...env, [DEFAULT_ENV_NAME]: token },
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  return Number.isInteger(result.status) ? result.status : 1;
}

export function main() {
  try {
    process.exitCode = runWithNormalizedCloudflareToken();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) main();
