import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { MessagesScreen } from '@screens/MessagesScreen';
import { routeForSide } from '@/shared/routes';

export default function MessagesRoute() {
  const { userSide } = useAppContext();
  const side = userSide === 'parent' ? 'parent' : 'teen';
  return (
    <MessagesScreen
      side={side}
      setScreen={(screen: string) => router.push(routeForSide(side, screen) as any)}
      BottomNav={null}
    />
  );
}
