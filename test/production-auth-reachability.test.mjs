import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(
  new URL('../e2e/production-auth-reachability.spec.ts', import.meta.url),
  'utf8',
);

test('production Auth reachability probe stays browser-based and read-only', () => {
  assert.match(source, /page\.evaluate/);
  assert.match(source, /\/auth\/v1\/settings/);
  assert.match(source, /method:\s*['"]GET['"]/);
  assert.doesNotMatch(source, /method:\s*['"]POST['"]/);
  assert.doesNotMatch(source, /\.auth\.signUp\s*\(/);
  assert.doesNotMatch(source, /service[_-]?role/i);
});

test('production Auth reachability probe uses repository-controlled public config', () => {
  assert.match(source, /\.env\.production/);
  assert.match(source, /EXPO_PUBLIC_SUPABASE_URL/);
  assert.match(source, /EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(source, /EXPO_PUBLIC_SUPABASE_ANON_KEY/);
});
