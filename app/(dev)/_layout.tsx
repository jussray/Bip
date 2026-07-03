import { Redirect, Slot } from 'expo-router';

/**
 * Dev-only layout guard.
 * In production builds __DEV__ is false, so all routes under (dev)/
 * immediately redirect to the app root and are never rendered.
 * In development the Slot renders normally — no extra chrome needed.
 */
export default function DevLayout() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <Slot />;
}
