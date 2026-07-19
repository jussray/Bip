import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('age assurance model keeps age proof privacy-minimal and blocks under-13 teen entry', async () => {
  const model = await read('src/features/onboarding/ageAssurance.ts');

  assert.match(model, /AgeVerificationStatus/);
  assert.match(model, /'guardian_required'/);
  assert.match(model, /'third_party_required'/);
  assert.match(model, /'blocked'/);
  assert.match(model, /id:\s*'under-13'/);
  assert.match(model, /allowed:\s*false/);
  assert.match(model, /nextRoute:\s*'\/\(onboarding\)\/parent-splash'/);
  assert.match(model, /rawEvidenceStored:\s*'bip_age_raw_evidence_stored'/);

  assert.doesNotMatch(model, /raw_id|id_image|selfie_video|face_scan|date_of_birth|full_dob/i);
});

test('age onboarding screen stores assurance metadata instead of raw evidence', async () => {
  const screen = await read('app/(onboarding)/age.tsx');

  assert.match(screen, /decideAgeAssurance/);
  assert.match(screen, /AGE_ASSURANCE_STORAGE_KEYS\.status/);
  assert.match(screen, /AGE_ASSURANCE_STORAGE_KEYS\.method/);
  assert.match(screen, /AGE_ASSURANCE_STORAGE_KEYS\.guardianRequired/);
  assert.match(screen, /AGE_ASSURANCE_STORAGE_KEYS\.rawEvidenceStored, 'false'/);
  assert.match(screen, /age_verification_status/);
  assert.match(screen, /age_verification_method/);
  assert.match(screen, /guardian_required/);
  assert.match(screen, /raw_evidence_stored:\s*false/);

  assert.doesNotMatch(screen, /upload.*id|selfie|video.*proof|date of birth/i);
});
