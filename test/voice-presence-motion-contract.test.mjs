import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const avatar = fs.readFileSync('components/PresenceAvatar.tsx', 'utf8');
const reducedMotionHook = fs.readFileSync('hooks/useReducedMotion.ts', 'utf8');
const motionContract = fs.readFileSync('src/motion/presenceMotion.ts', 'utf8');

test('Voice Bip presence follows the live platform reduced-motion preference', () => {
  assert.match(reducedMotionHook, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(reducedMotionHook, /reduceMotionChanged/);
  assert.match(avatar, /const shouldAnimate = animate && !reduceMotion/);
  assert.match(avatar, /if \(!shouldAnimate\)/);
});

test('Voice Bip state crossfades use one shared timing authority', () => {
  assert.match(motionContract, /stateCrossfadeMs:\s*420/);
  assert.match(avatar, /PRESENCE_MOTION\.stateCrossfadeMs/);
  assert.doesNotMatch(avatar, /duration:\s*420/);
});

test('Voice Bip exposes the presence layer for real browser motion proof', () => {
  assert.match(avatar, /testID="voice-presence-avatar"/);
  assert.match(avatar, /testID="voice-presence-avatar-live"/);
});
