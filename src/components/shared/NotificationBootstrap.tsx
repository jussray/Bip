import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import {
  configureNotificationHandling,
  registerForPushNotificationsAsync,
} from '@/services/notifications';

function openNotificationRoute(response: Notifications.NotificationResponse): void {
  const url = response.notification.request.content.data?.url;
  if (typeof url !== 'string' || !url.startsWith('/')) return;
  router.push(url as never);
}

export function NotificationBootstrap() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    void (async () => {
      await configureNotificationHandling();
      const registration = await registerForPushNotificationsAsync();
      if (__DEV__ && registration.reason) {
        console.info('[notifications]', registration.reason);
      }
    })();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      openNotificationRoute,
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openNotificationRoute(response);
    });

    return () => responseSubscription.remove();
  }, []);

  return null;
}
