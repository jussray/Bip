import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const envSource = fs.readFileSync(
  new URL('../src/utils/env.ts', import.meta.url),
  'utf8',
);
const productionEnv = fs.readFileSync(
  new URL('../.env.production', import.meta.url),
  'utf8',
);
const gitignore = fs.readFileSync(
  new URL('../.gitignore', import.meta.url),
  'utf8',
);
const supabaseSource = fs.readFileSync(
  new URL('../src/utils/supabase.ts', import.meta.url),
  'utf8',
);

test('production Expo export receives the canonical public Supabase config', () => {
  assert.match(
    productionEnv,
    /^EXPO_PUBLIC_SUPABASE_URL=https:\/\/tbsevonvegdnlyjgplmm\.supabase\.co$/m,
  );
  assert.match(
    productionEnv,
    /^EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[A-Za-z0-9_-]+$/m,
  );
  assert.match(
    productionEnv,
    /^EXPO_PUBLIC_BACKEND_URL=https:\/\/sekret-backend\.mcgill-raylene\.workers\.dev$/m,
  );
  assert.doesNotMatch(gitignore, /^\.env\.production$/m);
});

test('client prefers modern publishable config and retains legacy anon compatibility', () => {
  assert.match(
    envSource,
    /export const SUPABASE_URL = clean\(env\.EXPO_PUBLIC_SUPABASE_URL\)/,
  );
  assert.match(
    envSource,
    /clean\(env\.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY\)[\s\S]*clean\(env\.EXPO_PUBLIC_SUPABASE_ANON_KEY\)/,
  );

  const publishableIndex = envSource.indexOf('clean(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  const legacyIndex = envSource.indexOf('clean(env.EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  assert.notEqual(publishableIndex, -1);
  assert.notEqual(legacyIndex, -1);
  assert.equal(publishableIndex < legacyIndex, true);
});

test('production config contains only public client values', () => {
  assert.doesNotMatch(productionEnv, /sb_secret_/i);
  assert.doesNotMatch(productionEnv, /SUPABASE_SERVICE_ROLE_KEY/i);
  assert.doesNotMatch(productionEnv, /OPENAI_API_KEY/i);
  assert.doesNotMatch(productionEnv, /SEKRET_CLIENT_TOKEN/i);
  assert.match(productionEnv, /Never add server secrets here/);
});

test('Supabase readiness uses the resolved Expo public values', () => {
  assert.match(envSource, /isSupabaseReady = Boolean\(SUPABASE_URL && SUPABASE_ANON\)/);
  assert.match(supabaseSource, /export const isSupabaseConfigured = isSupabaseReady/);
  assert.match(supabaseSource, /createClient\(SUPABASE_URL, SUPABASE_ANON/);
});
