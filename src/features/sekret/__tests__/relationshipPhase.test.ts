/**
 * Unit tests for relationshipPhase.ts
 *
 * Covers:
 *   - Phase transitions at correct memory thresholds
 *   - ‘reflective’ requires ≥10 memories + reflection + zero contradictions
 *   - ‘reflective’ cannot be reached on sparse or empty memory state
 *   - ‘reflective’ cannot be reached when contradictions > 0
 *   - ‘deep’ is returned correctly for 30+ memories
 */

import { deriveRelationshipPhase } from '../relationshipPhase';

describe('deriveRelationshipPhase()', () => {
  describe('new', () => {
    it('returns new with 0 memories', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 0, reflectionRunCount: 0, contradictions: 0 })).toBe('new');
    });

    it('returns new with 0 memories even if a reflection was run (sparse state)', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 0, reflectionRunCount: 5, contradictions: 0 })).toBe('new');
    });
  });

  describe('building', () => {
    it('returns building with 1 memory', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 1, reflectionRunCount: 0, contradictions: 0 })).toBe('building');
    });

    it('returns building with 9 memories', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 9, reflectionRunCount: 0, contradictions: 0 })).toBe('building');
    });

    it('building with a reflection run does not skip to reflective', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 5, reflectionRunCount: 3, contradictions: 0 })).toBe('building');
    });
  });

  describe('established', () => {
    it('returns established with 10 memories, no reflection', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 10, reflectionRunCount: 0, contradictions: 0 })).toBe('established');
    });

    it('returns established with 29 memories, no reflection', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 29, reflectionRunCount: 0, contradictions: 0 })).toBe('established');
    });

    it('returns established with 10 memories and contradictions even if reflection ran', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 10, reflectionRunCount: 1, contradictions: 2 })).toBe('established');
    });
  });

  describe('reflective', () => {
    it('returns reflective with 10 memories + 1 reflection + 0 contradictions', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 10, reflectionRunCount: 1, contradictions: 0 })).toBe('reflective');
    });

    it('returns reflective with 25 memories + reflection + 0 contradictions', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 25, reflectionRunCount: 2, contradictions: 0 })).toBe('reflective');
    });

    it('does NOT return reflective when contradictions > 0', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 15, reflectionRunCount: 1, contradictions: 1 })).not.toBe('reflective');
    });

    it('does NOT return reflective when reflectionRunCount is 0', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 15, reflectionRunCount: 0, contradictions: 0 })).not.toBe('reflective');
    });

    it('does NOT return reflective on 0 memories even with many reflections', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 0, reflectionRunCount: 99, contradictions: 0 })).not.toBe('reflective');
    });

    it('does NOT return reflective on 9 memories (below threshold)', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 9, reflectionRunCount: 1, contradictions: 0 })).not.toBe('reflective');
    });
  });

  describe('deep', () => {
    it('returns deep with exactly 30 memories, no reflection', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 30, reflectionRunCount: 0, contradictions: 0 })).toBe('deep');
    });

    it('returns deep with 100 memories', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 100, reflectionRunCount: 0, contradictions: 0 })).toBe('deep');
    });

    it('30+ memories with reflection and contradictions returns deep, not reflective', () => {
      // deep takes priority — reflective is only reachable at 10–29
      expect(deriveRelationshipPhase({ durableMemoryCount: 35, reflectionRunCount: 3, contradictions: 0 })).toBe('deep');
    });
  });

  describe('boundary conditions', () => {
    it('threshold at exactly 10: no reflection → established', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 10, reflectionRunCount: 0, contradictions: 0 })).toBe('established');
    });

    it('threshold at exactly 10: with reflection, no contradictions → reflective', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 10, reflectionRunCount: 1, contradictions: 0 })).toBe('reflective');
    });

    it('threshold at exactly 30 → deep (not established or reflective)', () => {
      expect(deriveRelationshipPhase({ durableMemoryCount: 30, reflectionRunCount: 1, contradictions: 0 })).toBe('deep');
    });
  });
});
