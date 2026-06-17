/**
 * src/components/index.ts
 *
 * Master barrel — re-exports all domain groups.
 * Prefer importing from a specific group:
 *   import { AgeGate } from '@/components/safety';
 * over the root barrel for better tree-shaking.
 */
export * from './ai';
export * from './chat';
export * from './layout';
export * from './safety';
export * from './shared';
