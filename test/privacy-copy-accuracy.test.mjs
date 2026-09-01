/**
 * Privacy copy must not out-promise the storage model.
 *
 * Se'kret Bip syncs journal entries, mood history and period days to Supabase
 * under the teen's user_id. RLS makes those rows owner-only (authenticated,
 * non-anonymous), and 20260705010000_bridge_summary_contract.sql dropped the
 * parent raw-read policies, so "your parent cannot see this" is true and
 * "it never leaves this device" is not.
 *
 * screens/PeriodCalendarScreen.tsx shipped "your data stays on this device.
 * nothing leaves" in the same file that calls syncPeriodDay() and
 * deletePeriodDay() against Supabase. This locks that shut.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname).replace(/\/test$/, '');

const SURFACE_DIRS = ['app', 'components', 'screens', 'src'];

/**
 * Absolute claims the current architecture cannot support. Each is phrased to
 * match the promise, not any word inside it — "device" and "private" on their
 * own are fine.
 */
const UNSUPPORTED_CLAIMS = [
  { pattern: /nothing leaves/i, why: 'entries sync to Supabase' },
  { pattern: /stays on (?:this|your) device/i, why: 'entries sync to Supabase' },
  { pattern: /never leaves (?:this|your) (?:device|phone|app)/i, why: 'entries sync to Supabase' },
  { pattern: /only you can (?:see|read)/i, why: 'operators hold service-role access; say what RLS guarantees instead' },
  { pattern: /end[- ]to[- ]end encrypt/i, why: 'rows are not end-to-end encrypted' },
  { pattern: /fully anonymous|completely anonymous/i, why: 'rows are keyed to auth.uid()' },
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

test('no user-facing surface makes a privacy promise the storage model breaks', () => {
  const offenders = [];

  for (const file of SURFACE_DIRS.flatMap(sourceFiles)) {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return;

      for (const { pattern, why } of UNSUPPORTED_CLAIMS) {
        if (pattern.test(line)) {
          offenders.push(`${file}:${index + 1}: ${line.trim()}\n    → ${why}`);
        }
      }
    });
  }

  assert.deepEqual(offenders, [], `Unsupported privacy claim:\n${offenders.join('\n')}`);
});

test('the period calendar still tells the teen the truth about where the data goes', () => {
  const screen = fs.readFileSync(path.join(root, 'screens/PeriodCalendarScreen.tsx'), 'utf8');

  // The screen writes to Supabase, so it owes the teen a real statement --
  // silence would be its own kind of overclaim.
  assert.match(screen, /syncPeriodDay\(isoDay\)/);
  assert.match(screen, /deletePeriodDay\(isoDay\)/);
  assert.match(screen, /synced to your account/);
  assert.match(screen, /never your parent's/);
});

test('period rows stay owner-only, which is what the copy now promises', () => {
  const migrations = path.join(root, 'supabase/migrations');
  const anonBlock = fs.readFileSync(
    path.join(migrations, '20260629024952_block_anonymous_sessions_from_private_data.sql'),
    'utf8',
  );

  assert.match(
    anonBlock,
    /alter policy period_days_owner_select on public\.period_days using \(public\.is_non_anonymous_user\(\) and auth\.uid\(\) = user_id\)/,
  );

  // No parent-read path may exist on period_days -- the copy says "never your
  // parent's", so a future linked-parent policy has to change the copy too.
  const all = fs
    .readdirSync(migrations)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => fs.readFileSync(path.join(migrations, name), 'utf8'))
    .join('\n');

  const parentPeriodPolicy = /create policy[^;]*period_days[^;]*parent/is.test(all);
  assert.equal(parentPeriodPolicy, false, 'a parent-read policy on period_days would falsify the screen copy');
});
