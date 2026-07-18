#!/usr/bin/env node
import fs from 'node:fs';
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
const terminationGraceMs = Number(
  process.env.CONTROL_ROOM_TERMINATION_GRACE_MS
  || process.env.CONTROL_ROOM_MISSION_TIMEOUT_GRACE_MS
  || 3_000,
);
const allowedMissions = new Set(['continue-yesterday', 'verify-local', 'verify-frontend', 'recover-system']);
const founderOperatorReportDir = path.join(root, 'reports', 'control-room', 'founder-operator');
const blockedPlanKeys = new Set([
  'transcript', 'journalentry', 'privatemessage', 'rawteencontent', 'rawparentcontent',
  'password', 'passphrase', 'token', 'accesstoken', 'refreshtoken', 'idtoken',
  'apikey', 'secret', 'clientsecret', 'servicerole', 'authorization', 'cookie',
  'session', 'otp', 'onetimecode', 'verificationcode',
]);
const founderOperatorModes = ['ultrathink', 'billgates-artifacts', 'elonmusk-execution'];
const founderOperatorLaneIds = new Set([
  'founder', 'codex', 'chatgpt', 'claude', 'deepseek', 'figma', 'canva',
  'supabase', 'cloudflare', 'github', 'playwright', 'gmail', 'local-agent',
]);
const founderOperatorArtifactKinds = new Set([
  'mission-brief', 'decision', 'architecture', 'code', 'design', 'data',
  'verification', 'release', 'communication', 'ledger',
]);
const founderOperatorArtifactStatuses = new Set([
  'planned', 'building', 'verification-required', 'human-required', 'verified',
]);
const founderOperatorPhaseStatuses = new Set(['planned', 'active', 'blocked', 'human-required', 'verified']);
const founderOperatorEvidenceLevels = new Set(['plan-only', 'local-evidence']);
const planKeys = new Set([
  'schemaVersion', 'id', 'createdAt', 'mission', 'constraints', 'modes', 'lanes',
  'phases', 'artifacts', 'approvalGates', 'nonClaims', 'evidenceLevel',
]);
const laneKeys = new Set(['id', 'label', 'purpose', 'authority']);
const artifactKeys = new Set([
  'id', 'title', 'kind', 'ownerLane', 'supportLanes', 'pathHint',
  'evidenceRequired', 'approvalGate', 'status', 'approvalRecordedAt',
]);
const phaseKeys = new Set([
  'id', 'title', 'objective', 'operatingQuestion', 'ownerLane', 'supportLanes',
  'artifactIds', 'safeMissionId', 'exitGate', 'status',
]);
const credentialPatterns = [
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9_-]{16,}/,
  /service_role/i,
  /Bearer\s+[A-Za-z0-9._-]{12,}/i,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/i,
];
let activeMission = null;
let activeChild = null;
let latestRun = null;

if (!token || token.length < 32) {
  throw new Error('CONTROL_ROOM_LOCAL_TOKEN must be an ephemeral token of at least 32 characters.');
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('CONTROL_ROOM_LOCAL_PORT must be a valid non-privileged port.');
}
if (!Number.isInteger(terminationGraceMs) || terminationGraceMs < 100 || terminationGraceMs > 60_000) {
  throw new Error('CONTROL_ROOM_TERMINATION_GRACE_MS must be between 100 and 60000 milliseconds.');
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

  if (process.platform === 'win32') {
    const args = ['/PID', String(child.pid), '/T'];
    if (signal === 'SIGKILL') args.push('/F');
    const result = spawnSync('taskkill', args, {
      stdio: 'ignore',
      windowsHide: true,
    });
    return result.status === 0;
  }

  try {
    process.kill(-child.pid, signal);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return true;
    console.error(`Unable to terminate mission process group ${child.pid}: ${error instanceof Error ? error.message : String(error)}`);
    try {
      return child.kill(signal);
    } catch {
      return false;
    }
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
    env: { ...process.env, CI: process.env.CI || 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  activeChild = child;
  let stdout = '';
  let stderr = '';
  let settled = false;
  let timedOut = false;
  let terminationEscalated = false;
  let timedOutPayload = null;
  let timeoutTimer = null;
  let forceKillTimer = null;
  child.stdout.on('data', chunk => { stdout = appendTail(stdout, chunk); });
  child.stderr.on('data', chunk => { stderr = appendTail(stderr, chunk); });

  const finish = (status, payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutTimer);
    clearTimeout(forceKillTimer);
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

  timeoutTimer = setTimeout(() => {
    timedOut = true;
    stderr = appendTail(stderr, `\nMission exceeded ${timeoutMs}ms; terminating the full process tree.\n`);
    terminateProcessTree(child, 'SIGTERM');
    forceKillTimer = setTimeout(() => {
      if (settled) return;
      stderr = appendTail(stderr, `\nMission process tree did not exit within ${terminationGraceMs}ms; escalating to forced termination.\n`);
      terminateProcessTree(child, 'SIGKILL');
      terminationEscalated = true;
      if (timedOutPayload) finish('timed_out', timedOutPayload);
    }, terminationGraceMs);
  }, timeoutMs);

  child.on('error', error => {
    if (!timedOut) return finish('failed', { exitCode: null, error: error.message });
    timedOutPayload = { exitCode: null, error: 'mission_timeout', termination: 'process_tree' };
    if (terminationEscalated) finish('timed_out', timedOutPayload);
  });
  child.on('close', (code, signal) => {
    if (!timedOut) return finish(code === 0 ? 'passed' : 'failed', { exitCode: code, signal });
    timedOutPayload = { exitCode: code, signal, error: 'mission_timeout', termination: 'process_tree' };
    if (terminationEscalated) finish('timed_out', timedOutPayload);
  });
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

function isPlainRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function requireExactKeys(value, allowedKeys, code) {
  if (!isPlainRecord(value)) throw new Error(code);
  if (Object.keys(value).some(key => !allowedKeys.has(key))) throw new Error(code);
}

function requireString(value, minLength, maxLength, code) {
  if (typeof value !== 'string' || value.length < minLength || value.length > maxLength) throw new Error(code);
}

function requireStringArray(value, minLength, maxLength, itemMaxLength, code) {
  if (!Array.isArray(value) || value.length < minLength || value.length > maxLength) throw new Error(code);
  for (const item of value) requireString(item, 1, itemMaxLength, code);
}

function requireIsoDate(value, code) {
  requireString(value, 20, 40, code);
  if (Number.isNaN(Date.parse(value))) throw new Error(code);
}

function requireLaneId(value, declaredLanes, code) {
  if (!founderOperatorLaneIds.has(value) || !declaredLanes.has(value)) throw new Error(code);
}

function containsBlockedPlanKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsBlockedPlanKey);
  return Object.entries(value).some(([key, nested]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return blockedPlanKeys.has(normalizedKey) || containsBlockedPlanKey(nested);
  });
}

function validateFounderOperatorPlan(plan) {
  requireExactKeys(plan, planKeys, 'invalid_plan_schema');
  if (plan.schemaVersion !== 1) throw new Error('invalid_plan_schema');
  if (typeof plan.id !== 'string' || !/^[a-z0-9-]{8,120}$/.test(plan.id)) throw new Error('invalid_plan_id');
  requireIsoDate(plan.createdAt, 'invalid_plan_created_at');
  requireString(plan.mission, 8, 2_000, 'invalid_plan_mission');
  requireString(plan.constraints, 0, 2_000, 'invalid_plan_constraints');
  if (!Array.isArray(plan.modes)
    || plan.modes.length !== founderOperatorModes.length
    || plan.modes.some((mode, index) => mode !== founderOperatorModes[index])) {
    throw new Error('invalid_plan_modes');
  }
  if (!Array.isArray(plan.lanes) || plan.lanes.length < 1 || plan.lanes.length > founderOperatorLaneIds.size) {
    throw new Error('invalid_plan_lanes');
  }
  const declaredLanes = new Set();
  for (const lane of plan.lanes) {
    requireExactKeys(lane, laneKeys, 'invalid_plan_lane');
    if (!founderOperatorLaneIds.has(lane.id) || declaredLanes.has(lane.id)) throw new Error('invalid_plan_lane');
    requireString(lane.label, 1, 80, 'invalid_plan_lane');
    requireString(lane.purpose, 8, 500, 'invalid_plan_lane');
    if (!['decision', 'execution', 'advisory', 'evidence'].includes(lane.authority)) throw new Error('invalid_plan_lane');
    declaredLanes.add(lane.id);
  }
  if (!Array.isArray(plan.phases) || plan.phases.length < 4 || plan.phases.length > 12) throw new Error('invalid_plan_phases');
  if (!Array.isArray(plan.artifacts) || plan.artifacts.length < 4 || plan.artifacts.length > 40) throw new Error('invalid_plan_artifacts');
  if (containsBlockedPlanKey(plan)) throw new Error('private_or_secret_plan_field');
  const serialized = JSON.stringify(plan);
  if (credentialPatterns.some(pattern => pattern.test(serialized))) {
    throw new Error('credential_shaped_content_rejected');
  }
  const artifactIds = new Set();
  const artifactById = new Map();
  const expectedPathPrefix = `reports/control-room/founder-operator/${plan.id}/`;
  for (const artifact of plan.artifacts) {
    requireExactKeys(artifact, artifactKeys, 'invalid_plan_artifact');
    if (typeof artifact.id !== 'string' || !/^[a-z0-9-]{2,120}$/.test(artifact.id) || artifactIds.has(artifact.id)) {
      throw new Error('invalid_plan_artifact_id');
    }
    artifactIds.add(artifact.id);
    artifactById.set(artifact.id, artifact);
    requireString(artifact.title, 3, 200, 'invalid_plan_artifact');
    if (!founderOperatorArtifactKinds.has(artifact.kind)) throw new Error('invalid_plan_artifact');
    requireLaneId(artifact.ownerLane, declaredLanes, 'invalid_plan_artifact_lane');
    requireStringArray(artifact.supportLanes, 0, founderOperatorLaneIds.size, 40, 'invalid_plan_artifact_lanes');
    if (new Set(artifact.supportLanes).size !== artifact.supportLanes.length) throw new Error('invalid_plan_artifact_lanes');
    artifact.supportLanes.forEach(lane => requireLaneId(lane, declaredLanes, 'invalid_plan_artifact_lanes'));
    requireString(artifact.pathHint, expectedPathPrefix.length + 1, 500, 'invalid_plan_artifact_path');
    if (!artifact.pathHint.startsWith(expectedPathPrefix)
      || artifact.pathHint.includes('\\')
      || artifact.pathHint.split('/').includes('..')
      || path.posix.normalize(artifact.pathHint) !== artifact.pathHint) {
      throw new Error('invalid_plan_artifact_path');
    }
    requireStringArray(artifact.evidenceRequired, 1, 16, 500, 'invalid_plan_artifact_evidence');
    if (!founderOperatorArtifactStatuses.has(artifact.status)) throw new Error('invalid_plan_artifact_status');
    if (artifact.approvalGate !== undefined) requireString(artifact.approvalGate, 8, 1_000, 'invalid_plan_approval_gate');
    if (artifact.approvalGate && artifact.status === 'verified') throw new Error('external_action_evidence_required');
    if (artifact.status === 'human-required' && !artifact.approvalGate) throw new Error('invalid_plan_approval_gate');
    if (artifact.approvalRecordedAt !== undefined) {
      if (!artifact.approvalGate || artifact.status !== 'human-required') throw new Error('invalid_plan_approval_record');
      requireIsoDate(artifact.approvalRecordedAt, 'invalid_plan_approval_record');
    }
  }
  const phaseIds = new Set();
  for (const phase of plan.phases) {
    requireExactKeys(phase, phaseKeys, 'invalid_plan_phase');
    if (typeof phase.id !== 'string' || !/^[a-z0-9-]{2,120}$/.test(phase.id) || phaseIds.has(phase.id)) {
      throw new Error('invalid_plan_phase_id');
    }
    phaseIds.add(phase.id);
    requireString(phase.title, 3, 200, 'invalid_plan_phase');
    requireString(phase.objective, 8, 1_000, 'invalid_plan_phase');
    requireString(phase.operatingQuestion, 8, 1_000, 'invalid_plan_phase');
    requireLaneId(phase.ownerLane, declaredLanes, 'invalid_plan_phase_lane');
    requireStringArray(phase.supportLanes, 0, founderOperatorLaneIds.size, 40, 'invalid_plan_phase_lanes');
    if (new Set(phase.supportLanes).size !== phase.supportLanes.length) throw new Error('invalid_plan_phase_lanes');
    phase.supportLanes.forEach(lane => requireLaneId(lane, declaredLanes, 'invalid_plan_phase_lanes'));
    requireStringArray(phase.artifactIds, 0, 40, 120, 'invalid_plan_phase_artifacts');
    if (new Set(phase.artifactIds).size !== phase.artifactIds.length
      || phase.artifactIds.some(id => !artifactById.has(id))) throw new Error('invalid_plan_phase_artifacts');
    if (phase.safeMissionId !== undefined && !allowedMissions.has(phase.safeMissionId)) throw new Error('invalid_plan_safe_mission');
    requireString(phase.exitGate, 8, 1_000, 'invalid_plan_phase');
    if (!founderOperatorPhaseStatuses.has(phase.status)) throw new Error('invalid_plan_phase_status');
    if (phase.status === 'verified' && phase.artifactIds.some(id => artifactById.get(id)?.approvalGate)) {
      throw new Error('external_action_evidence_required');
    }
  }
  requireStringArray(plan.approvalGates, 1, 20, 1_000, 'invalid_plan_approval_gates');
  requireStringArray(plan.nonClaims, 1, 20, 1_000, 'invalid_plan_non_claims');
  if (!founderOperatorEvidenceLevels.has(plan.evidenceLevel)) throw new Error('unverified_evidence_level');
  return plan;
}

function ensureFounderOperatorReportDirectory() {
  let current = root;
  for (const segment of ['reports', 'control-room', 'founder-operator']) {
    const candidate = path.join(current, segment);
    try {
      const stat = fs.lstatSync(candidate);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('unsafe_report_directory');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      try {
        fs.mkdirSync(candidate);
      } catch (mkdirError) {
        if (mkdirError?.code !== 'EEXIST') throw mkdirError;
      }
      const stat = fs.lstatSync(candidate);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('unsafe_report_directory');
    }
    current = candidate;
  }
  if (current !== founderOperatorReportDir) throw new Error('unsafe_report_directory');
  return current;
}

function assertSafeLatestPath(latestPath) {
  try {
    const stat = fs.lstatSync(latestPath);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('unsafe_latest_path');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

function persistFounderOperatorPlan(plan) {
  const reportDir = ensureFounderOperatorReportDirectory();
  const latestPath = path.join(founderOperatorReportDir, 'latest.json');
  assertSafeLatestPath(latestPath);
  const content = `${JSON.stringify(plan, null, 2)}\n`;
  let reportPath = null;
  for (let version = 1; version <= 10_000; version += 1) {
    const suffix = version === 1 ? '' : `-v${version}`;
    const candidate = path.join(reportDir, `${plan.id}${suffix}.json`);
    try {
      fs.writeFileSync(candidate, content, { flag: 'wx' });
      reportPath = candidate;
      break;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
    }
  }
  if (!reportPath) throw new Error('persistence_version_limit');
  const latestTempPath = path.join(reportDir, `.latest-${plan.id}-${process.pid}-${Date.now()}.tmp`);
  try {
    fs.writeFileSync(latestTempPath, content, { flag: 'wx' });
    fs.renameSync(latestTempPath, latestPath);
  } catch (error) {
    try {
      fs.unlinkSync(latestTempPath);
    } catch (cleanupError) {
      if (cleanupError?.code !== 'ENOENT') console.error('Unable to clean Founder Operator latest snapshot temp file.');
    }
    throw error;
  }
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
      const status = message === 'request_body_too_large'
        ? 413
        : /^(?:unsafe_|persistence_)/.test(message) ? 500 : 400;
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
  if (activeChild) terminateProcessTree(activeChild, 'SIGKILL');
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
