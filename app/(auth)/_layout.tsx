/**
 * app/(auth)/_layout.tsx
 *
 * Auth route group layout.
 * Screens: login, signup
 *
 * NOTE: This layout is a skeleton. It becomes the active auth
 * navigation once the string-router migration (Step 2b) is complete.
 * Until then, auth flow is handled inside app/index.tsx via setScreen().
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
