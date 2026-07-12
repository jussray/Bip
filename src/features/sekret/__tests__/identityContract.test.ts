/**
 * Unit tests for identityContract.ts
 *
 * Covers:
 *   - Oracle → Se’kret mapping
 *   - No Oracle display leakage
 *   - Surface suppression logic
 */

import {
  getVisibleIdentity,
  assertNoOracleLeak,
  isSekretVisibleSurface,
  shouldSuppressSekretIdentity,
  VISIBLE_AI_NAME,
  INTERNAL_REASONING_NAME,
} from '../identityContract';

describe('identityContract', () => {
  describe('getVisibleIdentity()', () => {
    it('returns the visible AI name', () => {
      expect(getVisibleIdentity()).toBe("Se'kret");
    });

    it('never returns the internal reasoning name', () => {
      expect(getVisibleIdentity()).not.toBe('Oracle');
    });

    it('returns the VISIBLE_AI_NAME constant', () => {
      expect(getVisibleIdentity()).toBe(VISIBLE_AI_NAME);
    });
  });

  describe('assertNoOracleLeak()', () => {
    const OLD_DEV = global.__DEV__;
    beforeEach(() => { (global as any).__DEV__ = true; });
    afterEach(() => { (global as any).__DEV__ = OLD_DEV; });

    it('throws in dev when display name contains the internal name', () => {
      expect(() => assertNoOracleLeak('Oracle is typing…')).toThrow();
    });

    it('throws case-insensitively', () => {
      expect(() => assertNoOracleLeak('oracle')).toThrow();
      expect(() => assertNoOracleLeak('ORACLE')).toThrow();
    });

    it('does not throw for clean Se’kret display strings', () => {
      expect(() => assertNoOracleLeak("Se'kret is here for you.")).not.toThrow();
    });

    it('does not throw for companion names', () => {
      expect(() => assertNoOracleLeak('Raylene')).not.toThrow();
      expect(() => assertNoOracleLeak('Rylane')).not.toThrow();
      expect(() => assertNoOracleLeak('Cloud')).not.toThrow();
      expect(() => assertNoOracleLeak('Night')).not.toThrow();
    });

    it('INTERNAL_REASONING_NAME constant is Oracle', () => {
      expect(INTERNAL_REASONING_NAME).toBe('Oracle');
    });
  });

  describe('isSekretVisibleSurface()', () => {
    it('returns true for sekret-chat', () => {
      expect(isSekretVisibleSurface('sekret-chat')).toBe(true);
    });

    it('returns true for sekret-archive', () => {
      expect(isSekretVisibleSurface('sekret-archive')).toBe(true);
    });

    it('returns false for companion-picker', () => {
      expect(isSekretVisibleSurface('companion-picker')).toBe(false);
    });

    it('returns false for companion-list', () => {
      expect(isSekretVisibleSurface('companion-list')).toBe(false);
    });

    it('returns false for an unrelated surface', () => {
      expect(isSekretVisibleSurface('home-feed')).toBe(false);
    });
  });

  describe('shouldSuppressSekretIdentity()', () => {
    it('returns true for companion-picker', () => {
      expect(shouldSuppressSekretIdentity('companion-picker')).toBe(true);
    });

    it('returns true for companion-list', () => {
      expect(shouldSuppressSekretIdentity('companion-list')).toBe(true);
    });

    it('returns false for sekret-chat', () => {
      expect(shouldSuppressSekretIdentity('sekret-chat')).toBe(false);
    });

    it('returns false for unrelated surfaces', () => {
      expect(shouldSuppressSekretIdentity('home-feed')).toBe(false);
    });

    it('isSekretVisibleSurface and shouldSuppressSekretIdentity are mutually exclusive for known surfaces', () => {
      const allKnown = ['sekret-chat', 'sekret-archive', 'companion-picker', 'companion-list'];
      for (const s of allKnown) {
        expect(isSekretVisibleSurface(s) && shouldSuppressSekretIdentity(s)).toBe(false);
      }
    });
  });
});
