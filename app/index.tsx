/**
 * app/index.tsx
 *
 * Entry point — redirect only.
 * All logic has moved to app/(main)/home.tsx.
 *
 * Step 2b: This file is now a thin redirect.
 * Step 4 goal: keep it exactly like this forever.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(main)/home" />;
}
