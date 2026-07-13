import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const envSource = fs.readFileSync(
  new URL('../src/utils/env.ts', import.meta.url),
  'utf8',
);

const supabaseSource = fs.readFileSync(
  new URL('../src/utils/supabase.ts', import.meta.url),
  'utf8',
);

test('production web builds retain a client-safe Supabase default', () => {
  assert.match(
    envSource,
    /PRODUCTION_SUPABASE_URL\s*=\s*'https:\/\/tbsevonvegdnlyjgplmm\.supabase\.co'/,
  );
  assert.match(
    envSource,
    /PRODUCTION_SUPABASE_PUBLISHABLE_KEY\s*=\s*'sb_publishable_[A-Za-z0-9_-]+'/,
  );
  assert.match(
    envSource,
    /clean\(env\.EXPO_PUBLIC_SUPABASE_URL\)[\s\S]*\|\| PRODUCTION_SUPABASE_URL/,
  );
  assert.match(
    envSource,
    /clean\(env\.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY\)[\s\S]*clean\(env\.EXPO_PUBLIC_SUPABASE_ANON_KEY\)[\s\S]*PRODUCTION_SUPABASE_PUBLISHABLE_KEY/,
  );
});

test('deployment variables override defaults and legacy anon env remains supported', () => {
  const publishableIndex = envSource.indexOf('clean(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  const legacyIndex = envSource.indexOf('clean(env.EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  const defaultIndex = envSource.indexOf('|| PRODUCTION_SUPABASE_PUBLISHABLE_KEY');

  assert.notEqual(publishableIndex, -1);
  assert.notEqual(legacyIndex, -1);
  assert.notEqual(defaultIndex, -1);
  assert.equal(publishableIndex < legacyIndex, true);
  assert.equal(legacyIndex < defaultIndex, true);
});

test('client config never embeds a privileged Supabase key', () => {
  assert.doesNotMatch(envSource, /sb_secret_/i);
  assert.doesNotMatch(envSource, /service_role[^'"\n]*['"][A-Za-z0-9._-]{20,}/i);
  assert.match(envSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(envSource, /This key must NEVER be in Expo, Vercel, or client code/);
});

test('Supabase readiness uses the resolved production-capable values', () => {
  assert.match(envSource, /isSupabaseReady = Boolean\(SUPABASE_URL && SUPABASE_ANON\)/);
  assert.match(supabaseSource, /export const isSupabaseConfigured = isSupabaseReady/);
  assert.match(supabaseSource, /createClient\(SUPABASE_URL, SUPABASE_ANON/);
});
