import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ONBOARDING_WRITE_MAX_RETRIES,
  classifyOnboardingZeroRow,
  nextOnboardingWriteAttempt,
} from '../services/onboardingWriteRetry.mjs';

test('a concurrent winner satisfies the requested stage without another write', () => {
  assert.equal(classifyOnboardingZeroRow(11, 7), 'satisfied');
  assert.equal(classifyOnboardingZeroRow(7, 7), 'satisfied');
});

test('an unchanged lower stage is classified for retry', () => {
  assert.equal(classifyOnboardingZeroRow(3, 7), 'retry');
});

test('unchanged-stage retries stop at the configured bound', () => {
  let attempt = 0;
  for (let index = 0; index < ONBOARDING_WRITE_MAX_RETRIES; index += 1) {
    attempt = nextOnboardingWriteAttempt(attempt);
  }

  assert.equal(attempt, ONBOARDING_WRITE_MAX_RETRIES);
  assert.throws(
    () => nextOnboardingWriteAttempt(attempt),
    /did not advance after bounded retries/,
  );
});

test('invalid retry counters fail explicitly', () => {
  assert.throws(() => nextOnboardingWriteAttempt(-1), /Invalid onboarding write retry attempt/);
  assert.throws(() => nextOnboardingWriteAttempt(0.5), /Invalid onboarding write retry attempt/);
});
