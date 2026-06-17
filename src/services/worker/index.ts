/**
 * src/services/worker/index.ts
 *
 * Cloudflare Worker API calls.
 * Extracted from inline fetch() calls in screens during Step 3.
 *
 * Base URL is read from EXPO_PUBLIC_BACKEND_URL (set in Vercel env).
 */
export const WORKER_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
