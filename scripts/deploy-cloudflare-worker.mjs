import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;

export function normalizeCommitSha(value) {
  const sha = String(value ?? '').trim().toLowerCase();
  return SHA_PATTERN.test(sha) ? sha : null;
}

export function resolveDeployCommitSha({ env = process.env, cwd = process.cwd() } = {}) {
  const workersBuildSha = normalizeCommitSha(env.WORKERS_CI_COMMIT_SHA);
  if (workersBuildSha) return workersBuildSha;

  const localSha = normalizeCommitSha(
    execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );

  if (!localSha) {
    throw new Error('Unable to resolve an exact 40-character Git commit SHA for Cloudflare deployment.');
  }

  return localSha;
}

export function buildWranglerDeployArgs(commitSha) {
  const sha = normalizeCommitSha(commitSha);
  if (!sha) throw new Error('A valid 40-character Git commit SHA is required.');
  return ['wrangler', 'deploy', '--tag', sha, '--message', `git:${sha}`];
}

export function deployCloudflareWorker(options = {}) {
  const sha = resolveDeployCommitSha(options);
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = buildWranglerDeployArgs(sha);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Cloudflare Worker deployment failed with exit code ${result.status ?? 'unknown'}.`);
  }

  return sha;
}

const isDirectExecution = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectExecution) {
  try {
    const sha = deployCloudflareWorker();
    console.log(`Deployed sekret-backend with exact Git tag ${sha}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  }
}
