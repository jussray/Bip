#!/usr/bin/env node
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
const timeoutGraceMs = Number(process.env.CONTROL_ROOM_MISSION_TIMEOUT_GRACE_MS || 5_000);
const allowedMissions = new Set(['continue-yesterday', 'verify-local', 'verify-frontend', 'recover-system']);
let activeMission = null;
let activeChild = null;
let latestRun = null;

if (!token || token.length < 32) {
  throw new Error('CONTROL_ROOM_LOCAL_TOKEN must be an ephemeral token of at least 32 characters.');
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('CONTROL_ROOM_LOCAL_PORT must be a valid non-privileged port.');
}
if (!Number.isInteger(timeoutGraceMs) || timeoutGraceMs < 250 || timeoutGraceMs > 30_000) {
  throw new Error('CONTROL_ROOM_MISSION_TIMEOUT_GRACE_MS must be between 250 and 30000 milliseconds.');
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

function terminateProcessTree(child, signal) {
  if (!child?.pid) return false;
  try {
    if (process.platform === 'win32') {
      const args = ['/pid', String(child.pid), '/T'];
      if (signal === 'SIGKILL') args.push('/F');
      const killer = spawn('taskkill', args, { windowsHide: true, stdio: 'ignore' });
      killer.unref();
      return true;
    }
    process.kill(-child.pid, signal);
    return true;
  } catch (error) {
    if (error?.code !== 'ESRCH') {
      try {
        return child.kill(signal);
      } catch {
        return false;
      }
    }
    return true;
  }
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
    detached: process.platform !== 'win32',
    env: { ...process.env, CI: process.env.CI || 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeChild = child;
  let stdout = '';
  let stderr = '';
  let settled = false;
  let timedOut = false;
  let escalationTimer = null;
  child.stdout.on('data', chunk => { stdout = appendTail(stdout, chunk); });
  child.stderr.on('data', chunk => { stderr = appendTail(stderr, chunk); });

  const finish = (status, payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (escalationTimer) clearTimeout(escalationTimer);
    activeMission = null;
    activeChild = null;
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
    timedOut = true;
    stderr = appendTail(stderr, `\nMission exceeded ${timeoutMs}ms; terminating the full process tree.\n`);
    terminateProcessTree(child, 'SIGTERM');
    escalationTimer = setTimeout(() => {
      stderr = appendTail(stderr, `\nMission process tree did not exit within ${timeoutGraceMs}ms; escalating to SIGKILL.\n`);
      terminateProcessTree(child, 'SIGKILL');
    }, timeoutGraceMs);
  }, timeoutMs);

  child.on('error', error => finish(timedOut ? 'timed_out' : 'failed', {
    exitCode: null,
    error: timedOut ? 'mission_timeout' : error.message,
  }));
  child.on('close', code => finish(timedOut ? 'timed_out' : code === 0 ? 'passed' : 'failed', {
    exitCode: code,
    ...(timedOut ? { error: 'mission_timeout' } : {}),
  }));
}

const server = createServer((req, res) => {
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

  const match = /^\/missions\/([a-z0-9-]+)$/.exec(url.pathname);
  if (req.method === 'POST' && match) return executeMission(match[1], req, res, origin);
  return writeJson(res, 404, { error: 'not_found' }, origin);
});

server.listen(port, host, () => {
  console.log(`Control Room local agent ready at http://${host}:${port}`);
  console.log('Loopback-only. Only allowlisted missions can run.');
});

function shutdown() {
  if (activeChild) terminateProcessTree(activeChild, 'SIGKILL');
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
