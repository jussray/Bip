import React from 'react';
import { router } from 'expo-router';
import { InsightsScreen } from '@screens/InsightsScreen';

export default function ParentInsightsRoute() {
  return (
    <InsightsScreen
      side="parent"
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      BottomNav={null}
    />
  );
}
