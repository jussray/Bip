import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const welcome = readFileSync('screens/WebWelcomeScreen.tsx', 'utf8');
const index = readFileSync('app/index.tsx', 'utf8');

test('teen front door keeps canonical names and approved teen artwork', () => {
  assert.match(welcome, /sekret-bip-teen-family-v1\.jpg/);
  assert.match(welcome, />Suhana</);
  assert.doesNotMatch(welcome, /Suhanna/);
  assert.match(welcome, /Night on the left, Suhana in the center, Sy on the right/);
});

test('Bip Jr remains a separate parent-side welcome world', () => {
  assert.match(welcome, /parent-space-splash\.png/);
  assert.match(welcome, /THE SOFTER ORIGINAL/);
  assert.match(welcome, /activeVariant === 'parent' \? 'bip-jr' : 'home'/);
  assert.match(welcome, /bipDevSide/);
  assert.match(welcome, /onEnter\('parent'\)/);
  assert.match(index, /variant=\{publicWelcomeSide\}/);
  assert.match(index, /previewSide \?\? buildSide \?\? userSide \?\? 'teen'/);
});

test('Enter preserves the selected public side through onboarding routing', () => {
  assert.match(index, /getDevSplitViewSideOverride/);
  assert.match(index, /const publicEntrySide: AccountSide = previewSide \?\? buildSide \?\? userSide \?\? 'teen'/);
  assert.match(index, /publicEntrySide === 'parent' \? '\/\(onboarding\)\/parent-splash' : '\/\(onboarding\)\/welcome'/);
  assert.match(index, /signup\?side=\$\{publicEntrySide\}/);
});

test('both variants retain explicit Enter controls and bottom navigation', () => {
  assert.match(welcome, /web-welcome-enter-teen/);
  assert.match(welcome, /web-welcome-enter-parent/);
  assert.match(welcome, /web-welcome-bottom-nav/);
  assert.match(welcome, /accessibilityRole="button"/);
});
