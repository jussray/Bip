import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const vibe = readFileSync(new URL('../tools/figma-vibe-builder/README.md', import.meta.url), 'utf8');
const arrival = readFileSync(new URL('../src/components/FrontDoorSceneArrival.tsx', import.meta.url), 'utf8');
const motion = readFileSync(new URL('../src/motion/frontDoorMotion.ts', import.meta.url), 'utf8');

describe('Se’kret Bip Visual Wonder contract', () => {
  it('requires nonliteral, family-first wonder instead of generic AI/dashboard visual language', () => {
    expect(vibe).toMatch(/family-first emotional worldbuilding/i);
    expect(vibe).toMatch(/explanatory UI as support, not the visual idea itself/i);
    expect(vibe).toMatch(/Never turn Se’kret Bip into generic “AI neon,” dashboard UI/i);
    expect(vibe).toMatch(/If the answer to the last question is “any AI product,” the visual is not done/i);
  });

  it('defines Attack 2000 as concept + rendered-artifact falsification rather than fake test-count theater', () => {
    expect(vibe).toMatch(/Attack 2000.*two falsification passes/i);
    expect(vibe).toMatch(/not a claim that 2,000 external tests ran/i);
    expect(vibe).toMatch(/Pass 1 — concept attack/i);
    expect(vibe).toMatch(/Pass 2 — rendered artifact attack/i);
  });

  it('keeps the current arrival visual-first, temporary, accessible, and reduced-motion aware', () => {
    expect(arrival).toContain('testID="web-welcome-caveman-visual"');
    expect(arrival).toContain('You. Your space. Enter.');
    expect(arrival).toContain("prefers-reduced-motion: reduce");
    expect(arrival).toMatch(/arrivalState === 'entering'/);
    expect(arrival).toMatch(/arrivalState !== 'entering'/);
    expect(motion).toMatch(/arrivalDurationMs/);
  });

  it('keeps product truth and human dignity inside the beauty gate', () => {
    expect(vibe).toMatch(/Product truth must stay legible inside the beauty/i);
    expect(vibe).toMatch(/dignity, choice, privacy, and emotional safety/i);
    expect(vibe).toMatch(/truthful but visually dead experience is incomplete/i);
  });
});
