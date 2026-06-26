// Re-export from each module explicitly to avoid TS2308 duplicate-export
// ambiguity that arises when `./sync` also re-exports from these modules.
export * from './parentBridgeCompat';
export * from './pointsCompat';
export {
  // Re-export only members from `./sync` that are NOT already exported
  // above. Add any sync-specific exports here.
} from './sync';
