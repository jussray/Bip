import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const screen = fs.readFileSync(new URL('../screens/WebWelcomeScreen.tsx', import.meta.url), 'utf8');
const arrival = fs.readFileSync(new URL('../src/components/FrontDoorSceneArrival.tsx', import.meta.url), 'utf8');
const entrypoint = fs.readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
const contract = fs.readFileSync(new URL('../src/motion/frontDoorMotion.ts', import.meta.url), 'utf8');

test('web welcome uses the shared front-door motion contract', () => {
  assert.match(screen, /FRONT_DOOR_MOTION/);
  assert.match(screen, /pulseDurationMs/);
  assert.match(screen, /driftDurationMs/);
  assert.match(screen, /reducedPulseRestValue/);
  assert.match(contract, /ambientOpacity/);
  assert.match(contract, /heroTranslateY/);
  assert.match(contract, /sparkRotate/);
});

test('canonical front door arrives as one scene before ambient motion continues', () => {
  assert.match(entrypoint, /FrontDoorSceneArrival/);
  assert.match(entrypoint, /<FrontDoorSceneArrival>/);
  assert.match(arrival, /web-welcome-scene-arrival/);
  assert.match(arrival, /arrivalDurationMs/);
  assert.match(arrival, /arrivalOpacity/);
  assert.match(arrival, /arrivalTranslateY/);
  assert.match(arrival, /arrivalScale/);
  assert.match(contract, /arrivalDurationMs: 1100/);
  assert.match(contract, /arrivalOpacity: \[0\.18, 1\]/);
  assert.match(contract, /arrivalTranslateY: \[28, 0\]/);
  assert.match(contract, /arrivalScale: \[0\.985, 1\]/);
});

test('reduced motion fails safe before decorative or arrival motion starts', () => {
  assert.match(screen, /const motionEnabled = reduceMotion === false/);
  assert.match(screen, /isReduceMotionEnabled\(\)/);
  assert.match(screen, /setReduceMotion\(true\)/);
  assert.match(arrival, /prefersReducedMotionOnFirstFrame/);
  assert.match(arrival, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(arrival, /progress\.setValue\(1\)/);
  assert.match(arrival, /setArrivalState\('reduced'\)/);
});
