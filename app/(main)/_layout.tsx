/**
 * app/(main)/_layout.tsx
 *
 * Main app route group layout — Tab bar lives here.
 *
 * NOTE: This is a skeleton. The Tabs navigator is wired in Step 2b
 * when state.screen string routing is replaced with router.push().
 * Until then, all navigation is handled inside app/index.tsx.
 *
 * Tab structure matches your target architecture:
 *   / (home/room)  →  chat/index
 *   /discover      →  Oracle discovery
 *   /profile       →  Profile
 *   /settings      →  Settings
 */
import { Stack } from 'expo-router';

export default function MainLayout() {
  // Stack for now — swap to Tabs when router migration is complete (Step 2b).
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
