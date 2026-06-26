/**
 * Compatibility re-export for legacy screen imports.
 *
 * Canonical API helpers live in src/utils/api.ts. Some older screens still
 * import from ../utils/api, so this file forwards those exports until the
 * route cleanup removes the legacy path.
 */
export * from '../src/utils/api';
