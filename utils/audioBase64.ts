// utils/audioBase64.ts
// Converts a local file URI to a base64 string using expo-file-system.
// FileReader is a Web-only API and is unavailable in Hermes/JSC runtimes.
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Reads a local file URI and returns its contents as a base64 string.
 * Safe to call in React Native (Hermes, JSC) and Expo Go.
 */
export async function uriToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * Returns the correct audio MIME type for the platform.
 * expo-av HIGH_QUALITY preset writes .m4a on iOS and .3gp on Android.
 */
export function recordingContentType(): string {
  return Platform.OS === 'android' ? 'audio/3gpp' : 'audio/m4a';
}
