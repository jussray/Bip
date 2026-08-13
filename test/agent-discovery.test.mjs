import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('robots.txt exposes only the explicit public discovery surface', () => {
  const robots = read('public/robots.txt');

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Disallow: \/$/m);
  assert.match(robots, /^Allow: \/\$$/m);
  assert.match(robots, /^Allow: \/auth\.md$/m);
  assert.match(robots, /^Allow: \/robots\.txt$/m);
  assert.match(robots, /^Allow: \/sitemap\.xml$/m);
  assert.match(robots, /^Sitemap: https:\/\/sekretbip\.net\/sitemap\.xml$/m);
});

test('sitemap.xml contains only the canonical public landing page', () => {
  const sitemap = read('public/sitemap.xml');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.deepEqual(locations, ['https://sekretbip.net/']);
});

test('auth.md truthfully documents current agent authentication discovery', () => {
  const auth = read('public/auth.md');

  assert.match(auth, /^# .*auth\.md$/m);
  assert.match(auth, /Agent audience/);
  assert.match(auth, /https:\/\/sekretbip\.net\/signup/);
  assert.match(auth, /human_email_password/);
  assert.match(auth, /Authorization: Bearer <access-token>/);
  assert.match(auth, /https:\/\/api\.sekretbip\.net/);
  assert.match(auth, /Supabase session access token/);
  assert.match(auth, /does not currently issue autonomous agent identities/);
  assert.match(auth, /does not currently publish OAuth Protected Resource Metadata or OAuth Authorization Server Metadata/);
});

test('Cloudflare headers deny AI training while preserving search and agent use', () => {
  const headers = read('public/_headers');

  assert.match(headers, /^\/\*$/m);
  assert.match(headers, /^  Content-Signal: ai-train=no, search=yes, ai-input=yes$/m);
  assert.match(headers, /^\/auth\.md$/m);
  assert.match(headers, /^  Content-Type: text\/markdown; charset=utf-8$/m);
  assert.match(headers, /^\/robots\.txt$/m);
  assert.match(headers, /^  Content-Type: text\/plain; charset=utf-8$/m);
  assert.match(headers, /^\/sitemap\.xml$/m);
  assert.match(headers, /^  Content-Type: application\/xml; charset=utf-8$/m);

  // Preserve the pre-existing browser hardening contract while extending it.
  assert.match(headers, /^  X-Frame-Options: DENY$/m);
  assert.match(headers, /^  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'$/m);
});
