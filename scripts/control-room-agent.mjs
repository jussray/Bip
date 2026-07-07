#!/usr/bin/env node

import http from 'node:http';
import { spawn } from 'node:child_process';

const host = process.env.CONTROL_ROOM_AGENT_HOST || '127.0.0.1';
const port = Number(process.env.CONTROL_ROOM_AGENT_PORT || 4317);
const token = process.env.CONTROL_ROOM_AGENT_TOKEN || '';
const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(host);

if (!isLoopback && !token) {
  console.error('Refusing to bind Control Room agent beyond loopback without CONTROL_ROOM_AGENT_TOKEN.');
  process.exit(1);
}

let child = null;
let mission = {
  status: 'idle',
  pid: null,
  startedAt: null,
  stoppedAt: null,
  exitCode: null,
  logs: [],
};

function addLog(line) {
  if (!line) return;
  mission.logs.push(String(line).slice(0, 1000));
  mission.logs = mission.logs.slice(-80);
}

function snapshot() {
  return {
    ok: true,
    agent: {
      name: 'control-room-agent',
      version: '0.1.0',
      host,
      port,
    },
    launchBip: { ...mission },
  };
}

function authorized(req) {
  if (!token) return isLoopback;
  return req.headers.authorization === `Bearer ${token}`;
}

function send(res, statusCode, body) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  });
  res.end(json);
}

function startExpo() {
  if (child && mission.status === 'running') return snapshot();

  mission = {
    status: 'starting',
    pid: null,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    exitCode: null,
    logs: [],
  };

  child = spawn('npx', ['expo', 'start', '--tunnel'], {
    cwd: process.cwd(),
    env: { ...process.env, CI: '0' },
    shell: process.platform === 'win32',
  });

  mission.pid = child.pid || null;
  mission.status = 'running';

  child.stdout?.on('data', (chunk) => {
    for (const line of String(chunk).split('\n')) addLog(line.trim());
  });
  child.stderr?.on('data', (chunk) => {
    for (const line of String(chunk).split('\n')) addLog(line.trim());
  });
  child.on('error', (error) => {
    mission.status = 'failed';
    addLog(error.message);
  });
  child.on('exit', (code) => {
    mission.status = code === 0 ? 'stopped' : 'failed';
    mission.exitCode = code;
    mission.stoppedAt = new Date().toISOString();
    mission.pid = null;
    child = null;
  });

  return snapshot();
}

function stopExpo() {
  if (child) {
    child.kill('SIGTERM');
    mission.status = 'stopped';
    mission.stoppedAt = new Date().toISOString();
    mission.pid = null;
    child = null;
  }
  return snapshot();
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (!authorized(req)) return send(res, 401, { ok: false, error: 'Unauthorized' });

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, snapshot());
  }

  if (req.method === 'POST' && req.url === '/missions/launch-bip') {
    return send(res, 200, startExpo());
  }

  if (req.method === 'POST' && req.url === '/missions/launch-bip/stop') {
    return send(res, 200, stopExpo());
  }

  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(port, host, () => {
  console.log(`Control Room agent listening on http://${host}:${port}`);
  console.log('Mission available: Launch Bip');
});

function shutdown() {
  if (child) child.kill('SIGTERM');
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
