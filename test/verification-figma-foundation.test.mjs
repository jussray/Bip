import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('verification states and route targets remain explicit', async () => {
  const source = await read('src/services/verificationState.ts');
  for (const state of [
    'UNVERIFIED',
    'PENDING_PARENT',
    'PENDING_TRUSTED_ADULT',
    'LIMITED_MODE',
    'VERIFIED_TEEN',
    'EXPIRED',
    'MANUAL_REVIEW',
    'SUSPENDED',
  ]) {
    assert.match(source, new RegExp(state));
  }
  assert.match(source, /getVerificationRouteTarget/);
  assert.match(source, /canUnlockSocial/);
});

test('Figma foundation contains required first screens', async () => {
  const source = await read('src/constants/figmaFrames.ts');
  for (const key of [
    'welcome',
    'teenOnboarding',
    'parentOnboarding',
    'limitedMode',
    'parentLinkVerify',
    'emergencyAlert',
    'parentDoorbell',
    'profile',
  ]) {
    assert.match(source, new RegExp(key));
  }
});

test('design system documents privacy boundaries', async () => {
  const source = await read('docs/FIGMA_SCREEN_SYSTEM.md');
  assert.match(source, /No open stranger DMs/);
  assert.match(source, /Public Circle identity never falls back to real account identity/);
  assert.match(source, /Parents never receive journal text/);
});
