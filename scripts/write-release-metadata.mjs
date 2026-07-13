import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function gitValue(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function resolveReleaseMetadata(env = process.env, cwd = process.cwd(), now = new Date()) {
  const commitSha = (
    env.CF_PAGES_COMMIT_SHA
    || env.GITHUB_SHA
    || gitValue(['rev-parse', 'HEAD'], cwd)
    || 'unknown'
  ).trim().toLowerCase();

  const branch = (
    env.CF_PAGES_BRANCH
    || env.GITHUB_REF_NAME
    || gitValue(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)
    || 'unknown'
  ).trim();

  return {
    schemaVersion: 1,
    app: 'sekret-bip',
    commitSha,
    branch,
    deploymentProvider: env.CF_PAGES === '1' ? 'cloudflare-pages' : 'local-or-ci-build',
    deploymentUrl: env.CF_PAGES_URL || null,
    builtAt: now.toISOString(),
  };
}

export function writeReleaseMetadata(outputDirectory = 'dist', options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const metadata = resolveReleaseMetadata(options.env ?? process.env, cwd, options.now ?? new Date());
  const absoluteOutput = path.resolve(cwd, outputDirectory);
  fs.mkdirSync(absoluteOutput, {recursive: true});
  const destination = path.join(absoluteOutput, 'release.json');
  fs.writeFileSync(destination, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return {destination, metadata};
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  const outputDirectory = process.argv[2] || 'dist';
  const result = writeReleaseMetadata(outputDirectory);
  console.log(`Wrote release metadata to ${result.destination}`);
  console.log(JSON.stringify(result.metadata));
}
