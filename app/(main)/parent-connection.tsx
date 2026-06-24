import React from 'react';
import { router } from 'expo-router';
import { ConnectionHubScreen } from '@screens/ConnectionHubScreen';

export default function ParentConnectionRoute() {
  return (
    <ConnectionHubScreen
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      BottomNav={null}
    />
  );
}
