import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function reservePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : null;
  await new Promise(resolve => probe.close(resolve));
  if (!port) throw new Error('Unable to reserve a loopback port.');
  return port;
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitFor(check, timeoutMs = 4_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for process state.');
}

test('timed-out missions kill descendants before the server accepts another mission', {
  skip: process.platform === 'win32' ? 'POSIX process-group integration; Windows is guarded by taskkill /T source contracts.' : false,
  timeout: 20_000,
}, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bip-control-room-tree-'));
  const pidFile = path.join(tempDir, 'pids.json');
  const npmShim = path.join(tempDir, 'npm');
  const token = 't'.repeat(32);
  const port = await reservePort();
  let fixturePids = [];

  fs.writeFileSync(npmShim, `#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const descendant = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'ignore' });
fs.writeFileSync(process.env.CONTROL_ROOM_DESCENDANT_PID_FILE, JSON.stringify({ shim: process.pid, descendant: descendant.pid }));
setInterval(() => {}, 1000);
`);
  fs.chmodSync(npmShim, 0o755);

  const server = spawn(process.execPath, ['scripts/control-room-server.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${tempDir}${path.delimiter}${process.env.PATH || ''}`,
      CONTROL_ROOM_LOCAL_TOKEN: token,
      CONTROL_ROOM_LOCAL_PORT: String(port),
      CONTROL_ROOM_MISSION_TIMEOUT_MS: '120',
      CONTROL_ROOM_TERMINATION_GRACE_MS: '500',
      CONTROL_ROOM_DESCENDANT_PID_FILE: pidFile,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    server.stdout.setEncoding('utf8');
    server.stderr.setEncoding('utf8');
    let serverOutput = '';
    let serverError = '';
    server.stdout.on('data', chunk => {
      serverOutput += chunk;
    });
    server.stderr.on('data', chunk => {
      serverError += chunk;
    });
    await waitFor(() => serverOutput.includes('Control Room local agent ready'));

    let missionError = null;
    const responsePromise = fetch(`http://127.0.0.1:${port}/missions/verify-local`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: `http://127.0.0.1:${port}`,
      },
    }).catch(error => {
      missionError = error;
      return null;
    });
    await waitFor(() => fs.existsSync(pidFile) || missionError || server.exitCode !== null, 8_000);
    if (!fs.existsSync(pidFile)) {
      throw new Error(`Mission fixture did not start. server=${server.exitCode} fetch=${missionError?.message || 'pending'} stderr=${serverError}`);
    }
    await new Promise(resolve => setTimeout(resolve, 180));

    const overlappingResponse = await fetch(`http://127.0.0.1:${port}/missions/verify-local`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: `http://127.0.0.1:${port}`,
      },
    });
    assert.equal(overlappingResponse.status, 409);
    assert.equal((await overlappingResponse.json()).error, 'mission_already_running');

    const response = await responsePromise;
    assert.ok(response);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.status, 'timed_out');
    assert.equal(body.error, 'mission_timeout');
    assert.equal(body.termination, 'process_tree');

    const fixture = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
    fixturePids = [fixture.shim, fixture.descendant];
    await waitFor(() => fixturePids.every(pid => !processExists(pid)));

    const health = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: `http://127.0.0.1:${port}`,
      },
    });
    assert.equal(health.status, 200);
    assert.equal((await health.json()).activeMission, null);
  } finally {
    if (fixturePids.length === 0 && fs.existsSync(pidFile)) {
      const fixture = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
      fixturePids = [fixture.shim, fixture.descendant];
    }
    for (const pid of fixturePids) {
      if (processExists(pid)) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch (error) {
          if (error?.code !== 'ESRCH') throw error;
        }
      }
    }
    server.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => server.once('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 1_000)),
    ]);
    if (server.exitCode === null) server.kill('SIGKILL');
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('server shutdown kills the active detached mission tree', {
  skip: process.platform === 'win32' ? 'POSIX process-group integration; Windows is guarded by taskkill /T source contracts.' : false,
  timeout: 20_000,
}, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bip-control-room-shutdown-tree-'));
  const pidFile = path.join(tempDir, 'pids.json');
  const npmShim = path.join(tempDir, 'npm');
  const token = 's'.repeat(32);
  const port = await reservePort();
  let fixturePids = [];

  fs.writeFileSync(npmShim, `#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const descendant = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'ignore' });
fs.writeFileSync(process.env.CONTROL_ROOM_DESCENDANT_PID_FILE, JSON.stringify({ shim: process.pid, descendant: descendant.pid }));
process.on('SIGTERM', () => {});
setInterval(() => {}, 1000);
`);
  fs.chmodSync(npmShim, 0o755);

  const server = spawn(process.execPath, ['scripts/control-room-server.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${tempDir}${path.delimiter}${process.env.PATH || ''}`,
      CONTROL_ROOM_LOCAL_TOKEN: token,
      CONTROL_ROOM_LOCAL_PORT: String(port),
      CONTROL_ROOM_MISSION_TIMEOUT_MS: '10000',
      CONTROL_ROOM_DESCENDANT_PID_FILE: pidFile,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    server.stdout.setEncoding('utf8');
    let serverOutput = '';
    server.stdout.on('data', chunk => { serverOutput += chunk; });
    await waitFor(() => serverOutput.includes('Control Room local agent ready'));

    const missionResponse = fetch(`http://127.0.0.1:${port}/missions/verify-local`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: `http://127.0.0.1:${port}`,
      },
    }).catch(() => null);
    await waitFor(() => fs.existsSync(pidFile));
    const fixture = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
    fixturePids = [fixture.shim, fixture.descendant];

    server.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => server.once('exit', resolve)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Server did not shut down.')), 8_000)),
    ]);
    await missionResponse;
    await waitFor(() => fixturePids.every(pid => !processExists(pid)));
  } finally {
    if (fixturePids.length === 0 && fs.existsSync(pidFile)) {
      const fixture = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
      fixturePids = [fixture.shim, fixture.descendant];
    }
    for (const pid of fixturePids) {
      if (processExists(pid)) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch (error) {
          if (error?.code !== 'ESRCH') throw error;
        }
      }
    }
    if (server.exitCode === null) server.kill('SIGKILL');
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
