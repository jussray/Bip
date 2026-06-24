import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ResourcesScreen } from '@screens/ResourcesScreen';
import { routeForSide } from '@/shared/routes';

export default function ResourcesRoute() {
  const { userSide } = useAppContext();
  const side = userSide === 'parent' ? 'parent' : 'teen';
  return (
    <ResourcesScreen
      side={side}
      setScreen={(screen: string) => router.push(routeForSide(side, screen) as any)}
      BottomNav={null}
    />
  );
}
