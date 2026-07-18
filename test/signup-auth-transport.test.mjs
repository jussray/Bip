import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const signupSource = fs.readFileSync(
  new URL('../app/(auth)/signup.tsx', import.meta.url),
  'utf8',
);

const smokeSource = fs.readFileSync(
  new URL('../e2e/smoke.spec.ts', import.meta.url),
  'utf8',
);

test('signup translates returned and thrown auth transport failures', () => {
  assert.match(signupSource, /normalized\.includes\('failed to fetch'\)/);
  assert.match(signupSource, /normalized\.includes\('fetch failed'\)/);
  assert.match(signupSource, /normalized\.includes\('network request failed'\)/);
  assert.match(
    signupSource,
    /Could not reach the account server\. Check your connection, then try again\./,
  );

  for (const errorName of ['sessionError', 'upgradeError', 'refreshError', 'authErr']) {
    assert.doesNotMatch(
      signupSource,
      new RegExp(`setError\\(${errorName}\\.message\\)`),
      `${errorName} must pass through readableAuthError()`,
    );
    assert.match(
      signupSource,
      new RegExp(`setError\\(readableAuthError\\(${errorName}\\)\\)`),
      `${errorName} must pass through readableAuthError()`,
    );
  }

  assert.match(signupSource, /catch \(caught\) \{\s*setError\(readableAuthError\(caught\)\)/);
});

test('Playwright probes auth reachability without creating a production account', () => {
  assert.match(smokeSource, /\/auth\/v1\/settings/);
  assert.match(smokeSource, /method: 'GET'/);
  assert.match(smokeSource, /expect\(probe\.status\)\.toBe\(200\)/);

  assert.match(smokeSource, /page\.route\('\*\*\/auth\/v1\/signup'/);
  assert.match(smokeSource, /route => route\.abort\('failed'\)/);
  assert.match(smokeSource, /playwright-network-probe@example\.invalid/);
  assert.match(
    smokeSource,
    /Could not reach the account server\. Check your connection, then try again\./,
  );
  assert.match(smokeSource, /getByText\(\/\^Failed to fetch\$\/i\)/);
});
