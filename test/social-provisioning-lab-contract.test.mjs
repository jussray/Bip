import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const panel = read('src/features/control-room/SocialProvisioningLabPanel.tsx');
const screen = read('src/screens/DevControlRoomScreen.tsx');
const labDoc = read('docs/SOCIAL_ACCOUNT_PROVISIONING_LAB.md');
const coordination = read('AI_COORDINATION.md');
const globalAi = read('GLOBAL_AI.md');
const agents = read('AGENTS.md');
const providers = read('docs/PROVIDERS.md');
const deepSeek = read('DeepSeek/deepseek-chat.md');

test('founder Control Room exposes the social provisioning lab', () => {
  assert.match(screen, /SocialProvisioningLabPanel/);
  assert.match(screen, /'social-lab'/);
  assert.match(screen, />Social</);
  assert.match(panel, /getCurrentFounderProfile/);
  assert.match(panel, /isFounderProfile/);
  assert.match(panel, /profile\.can_manage_app/);
});

test('the dry-run set covers every uncreated target platform', () => {
  for (const platform of ['instagram', 'facebook', 'tiktok', 'youtube', 'x']) {
    assert.match(panel, new RegExp(`id: '${platform}'`));
  }
  assert.doesNotMatch(panel, /id: 'linkedin'/);
  assert.match(labDoc, /LinkedIn is excluded from the dry-run set because it is already connected/);
});

test('the state machine cannot claim a live account', () => {
  assert.match(panel, /type RehearsalStatus = 'not_tested' \| 'human_required'/);
  assert.doesNotMatch(panel, /verified_live/);
  assert.doesNotMatch(panel, /api_connected/);
  assert.match(panel, /No external account was created/);
  assert.match(panel, /LIVE ACCOUNTS CREATED/);
  assert.match(panel, /<Text style=\{styles\.truthValue\}>0<\/Text>/);
  assert.match(labDoc, /The dry-run code has no transition to `verified_live`/);
});

test('the lab performs no social-platform request, account creation, or credential collection', () => {
  assert.doesNotMatch(panel, /\bfetch\s*\(/);
  assert.doesNotMatch(panel, /axios/);
  assert.doesNotMatch(panel, /XMLHttpRequest/);
  assert.doesNotMatch(panel, /Linking\.openURL/);
  assert.doesNotMatch(panel, /TextInput/);
  assert.doesNotMatch(panel, /SecureStore/);
  assert.match(panel, /No password, one-time code, token, secret, or private user content is requested or stored/);
  assert.match(panel, /No social-platform network request, signup submission, terms acceptance, or hidden browser automation was performed/);
  assert.match(labDoc, /Opening the panel may use the existing Supabase Auth\/profile read solely to prove founder management access/);
  assert.match(labDoc, /rehearsal itself performs no social-platform network request/);
});

test('individual and all-platform devil tests terminate at the human gate', () => {
  assert.match(panel, /function runDryTest/);
  assert.match(panel, /function runAllDevilTests/);
  assert.match(panel, /function resetLab/);
  assert.match(panel, /status: 'human_required'/);
  assert.match(panel, /A successful rehearsal ends at human_required/);
  assert.match(labDoc, /Every successful rehearsal ends at `human_required`/);
});

test('all AI instruction layers point to one coordinated mission', () => {
  assert.match(coordination, /Every AI, coding agent, research provider, design tool, and Control Room worker serves one mission/);
  assert.match(coordination, /One mission, distinct lanes/);
  assert.match(coordination, /One-writer rule/);
  assert.match(coordination, /Handoff envelope/);
  assert.match(coordination, /The safe test endpoint is `human_required`, not `live`/);

  assert.match(globalAi, /AI_COORDINATION\.md/);
  assert.match(globalAi, /one active writer per artifact/);
  assert.match(agents, /Coordinated multi-AI contract/);
  assert.match(agents, /Apply the \*\*one-writer rule\*\*/);
  assert.doesNotMatch(agents, /also load `.agents\/skills\/bip-control-room\/SKILL\.md`/);
  assert.match(agents, /verify that skill exists on the active branch before relying on it/);
  assert.match(providers, /AI_COORDINATION\.md/);
  assert.match(providers, /Providers share one founder-defined mission/);
  assert.match(deepSeek, /Canonical coordination contract: \[`\.\.\/AI_COORDINATION\.md`\]/);
  assert.match(deepSeek, /DeepSeek owns adversarial second opinion/);
  assert.match(deepSeek, /must not become a second active writer/);
});

test('provider lanes complement rather than silently overwrite one another', () => {
  for (const lane of [
    'Founder Control Room: orchestrator and ledger',
    'Codex / ChatGPT: integration, repository operations, and proof',
    'Claude / Claude Code: long-context architecture and implementation depth',
    'DeepSeek: adversarial second opinion',
    'Perplexity or public-research providers: current external evidence',
    'Figma, Canva, and visual tools: visual-system lane',
  ]) {
    assert.match(coordination, new RegExp(lane.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(coordination, /must not overwrite the same artifact concurrently/);
  assert.match(agents, /Do not silently duplicate or overwrite work owned by another lane/);
  assert.match(providers, /must not duplicate another active implementation/);
  assert.match(deepSeek, /When another lane owns the artifact, DeepSeek returns comments, risks, alternatives, or a bounded patch proposal/);
});

test('DeepSeek social provisioning review stops at the human gate', () => {
  assert.match(deepSeek, /Social provisioning devil test/);
  assert.match(deepSeek, /false live-account claims/);
  assert.match(deepSeek, /credential or verification-code collection/);
  assert.match(deepSeek, /The safe rehearsal endpoint is `human_required`, never `live`, `connected`, or `verified`/);
  assert.match(deepSeek, /repository write authority/);
  assert.match(deepSeek, /External tool schemas are not live capabilities/);
  assert.match(deepSeek, /Tool-schema presence, provider registration, or a fluent model response is not runtime proof/);
  assert.match(deepSeek, /tests rejecting information about minors/);
  assert.match(providers, /Provider or tool registration is a capability declaration, not proof that an adapter is deployed/);
});
