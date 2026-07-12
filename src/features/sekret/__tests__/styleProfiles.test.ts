/**
 * Unit tests for styleProfiles.ts
 *
 * Covers:
 *   - Se’kret excluded from NamedCompanionId (type-level enforced via getNamedCompanionProfiles)
 *   - Question budgets per companion
 *   - Se’kret always has slangLevel 0 and questionBudget 0
 *   - No companion shares identical systemPromptSnippet
 *   - getNamedCompanionProfiles never returns Se’kret
 */

import {
  getStyleProfile,
  getAllStyleProfiles,
  getNamedCompanionProfiles,
} from '../styleProfiles';

describe('styleProfiles', () => {
  describe('Se’kret is not a named companion', () => {
    it('getNamedCompanionProfiles does not include sekret', () => {
      const named = getNamedCompanionProfiles();
      const ids = named.map((p) => p.id);
      expect(ids).not.toContain('sekret');
    });

    it('getNamedCompanionProfiles returns exactly four companions', () => {
      expect(getNamedCompanionProfiles()).toHaveLength(4);
    });

    it('getNamedCompanionProfiles returns raylene, rylane, cloud, night', () => {
      const ids = getNamedCompanionProfiles().map((p) => p.id);
      expect(ids).toEqual(expect.arrayContaining(['raylene', 'rylane', 'cloud', 'night']));
    });
  });

  describe('question budgets', () => {
    it('raylene has questionBudget 1', () => {
      expect(getStyleProfile('raylene').questionBudget).toBe(1);
    });

    it('rylane has questionBudget 1', () => {
      expect(getStyleProfile('rylane').questionBudget).toBe(1);
    });

    it('cloud has questionBudget 0', () => {
      expect(getStyleProfile('cloud').questionBudget).toBe(0);
    });

    it('night has questionBudget 1', () => {
      expect(getStyleProfile('night').questionBudget).toBe(1);
    });

    it("se'kret has questionBudget 0", () => {
      expect(getStyleProfile('sekret').questionBudget).toBe(0);
    });
  });

  describe("Se'kret style constraints", () => {
    it('sekret slangLevel is 0', () => {
      expect(getStyleProfile('sekret').slangLevel).toBe(0);
    });

    it('sekret warmthScore is 10', () => {
      expect(getStyleProfile('sekret').warmthScore).toBe(10);
    });

    it('sekret displayName is exactly Se\'kret', () => {
      expect(getStyleProfile('sekret').displayName).toBe("Se'kret");
    });
  });

  describe('companion distinctness', () => {
    it('no two presences share identical systemPromptSnippet', () => {
      const snippets = getAllStyleProfiles().map((p) => p.systemPromptSnippet);
      const unique = new Set(snippets);
      expect(unique.size).toBe(snippets.length);
    });

    it('no two presences share identical textStyleSample', () => {
      const samples = getAllStyleProfiles().map((p) => p.textStyleSample);
      const unique = new Set(samples);
      expect(unique.size).toBe(samples.length);
    });

    it('all profiles have a non-empty displayName', () => {
      getAllStyleProfiles().forEach((p) => {
        expect(p.displayName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getAllStyleProfiles()', () => {
    it('returns 5 profiles total (4 companions + sekret)', () => {
      expect(getAllStyleProfiles()).toHaveLength(5);
    });
  });
});
