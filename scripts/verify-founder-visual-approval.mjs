#!/usr/bin/env node

const RECEIPT_MARKER = 'FOUNDER-VISUAL-APPROVAL v1';
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const RECEIPT_PATTERN = /^FOUNDER-VISUAL-APPROVAL v1\r?\nhead-sha:\s*([0-9a-f]{40})\r?\nartifact:\s*([^\r\n]+)\r?\ndecision:\s*([a-z-]+)$/i;

const GOVERNANCE_ONLY_PATHS = new Set([
  '.github/workflows/product-design-playwright-proof.yml',
  'config/founder-visual-authority.json',
  'scripts/verify-founder-visual-approval.mjs',
  'test/founder-visual-approval-receipt.test.mjs',
  'test/founder-visual-authority-contract.test.mjs',
  'test/product-design-workflow-contract.test.mjs',
]);

function fail(message) {
  console.error(`founder visual approval: ${message}`);
  process.exit(1);
}

function normalize(value) {
  return String(value ?? '').trim();
}

export function parseFounderVisualApproval(body) {
  const text = normalize(body);
  const match = text.match(RECEIPT_PATTERN);
  if (!match) return null;
  return {
    headSha: normalize(match[1]).toLowerCase(),
    artifact: normalize(match[2]),
    decision: normalize(match[3]).toLowerCase(),
  };
}

export function classifyFounderDecision(changedFiles = []) {
  if (changedFiles.length > 0 && changedFiles.every((path) => GOVERNANCE_ONLY_PATHS.has(normalize(path)))) {
    return 'no-visual-regression';
  }
  return 'visual-acceptance';
}

export function findValidFounderApproval({ comments, expectedHeadSha, founderLogin, requiredDecision }) {
  const headSha = normalize(expectedHeadSha).toLowerCase();
  const owner = normalize(founderLogin).toLowerCase();
  const required = normalize(requiredDecision).toLowerCase();
  if (!SHA_PATTERN.test(headSha)) throw new Error('expected head SHA must be a full 40-character SHA');
  if (!owner) throw new Error('founder login is required');
  if (!['visual-acceptance', 'no-visual-regression'].includes(required)) throw new Error('required founder decision is invalid');

  const expectedArtifact = `product-design-playwright-${headSha}`;
  for (const comment of [...(comments ?? [])].reverse()) {
    const login = normalize(comment?.user?.login).toLowerCase();
    const association = normalize(comment?.author_association).toUpperCase();
    if (login !== owner || association !== 'OWNER') continue;

    const receipt = parseFounderVisualApproval(comment?.body);
    if (!receipt) continue;
    if (receipt.headSha !== headSha) continue;
    if (receipt.artifact !== expectedArtifact) continue;

    if (receipt.decision !== required) return null;

    return {
      commentId: comment.id ?? null,
      htmlUrl: comment.html_url ?? null,
      founderLogin: login,
      headSha,
      artifact: expectedArtifact,
      decision: required,
    };
  }
  return null;
}

async function fetchPaginatedJson({ firstUrl, token, fetchImpl = fetch }) {
  const rows = [];
  let page = 1;
  while (true) {
    const separator = firstUrl.includes('?') ? '&' : '?';
    const response = await fetchImpl(`${firstUrl}${separator}per_page=100&page=${page}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('GitHub API returned a non-array payload');
    rows.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return rows;
}

export async function fetchPullRequestComments({ apiUrl, repository, pullRequestNumber, token, fetchImpl = fetch }) {
  if (!repository || !/^\d+$/.test(String(pullRequestNumber ?? ''))) throw new Error('repository and numeric pull request number are required');
  if (!token) throw new Error('GitHub token is required');
  return fetchPaginatedJson({ firstUrl: `${apiUrl}/repos/${repository}/issues/${pullRequestNumber}/comments`, token, fetchImpl });
}

export async function fetchPullRequestFiles({ apiUrl, repository, pullRequestNumber, token, fetchImpl = fetch }) {
  if (!repository || !/^\d+$/.test(String(pullRequestNumber ?? ''))) throw new Error('repository and numeric pull request number are required');
  if (!token) throw new Error('GitHub token is required');
  const rows = await fetchPaginatedJson({ firstUrl: `${apiUrl}/repos/${repository}/pulls/${pullRequestNumber}/files`, token, fetchImpl });
  return rows.map((row) => normalize(row?.filename)).filter(Boolean);
}

async function main() {
  const expectedHeadSha = process.env.EXPECTED_HEAD_SHA;
  const founderLogin = process.env.FOUNDER_GITHUB_LOGIN;
  const pullRequestNumber = process.env.PR_NUMBER;
  const repository = process.env.GITHUB_REPOSITORY;
  const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  const token = process.env.GITHUB_TOKEN;

  if (!expectedHeadSha) fail('EXPECTED_HEAD_SHA is required');
  if (!founderLogin) fail('FOUNDER_GITHUB_LOGIN is required');
  if (!pullRequestNumber) fail('PR_NUMBER is required');
  if (!repository) fail('GITHUB_REPOSITORY is required');
  if (!token) fail('GITHUB_TOKEN is required');

  let comments;
  let changedFiles;
  try {
    [comments, changedFiles] = await Promise.all([
      fetchPullRequestComments({ apiUrl, repository, pullRequestNumber, token }),
      fetchPullRequestFiles({ apiUrl, repository, pullRequestNumber, token }),
    ]);
  } catch (error) {
    fail(`could not read PR authority inputs: ${error instanceof Error ? error.message : String(error)}`);
  }

  const requiredDecision = classifyFounderDecision(changedFiles);
  const receipt = findValidFounderApproval({ comments, expectedHeadSha, founderLogin, requiredDecision });
  if (!receipt) {
    const artifact = `product-design-playwright-${expectedHeadSha.toLowerCase()}`;
    fail(
      `missing exact-head founder ${requiredDecision} receipt. Inspect artifact ${artifact}, then comment exactly:\n\n` +
      `${RECEIPT_MARKER}\nhead-sha: ${expectedHeadSha.toLowerCase()}\nartifact: ${artifact}\ndecision: ${requiredDecision}`,
    );
  }

  console.log(JSON.stringify({ ...receipt, changedFiles }));
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
