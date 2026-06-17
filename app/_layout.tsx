/**
 * app/_layout.tsx
 *
 * Root layout — mounts AppProvider around the Stack so every route
 * using useAppContext() has a valid context value.
 *
 * AppProvider lives here (not in app/index.tsx) because the provider
 * must wrap ALL routes, including the (main) group layout which calls
 * useAppContext() immediately to read `userSide`.
 */
import { Stack } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { AppProvider } from '@/context/AppContext';
import { validateEnv } from '@/utils/env';

// Run once at startup — logs warnings for missing vars, throws if secrets
// like OPENAI_API_KEY or service_role appear in the client bundle.
void validateEnv();

export default function RootLayout() {
  return (
    <AppProvider>
      <Analytics />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
