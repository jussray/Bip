import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const token = process.env.GH_TOKEN?.trim();
const repository = process.env.GITHUB_REPOSITORY?.trim();
const prNumber = process.env.PR_NUMBER?.trim();
const expectedHead = process.env.EXPECTED_HEAD_SHA?.trim();
const evidenceDir = process.env.EVIDENCE_DIR?.trim() || 'artifacts/codeql-pr-alert-proof';
const apiVersion = '2026-03-10';
const pollMs = 10_000;
const observationMs = 10 * 60_000;

mkdirSync(evidenceDir, { recursive: true });

function save(name, value) {
  writeFileSync(path.join(evidenceDir, name), `${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`);
}

function requireEnv(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function clip(value, max = 4_000) {
  if (typeof value !== 'string') return value ?? null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function github(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': apiVersion,
      'User-Agent': 'sekret-bip-codeql-pr-alert-proof',
    },
  });

  if (!response.ok) {
    const body = clip(await response.text(), 1_000);
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${body}`);
  }
  return response.json();
}

function sanitizeCheck(check) {
  if (!check) return null;
  return {
    id: check.id,
    name: check.name,
    status: check.status,
    conclusion: check.conclusion,
    started_at: check.started_at,
    completed_at: check.completed_at,
    details_url: check.details_url,
    app: check.app ? { slug: check.app.slug, name: check.app.name } : null,
    output: check.output ? {
      title: clip(check.output.title),
      summary: clip(check.output.summary),
      text: clip(check.output.text),
      annotations_count: check.output.annotations_count ?? null,
    } : null,
  };
}

function sanitizeAlert(alert) {
  const instance = alert.most_recent_instance ?? {};
  const location = instance.location ?? {};
  return {
    number: alert.number,
    state: alert.state,
    html_url: alert.html_url,
    rule: alert.rule ? {
      id: alert.rule.id,
      name: alert.rule.name,
      severity: alert.rule.severity,
      security_severity_level: alert.rule.security_severity_level,
      description: clip(alert.rule.description, 1_000),
      tags: alert.rule.tags ?? [],
    } : null,
    tool: alert.tool ? {
      name: alert.tool.name,
      version: alert.tool.version,
    } : null,
    most_recent_instance: {
      ref: instance.ref ?? null,
      state: instance.state ?? null,
      commit_sha: instance.commit_sha ?? null,
      message: instance.message ? { text: clip(instance.message.text, 1_000) } : null,
      location: {
        path: location.path ?? null,
        start_line: location.start_line ?? null,
        end_line: location.end_line ?? null,
        start_column: location.start_column ?? null,
        end_column: location.end_column ?? null,
      },
      classifications: instance.classifications ?? [],
    },
  };
}

function latestCheck(checks, predicate) {
  return checks
    .filter(predicate)
    .sort((a, b) => Number(b.id) - Number(a.id))[0] ?? null;
}

function isMissingConfigurationNeutral(check) {
  if (check?.conclusion !== 'neutral') return false;
  const text = [check.output?.title, check.output?.summary, check.output?.text]
    .filter((value) => typeof value === 'string')
    .join('\n')
    .toLowerCase();
  return text.includes('configuration not found') || text.includes('configurations not found');
}

async function listOpenPrAlerts(owner, repo, pr) {
  const alerts = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await github(`/repos/${owner}/${repo}/code-scanning/alerts?pr=${encodeURIComponent(pr)}&state=open&per_page=100&page=${page}`);
    alerts.push(...batch);
    if (batch.length < 100) break;
  }
  return alerts;
}

async function main() {
  requireEnv(token, 'GH_TOKEN');
  requireEnv(repository, 'GITHUB_REPOSITORY');
  requireEnv(prNumber, 'PR_NUMBER');
  requireEnv(expectedHead, 'EXPECTED_HEAD_SHA');

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPOSITORY must be owner/repo');

  const deadline = Date.now() + observationMs;
  let codeqlCheck = null;
  let javascriptAnalysisCheck = null;
  let observedCheckCount = 0;

  while (Date.now() < deadline) {
    const payload = await github(`/repos/${owner}/${repo}/commits/${expectedHead}/check-runs?per_page=100`);
    const checks = payload.check_runs ?? [];
    observedCheckCount = checks.length;

    codeqlCheck = latestCheck(
      checks,
      (check) => check.name === 'CodeQL' && check.app?.slug === 'github-advanced-security',
    );
    javascriptAnalysisCheck = latestCheck(
      checks,
      (check) => check.name === 'Analyze (javascript-typescript)' && check.app?.slug === 'github-actions',
    );

    const javascriptTerminal = javascriptAnalysisCheck?.status === 'completed';
    const aggregateTerminal = codeqlCheck?.status === 'completed';
    const aggregateSettled = aggregateTerminal && !isMissingConfigurationNeutral(codeqlCheck);

    if (javascriptTerminal && aggregateSettled) break;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  const sanitizedCodeqlCheck = sanitizeCheck(codeqlCheck);
  const sanitizedJavascriptCheck = sanitizeCheck(javascriptAnalysisCheck);
  save('codeql-check.json', sanitizedCodeqlCheck ?? { state: 'not-observed' });
  save('javascript-analysis-check.json', sanitizedJavascriptCheck ?? { state: 'not-observed' });

  const javascriptPassed = javascriptAnalysisCheck?.status === 'completed'
    && javascriptAnalysisCheck.conclusion === 'success';
  const aggregateSettled = codeqlCheck?.status === 'completed'
    && !isMissingConfigurationNeutral(codeqlCheck);

  if (!javascriptPassed || !aggregateSettled) {
    save('summary.txt', [
      `head=${expectedHead}`,
      `pr=${prNumber}`,
      `observed_check_count=${observedCheckCount}`,
      `javascript_analysis_status=${javascriptAnalysisCheck?.status ?? 'not-observed'}`,
      `javascript_analysis_conclusion=${javascriptAnalysisCheck?.conclusion ?? 'unknown'}`,
      `codeql_status=${codeqlCheck?.status ?? 'not-observed'}`,
      `codeql_conclusion=${codeqlCheck?.conclusion ?? 'unknown'}`,
      `codeql_missing_configuration=${isMissingConfigurationNeutral(codeqlCheck)}`,
    ].join('\n'));
    throw new Error('CodeQL evidence did not reach a settled current-head JavaScript analysis state');
  }

  const alerts = await listOpenPrAlerts(owner, repo, prNumber);
  const sanitizedAlerts = alerts.map(sanitizeAlert);
  const currentHeadAlerts = sanitizedAlerts.filter(
    (alert) => alert.most_recent_instance.commit_sha === expectedHead,
  );
  const staleAlerts = sanitizedAlerts.filter(
    (alert) => alert.most_recent_instance.commit_sha !== expectedHead,
  );

  save('open-pr-alerts.json', sanitizedAlerts);
  save('current-head-open-alerts.json', currentHeadAlerts);
  save('stale-open-alerts.json', staleAlerts);

  const lines = [
    `head=${expectedHead}`,
    `pr=${prNumber}`,
    `javascript_analysis_conclusion=${javascriptAnalysisCheck.conclusion ?? 'unknown'}`,
    `codeql_conclusion=${codeqlCheck.conclusion ?? 'unknown'}`,
    `current_head_open_alert_count=${currentHeadAlerts.length}`,
    `stale_open_alert_count=${staleAlerts.length}`,
    `total_open_pr_alert_count=${sanitizedAlerts.length}`,
  ];

  for (const alert of currentHeadAlerts) {
    lines.push([
      `current_head_alert=${alert.number}`,
      `rule=${alert.rule?.id ?? 'unknown'}`,
      `security_severity=${alert.rule?.security_severity_level ?? 'unknown'}`,
      `severity=${alert.rule?.severity ?? 'unknown'}`,
      `path=${alert.most_recent_instance.location.path ?? 'unknown'}`,
      `line=${alert.most_recent_instance.location.start_line ?? 'unknown'}`,
    ].join(' '));
  }

  for (const alert of staleAlerts) {
    lines.push([
      `stale_alert=${alert.number}`,
      `instance_head=${alert.most_recent_instance.commit_sha ?? 'unknown'}`,
      `rule=${alert.rule?.id ?? 'unknown'}`,
      `path=${alert.most_recent_instance.location.path ?? 'unknown'}`,
    ].join(' '));
  }

  save('summary.txt', lines.join('\n'));

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## CodeQL PR Alert Proof\n\n${lines.map((line) => `- ${line}`).join('\n')}\n`);
  }

  console.log(`CodeQL PR alert proof: js=${javascriptAnalysisCheck.conclusion ?? 'unknown'} codeql=${codeqlCheck.conclusion ?? 'unknown'} currentHeadAlerts=${currentHeadAlerts.length} staleAlerts=${staleAlerts.length}`);

  if (codeqlCheck.conclusion !== 'success' || currentHeadAlerts.length > 0) {
    throw new Error(`CodeQL current-head gate failed: conclusion=${codeqlCheck.conclusion ?? 'unknown'} currentHeadAlerts=${currentHeadAlerts.length}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  save('diagnostic-error.json', { error: message, head: expectedHead ?? null, pr: prNumber ?? null });
  console.error(`CodeQL PR alert proof failed: ${message}`);
  process.exitCode = 1;
});
