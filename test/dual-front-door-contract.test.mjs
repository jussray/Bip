import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const welcome = readFileSync('screens/WebWelcomeScreen.tsx', 'utf8');
const index = readFileSync('app/index.tsx', 'utf8');

test('teen front door keeps canonical accessible names without a visible caption', () => {
  assert.match(welcome, /sekret-bip-teen-family-v1\.jpg/);
  assert.doesNotMatch(welcome, />Suhana</);
  assert.doesNotMatch(welcome, /Suhanna/);
  assert.doesNotMatch(welcome, /namePill|nameText|nameDot/);
  assert.match(welcome, /Night on the left, Suhana in the center, Sy on the right/);
});

test('Bip Jr remains a separate parent-side welcome world', () => {
  assert.match(welcome, /parent-space-splash\.png/);
  assert.match(welcome, /YOUR FAMILY\. YOUR SPACE\./);
  assert.match(welcome, /const isBipJr = activeVariant === 'parent'/);
  assert.match(welcome, /bipDevSide/);
  assert.match(welcome, /onEnter\(activeVariant\)/);
  assert.match(index, /variant=\{publicWelcomeSide\}/);
});

test('explicit Enter choice outranks preview and build defaults', () => {
  assert.match(index, /getDevSplitViewSideOverride/);
  assert.match(index, /const publicEntrySide: AccountSide = selectedEntrySide \?\? previewSide \?\? buildSide \?\? userSide \?\? 'teen'/);
  assert.match(index, /setSelectedEntrySide\(side\)/);
  assert.match(index, /publicEntrySide === 'parent' \? '\/\(onboarding\)\/parent-splash' : '\/\(onboarding\)\/welcome'/);
  assert.match(index, /signup\?side=\$\{publicEntrySide\}/);
});

test('each preview variant uses one direct Enter control with variant-specific accessible copy', () => {
  assert.match(welcome, /testID="web-welcome-enter"/);
  assert.match(welcome, /Bip Jr — enter your family space/);
  assert.match(welcome, /Se'kret Bip — enter your safe space/);
  assert.match(welcome, /onPress=\{\(\) => onEnter\(activeVariant\)\}/);
  assert.doesNotMatch(welcome, /web-welcome-enter-teen|web-welcome-enter-parent|web-welcome-bottom-nav/);
  assert.match(welcome, /accessibilityRole="button"/);
});

test('returning users can reach sign-in without entering onboarding first', () => {
  assert.match(welcome, /testID="web-welcome-sign-in"/);
  assert.match(welcome, /Already have an account\?/);
  assert.match(welcome, />Sign in</);
  assert.match(welcome, /router\.push\(`\/\(auth\)\/login\?side=\$\{activeVariant\}` as never\)/);
  assert.match(welcome, /Sign in to your existing Se'kret Bip account/);
});

test('primary entry language matches the approved front-door promise', () => {
  assert.match(welcome, />Enter Se’kret Bip</);
  assert.doesNotMatch(welcome, />Night|>Suhana|>Sy/);
});