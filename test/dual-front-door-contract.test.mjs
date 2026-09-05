import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const welcome = readFileSync('screens/WebWelcomeScreen.tsx', 'utf8');
const theme = readFileSync('constants/frontDoorTheme.ts', 'utf8');
const index = readFileSync('app/index.tsx', 'utf8');

test('teen front door keeps canonical accessible names without a visible caption', () => {
  assert.match(welcome, /sekret-bip-teen-family-v1\.jpg/);
  assert.doesNotMatch(welcome, />Suhana</);
  assert.doesNotMatch(welcome, /Suhanna/);
  assert.doesNotMatch(welcome, /namePill|nameText|nameDot/);
  assert.match(welcome, /Night on the left, Suhana in the center, Sy on the right/);
});

test('presentation audience is separate from account role', () => {
  assert.match(welcome, /export type WelcomeAudience = 'teen' \| 'bip-jr'/);
  assert.match(welcome, /welcomeAudienceForAccountSide\(side: AccountSide\)/);
  assert.match(welcome, /accountSideForWelcomeAudience\(audience: WelcomeAudience\)/);
  assert.match(welcome, /audienceOverride === 'teen' \|\| audienceOverride === 'bip-jr'/);
  assert.match(welcome, /legacySideOverride === 'teen' \|\| legacySideOverride === 'parent'/);
  assert.match(welcome, /const entrySide = accountSideForWelcomeAudience\(activeAudience\)/);
  assert.match(welcome, /onEnter\(entrySide\)/);
  assert.doesNotMatch(welcome, /const isBipJr = activeVariant === 'parent'/);
});

test('Bip Jr remains a separate welcome world while preserving role compatibility', () => {
  assert.match(welcome, /parent-space-splash\.png/);
  assert.match(welcome, /YOUR FAMILY\. YOUR SPACE\./);
  assert.match(welcome, /const isBipJr = activeAudience === 'bip-jr'/);
  assert.match(welcome, /bipDevAudience/);
  assert.match(welcome, /bipDevSide/);
  assert.match(index, /variant=\{publicWelcomeSide\}/);
});

test('public entry never collapses Teen and Bip Jr into one generic chooser', () => {
  assert.match(welcome, /testID="web-welcome-audience-switch"/);
  assert.match(welcome, /Looking for Bip Jr\. \+ Family\? →/);
  assert.match(welcome, /Looking for Teen space\? →/);
  assert.match(welcome, /setActiveAudience\(copy\.nextAudience\)/);
  assert.doesNotMatch(welcome, /I.?m Teen/);
  assert.doesNotMatch(welcome, /I.?m a Parent \/ Guardian/);
});

test('world cues deepen each welcome experience without adding role or safety claims', () => {
  assert.match(welcome, /testID="web-welcome-world-cues"/);
  assert.match(welcome, /start quiet/);
  assert.match(welcome, /stay close/);
  assert.match(welcome, /keep your space/);
  assert.match(welcome, /set up together/);
  assert.match(welcome, /stay connected/);
  assert.match(welcome, /room to grow/);
  assert.match(welcome, /accessibilityLabel=\{copy\.cueLabel\}/);
  assert.doesNotMatch(welcome, /you(?:’|'| a)re safe here|guaranteed private|completely private/i);
});

test('explicit Enter choice outranks preview and build defaults', () => {
  assert.match(index, /getDevSplitViewSideOverride/);
  assert.match(index, /const publicEntrySide: AccountSide = selectedEntrySide \?\? previewSide \?\? buildSide \?\? userSide \?\? 'teen'/);
  assert.match(index, /setSelectedEntrySide\(side\)/);
  assert.match(index, /publicEntrySide === 'parent' \? '\/\(onboarding\)\/parent-splash' : '\/\(onboarding\)\/welcome'/);
  assert.match(index, /signup\?side=\$\{publicEntrySide\}/);
});

test('front door consumes one canonical token extension instead of screen-local colors', () => {
  assert.match(welcome, /import \{ FRONT_DOOR_THEME \} from '@\/constants\/frontDoorTheme'/);
  assert.match(theme, /import \{ MOTION, RADIUS, SPACE, TYPE \} from '\.\/vibeColors'/);
  assert.match(theme, /heroSafeArea/);
  assert.match(theme, /teen:/);
  assert.match(theme, /bipJr:/);
  assert.doesNotMatch(welcome, /#[0-9A-Fa-f]{3,8}/);
  assert.doesNotMatch(welcome, /rgba\(/);
});

test('About is a real accessible action and sound-like decoration is not interactive', () => {
  assert.match(welcome, /testID="web-welcome-about"/);
  assert.match(welcome, /accessibilityState=\{\{ expanded: aboutOpen \}\}/);
  assert.match(welcome, /setAboutOpen\(value => !value\)/);
  assert.match(welcome, /testID="web-welcome-about-panel"/);
  assert.match(welcome, /importantForAccessibility="no-hide-descendants"/);
  assert.doesNotMatch(welcome, /accessibilityLabel="Welcome sound"/);
});

test('hero safe-area contract protects artwork from the primary action', () => {
  assert.match(welcome, /testID="web-welcome-hero-safe-area"/);
  assert.match(welcome, /heroContract\.bottomGap/);
  assert.match(welcome, /shortViewport/);
  assert.match(welcome, /heroContract\.shortHeight/);
  assert.match(welcome, /heroContract\.compactHeight/);
  assert.match(welcome, /heroContract\.desktopHeight/);
});

test('each preview audience uses one direct Enter control with truthful accessible copy', () => {
  assert.match(welcome, /testID="web-welcome-enter"/);
  assert.match(welcome, /Bip Jr family welcome — continue to family setup/);
  assert.match(welcome, /Se'kret Bip teen welcome — continue to age setup/);
  assert.match(welcome, /onPress=\{\(\) => onEnter\(entrySide\)\}/);
  assert.doesNotMatch(welcome, /web-welcome-enter-teen|web-welcome-enter-parent|web-welcome-bottom-nav/);
  assert.match(welcome, /accessibilityRole="button"/);
});

test('account-return action appears only after a clean no-session restoration result', () => {
  assert.match(welcome, /showSignIn\?: boolean/);
  assert.match(welcome, /showSignIn = false/);
  assert.match(welcome, /\{showSignIn && \(/);
  assert.match(welcome, /testID="web-welcome-sign-in"/);
  assert.match(welcome, /Already have an account\?/);
  assert.match(welcome, />Sign in</);
  assert.match(welcome, /router\.push\(`\/\(auth\)\/login\?side=\$\{entrySide\}` as never\)/);

  assert.match(index, /const canOfferSignIn = authChecked/);
  assert.match(index, /&& profileResolved/);
  assert.match(index, /&& !hasPermanentSession/);
  assert.match(index, /&& !requiresAccountUpgrade/);
  assert.match(index, /&& !bootstrapError/);
  assert.match(index, /showSignIn=\{canOfferSignIn\}/);
  assert.doesNotMatch(index, /showSignIn=\{true\}/);
});

test('primary entry language matches the approved front-door promise without absolute safety claims', () => {
  assert.match(welcome, /Enter Se’kret Bip/);
  assert.match(welcome, /Enter with a grown-up/);
  assert.doesNotMatch(welcome, />Night|>Suhana|>Sy/);
  assert.doesNotMatch(welcome, /safe little world|you’re safe here|enter your safe space/i);
});

test('a founder account gets its own front door instead of dead-ending in the teen or parent surface (#563)', () => {
  assert.match(index, /import \{ getCurrentFounderProfile, isFounderProfile \} from '@\/services\/founderAudit'/);
  assert.match(index, /const founderProfile = await getCurrentFounderProfile\(\)/);
  assert.match(index, /isFounderProfile\(founderProfile\)/);
  assert.match(index, /router\.replace\('\/\(dev\)\/control-room' as never\)/);

  const onboardingGateIndex = index.indexOf("accountProfile?.onboardingComplete");
  const founderCheckIndex = index.indexOf('getCurrentFounderProfile()');
  const parentBranchIndex = index.indexOf("accountProfile.accountSide === 'parent'");
  assert.ok(onboardingGateIndex !== -1 && founderCheckIndex !== -1 && parentBranchIndex !== -1);
  assert.ok(onboardingGateIndex < founderCheckIndex, 'founder check must run after the onboarding-complete gate');
  assert.ok(founderCheckIndex < parentBranchIndex, 'founder check must run before the parent/teen room routing');
  assert.match(index, /Founder-status lookup is a routing convenience only/);
});
