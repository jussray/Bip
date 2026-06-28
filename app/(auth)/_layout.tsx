/**
 * app/(auth)/_layout.tsx
 *
 * Auth route group layout.
 * Screens: login, signup
 *
 * Active: app/index.tsx routes to /(auth)/login when no session exists.
 * app/_layout.tsx subscribes to onAuthStateChange and redirects on sign-out.
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
