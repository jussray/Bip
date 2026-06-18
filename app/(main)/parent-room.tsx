/**
 * app/(main)/parent-room.tsx
 * Route wrapper for ParentRoomScreen.
 * Entry point for the parent side after splash.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentRoomScreen } from '@/screens/ParentRoomScreen';

export default function ParentRoomRoute() {
  const {
    theme,
    parentMood,
    setParentMood,
    parentRoomStyle,
    setParentRoomStyle,
    selectedSekret,
  } = useAppContext();
  return (
    <ParentRoomScreen
      theme={theme}
      mood={parentMood}
      setMood={setParentMood}
      roomStyle={parentRoomStyle}
      setRoomStyle={setParentRoomStyle}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
