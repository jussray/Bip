/**
 * app/index.tsx — entry redirect
 *
 * Expo Router boots here. We immediately redirect to /(main)/home
 * so the route group layout (tab bar, auth guards) initialises correctly.
 *
 * All app logic lives in app/(main)/ and src/.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(main)/home" />;
}
