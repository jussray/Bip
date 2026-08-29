import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const service = fs.readFileSync('src/services/controlRoomTruth.ts', 'utf8');
const panel = fs.readFileSync('src/features/control-room/TruthMembranePanel.tsx', 'utf8');
const screen = fs.readFileSync('src/screens/DevControlRoomScreen.tsx', 'utf8');

test('truth membrane reconciles authoritative source and runtime identities without granting authority', () => {
  assert.match(service, /api\.github\.com\/repos\/jussray\/Sekret-Bip\/commits\/main/);
  assert.match(service, /https:\/\/sekretbip\.net\/release\.json/);
  assert.match(service, /https:\/\/api\.sekretbip\.net\/health/);
  assert.match(service, /mainSha === pagesSha && mainSha === workerSha/);
  assert.match(service, /executionAuthorized: false/);
  assert.match(service, /mergeAuthorized: false/);
  assert.match(service, /deploymentAuthorized: false/);
  assert.match(service, /Partial evidence is not success/);
});

test('continuity fingerprint is source/runtime-only and never becomes a cookie or person fingerprint', () => {
  assert.match(service, /bip-control-room-truth-v1/);
  assert.match(service, /bip-cr-v1:/);
  assert.match(service, /continuity receipt/);
  assert.doesNotMatch(service, /document\.cookie|Set-Cookie|userAgent|navigator\.userAgent|deviceId|rawIp/i);
  assert.doesNotMatch(panel, /document\.cookie|Set-Cookie|userAgent|navigator\.userAgent|deviceId|rawIp/i);
});

test('partial observations do not advance the bounded continuity receipt', () => {
  assert.match(panel, /control-room:truth-membrane:continuity:v1/);
  assert.match(panel, /next\.state === 'partial'/);
  assert.match(panel, /setContinuity\('held-partial'\)/);
  assert.match(panel, /AsyncStorage\.setItem\(CONTINUITY_KEY/);
  assert.match(panel, /not a person, browser, device, session, or authorization fingerprint/);
});

test('founder-only control room exposes the truth membrane through the existing canonical screen', () => {
  assert.match(screen, /TruthMembranePanel/);
  assert.match(screen, /\['truth', 'Truth'\]/);
  assert.match(screen, /surface === 'truth'/);
  assert.match(screen, /isFounderProfile\(profile\)/);
});
