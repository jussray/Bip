import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  resolveReleaseMetadata,
  writeReleaseMetadata,
} from '../scripts/write-release-metadata.mjs';

test('Cloudflare Pages environment wins when resolving release metadata', () => {
  const metadata = resolveReleaseMetadata({
    CF_PAGES: '1',
    CF_PAGES_COMMIT_SHA: 'ABCDEF0123456789ABCDEF0123456789ABCDEF01',
    CF_PAGES_BRANCH: 'main',
    CF_PAGES_URL: 'https://example.pages.dev',
    GITHUB_SHA: '1111111111111111111111111111111111111111',
  }, process.cwd(), new Date('2026-07-13T01:00:00.000Z'));

  assert.deepEqual(metadata, {
    schemaVersion: 1,
    app: 'sekret-bip',
    commitSha: 'abcdef0123456789abcdef0123456789abcdef01',
    branch: 'main',
    deploymentProvider: 'cloudflare-pages',
    deploymentUrl: 'https://example.pages.dev',
    builtAt: '2026-07-13T01:00:00.000Z',
  });
});

test('writes public release metadata into the exported directory', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-release-'));
  try {
    const result = writeReleaseMetadata('dist', {
      cwd: directory,
      env: {
        GITHUB_SHA: '2222222222222222222222222222222222222222',
        GITHUB_REF_NAME: 'test-branch',
      },
      now: new Date('2026-07-13T02:00:00.000Z'),
    });
    const written = JSON.parse(fs.readFileSync(result.destination, 'utf8'));
    assert.equal(written.commitSha, '2222222222222222222222222222222222222222');
    assert.equal(written.branch, 'test-branch');
    assert.equal(written.deploymentProvider, 'local-or-ci-build');
    assert.equal(written.deploymentUrl, null);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
