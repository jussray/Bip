import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const moments = readFileSync(new URL('../src/features/sekret/companionMoments.ts', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../app/(teen)/companion-moment.tsx', import.meta.url), 'utf8');
const routes = readFileSync(new URL('../src/teen/routes.ts', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../app/(teen)/sekret.tsx', import.meta.url), 'utf8');

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
  assert.match(screen, /setSelectedSekret\(selected\.destination\.companion === 'sy' \? 'rylane' : 'night'\)/);
  assert.match(screen, /source=\{IMAGES\.rylaneNeutral\}/);
});

test('Sy picker entry is bounded to Sy and preserves other companion behavior', () => {
  assert.match(entry, /if \(id === 'rylane'\)/);
  assert.match(entry, /setSelectedSekret\('rylane'\)/);
  assert.match(entry, /router\.push\(TEEN_ROUTES\.companionMoment as never\)/);
  assert.match(entry, /pathname: TEEN_ROUTES\.pages/);
});

test('moment choices expose native selection semantics and no legacy Sy display name', () => {
  assert.match(screen, /accessibilityRole="radiogroup"/);
  assert.match(screen, /accessibilityRole="radio"/);
  assert.match(screen, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(screen, /testID="sy-moment-action"/);
  assert.doesNotMatch(screen, />Rylane</);
});
