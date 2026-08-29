import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/founder-shield.yml', import.meta.url),
  'utf8',
);

test('Founder Shield proves the public edge anonymously and binds the release marker to exact main', () => {
  assert.match(workflow, /name: Verify anonymous live edge on main/);
  assert.ok(workflow.includes('https://sekretbip.net/'));
  assert.ok(workflow.includes('https://sekretbip.net/.well-known/sekret-release.json'));
  assert.ok(workflow.includes('https://api.sekretbip.net/'));
  assert.ok(workflow.includes('https://api.sekretbip.net/api/sekret/reply'));

  assert.match(workflow, /release\?\.\[key\] !== value/);
  assert.match(workflow, /commitSha: expected/);
  assert.match(workflow, /branch: 'main'/);
  assert.match(workflow, /deploymentProvider: 'cloudflare-pages'/);
  assert.ok(workflow.includes("canonicalUrl: 'https://sekretbip.net'"));

  assert.match(workflow, /cloudflareaccess\.com/);
  assert.match(workflow, /\/cdn-cgi\/access\//);
  assert.match(workflow, /assertPublicUrl\(pagesUrl, 'sekretbip\.net'/);
  assert.match(workflow, /assertPublicUrl\(releaseUrl, 'sekretbip\.net'/);
  assert.match(workflow, /assertPublicUrl\(apiUrl, 'api\.sekretbip\.net'/);
  assert.match(workflow, /assertPublicUrl\(optionsUrl, 'api\.sekretbip\.net'/);

  assert.doesNotMatch(workflow, /CLOUDFLARE_ACCESS_CLIENT_ID/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_ACCESS_CLIENT_SECRET/);
  assert.doesNotMatch(workflow, /CF-Access-Client-Id:/i);
  assert.doesNotMatch(workflow, /CF-Access-Client-Secret:/i);
  assert.doesNotMatch(workflow, /access_headers=/);

  assert.match(workflow, /sanitize_headers\(\)/);
  assert.match(workflow, /release_json="\$\(cat "\$release_body"\)"/);
  assert.doesNotMatch(workflow, /require\(['"]node:fs['"]\)/);
  assert.doesNotMatch(workflow, /fs\.(?:readFileSync|writeFileSync|copyFileSync)/);
});
