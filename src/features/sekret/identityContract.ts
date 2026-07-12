/**
 * identityContract.ts — RUNTIME MODULE
 *
 * Canonical rules for the Oracle ↔ Se'kret identity split.
 * Control Room reads violations from here — it does not define them.
 *
 * Rules:
 *   1. Oracle is the AI reasoning layer. It NEVER appears onscreen.
 *   2. Se'kret is the visible emotional presence. She is not Raylene.
 *   3. Se'kret is NOT a fifth selectable companion in the companion list.
 *   4. All accessibility labels, reply headers, TTS, and loading states
 *      must use "Se'kret" — never "Oracle", "AI", or a companion name.
 *   5. oracle → Se'kret mapping is one-way. Se'kret never exposes Oracle.
 */

export const VISIBLE_AI_NAME = "Se'kret" as const;
export const INTERNAL_REASONING_NAME = 'Oracle' as const;

/**
 * Returns the name that should appear on any user-facing surface.
 * Never returns the internal reasoning name.
 */
export function getVisibleIdentity(): typeof VISIBLE_AI_NAME {
  return VISIBLE_AI_NAME;
}

/**
 * Asserts that a given display name does not leak the internal identity.
 * Throws in development; logs a warning in production.
 */
export function assertNoOracleLeak(displayName: string): void {
  if (displayName.toLowerCase().includes(INTERNAL_REASONING_NAME.toLowerCase())) {
    const msg = `[identityContract] Identity leak detected: "${displayName}" contains "${INTERNAL_REASONING_NAME}". Use "${VISIBLE_AI_NAME}" instead.`;
    if (__DEV__) throw new Error(msg);
    console.warn(msg);
  }
}

/**
 * Returns true if Se'kret should be suppressed from a given surface.
 * Se'kret must never appear as a selectable companion in the companion picker.
 */
export function isSekretSurface(surfaceId: string): boolean {
  return surfaceId === 'sekret-chat' || surfaceId === 'sekret-archive';
}
