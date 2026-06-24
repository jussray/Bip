import React from 'react';
import { router } from 'expo-router';
import { ParentGrowthScreen } from '@/parent/features/growth/ParentGrowthScreen';

export default function ParentGrowthRoute() {
  return (
    <ParentGrowthScreen
      setScreen={(screen: string) => router.push(`/(parent)/${screen}` as any)}
      BottomNav={null}
    />
  );
}
