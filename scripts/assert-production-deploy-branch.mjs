import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCTION_BRANCH = 'main';
const PROVIDER_BRANCH_KEYS = [
  'WORKERS_CI_BRANCH',
  'CF_PAGES_BRANCH',
  'GITHUB_HEAD_REF',
  'GITHUB_REF_NAME',
];

export function normalizeBranch(value) {
  return String(value ?? '')
    .trim()
    .replace(/^refs\/heads\//, '')
    .replace(/^refs\/remotes\/origin\//, '')
    .replace(/^origin\//, '');
}

function readCurrentGitBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function resolveDeployBranch({ env = process.env, readGitBranch = readCurrentGitBranch } = {}) {
  const providerEvidence = PROVIDER_BRANCH_KEYS
    .map((key) => ({ key, branch: normalizeBranch(env[key]) }))
    .filter(({ branch }) => branch);

  const uniqueProviderBranches = [...new Set(providerEvidence.map(({ branch }) => branch))];
  if (uniqueProviderBranches.length > 1) {
    const detail = providerEvidence.map(({ key, branch }) => `${key}=${branch}`).join(', ');
    throw new Error(`Conflicting deployment branch evidence: ${detail}`);
  }

  if (uniqueProviderBranches.length === 1) {
    return {
      branch: uniqueProviderBranches[0],
      source: providerEvidence.map(({ key }) => key).join('+'),
    };
  }

  const gitBranch = normalizeBranch(readGitBranch());
  if (gitBranch) {
    return { branch: gitBranch, source: 'git' };
  }

  const localOverride = normalizeBranch(env.SEKRET_DEPLOY_BRANCH);
  const isProviderOrCi = env.WORKERS_CI === '1' || env.CI === 'true';
  if (
    localOverride &&
    env.SEKRET_PRODUCTION_DEPLOY_APPROVED === '1' &&
    !isProviderOrCi
  ) {
    return { branch: localOverride, source: 'explicit-local-approval' };
  }

  return { branch: '', source: 'unknown' };
}

export function assertProductionDeployBranch(options = {}) {
  const result = resolveDeployBranch(options);

  if (!result.branch) {
    throw new Error(
      'Production deployment blocked: branch authority is unknown. ' +
        'Run from main, or for a deliberate local detached-head release set ' +
        'SEKRET_DEPLOY_BRANCH=main and SEKRET_PRODUCTION_DEPLOY_APPROVED=1. ' +
        'CI and Workers Builds may not use this override.',
    );
  }

  if (result.branch !== PRODUCTION_BRANCH) {
    throw new Error(
      `Production deployment blocked: ${result.source} resolved to ` +
        `${result.branch}; only ${PRODUCTION_BRANCH} may run production deploy commands.`,
    );
  }

  return result;
}

const executedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executedDirectly) {
  try {
    const result = assertProductionDeployBranch();
    console.log(`Production deployment branch verified: ${result.branch} (${result.source}).`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
