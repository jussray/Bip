import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/founder-shield.yml', import.meta.url),
  'utf8',
);

test('Founder Shield proves the public edge anonymously and binds the release marker to exact main', () => {
  assert.ok(workflow.includes('name: Verify anonymous live edge on main'));
  assert.ok(workflow.includes('https://sekretbip.net/'));
  assert.ok(workflow.includes('https://sekretbip.net/.well-known/sekret-release.json'));
  assert.ok(workflow.includes('https://api.sekretbip.net/'));
  assert.ok(workflow.includes('https://api.sekretbip.net/api/sekret/reply'));

  assert.ok(workflow.includes('release?.[key] !== value'));
  assert.ok(workflow.includes('commitSha: expected'));
  assert.ok(workflow.includes("branch: 'main'"));
  assert.ok(workflow.includes("deploymentProvider: 'cloudflare-pages'"));
  assert.ok(workflow.includes("canonicalUrl: 'https://sekretbip.net'"));

  assert.ok(workflow.includes("host === 'cloudflareaccess.com'"));
  assert.ok(workflow.includes("host.endsWith('.cloudflareaccess.com')"));
  assert.ok(workflow.includes("path.startsWith('/cdn-cgi/access/')"));
  assert.ok(workflow.includes("assertPublicUrl(pagesUrl, 'sekretbip.net'"));
  assert.ok(workflow.includes("assertPublicUrl(releaseUrl, 'sekretbip.net'"));
  assert.ok(workflow.includes("assertPublicUrl(apiUrl, 'api.sekretbip.net'"));
  assert.ok(workflow.includes("assertPublicUrl(optionsUrl, 'api.sekretbip.net'"));

  assert.equal(workflow.includes('CLOUDFLARE_ACCESS_CLIENT_ID'), false);
  assert.equal(workflow.includes('CLOUDFLARE_ACCESS_CLIENT_SECRET'), false);
  assert.equal(workflow.toLowerCase().includes('cf-access-client-id:'), false);
  assert.equal(workflow.toLowerCase().includes('cf-access-client-secret:'), false);
  assert.equal(workflow.includes('access_headers='), false);

  assert.ok(workflow.includes('sanitize_headers()'));
  assert.ok(workflow.includes('release_json="$(cat "$release_body")"'));
  assert.doesNotMatch(workflow, /require\(['"]node:fs['"]\)/);
  assert.doesNotMatch(workflow, /fs\.(?:readFileSync|writeFileSync|copyFileSync)/);
});
