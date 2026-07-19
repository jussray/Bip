import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const readme = read('README.md');
const policy = read('.control-room/README_SYNC_POLICY.md');

test('README exposes Founder Control Room documentation synchronization', () => {
  assert.match(readme, /Founder Control Room.*README sync/is);
  assert.match(readme, /required.*not_required.*deferred_with_reason/is);
  assert.match(readme, /runner_startup_failure/);
  assert.match(readme, /README_SYNC_POLICY\.md/);
});

test('Founder Control Room policy requires a README impact decision', () => {
  assert.match(policy, /README impact value/i);
  assert.match(policy, /required.*not_required.*deferred_with_reason/is);
  assert.match(policy, /same pull request/i);
  assert.match(policy, /runner_startup_failure/);
  assert.match(policy, /must not be rewritten as a code regression/i);
  assert.match(policy, /avoid claiming deployment or live proof from a merge alone/i);
});
