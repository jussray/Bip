import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const historicalSafetyPath = path.join(migrationsDir, '20260619_safety_scan.sql');
const repairName = '20260822203000_disable_private_journal_passive_safety_scan.sql';
const repairPath = path.join(migrationsDir, repairName);

const historicalSafety = fs.readFileSync(historicalSafetyPath, 'utf8');
const repair = fs.readFileSync(repairPath, 'utf8');
const orderedMigrations = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
const repairIndex = orderedMigrations.indexOf(repairName);

test('historical migration establishes the passive journal trigger this repair closes', () => {
  assert.match(historicalSafety, /create\s+trigger\s+safety_scan_journal\b/i);
  assert.match(historicalSafety, /after\s+insert\s+on\s+public\.journal_entries/i);
});

test('final Trust Contract migration drops the passive private-journal trigger', () => {
  assert.ok(repairIndex >= 0, 'Trust Contract repair migration must exist in ordered migrations');
  assert.match(
    repair,
    /drop\s+trigger\s+if\s+exists\s+safety_scan_journal\s+on\s+public\.journal_entries\s*;/i,
  );
  assert.doesNotMatch(repair, /create\s+trigger\s+safety_scan_journal\b/i);
});

test('no migration after the Trust Contract repair recreates passive journal scanning', () => {
  for (const name of orderedMigrations.slice(repairIndex + 1)) {
    const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    assert.doesNotMatch(
      sql,
      /create\s+trigger\s+safety_scan_journal\b/i,
      `${name} must not recreate passive journal scanning`,
    );
  }
});

test('the focused repair does not disable public/social safety triggers', () => {
  assert.match(historicalSafety, /create\s+trigger\s+safety_scan_circle\b/i);
  assert.match(historicalSafety, /create\s+trigger\s+safety_scan_public_circle\b/i);
  assert.doesNotMatch(repair, /safety_scan_circle\b/i);
  assert.doesNotMatch(repair, /safety_scan_public_circle\b/i);
});

test('repair contains no new data egress, privileged function, or caregiver access path', () => {
  assert.doesNotMatch(repair, /http_post|fetch\s*\(|service[_-]?role|security\s+definer/i);
  assert.doesNotMatch(repair, /parent_links|parent_user_id|caregiver|guardian/i);
  assert.doesNotMatch(repair, /insert\s+into|update\s+public\.|delete\s+from/i);
});
