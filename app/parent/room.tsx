import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentRoomScreen } from '@screens/ParentRoomScreen';

export default function ParentRoomRoute() {
  const { parentMood, parentMoodDate, setParentMood, parentRoomStyle } = useAppContext();
  return (
    <ParentRoomScreen
      parentRoomStyle={parentRoomStyle === 'dad' ? 'dad' : 'mom'}
      parentMood={parentMood}
      previousMood={parentMoodDate || undefined}
      setParentMood={setParentMood}
      setScreen={(screen: string) => router.push(`/parent/${screen}` as any)}
      BottomNav={null}
    />
  );
}
