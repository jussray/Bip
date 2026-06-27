import React from 'react';
import { InsightsScreen } from '@screens/InsightsScreen';
import { parentNavigateTo } from '@/parent/navigation';

export default function ParentInsightsRoute() {
  return (
    <InsightsScreen
      side="parent"
      setScreen={parentNavigateTo}
      BottomNav={null}
    />
  );
}
