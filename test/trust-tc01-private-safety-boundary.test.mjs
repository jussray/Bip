import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260822060000_tc01_private_safety_boundary.sql', import.meta.url),
  'utf8',
);
const scanner = fs.readFileSync(
  new URL('../supabase/functions/safety-scan/index.ts', import.meta.url),
  'utf8',
);

test('TC-01 Barrier A removes automatic scanning from private and mixed-visibility sources', () => {
  assert.match(migration, /DROP TRIGGER IF EXISTS safety_scan_journal ON public\.journal_entries/);
  assert.match(migration, /DROP TRIGGER IF EXISTS safety_scan_circle ON public\.circle_posts/);
  assert.match(migration, /DROP TRIGGER IF EXISTS safety_scan_posts ON public\.posts/);
  assert.doesNotMatch(migration, /DROP TRIGGER IF EXISTS safety_scan_public_circle/);
});

test('database trigger function also fails closed to the public-only source', () => {
  assert.match(migration, /IF TG_TABLE_NAME::text <> 'public_circle_posts' THEN\s+RETURN NEW;/s);
  const httpBody = migration.match(/body := jsonb_build_object\([\s\S]*?\),\s+headers :=/);
  assert.ok(httpBody, 'expected metadata-only net.http_post body');
  assert.match(httpBody[0], /'record_id'/);
  assert.match(httpBody[0], /'user_id'/);
  assert.match(httpBody[0], /'source_table'/);
  assert.doesNotMatch(httpBody[0], /'content'|_content|NEW\.text|NEW\.body/);
});

test('TC-01 Barrier B uses an explicit automatic-source allowlist', () => {
  assert.match(scanner, /AUTOMATIC_SAFETY_ELIGIBLE_SOURCES = new Set\(\['public_circle_posts'\]\)/);
  assert.match(scanner, /PRIVATE_OR_MIXED_SOURCES = new Set\(\[/);
  for (const source of ['journal_entries', 'circle_posts', 'posts', 's2tell_entries']) {
    assert.match(scanner, new RegExp(`['"]${source}['"]`));
  }
});

test('private-source rejection happens before privileged access, classification, moderation, or parent resolution', () => {
  const rejectIdx = scanner.indexOf("PRIVATE_OR_MIXED_SOURCES.has(metadata.source_table)");
  const adminIdx = scanner.indexOf('createClient(SUPA_URL, SUPA_SVC_KEY');
  const patternIdx = scanner.indexOf('const kw = patternScan(content)');
  const moderationIdx = scanner.indexOf('const mod = await moderationScan(content)');
  const parentIdx = scanner.indexOf('await notifyParentIfLinked');

  assert.ok(rejectIdx > 0, 'private-source rejection must exist');
  assert.ok(adminIdx > rejectIdx, 'service-role access must occur after source rejection');
  assert.ok(patternIdx > rejectIdx, 'keyword classification must occur after source rejection');
  assert.ok(moderationIdx > rejectIdx, 'vendor moderation must occur after source rejection');
  assert.ok(parentIdx > rejectIdx, 'parent resolution must occur after source rejection');
});

test('scanner ignores caller-supplied raw content and loads only an allowlisted canonical public row', () => {
  assert.doesNotMatch(scanner, /const\s*\{[^}]*content[^}]*\}\s*=\s*metadata/);
  assert.doesNotMatch(scanner, /metadata\.content/);
  assert.match(scanner, /\.from\(sourceTable\)[\s\S]*?\.select\('id,user_id,text'\)/);
  assert.match(scanner, /\.eq\('id', metadata\.record_id\)/);
  assert.match(scanner, /\.eq\('user_id', metadata\.user_id\)/);
});

test('missing, private, and non-allowlisted sources fail closed', () => {
  assert.match(scanner, /return reject\('invalid_source'\)/);
  assert.match(scanner, /return reject\('private_source'\)/);
  assert.match(scanner, /return reject\('source_not_allowlisted'\)/);
  assert.match(scanner, /return reject\('invalid_metadata'\)/);
});

test('rejection path emits no child identifiers or content to logs', () => {
  const firstConsoleIdx = scanner.indexOf('console.');
  const sourceRejectIdx = scanner.indexOf("return reject('private_source')");
  assert.ok(firstConsoleIdx === -1 || firstConsoleIdx > sourceRejectIdx,
    'no log call may precede private-source rejection');
  assert.doesNotMatch(scanner, /console\.(?:log|error|warn)\([^\n]*(?:metadata\.record_id|metadata\.user_id|content)/);
});

test('public-source parent notification remains content-free in this narrow repair', () => {
  assert.match(scanner, /public-source parent notify queued severity=\$\{severity\}/);
  assert.doesNotMatch(scanner, /parent notify queued[^\n]*(?:text|content|record_id|user_id)/);
});
