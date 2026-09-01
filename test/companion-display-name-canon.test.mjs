/**
 * Companion display-name canon (docs/COMPANION_NAME_CANON.md).
 *
 * Layer 1 (internal id truth): `raylene` / `rylane` / `soft` stay valid as
 * persisted ids, route keys, asset keys and analytics values.
 * Layer 2 (display-name truth): no runtime surface may render the pre-cutover
 * names. Every user-facing label resolves to Suhana / Sy.
 *
 * These two layers are easy to re-break in opposite directions — a refactor
 * that "cleans up" the legacy ids silently drops saved user state, and a new
 * screen that hardcodes a label silently reintroduces the old names. One test
 * guards both.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname).replace(/\/test$/, '');

const RUNTIME_DIRS = [
  'app',
  'components',
  'constants',
  'hooks',
  'screens',
  'src',
  'worker',
  'utils',
  'services',
  'context',
  'lib',
];

const LEGACY_DISPLAY_NAME = /\b(?:Raylene|Rylane)\b/;

/**
 * Every allowed survivor, with the reason it survives. A bare path is not
 * enough — the matched line must still say what it is allowed to say, so an
 * unrelated label added to one of these files is still caught.
 */
const ALLOWED = [
  {
    file: 'app/(teen)/continuity.tsx',
    reason: 'comment explaining why the id is not title-cased for display',
    match: /^\s*\/\//,
  },
  {
    file: 'constants/presence/avatarStates.ts',
    reason: 'the reference-sheet artwork is physically signed with the old name',
    match: /^\s*\/\//,
  },
  {
    file: 'src/utils/sekretCompanion.ts',
    reason: 'comment naming the pre-cutover labels the normalizer still accepts',
    match: /^\s*\/\//,
  },
];

function sourceFiles(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];

  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(rel);
    return /\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

test('no runtime surface renders the pre-cutover companion display names', () => {
  const offenders = [];

  for (const file of RUNTIME_DIRS.flatMap(sourceFiles)) {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (!LEGACY_DISPLAY_NAME.test(line)) return;

      const allowed = ALLOWED.some((entry) => entry.file === file && entry.match.test(line));
      if (!allowed) offenders.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `Use the canonical display names (Suhana / Sy). Internal ids stay as they are.\n${offenders.join('\n')}`,
  );
});

test('legacy and pre-id aliases still resolve to the canonical companions', () => {
  const source = fs.readFileSync(
    path.join(root, 'src/features/identity/legacyCompanionIdMigration.ts'),
    'utf8',
  );

  const mapMatch = /const LEGACY_TO_CANONICAL[^=]*= \{([\s\S]*?)\n\};/.exec(source);
  assert.ok(mapMatch, 'LEGACY_TO_CANONICAL must be extractable from source');

  const map = Object.fromEntries(
    [...mapMatch[1].matchAll(/^\s*(\w+): '(\w+)',/gm)].map(([, from, to]) => [from, to]),
  );

  // Dropping any of these silently repoints saved user state at the wrong twin.
  assert.equal(map.raylene, 'suhana');
  assert.equal(map.rylane, 'sy');
  assert.equal(map.soft, 'suhana');
});

test('the canonical display map is the only source of the visible names', () => {
  const ids = fs.readFileSync(path.join(root, 'src/features/identity/companionIds.ts'), 'utf8');

  assert.match(ids, /suhana: 'Suhana'/);
  assert.match(ids, /sy: 'Sy'/);
  assert.doesNotMatch(ids, LEGACY_DISPLAY_NAME);
});

test('the greeting selector reads through the normalizer, not a display literal', () => {
  const companion = fs.readFileSync(path.join(root, 'src/utils/sekretCompanion.ts'), 'utf8');

  // Comparing `personality === 'Sy'` would strand every account whose
  // persisted personality label is still 'Rylane'.
  assert.match(companion, /normalizeSekretPersonality\(personality\)/);
  assert.doesNotMatch(companion, /personality === '(?:Sy|Suhana)'/);
});

test('the Worker prompt names the canonical companions directly', () => {
  const prompt = fs.readFileSync(path.join(root, 'worker/sekret-reply.ts'), 'utf8');

  assert.match(prompt, /^CHARACTER: Suhana$/m);
  assert.match(prompt, /^CHARACTER: Sy$/m);
  // The runtime scrubber stays as a backstop, but it must not be the only
  // thing standing between the model and a pre-cutover name.
  assert.doesNotMatch(prompt, LEGACY_DISPLAY_NAME);
});
