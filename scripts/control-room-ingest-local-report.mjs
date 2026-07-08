import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function normalizeVerifyLocalReport(reportPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const checks = Array.isArray(report.checks) ? report.checks : [];
  return { reportPath, generatedAt: report.generatedAt || report.generated_at || null, checks };
}

function normalizeFrontendReport(reportPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const run = report.run || {};
  const checks = [
    {
      id: 'frontend-verification',
      label: `Frontend verification (${run.mode || 'unknown mode'})`,
      area: 'frontend',
      status: run.status || 'fail',
      commandText: run.mode || 'verify-frontend',
      exitCode: run.exitCode ?? null,
      durationMs: run.durationMs ?? null,
      stdoutTail: run.stdoutTail || '',
      stderrTail: run.stderrTail || '',
    },
  ];
  return { reportPath, generatedAt: report.generatedAt || null, checks };
}

const sources = [
  { path: path.join(root, 'artifacts', 'control-room', 'local-verification-report.json'), normalize: normalizeVerifyLocalReport },
  { path: path.join(root, 'reports', 'control-room', 'latest.json'), normalize: normalizeVerifyLocalReport },
  { path: path.join(root, 'reports', 'control-room', 'frontend.json'), normalize: normalizeFrontendReport },
].filter((source) => fs.existsSync(source.path));

if (sources.length === 0) {
  throw new Error('No local Control Room report found. Run `npm run verify:local` or `npm run control-room:mission:verify-frontend` first.');
}

if (process.env.CONTROL_ROOM_INGEST !== '1') {
  throw new Error('Ingestion is opt-in. Re-run with CONTROL_ROOM_INGEST=1.');
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const reports = sources.map((source) => source.normalize(source.path));
const failedChecks = reports.flatMap((entry) =>
  entry.checks
    .filter((check) => check.status === 'fail')
    .map((check) => ({ ...check, reportPath: entry.reportPath, generatedAt: entry.generatedAt })),
);

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 700)}`);
  }
  return body ? JSON.parse(body) : null;
}

function fingerprint(check) {
  return `local_control_room:${check.id}:local`;
}

function severityFor(check) {
  if (['type-check', 'unit-tests', 'control-room-rls'].includes(check.id)) return 'error';
  return 'warning';
}

function suggestedFix(check) {
  if (check.id === 'control-room-rls') return 'Review the reported Supabase migration or policy failure before pushing.';
  if (check.id === 'companions') return 'Restore companion assets or update the companion asset contract intentionally.';
  if (check.id === 'type-check') return 'Fix the TypeScript errors shown in the local verification report.';
  if (check.id === 'unit-tests') return 'Fix the failing test before pushing or preparing a release.';
  if (check.id === 'voice-intelligence') return 'Review the voice intelligence test output and restore the expected reply path.';
  if (check.id === 'oracle') return 'Review Oracle discovery output and restore the expected integration contract.';
  if (check.id === 'frontend-verification') return 'Review the Playwright or fallback verification output and fix the failing frontend check.';
  return 'Review the local verification output and fix the failing command before pushing.';
}

async function ingestFailure(check) {
  const metadata = {
    source: 'local_control_room',
    report_generated_at: check.generatedAt || null,
    report_path: path.relative(root, check.reportPath),
    command: check.commandText || null,
    exit_code: check.exitCode ?? null,
    duration_ms: check.durationMs ?? null,
    stdout_tail: String(check.stdoutTail || '').slice(0, 2000),
    stderr_tail: String(check.stderrTail || '').slice(0, 2000),
  };

  const inserted = await supabaseRequest('/rest/v1/audit_events', {
    method: 'POST',
    body: JSON.stringify({
      user_id: null,
      event_type: `local_verification_${check.id}_failed`,
      screen: check.area || 'local-control-room',
      severity: severityFor(check),
      message: `${check.label || check.id} failed during local verification.`,
      metadata,
      resolved: false,
    }),
  });

  const eventId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;
  if (!eventId) throw new Error(`audit_events insert did not return an id for ${check.id}.`);

  await supabaseRequest('/rest/v1/rpc/upsert_control_room_issue', {
    method: 'POST',
    body: JSON.stringify({
      p_fingerprint: fingerprint(check),
      p_source: 'local_control_room',
      p_category: check.area || 'verification',
      p_severity: severityFor(check),
      p_status: 'open',
      p_title: `${check.label || check.id} failed locally`,
      p_summary: `${check.commandText || check.id} exited with code ${check.exitCode ?? 'unknown'}.`,
      p_suggested_fix: suggestedFix(check),
      p_affected_surface: check.area || null,
      p_affected_user_id: null,
      p_event_id: eventId,
      p_metadata: metadata,
    }),
  });

  return check.id;
}

const ingested = [];
for (const check of failedChecks) {
  ingested.push(await ingestFailure(check));
}

const result = {
  report_paths: reports.map((entry) => path.relative(root, entry.reportPath)),
  failed_count: failedChecks.length,
  ingested_count: ingested.length,
  ingested,
};

console.log(JSON.stringify(result, null, 2));
