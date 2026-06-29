// Temporary typing bridge for the legacy runtime require used in constants/vibeColors.ts.
// This keeps strict type-checking intact until that accessor is converted to a static import.
declare function require(id: './vibeRegistry'): typeof import('../../constants/vibeRegistry');
