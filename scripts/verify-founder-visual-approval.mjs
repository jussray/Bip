#!/usr/bin/env node

const RECEIPT_MARKER = 'FOUNDER-VISUAL-APPROVAL v1';
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const RECEIPT_PATTERN = /^FOUNDER-VISUAL-APPROVAL v1\r?\nhead-sha:\s*([0-9a-f]{40})\r?\nartifact:\s*([^\r\n]+)\r?\ndecision:\s*([a-z-]+)$/i;

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

export function findValidFounderApproval({ comments, expectedHeadSha, founderLogin }) {
  const headSha = normalize(expectedHeadSha).toLowerCase();
  const owner = normalize(founderLogin).toLowerCase();
  if (!SHA_PATTERN.test(headSha)) throw new Error('expected head SHA must be a full 40-character SHA');
  if (!owner) throw new Error('founder login is required');

  const expectedArtifact = `product-design-playwright-${headSha}`;

  for (const comment of [...(comments ?? [])].reverse()) {
    const login = normalize(comment?.user?.login).toLowerCase();
    const association = normalize(comment?.author_association).toUpperCase();
    if (login !== owner || association !== 'OWNER') continue;

    const receipt = parseFounderVisualApproval(comment?.body);
    if (!receipt) continue;
    if (receipt.headSha !== headSha) continue;
    if (receipt.artifact !== expectedArtifact) continue;
    if (receipt.decision !== 'approved') return null;

    return {
      commentId: comment.id ?? null,
      htmlUrl: comment.html_url ?? null,
      founderLogin: login,
      headSha,
      artifact: expectedArtifact,
      decision: 'approved',
    };
  }

  return null;
}

export async function fetchPullRequestComments({ apiUrl, repository, pullRequestNumber, token, fetchImpl = fetch }) {
  if (!repository || !/^\d+$/.test(String(pullRequestNumber ?? ''))) {
    throw new Error('repository and numeric pull request number are required');
  }
  if (!token) throw new Error('GitHub token is required');

  const comments = [];
  let page = 1;

  while (true) {
    const url = `${apiUrl}/repos/${repository}/issues/${pullRequestNumber}/comments?per_page=100&page=${page}`;
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub comments API returned ${response.status}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('GitHub comments API returned a non-array payload');
    comments.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return comments;
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
  try {
    comments = await fetchPullRequestComments({
      apiUrl,
      repository,
      pullRequestNumber,
      token,
    });
  } catch (error) {
    fail(`could not read PR comments: ${error instanceof Error ? error.message : String(error)}`);
  }

  const receipt = findValidFounderApproval({ comments, expectedHeadSha, founderLogin });
  if (!receipt) {
    const artifact = `product-design-playwright-${expectedHeadSha.toLowerCase()}`;
    fail(
      `missing exact-head founder approval. Inspect artifact ${artifact}, then comment exactly:\n\n` +
      `${RECEIPT_MARKER}\nhead-sha: ${expectedHeadSha.toLowerCase()}\nartifact: ${artifact}\ndecision: approved`,
    );
  }

  console.log(JSON.stringify(receipt));
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
