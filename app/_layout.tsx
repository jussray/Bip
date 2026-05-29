import React, { createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSekretState } from '@hooks/useSekretState';

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const SekretContext = createContext<ReturnType<typeof useSekretState> | null>(null);

export function useSekret() {
  const ctx = useContext(SekretContext);
  if (!ctx) throw new Error('useSekret must be used inside SekretProvider');
  return ctx;
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
export default function RootLayout() {
  const state = useSekretState();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SekretContext.Provider value={state}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </SekretContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
