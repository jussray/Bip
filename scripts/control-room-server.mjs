#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = '127.0.0.1';
const port = Number(process.env.CONTROL_ROOM_LOCAL_PORT || 4317);
const token = String(process.env.CONTROL_ROOM_LOCAL_TOKEN || '');
const timeoutMs = Number(process.env.CONTROL_ROOM_MISSION_TIMEOUT_MS || 10 * 60 * 1000);
const terminationGraceMs = Number(process.env.CONTROL_ROOM_TERMINATION_GRACE_MS || 3_000);
const allowedMissions = new Set(['continue-yesterday', 'verify-local', 'verify-frontend', 'recover-system']);
let activeMission = null;
let activeChild = null;
let latestRun = null;

if (token.length < 32) throw new Error('CONTROL_ROOM_LOCAL_TOKEN must be an ephemeral token of at least 32 characters.');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('CONTROL_ROOM_LOCAL_PORT must be a valid non-privileged port.');
if (!Number.isInteger(timeoutMs) || timeoutMs < 100) throw new Error('CONTROL_ROOM_MISSION_TIMEOUT_MS must be at least 100 milliseconds.');
if (!Number.isInteger(terminationGraceMs) || terminationGraceMs < 100 || terminationGraceMs > 60_000) {
  throw new Error('CONTROL_ROOM_TERMINATION_GRACE_MS must be between 100 and 60000 milliseconds.');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function bearerToken(header) {
  const value = String(header || '');
  const prefix = 'Bearer ';
  return value.startsWith(prefix) ? value.slice(prefix.length) : '';
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
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function authorize(req) {
  return safeEqual(bearerToken(req.headers.authorization), token);
}

function appendTail(current, chunk) {
  return (current + chunk.toString('utf8')).slice(-64_000);
}

function terminateProcessTree(child, signal) {
  if (!child?.pid) return false;
  if (process.platform === 'win32') {
    const args = ['/PID', String(child.pid), '/T'];
    if (signal === 'SIGKILL') args.push('/F');
    return spawnSync('taskkill', args, { stdio: 'ignore', windowsHide: true }).status === 0;
  }
  try {
    process.kill(-child.pid, signal);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return true;
    try {
      return child.kill(signal);
    } catch {
      return false;
    }
  }
}

function processTreeAlive(pid) {
  if (!pid) return false;
  if (process.platform === 'win32') return Boolean(activeChild && activeChild.exitCode == null);
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    return error?.code !== 'ESRCH';
  }
}

function executeMission(missionId, res, origin) {
  if (!allowedMissions.has(missionId)) return writeJson(res, 403, { error: 'mission_not_allowed', missionId }, origin);
  if (activeMission) return writeJson(res, 409, { error: 'mission_already_running', missionId: activeMission }, origin);

  activeMission = missionId;
  const startedAt = Date.now();
  const child = spawn(process.execPath, ['scripts/control-room-agent.mjs', missionId], {
    cwd: root,
    env: { ...process.env, CI: process.env.CI || 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  activeChild = child;
  const processGroupId = child.pid;
  let stdout = '';
  let stderr = '';
  let settled = false;
  let timedOut = false;
  let closePayload = { exitCode: null, signal: null };
  let timeoutTimer = null;
  let forceKillTimer = null;
  let treePollTimer = null;

  child.stdout.on('data', chunk => { stdout = appendTail(stdout, chunk); });
  child.stderr.on('data', chunk => { stderr = appendTail(stderr, chunk); });

  const finish = (status, payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutTimer);
    clearTimeout(forceKillTimer);
    clearTimeout(treePollTimer);
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

  const finishWhenTreeStops = () => {
    if (settled) return;
    if (!processTreeAlive(processGroupId)) {
      finish('timed_out', { ...closePayload, error: 'mission_timeout', termination: 'process_tree' });
      return;
    }
    treePollTimer = setTimeout(finishWhenTreeStops, 40);
  };

  timeoutTimer = setTimeout(() => {
    timedOut = true;
    stderr = appendTail(stderr, `\nMission exceeded ${timeoutMs}ms; terminating the full process tree.\n`);
    terminateProcessTree(child, 'SIGTERM');
    finishWhenTreeStops();
    forceKillTimer = setTimeout(() => {
      if (settled || !processTreeAlive(processGroupId)) return;
      stderr = appendTail(stderr, `\nMission process tree did not exit within ${terminationGraceMs}ms; escalating to forced termination.\n`);
      terminateProcessTree(child, 'SIGKILL');
    }, terminationGraceMs);
  }, timeoutMs);

  child.on('error', error => {
    if (!timedOut) finish('failed', { exitCode: null, signal: null, error: error.message });
    else closePayload = { exitCode: null, signal: null };
  });
  child.on('close', (code, signal) => {
    closePayload = { exitCode: code, signal };
    if (!timedOut) finish(code === 0 ? 'passed' : 'failed', closePayload);
    else finishWhenTreeStops();
  });
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
  if (req.method === 'GET' && url.pathname === '/runs/latest') return writeJson(res, 200, { latestRun }, origin);

  const match = /^\/missions\/([a-z0-9-]+)$/.exec(url.pathname);
  if (req.method === 'POST' && match) return executeMission(match[1], res, origin);
  return writeJson(res, 404, { error: 'not_found' }, origin);
});

server.listen(port, host, () => {
  console.log(`Control Room local agent ready at http://${host}:${port}`);
  console.log('Loopback-only. Only fixed, allowlisted missions can run.');
});

function shutdown() {
  if (activeChild) terminateProcessTree(activeChild, 'SIGTERM');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1_000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
