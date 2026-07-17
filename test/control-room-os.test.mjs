import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const config = fs.readFileSync('src/config/controlRoomOs.ts', 'utf8');
const agent = fs.readFileSync('scripts/control-room-agent.mjs', 'utf8');
const localRunner = fs.readFileSync('scripts/control-room-local.js', 'utf8');
const verificationRegistry = JSON.parse(fs.readFileSync('src/config/controlRoomVerificationRegistry.json', 'utf8'));
const placement = fs.readFileSync('src/config/controlRoomPlacement.ts', 'utf8');
const workspace = fs.readFileSync('src/screens/DevControlRoomWorkspace.tsx', 'utf8');
const deepseekContract = fs.readFileSync('DeepSeek/deepseek-chat.md', 'utf8');


test('Control Room OS defines founder-first V1 missions inside the existing workspace', () => {
  for (const mission of ['launch-bip', 'continue-yesterday', 'verify-local', 'verify-frontend', 'ship-release', 'recover-system']) {
    assert.match(config, new RegExp(`id: '${mission}'`));
  }
  assert.match(workspace, /MISSION FIRST/);
  assert.match(workspace, /tab==='missions'/);
  assert.match(workspace, /tab==='operations'/);
});


test('local agent exposes only allowlisted missions and no arbitrary shell passthrough', () => {
  assert.match(agent, /Allowed missions only/);
  assert.match(agent, /new Map\(/);
  assert.match(agent, /control-room-verify-frontend\.mjs/);
  assert.doesNotMatch(agent, /process\.argv\.slice\(2\).*spawnSync/s);
  assert.match(agent, /Unknown or disallowed mission/);
});


test('connector and worker registries preserve fallbacks for provider failure', () => {
  for (const connector of ['github', 'supabase', 'expo', 'gmail', 'filesystem', 'playwright']) {
    assert.match(config, new RegExp(`id: '${connector}'`));
  }
  for (const worker of ['codex', 'chatgpt', 'claude', 'deepseek', 'local-agent']) {
    assert.match(config, new RegExp(`id: '${worker}'`));
  }
  assert.match(config, /browser-test/);
  assert.match(config, /fallback:/);
  assert.match(config, /sekretbip@gmail.com/);
});


test('verification registry stays owned by Control Room config, not agent-local duplicates', () => {
  assert.equal(verificationRegistry.owner, 'Control Room');
  assert.ok(verificationRegistry.checks.length >= 10);
  for (const check of verificationRegistry.checks) {
    assert.equal(typeof check.id, 'string');
    assert.equal(typeof check.command, 'string');
    assert.ok(Array.isArray(check.args));
  }
  assert.match(localRunner, /controlRoomVerificationRegistry\.json/);
  assert.match(localRunner, /path\.resolve\(__dirname, '\.\.'\)/);
  assert.match(placement, /\.agents\/verification-registry\.json/);
});


test('DeepSeek is founder-only advisory capability with a fail-closed live adapter boundary', () => {
  assert.match(config, /id: 'deepseek'/);
  assert.match(config, /fallbackWorkerId: 'codex'/);
  assert.match(deepseekContract, /founder-only/i);
  assert.match(deepseekContract, /advisory-only/i);
  assert.match(deepseekContract, /must not receive raw teen content/i);
  assert.match(deepseekContract, /server-side adapter/i);
  assert.match(deepseekContract, /not implemented/i);
  assert.match(deepseekContract, /must never store information about minors/i);
  assert.match(deepseekContract, /Instruction memory is not teen continuity memory/i);
  assert.match(deepseekContract, /None of these capabilities are available merely because/i);
});
