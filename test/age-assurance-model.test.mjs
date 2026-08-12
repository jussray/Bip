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

  // Privacy copy may plainly say what Bip does *not* collect. Guard concrete
  // collection/storage mechanisms instead of rejecting that explanatory text.
  for (const forbiddenImplementation of [
    /expo-(image-picker|camera|document-picker)/i,
    /launch(ImageLibrary|Camera)|requestCameraPermissions/i,
    /raw[_A-Z]?id|id[_A-Z]?image|selfie[_A-Z]?video|face[_A-Z]?scan/i,
    /date[_A-Z]?of[_A-Z]?birth|full[_A-Z]?dob/i,
  ]) {
    assert.doesNotMatch(screen, forbiddenImplementation);
  }
});

test('welcome is a one-page onboarding entry without bypassing age assurance', async () => {
  const welcome = await read('app/(onboarding)/welcome.tsx');

  assert.match(welcome, /One page/);
  assert.match(welcome, /AGE_OPTIONS/);
  assert.match(welcome, /decideAgeAssurance/);
  assert.match(welcome, /persistDecision/);
  assert.match(welcome, /AGE_ASSURANCE_STORAGE_KEYS\.rawEvidenceStored, 'false'/);
  assert.match(welcome, /advance\('age_verified'/);
  assert.match(welcome, /guardian_required/);
  assert.match(welcome, /router\.push\(decision\.nextRoute as never\)/);
  assert.match(welcome, /handleParent/);

  assert.doesNotMatch(welcome, /router\.push\('\/\(onboarding\)\/age'/);
  for (const forbiddenImplementation of [
    /expo-(image-picker|camera|document-picker)/i,
    /launch(ImageLibrary|Camera)|requestCameraPermissions/i,
    /raw[_A-Z]?id|id[_A-Z]?image|selfie[_A-Z]?video|face[_A-Z]?scan/i,
    /date[_A-Z]?of[_A-Z]?birth|full[_A-Z]?dob/i,
  ]) {
    assert.doesNotMatch(welcome, forbiddenImplementation);
  }
});

test('onboarding documentation and ledger describe the one-page shell without claiming production proof', async () => {
  const docs = await read('ONBOARDING.md');
  const ledger = await read('implementation-ledger.extensions/auth-onboarding-runtime.json');

  assert.match(docs, /one-page entry/i);
  assert.match(docs, /UX shell, not a single unchecked backend event/i);
  assert.match(docs, /raw_evidence_stored = false/);
  assert.match(docs, /legal, privacy, storage, deletion, and vendor review/);

  assert.match(ledger, /one-page age\/account-side choice/);
  assert.match(ledger, /app\/\(onboarding\)\/welcome\.tsx/);
  assert.match(ledger, /src\/features\/onboarding\/ageAssurance\.ts/);
  assert.match(ledger, /test\/age-assurance-model\.test\.mjs/);
  assert.match(ledger, /"state":\s*"not-run"/);
});
