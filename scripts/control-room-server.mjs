#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = '127.0.0.1';
const port = Number(process.env.CONTROL_ROOM_LOCAL_PORT || 4317);
const token = String(process.env.CONTROL_ROOM_LOCAL_TOKEN || '');
const timeoutMs = Number(process.env.CONTROL_ROOM_MISSION_TIMEOUT_MS || 10 * 60 * 1000);
const allowedMissions = new Set(['continue-yesterday', 'verify-local', 'verify-frontend', 'recover-system']);
const founderOperatorReportDir = path.join(root, 'reports', 'control-room', 'founder-operator');
const blockedPlanKeys = new Set(['transcript', 'journalEntry', 'privateMessage', 'rawTeenContent', 'rawParentContent', 'password', 'token', 'secret']);
let activeMission = null;
let latestRun = null;

if (!token || token.length < 32) {
  throw new Error('CONTROL_ROOM_LOCAL_TOKEN must be an ephemeral token of at least 32 characters.');
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('CONTROL_ROOM_LOCAL_PORT must be a valid non-privileged port.');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function isLocalOrigin(origin) {
  if (!origin) return true;
  try {
    const value = new URL(origin);
    return value.protocol === 'http:' && (value.hostname === '127.0.0.1' || value.hostname === 'localhost');
  } catch {
    return false;
  }
}

function writeJson(res, status, body, origin = '') {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (isLocalOrigin(origin) && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function authorize(req) {
  const match = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ''));
  return Boolean(match && safeEqual(match[1], token));
}

function appendTail(current, chunk) {
  return (current + chunk.toString('utf8')).slice(-64_000);
}

function executeMission(missionId, req, res, origin) {
  if (!allowedMissions.has(missionId)) {
    return writeJson(res, 403, { error: 'mission_not_allowed', missionId }, origin);
  }
  if (activeMission) {
    return writeJson(res, 409, { error: 'mission_already_running', missionId: activeMission }, origin);
  }

  activeMission = missionId;
  const startedAt = Date.now();
  const child = spawn(process.execPath, ['scripts/control-room-agent.mjs', missionId], {
    cwd: root,
    env: { ...process.env, CI: process.env.CI || 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let settled = false;
  child.stdout.on('data', chunk => { stdout = appendTail(stdout, chunk); });
  child.stderr.on('data', chunk => { stderr = appendTail(stderr, chunk); });

  const finish = (status, payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    activeMission = null;
    latestRun = {
      missionId,
      status,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      stdout,
      stderr,
      ...payload,
    };
    if (!res.writableEnded) writeJson(res, status === 'passed' ? 200 : 500, latestRun, origin);
  };

  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    finish('timed_out', { exitCode: null, error: 'mission_timeout' });
  }, timeoutMs);

  child.on('error', error => finish('failed', { exitCode: null, error: error.message }));
  child.on('close', code => finish(code === 0 ? 'passed' : 'failed', { exitCode: code }));
}

function readJsonBody(req, maxBytes = 96_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > maxBytes) reject(new Error('request_body_too_large'));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function containsBlockedPlanKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsBlockedPlanKey);
  return Object.entries(value).some(([key, nested]) => blockedPlanKeys.has(key) || containsBlockedPlanKey(nested));
}

function validateFounderOperatorPlan(plan) {
  if (!plan || plan.schemaVersion !== 1) throw new Error('invalid_plan_schema');
  if (typeof plan.id !== 'string' || !/^[a-z0-9-]{8,120}$/.test(plan.id)) throw new Error('invalid_plan_id');
  if (typeof plan.mission !== 'string' || plan.mission.length < 8 || plan.mission.length > 2_000) throw new Error('invalid_plan_mission');
  if (!Array.isArray(plan.phases) || plan.phases.length < 4 || plan.phases.length > 12) throw new Error('invalid_plan_phases');
  if (!Array.isArray(plan.artifacts) || plan.artifacts.length < 4 || plan.artifacts.length > 40) throw new Error('invalid_plan_artifacts');
  if (containsBlockedPlanKey(plan)) throw new Error('private_or_secret_plan_field');
  const serialized = JSON.stringify(plan);
  if (/(?:ghp_|github_pat_|sk-[A-Za-z0-9]|service_role|Bearer\s+[A-Za-z0-9._-]{12,})/i.test(serialized)) {
    throw new Error('credential_shaped_content_rejected');
  }
  return plan;
}

function persistFounderOperatorPlan(plan) {
  fs.mkdirSync(founderOperatorReportDir, { recursive: true });
  let reportPath = path.join(founderOperatorReportDir, `${plan.id}.json`);
  let version = 2;
  while (fs.existsSync(reportPath)) {
    reportPath = path.join(founderOperatorReportDir, `${plan.id}-v${version}.json`);
    version += 1;
  }
  const latestPath = path.join(founderOperatorReportDir, 'latest.json');
  const content = `${JSON.stringify(plan, null, 2)}\n`;
  fs.writeFileSync(reportPath, content, { flag: 'wx' });
  fs.writeFileSync(latestPath, content);
  return {
    ok: true,
    planId: plan.id,
    reportPath: path.relative(root, reportPath),
    latestPath: path.relative(root, latestPath),
  };
}

const server = createServer(async (req, res) => {
  const origin = String(req.headers.origin || '');
  if (!isLocalOrigin(origin)) return writeJson(res, 403, { error: 'origin_not_allowed' });

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '300',
      Vary: 'Origin',
    });
    return res.end();
  }

  if (!authorize(req)) return writeJson(res, 401, { error: 'unauthorized' }, origin);
  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return writeJson(res, 200, {
      ok: true,
      mode: 'loopback-only',
      activeMission,
      allowedMissions: [...allowedMissions],
      latestRun,
    }, origin);
  }
  if (req.method === 'GET' && url.pathname === '/runs/latest') {
    return writeJson(res, 200, { latestRun }, origin);
  }
  if (req.method === 'POST' && url.pathname === '/founder-operator/plans') {
    try {
      const plan = validateFounderOperatorPlan(await readJsonBody(req));
      return writeJson(res, 201, persistFounderOperatorPlan(plan), origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'founder_operator_plan_rejected';
      const status = message === 'request_body_too_large' ? 413 : 400;
      return writeJson(res, status, { error: message }, origin);
    }
  }

  const match = /^\/missions\/([a-z0-9-]+)$/.exec(url.pathname);
  if (req.method === 'POST' && match) return executeMission(match[1], req, res, origin);
  return writeJson(res, 404, { error: 'not_found' }, origin);
});

server.listen(port, host, () => {
  console.log(`Control Room local agent ready at http://${host}:${port}`);
  console.log('Loopback-only. Only allowlisted missions and fixed Founder Operator plan persistence can run.');
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
