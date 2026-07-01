import { Alert } from 'react-native';
import { router } from 'expo-router';
import { captureRuntimeError } from '@/services/runtimeAudit';

export async function safePush(href: string, screen?: string): Promise<void> {
  try {
    router.push(href as never);
  } catch (error) {
    await captureRuntimeError('navigation', error, {
      event_type: 'navigation_failed',
      screen: screen ?? 'router.push',
      severity: 'warning',
      metadata: { href },
    });
    Alert.alert('Navigation error', 'That screen could not be opened right now.');
  }
}

export async function safeReplace(href: string, screen?: string): Promise<void> {
  try {
    router.replace(href as never);
  } catch (error) {
    await captureRuntimeError('navigation', error, {
      event_type: 'navigation_failed',
      screen: screen ?? 'router.replace',
      severity: 'warning',
      metadata: { href },
    });
    Alert.alert('Navigation error', 'That screen could not be opened right now.');
  }
}
