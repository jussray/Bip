import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

function readProductionEnv(): Record<string, string> {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), '.env.production'),
    'utf8',
  );

  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator === -1) return [line, ''];
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

const productionEnv = readProductionEnv();
const supabaseUrl = productionEnv.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  productionEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  productionEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;

test('production browser can reach Supabase Auth without mutating account data', async ({
  page,
}) => {
  expect(supabaseUrl).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
  expect(supabasePublishableKey).toMatch(/^(sb_publishable_|eyJ)/);

  await page.goto('/signup?side=teen');

  const probe = await page.evaluate(
    async ({ url, key }) => {
      try {
        const response = await fetch(`${url}/auth/v1/settings`, {
          method: 'GET',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });
        const body = await response.text();

        return {
          ok: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type') ?? '',
          body: body.slice(0, 1_000),
          error: '',
        };
      } catch (error) {
        return {
          ok: false,
          status: 0,
          contentType: '',
          body: '',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    { url: supabaseUrl, key: supabasePublishableKey },
  );

  expect(probe.status, JSON.stringify(probe)).toBe(200);
  expect(probe.ok, JSON.stringify(probe)).toBe(true);
  expect(probe.contentType).toContain('application/json');
  expect(probe.body).not.toMatch(/service[_-]?role/i);
});
