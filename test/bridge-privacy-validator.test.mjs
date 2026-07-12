import assert from 'node:assert/strict';
import test from 'node:test';

// worker/bridge-privacy-validator.ts has zero imports, so node's native TS
// type-stripping can load it directly — these tests exercise the real
// validator logic, not a regex match against the source file.
const {
  isGeneratedSummary,
  passesPrivacyValidator,
  containsClinicalLanguage,
  leaksSourceContent,
  normalizeWords,
  ngramSet,
  isBridgeSummariesRolloutAllowed,
  MAX_THEME_LEN,
} = await import('../worker/bridge-privacy-validator.ts');

const VALID_SUMMARY = {
  themes: ['feeling caught between what other people expect and what they actually want'],
  conversationStarters: ['Is there something on your mind you want to talk through together?'],
  limitations: 'This is a generated summary, not the full private content, a diagnosis, or proof of what happened.',
};

test('isGeneratedSummary accepts a well-shaped summary', () => {
  assert.equal(isGeneratedSummary(VALID_SUMMARY), true);
});

test('isGeneratedSummary rejects missing or wrongly-typed fields', () => {
  assert.equal(isGeneratedSummary({}), false);
  assert.equal(isGeneratedSummary({ themes: [], conversationStarters: ['x'], limitations: 'y' }), false);
  assert.equal(isGeneratedSummary({ themes: ['x'], conversationStarters: 'not-an-array', limitations: 'y' }), false);
  assert.equal(isGeneratedSummary({ themes: ['x'], conversationStarters: ['y'], limitations: '' }), false);
  assert.equal(isGeneratedSummary(null), false);
});

test('passesPrivacyValidator accepts a valid summary with unrelated snippets', () => {
  const snippets = ['[journal entry, mood: sad] I hate my math teacher and I bombed the quiz today.'];
  assert.equal(passesPrivacyValidator(VALID_SUMMARY, snippets), true);
});

test('passesPrivacyValidator rejects too many themes or conversation starters', () => {
  const tooManyThemes = { ...VALID_SUMMARY, themes: ['a', 'b', 'c', 'd'] };
  const tooManyStarters = { ...VALID_SUMMARY, conversationStarters: ['a', 'b', 'c'] };
  assert.equal(passesPrivacyValidator(tooManyThemes, []), false);
  assert.equal(passesPrivacyValidator(tooManyStarters, []), false);
});

test('passesPrivacyValidator rejects oversized fields', () => {
  const overLong = { ...VALID_SUMMARY, themes: ['x'.repeat(MAX_THEME_LEN + 1)] };
  assert.equal(passesPrivacyValidator(overLong, []), false);
});

test('passesPrivacyValidator accepts the required "not a diagnosis" disclaimer in limitations', () => {
  // Regression: the disclaimer legitimately negates "diagnosis" — clinical
  // screening must not apply to the limitations field, only to themes and
  // conversationStarters (the actual content-about-the-teen fields).
  const withDisclaimer = {
    ...VALID_SUMMARY,
    limitations: 'This is a generated summary, not the teen’s full private content, a diagnosis, or proof of what happened.',
  };
  assert.equal(passesPrivacyValidator(withDisclaimer, []), true);
});

test('passesPrivacyValidator rejects clinical/diagnostic language', () => {
  const clinical = {
    themes: ['signs consistent with anxiety and depression'],
    conversationStarters: ['Have you talked to anyone about your trauma?'],
    limitations: 'Generated summary.',
  };
  assert.equal(passesPrivacyValidator(clinical, []), false);
});

test('passesPrivacyValidator rejects near-verbatim leakage of the source text', () => {
  const snippets = ['I hate my math teacher and I bombed the quiz today because I never studied at all this week.'];
  const leaking = {
    themes: ['I hate my math teacher and I bombed the quiz today because I never studied'],
    conversationStarters: ['Want to talk about school?'],
    limitations: 'Generated summary.',
  };
  assert.equal(passesPrivacyValidator(leaking, snippets), false);
});

test('leaksSourceContent is false when there is no 7-word overlap', () => {
  const sourceGrams = ngramSet(normalizeWords('I hate my math teacher and I bombed the quiz today'), 7);
  assert.equal(leaksSourceContent('Something about school has been on their mind lately', sourceGrams), false);
});

test('containsClinicalLanguage matches whole words only, not substrings', () => {
  assert.equal(containsClinicalLanguage('feeling anxious about the test'), true);
  assert.equal(containsClinicalLanguage('a transformative moment'), false); // must not false-positive on substrings
});

test('isBridgeSummariesRolloutAllowed defaults to allowed when unset', () => {
  assert.equal(isBridgeSummariesRolloutAllowed({}, 'user-1'), true);
  assert.equal(isBridgeSummariesRolloutAllowed({ BRIDGE_SUMMARIES_ROLLOUT: 'enabled' }, 'user-1'), true);
});

test('isBridgeSummariesRolloutAllowed blocks everyone when disabled', () => {
  assert.equal(isBridgeSummariesRolloutAllowed({ BRIDGE_SUMMARIES_ROLLOUT: 'disabled' }, 'user-1'), false);
});

test('isBridgeSummariesRolloutAllowed only allows listed user IDs in cohort mode', () => {
  const env = { BRIDGE_SUMMARIES_ROLLOUT: 'user-1, user-2' };
  assert.equal(isBridgeSummariesRolloutAllowed(env, 'user-1'), true);
  assert.equal(isBridgeSummariesRolloutAllowed(env, 'user-2'), true);
  assert.equal(isBridgeSummariesRolloutAllowed(env, 'user-3'), false);
});
