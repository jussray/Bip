import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const screen = fs.readFileSync(new URL('../screens/WebWelcomeScreen.tsx', import.meta.url), 'utf8');
const contract = fs.readFileSync(new URL('../src/motion/frontDoorMotion.ts', import.meta.url), 'utf8');

test('web welcome uses the shared front-door motion contract', () => {
  assert.match(screen, /FRONT_DOOR_MOTION/);
  assert.match(screen, /introProgress/);
  assert.match(screen, /pulseDurationMs/);
  assert.match(screen, /driftDurationMs/);
  assert.match(screen, /reducedPulseRestValue/);
  assert.match(contract, /introApproachDurationMs/);
  assert.match(contract, /introSettleDurationMs/);
  assert.match(contract, /introHeroTranslateY/);
  assert.match(contract, /ambientOpacity/);
  assert.match(contract, /sparkRotate/);
});

test('canonical hero settles while only the surrounding world keeps breathing', () => {
  assert.match(screen, /translateY: introProgress\.interpolate/);
  assert.match(screen, /translateY: worldDrift\.interpolate/);
  assert.match(screen, /web-welcome-motion-settled/);
  assert.doesNotMatch(screen, /heroDrift/);
});

test('reduced motion fails safe before decorative motion starts', () => {
  assert.match(screen, /const motionEnabled = reduceMotion === false/);
  assert.match(screen, /prefers-reduced-motion: reduce/);
  assert.match(screen, /isReduceMotionEnabled\(\)/);
  assert.match(screen, /setReduceMotion\(true\)/);
});
