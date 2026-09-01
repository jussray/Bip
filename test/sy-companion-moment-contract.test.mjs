import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const moments = readFileSync(new URL('../src/features/sekret/companionMoments.ts', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../app/(teen)/companion-moment.tsx', import.meta.url), 'utf8');
const routes = readFileSync(new URL('../src/teen/routes.ts', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../app/(teen)/sekret.tsx', import.meta.url), 'utf8');
const chat = readFileSync(new URL('../app/(teen)/companion-chat.tsx', import.meta.url), 'utf8');

test('Sy moment contract exposes the five approved intents', () => {
  for (const id of ['sort', 'write', 'company', 'good', 'night']) {
    assert.match(moments, new RegExp(`id: '${id}'`));
  }

  assert.match(moments, /destination: \{ kind: 'chat', companion: 'sy', surface: 'chat' \}/);
  assert.match(moments, /destination: \{ kind: 'pages', selectedSekret: 'rylane' \}/);
  assert.match(moments, /destination: \{ kind: 'chat', companion: 'night', surface: 'chat' \}/);
});

test('Sy moment screen delegates into canonical app surfaces', () => {
  assert.match(routes, /companionMoment:\s*'\/\(teen\)\/companion-moment'/);
  assert.match(screen, /pathname: TEEN_ROUTES\.companionChat/);
  assert.match(screen, /router\.push\(TEEN_ROUTES\.pages as never\)/);
  assert.match(screen, /const routeCompanion = selected\.destination\.companion === 'sy' \? 'rylane' : selected\.destination\.companion/);
  assert.match(screen, /setSelectedSekret\(routeCompanion\)/);
  assert.match(screen, /companion: routeCompanion/);
});

test('Sy moment screen uses the existing full-body Sy asset for the hero composition', () => {
  assert.match(screen, /const SY_MOMENT_ART = IMAGES\.rylaneFullbody/);
  assert.match(screen, /source=\{SY_MOMENT_ART\}/);
  assert.doesNotMatch(screen, /getTeenCompanionAsset\('rylane', 'neutral'\)/);
  assert.doesNotMatch(screen, /source=\{IMAGES\.rylaneNeutral\}/);
});

test('Sy picker entry is bounded to Sy and preserves other companion behavior', () => {
  assert.match(entry, /if \(id === 'rylane'\)/);
  assert.match(entry, /setSelectedSekret\('rylane'\)/);
  assert.match(entry, /router\.push\(TEEN_ROUTES\.companionMoment as never\)/);
  assert.match(entry, /pathname: TEEN_ROUTES\.pages/);
});

test('moment choices expose checked native radio semantics and no legacy Sy display name', () => {
  assert.match(screen, /accessibilityRole="radiogroup"/);
  assert.match(screen, /accessibilityRole="radio"/);
  assert.match(screen, /accessibilityState=\{\{ checked: isSelected \}\}/);
  assert.match(screen, /aria-checked=\{isSelected\}/);
  assert.match(screen, /testID="sy-moment-action"/);
  assert.doesNotMatch(screen, />Rylane</);
});

test('companion chat keeps compatibility keys private and renders canonical companion metadata', () => {
  assert.match(chat, /const profileKey = companionKey in SEKRET_PROFILES \? companionKey : 'soft'/);
  assert.match(chat, /const companionId = toCompanionId\(profileKey\)/);
  assert.match(chat, /const profile = COMPANION_PROFILES\[companionId\]/);
  assert.match(chat, /buildHistoryKey\(profileKey, surface\)/);
  assert.doesNotMatch(chat, /const profile\s*=\s*SEKRET_PROFILES\[profileKey\]/);
});
