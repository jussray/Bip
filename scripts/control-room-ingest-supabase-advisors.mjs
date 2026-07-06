import fs from 'node:fs';
import path from 'node:path';

const reportOnly = process.env.CONTROL_ROOM_REPORT_ONLY === 'true';
const projectRef = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_MANAGEMENT_API_TOKEN;
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const reportPath = path.join(process.cwd(), 'artifacts', 'control-room', 'supabase-advisors-report.json');

const severity = (level) => {
  const value = String(level || '').toUpperCase();
  return value === 'ERROR' ? 'error' : value.startsWith('WARN') ? 'warning' : 'info';
};

const fingerprint = (kind, lint) => `supabase_advisor:${kind}:${lint.cache_key || lint.name || 'unknown'}`;

async function getAdvisors(kind) {
  if (reportOnly) return { kind, skipped: true, lints: [] };
  if (!projectRef || !token) return { kind, skipped: true, lints: [], error: 'Management API credentials not configured.' };
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/advisors/${kind}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${kind}: ${response.status} ${body.slice(0, 500)}`);
  const parsed = body ? JSON.parse(body) : {};
  return { kind, skipped: false, lints: Array.isArray(parsed.lints) ? parsed.lints : [] };
}

async function post(pathname, body) {
  const response = await fetch(`${url.replace(/\/$/, '')}${pathname}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function ingest(kind, lint) {
  const metadata = {
    advisor_kind: kind,
    advisor_name: lint.name || null,
    advisor_level: lint.level || null,
    categories: lint.categories || [],
    remediation: lint.remediation || null,
    detail: lint.detail || null,
    advisor_metadata: lint.metadata || {},
    cache_key: lint.cache_key || null,
    project_ref: projectRef || null,
    commit_sha: process.env.GITHUB_SHA || null,
    run_id: process.env.GITHUB_RUN_ID || null,
  };

  const inserted = await post('/rest/v1/audit_events', {
    user_id: null,
    event_type: `supabase_advisor_${kind}`,
    screen: lint.metadata?.entity || lint.metadata?.name || null,
    severity: severity(lint.level),
    message: lint.title || lint.description || lint.name || 'Supabase advisor finding',
    metadata,
    resolved: false,
  });
  const eventId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;
  if (!eventId) throw new Error('Advisor audit event insert returned no id.');

  return post('/rest/v1/rpc/upsert_control_room_issue', {
    p_fingerprint: fingerprint(kind, lint),
    p_source: 'supabase_advisor',
    p_category: kind === 'security' ? 'safety' : 'infra',
    p_severity: severity(lint.level),
    p_status: 'open',
    p_title: lint.title || lint.name || `Supabase ${kind} advisor finding`,
    p_summary: lint.description || lint.detail || 'Supabase advisor reported a finding.',
    p_suggested_fix: lint.remediation || 'Review the advisor detail and apply the recommended change.',
    p_affected_surface: lint.metadata?.entity || lint.metadata?.name || null,
    p_affected_user_id: null,
    p_event_id: eventId,
    p_metadata: metadata,
  });
}

const results = [];
const errors = [];
for (const kind of ['security', 'performance']) {
  try { results.push(await getAdvisors(kind)); }
  catch (error) { errors.push({ kind, error: error instanceof Error ? error.message : String(error) }); }
}

const ingestionEnabled = !reportOnly && Boolean(url && serviceKey);
let ingestedCount = 0;
if (ingestionEnabled) {
  for (const result of results) {
    for (const lint of result.lints) {
      try { await ingest(result.kind, lint); ingestedCount += 1; }
      catch (error) { errors.push({ kind: result.kind, fingerprint: fingerprint(result.kind, lint), error: error instanceof Error ? error.message : String(error) }); }
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  report_only: reportOnly,
  ingestion_enabled: ingestionEnabled,
  finding_count: results.reduce((sum, result) => sum + result.lints.length, 0),
  ingested_count: ingestedCount,
  advisor_results: results,
  errors,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
