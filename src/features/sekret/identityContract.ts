/**
 * identityContract.ts — RUNTIME CONTRACT
 *
 * Canonical rules for the Oracle ↔ Se’kret identity split.
 * This is the single source of truth for any code that needs to
 * produce or validate a user-facing AI identity string.
 *
 * Rules:
 *   1. Oracle is the internal reasoning layer. It NEVER appears onscreen.
 *   2. Se’kret is the visible emotional presence. She is NOT Raylene.
 *   3. Se’kret is NOT a selectable companion in the companion picker.
 *   4. All user-facing surfaces (labels, headers, TTS, loading states,
 *      archive screens, notifications) must use Se’kret’s name —
 *      never “Oracle”, “AI”, or any companion name.
 *   5. oracle → Se’kret mapping is one-way. Se’kret never reveals Oracle.
 *
 * Agent skill: .agents/skills/bip-sekret-identity/SKILL.md
 */

export const VISIBLE_AI_NAME = "Se'kret" as const;
export const INTERNAL_REASONING_NAME = 'Oracle' as const;

/**
 * Returns the name that must appear on any user-facing surface.
 * Never call this function and then override the result.
 */
export function getVisibleIdentity(): typeof VISIBLE_AI_NAME {
  return VISIBLE_AI_NAME;
}

/**
 * Asserts that a display string does not contain the internal reasoning name.
 * Throws in development; logs a warning in production.
 *
 * Call this wherever code constructs a string that will be shown to the user.
 */
export function assertNoOracleLeak(displayName: string): void {
  if (displayName.toLowerCase().includes(INTERNAL_REASONING_NAME.toLowerCase())) {
    const msg =
      `[identityContract] Identity leak: "${displayName}" exposes` +
      ` "${INTERNAL_REASONING_NAME}". Use "${VISIBLE_AI_NAME}" instead.`;
    if (__DEV__) throw new Error(msg);
    console.warn(msg);
  }
}

/**
 * Returns true if the given surfaceId is a Se’kret-visible surface —
 * i.e., a context where Se’kret’s name and presence SHOULD appear.
 *
 * Contrast: companion picker surfaces should return FALSE here because
 * Se’kret must not be listed alongside the four named companions.
 *
 * Named deliberately: isSekretVisibleSurface (not isSekretSurface).
 */
export function isSekretVisibleSurface(surfaceId: string): boolean {
  return surfaceId === 'sekret-chat' || surfaceId === 'sekret-archive';
}

/**
 * Returns true if Se’kret’s identity should be SUPPRESSED on this surface.
 * Use this to guard companion-picker and companion-list rendering.
 */
export function shouldSuppressSekretIdentity(surfaceId: string): boolean {
  return surfaceId === 'companion-picker' || surfaceId === 'companion-list';
}
